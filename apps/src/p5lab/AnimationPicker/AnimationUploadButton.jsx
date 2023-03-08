import React, {useState} from 'react';
import PropTypes from 'prop-types';
import msg from '@cdo/locale';
import AnimationPickerListItem from './AnimationPickerListItem.jsx';
import project from '@cdo/apps/code-studio/initApp/project';
import BaseDialog from '@cdo/apps/templates/BaseDialog.jsx';
import classNames from 'classnames';
import styles from './animation-upload-button.module.scss';
import {connect} from 'react-redux';
import {refreshInRestrictedShareMode} from '@cdo/apps/code-studio/projectRedux.js';

/**
 * Render the animation upload button. If the project should restrict uploads
 * (which occurs for student Sprite Lab projects), and the project has not already seen
 * the warning (which is tracked with inRestrictedShareMode), we show a warning modal
 * before allowing uploads. If the project should restrict uploads and is already
 * published, we will not allow uploads until the project is un-published.
 */
export function UnconnectedAnimationUploadButton({
  onUploadClick,
  shouldRestrictAnimationUpload,
  isBackgroundsTab,
  inRestrictedShareMode,
  refreshInRestrictedShareMode
}) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [
    isPublishedWarningModalOpen,
    setIsPublishedWarningModalOpen
  ] = useState(false);
  const [noPIIConfirmed, setNoPIIConfirmed] = useState(false);
  const [restrictedShareConfirmed, setRestrictedShareConfirmed] = useState(
    false
  );
  const showRestrictedUploadWarning =
    shouldRestrictAnimationUpload && !inRestrictedShareMode;

  function renderUploadButton() {
    return (
      <AnimationPickerListItem
        label={msg.animationPicker_uploadImage()}
        icon="upload"
        onClick={
          showRestrictedUploadWarning
            ? project.isPublished()
              ? () => setIsPublishedWarningModalOpen(true)
              : () => setIsUploadModalOpen(true)
            : onUploadClick
        }
        isBackgroundsTab={isBackgroundsTab}
      />
    );
  }

  // Warning dialog that says if you upload, you can no longer share and remix,
  // and you confirm you will not upload PII.
  function renderUploadModal() {
    return (
      <BaseDialog
        isOpen={isUploadModalOpen}
        handleClose={() => setIsUploadModalOpen(false)}
      >
        <div>
          <h1 className={styles.modalHeader}>
            {msg.animationPicker_restrictedShareRulesHeader()}
          </h1>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={noPIIConfirmed}
              onChange={() => setNoPIIConfirmed(!noPIIConfirmed)}
            />
            {msg.animationPicker_confirmNoPII()}
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={restrictedShareConfirmed}
              onChange={() =>
                setRestrictedShareConfirmed(!restrictedShareConfirmed)
              }
            />
            {msg.animationPicker_confirmRestrictedShare()}
          </label>
          <p className={styles.modalDetails}>
            {msg.animationPicker_undoRestrictedShareInstructions()}
          </p>
        </div>
        <div className={styles.modalButtonRow}>
          <button
            className={classNames(styles.modalButton, styles.cancelButton)}
            type="button"
            onClick={cancelUpload}
          >
            {msg.dialogCancel()}
          </button>
          <button
            className={classNames(styles.modalButton, styles.confirmButton)}
            type="button"
            onClick={confirmRestrictedUpload}
            disabled={!(noPIIConfirmed && restrictedShareConfirmed)}
          >
            {msg.dialogOK()}
          </button>
        </div>
      </BaseDialog>
    );
  }

  // Warning dialog that you cannot upload until you un-publish your project.
  function renderPublishedWarningModal() {
    return (
      <BaseDialog
        isOpen={isPublishedWarningModalOpen}
        handleClose={() => setIsPublishedWarningModalOpen(false)}
      >
        <div>
          <h1 className={styles.modalHeader}>
            {msg.animationPicker_cannotUploadHeader()}
          </h1>
          <p>{msg.animationPicker_cannotUploadIfPublished()}</p>
        </div>
        <div className={styles.modalButtonRow}>
          <button
            className={classNames(styles.modalButton, styles.confirmButton)}
            type="button"
            onClick={() => setIsPublishedWarningModalOpen(false)}
          >
            {msg.dialogOK()}
          </button>
        </div>
      </BaseDialog>
    );
  }

  function confirmRestrictedUpload() {
    project.setInRestrictedShareMode(true);
    setIsUploadModalOpen(false);
    // redux setting, for use in share/remix
    refreshInRestrictedShareMode();
    onUploadClick();
  }

  function cancelUpload() {
    setRestrictedShareConfirmed(false);
    setNoPIIConfirmed(false);
    setIsUploadModalOpen(false);
  }

  return (
    <>
      {renderUploadModal()}
      {renderPublishedWarningModal()}
      {renderUploadButton()}
    </>
  );
}

UnconnectedAnimationUploadButton.propTypes = {
  onUploadClick: PropTypes.func.isRequired,
  shouldRestrictAnimationUpload: PropTypes.bool.isRequired,
  isBackgroundsTab: PropTypes.bool.isRequired,
  // populated from redux
  inRestrictedShareMode: PropTypes.bool.isRequired,
  refreshInRestrictedShareMode: PropTypes.func.isRequired
};

export default connect(
  state => ({
    inRestrictedShareMode: state.project.inRestrictedShareMode
  }),
  dispatch => ({
    refreshInRestrictedShareMode: inRestrictedShareMode =>
      dispatch(refreshInRestrictedShareMode(inRestrictedShareMode))
  })
)(UnconnectedAnimationUploadButton);
