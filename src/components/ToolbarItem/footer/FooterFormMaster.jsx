export function FooterFormMaster({
  onSave,
  onClose,
  isSaving = false,
  saveLabel = 'Simpan',
  cancelLabel = 'Close',
  leftButtons,
  onNext,
  onPrev,
  canNext,
  canPrev,
}) {
  return (
    <div className="master-form-actions">
      {leftButtons && <>{leftButtons}</>}
      <button
        type="button"
        className="master-btn-save-primary"
        onClick={onSave}
        disabled={isSaving}
      >
        <span className="material-icons-round">save</span>
        {saveLabel}
      </button>
      {onClose && (
        <button
          type="button"
          className="master-btn-cancel-secondary"
          onClick={onClose}
          disabled={isSaving}
        >
          <span className="material-icons-round">close</span>
          {cancelLabel}
        </button>
      )}
      <div className="master-form-nav">
        {onPrev && (
          <button
            type="button"
            className="master-btn-nav"
            onClick={onPrev}
            disabled={isSaving || canPrev === false}
            title="Previous Record"
          >
            <span className="material-icons-round">navigate_before</span>
          </button>
        )}
        {onNext && (
          <button
            type="button"
            className="master-btn-nav"
            onClick={onNext}
            disabled={isSaving || canNext === false}
            title="Next Record"
          >
            <span className="material-icons-round">navigate_next</span>
          </button>
        )}
      </div>
    </div>
  )
}
