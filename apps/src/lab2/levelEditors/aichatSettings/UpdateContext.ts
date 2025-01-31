import {createContext} from 'react';

import {
  AiCustomizations,
  LevelAichatSettings,
  ModelCardInfo,
  Visibility,
} from '@cdo/apps/aichat/types';
import {ValueOf} from '@cdo/apps/types/utils';
import {AiChatModelIds} from '@cdo/generated-scripts/sharedConstants';

export const UpdateContext = createContext({
  aichatSettings: {} as LevelAichatSettings,
  setPropertyValue: (
    property: keyof AiCustomizations,
    value: AiCustomizations[keyof AiCustomizations]
  ) => {},
  setPropertyVisibility: (
    property: keyof AiCustomizations,
    visibility: Visibility
  ) => {},
  setModelCardPropertyValue: (
    property: keyof ModelCardInfo,
    value: ModelCardInfo[keyof ModelCardInfo]
  ) => {},
  setModelSelectionValues: (
    additionalModelIds: ValueOf<typeof AiChatModelIds>[],
    selectedModelId: ValueOf<typeof AiChatModelIds>
  ) => {},
});
