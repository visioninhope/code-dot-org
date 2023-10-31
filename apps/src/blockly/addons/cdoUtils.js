import _ from 'lodash';
import {unregisterProcedureBlocks} from '@blockly/block-shareable-procedures';
import {APP_HEIGHT} from '@cdo/apps/p5lab/constants';
import {SOUND_PREFIX} from '@cdo/apps/assetManagement/assetPrefix';
import cdoTheme from '../themes/cdoTheme';
import {blocks as procedureBlocks} from '../customBlocks/googleBlockly/proceduresBlocks';
import {
  BLOCK_TYPES,
  CLAMPED_NUMBER_REGEX,
  DEFAULT_SOUND,
  stringIsXml,
  ToolboxType,
} from '../constants';
import {
  convertXmlToJson,
  getCombinedSerialization,
  positionBlocksOnWorkspace,
  resetBlockLocations,
} from './cdoSerializationHelpers';
import {parseElement as parseXmlElement} from '../../xml';

/**
 * Loads blocks to a workspace.
 * To maintain backwards compatibility we must be able to use the XML source if no JSON state is provided.
 * @param {Blockly.Workspace} workspace - the current Blockly workspace
 * @param {string} source - workspace serialization, either XML or JSON
 */
export function loadBlocksToWorkspace(workspace, source) {
  const {mainSource, hiddenDefinitionSource, blockOrderMap} =
    prepareSourcesForWorkspaces(source);
  Blockly.serialization.workspaces.load(mainSource, workspace);
  positionBlocksOnWorkspace(workspace, blockOrderMap);
  loadHiddenDefinitionBlocksToWorkspace(hiddenDefinitionSource);
}

/**
 * Load hidden definition blocks to the hidden definition workspace, if it exists.
 * @param {Object} hiddenDefinitionSource Blockly serialization of hidden definition blocks.
 */
function loadHiddenDefinitionBlocksToWorkspace(hiddenDefinitionSource) {
  if (!Blockly.getHiddenDefinitionWorkspace() || !hiddenDefinitionSource) {
    return;
  }

  Blockly.serialization.workspaces.load(
    hiddenDefinitionSource,
    Blockly.getHiddenDefinitionWorkspace()
  );
  if (Blockly.functionEditor) {
    Blockly.functionEditor.setUpEditorWorkspaceProcedures();
  }
}

/**
 * Split source into appropriate serialization objects for the main and the hidden workspaces for loading.
 * Which blocks are moved depends on whether the modal function editor is enabled.
 * @param {string} source - workspace serialization, either XML or JSON
 * @returns {mainSource: Object, hiddenDefinitionSource: Object, blockOrderMap: Object}
 *  mainSource and hiddenDefinitionSource are Blockly serialization objects.
 *  blockOrderMap is only used when source is XML, and is a map of blocks to their positions on the workspace.
 */
function prepareSourcesForWorkspaces(source) {
  let {parsedSource, blockOrderMap} = parseSource(source);
  const procedureTypesToHide = [BLOCK_TYPES.behaviorDefinition];
  if (Blockly.useModalFunctionEditor) {
    procedureTypesToHide.push(BLOCK_TYPES.procedureDefinition);
  }
  const {mainSource, hiddenDefinitionSource} = moveHiddenProcedures(
    parsedSource,
    procedureTypesToHide
  );
  return {mainSource, hiddenDefinitionSource, blockOrderMap};
}

/**
 * Convert source to parsed json objects. If source was xml, convert to json before parsing.
 * Also create a block order map if source was xml, which will allow us to correctly place blocks on the workspace.
 * @param {string} source - workspace serialization, either XML or JSON
 * @returns {parsedSource: Object, blockOrderMap: Object}
 */
function parseSource(source) {
  let isXml = stringIsXml(source);
  let parsedSource;
  let blockOrderMap;

  if (isXml) {
    const xml = parseXmlElement(source);
    parsedSource = convertXmlToJson(xml);
    blockOrderMap = Blockly.Xml.createBlockOrderMap(xml);
  } else {
    parsedSource = JSON.parse(source);
  }

  return {parsedSource, blockOrderMap};
}

