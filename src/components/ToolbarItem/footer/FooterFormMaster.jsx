export function FooterFormMaster({
  onSave,
  onCancel,
  isSaving = false,
  saveLabel = 'Simpan',
  cancelLabel = 'Cancel',
  leftButtons,
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
      <button
        type="button"
        className="master-btn-cancel-secondary"
        onClick={onCancel}
        disabled={isSaving}
      >
        <span className="material-icons-round">close</span>
        {cancelLabel}
      </button>
    </div>
  )
}
