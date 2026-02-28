export function DeleteMaster({ onConfirm, onCancel, itemName }) {
  return (
    <div className="delete-master-overlay">
      <div className="delete-master-modal">
        <div className="delete-master-header">
          <span className="material-icon red">warning</span>
          <h2>Konfirmasi Hapus</h2>
        </div>
        <div className="delete-master-body">
          <p>Apakah Anda yakin ingin menghapus data <strong>{itemName}</strong>?</p>
          <p className="text-muted">Tindakan ini tidak dapat dibatalkan.</p>
        </div>
        <div className="delete-master-footer">
          <button type="button" className="btn-confirm" onClick={onConfirm}>
            Hapus
          </button>
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Batal
          </button>
        </div>
      </div>
    </div>
  )
}