/**
 * Move hidden procedures from the source to a hidden definition object.
 * These will be used to initialize the main and hidden definitions workspaces, respectively.
 * Procedures are hidden if they have a type in the procedureTypesToHide array.
 * In addition, copy the procedure model from the source
 * object to the hidden definition object when moving a procedure.
 * @param {Object} source Project source object, parsed from JSON.
 * @param {Array<string>} procedureTypesToHide procedure types to move to procedures object.
 * @returns void
 * exported for unit testing
 */
export function moveHiddenProcedures(source = {}, procedureTypesToHide = []) {
  if (procedureTypesToHide.length === 0 || !_.has(source, 'blocks.blocks')) {
    return {mainSource: {}, hiddenDefinitionSource: {}};
  }

  const mainSource = _.cloneDeep(source);
  const hiddenDefinitionSource = _.cloneDeep(source);

  // Reset the values on the copies so they can be populated from scratch
  // All of the original source procedures can be retained on the main workspace
  mainSource.blocks.blocks = [];
  hiddenDefinitionSource.blocks.blocks = [];
  hiddenDefinitionSource.procedures = [];

  source.blocks.blocks.forEach(block => {
    const destination = procedureTypesToHide.includes(block.type)
      ? hiddenDefinitionSource
      : mainSource;
    destination.blocks.blocks.push(block);

    // Also copy the procedure model for blocks to that need to be hidden
    // Equality check works because hiddenDefinitionSource and mainSource are different object references
    if (destination === hiddenDefinitionSource) {
      const procedureModel = source.procedures.find(
        procedure => procedure.id === block.extraState?.procedureId
      );
      if (procedureModel) {
        hiddenDefinitionSource.procedures.push(procedureModel);
      }
    }
  });

  return {
    mainSource,
    hiddenDefinitionSource,
  };
}

export function setHSV(block, h, s, v) {
  block.setColour(Blockly.utils.colour.hsvToHex(h, s, v * 255));
}

export function injectCss() {
  return Blockly.Css.inject(true, 'media');
}

export function resizeSvg(blockSpace) {
  return Blockly.svgResize(blockSpace);
}

export function getBlockFields(block) {
  let fields = [];
  block.inputList.forEach(input => {
    input.fieldRow.forEach(field => {
      fields.push(field);
    });
  });
  return fields;
}

export function getToolboxType() {
  const workspace = Blockly.getMainWorkspace();
  if (!workspace) {
    return;
  }
  // True is passed so we only get the flyout directly owned by the workspace.
  // Otherwise getFlyout will return the flyout for the toolbox if it has categories.
  if (workspace.getFlyout(true)) {
    return ToolboxType.UNCATEGORIZED;
  } else if (workspace.getToolbox()) {
    return ToolboxType.CATEGORIZED;
  } else {
    return ToolboxType.NONE;
  }
}

export function getToolboxWidth() {
  const workspace = Blockly.getMainWorkspace();
  const metrics = workspace.getMetrics();
  switch (getToolboxType()) {
    case ToolboxType.CATEGORIZED:
      return metrics.toolboxWidth;
    case ToolboxType.UNCATEGORIZED:
      return metrics.flyoutWidth;
    case ToolboxType.NONE:
      return 0;
  }
}

export function workspaceSvgResize(workspace) {
  return Blockly.svgResize(workspace);
}

export function bindBrowserEvent(element, name, thisObject, func, useCapture) {
  return Blockly.browserEvents.bind(
    element,
    name,
    thisObject,
    func,
    useCapture
  );
}

export function isWorkspaceReadOnly() {
  return false; // TODO - used for feedback
}

export function blockLimitExceeded() {
  return false;
}

export function getBlockLimit() {
  return 0;
}

/**
 * Returns a new Field object,
 * conditional on the type of block we're trying to create.
 * @param {string} type
 * @returns {?Blockly.Field}
 */
export function getField(type) {
  let field;
  if (type === Blockly.BlockValueType.NUMBER) {
    field = new Blockly.FieldNumber();
  } else if (type.includes('ClampedNumber')) {
    const clampedNumberMatch = type.match(CLAMPED_NUMBER_REGEX);
    if (clampedNumberMatch) {
      const min = parseFloat(clampedNumberMatch[1]);
      const max = parseFloat(clampedNumberMatch[2]);
      field = new Blockly.FieldNumber(0, min, max);
    }
  } else {
    field = new Blockly.FieldTextInput();
  }
  return field;
}

