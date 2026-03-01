export function DeleteMaster({ onConfirm, onCancel, itemName, title = '', confirmText, cancelText, isExit = false }) {
  const bodyText = isExit 
    ? `Apakah Anda yakin ingin ${itemName}?`
    : `Apakah Anda yakin ingin menghapus data "${itemName}"?`
  const headerTitle = title || 'Konfirmasi Hapus'
  const btnConfirmText = confirmText || (isExit ? 'Ya' : 'Hapus')
  const btnCancelText = cancelText || 'Batal'

  return (
    <div className="delete-master-overlay">
      <div className="delete-master-modal">
        <div className="delete-master-header">
          <span className="material-icons-round material-icon red">warning</span>
          <h2>{headerTitle}</h2>
        </div>
        <div className="delete-master-body">
          <p>{bodyText}</p>
        </div>
        <div className="delete-master-footer">
          <button type="button" className="btn-confirm" onClick={onConfirm}>
            {btnConfirmText}
          </button>
          <button type="button" className="btn-cancel" onClick={onCancel}>
            {btnCancelText}
          </button>
        </div>
      </div>
    </div>
  )
}