/**
 * Returns a theme object, based on the presence of an option in the browser's localStorage.
 * @param {string} type
 * @returns {?Blockly.Field}
 */
// Users can change their active theme using the context menu. Use this setting, if present.
export function getUserTheme(themeOption) {
  return Blockly.themes[localStorage.blocklyTheme] || themeOption || cdoTheme;
}

/**
 * Retrieves the serialization of the workspace (student code).
 *
 * @param {Blockly.WorkspaceSvg} workspace - The workspace to serialize.
 * @param {boolean} [getSourceAsJson] - Flag indicating whether to retrieve the code as JSON or XML.
 *                                      If truthy, the code will be returned as a JSON string.
 *                                      If falsy, the code will be returned as an XML string.
 * @returns {string} The serialization of the workspace.
 */
export function getCode(workspace, getSourceAsJson) {
  if (!getSourceAsJson) {
    return Blockly.Xml.domToText(Blockly.Xml.blockSpaceToDom(workspace));
  }

  const mainWorkspaceSerialization =
    Blockly.serialization.workspaces.save(workspace);
  const hiddenWorkspaceSerialization = Blockly.getHiddenDefinitionWorkspace()
    ? Blockly.serialization.workspaces.save(
        Blockly.getHiddenDefinitionWorkspace()
      )
    : null;

  // Resetting locations on hidden workspace blocks allows auto-positioning to kick in
  // as they are moved between the main and hidden workspaces (depending on whether editor is used)
  resetBlockLocations(hiddenWorkspaceSerialization.blocks.blocks);

  const combinedSerialization = getCombinedSerialization(
    mainWorkspaceSerialization,
    hiddenWorkspaceSerialization
  );
  return JSON.stringify(combinedSerialization);
}

export function soundField(onClick, transformText, icon) {
  // Handle 'play sound' block with default param from CDO blockly.
  // TODO: Remove when sprite lab is migrated to Google blockly.
  const validator = newValue => {
    if (typeof newValue !== 'string') {
      return null;
    }
    if (!newValue.startsWith(SOUND_PREFIX) || !newValue.endsWith('.mp3')) {
      console.error(
        'An invalid sound value was selected. Therefore, the default sound value will be used.'
      );
      return DEFAULT_SOUND;
    }
    return newValue;
  };
  return new Blockly.FieldButton({
    value: DEFAULT_SOUND,
    validator,
    onClick,
    transformText,
    icon,
  });
}

export function locationField(icon, onClick) {
  const transformTextSetField = value => {
    if (value) {
      try {
        const loc = JSON.parse(value);
        return `(${loc.x}, ${APP_HEIGHT - loc.y})`;
      } catch (e) {
        // Just ignore bad values
      }
    }
  };
  return new Blockly.FieldButton({
    onClick,
    transformText: transformTextSetField,
    icon,
  });
}

export function registerCustomProcedureBlocks() {
  unregisterProcedureBlocks();
  Blockly.common.defineBlocks(procedureBlocks);
}

/**
 * Partitions blocks of the specified types to the front of the list.
 *
 * @param {Element[]|Object[]} blocks - An array of block elements or JSON blocks to be partitioned.
 * @param {Object} [options] - An object containing partitioning options.
 * @param {string[]} [options.prioritizedBlockTypes] - An array of strings representing block types to move to the front.
 * @param {boolean} [options.isJson] - A flag indicating whether the blocks are JSON blocks (vs. block elements).
 * @returns {Element[]|Object[]} A new array of block elements or JSON blocks partitioned based on their types.
 */
export function partitionBlocksByType(
  blocks = [],
  prioritizedBlockTypes = [],
  isBlockElements = true
) {
  const prioritizedBlocks = [];
  const remainingBlocks = [];

  blocks.forEach(block => {
    const blockType = isBlockElements ? block.getAttribute('type') : block.type;
    prioritizedBlockTypes.includes(blockType)
      ? prioritizedBlocks.push(block)
      : remainingBlocks.push(block);
  });

  return [...prioritizedBlocks, ...remainingBlocks];
}
