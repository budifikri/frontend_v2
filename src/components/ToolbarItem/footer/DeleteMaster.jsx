import { useEffect, useState } from 'react'

export function DeleteMaster({
  onConfirm,
  onCancel,
  itemName,
  title = '',
  confirmText,
  cancelText,
  isExit = false,
  message,
  singleAction = false,
}) {
  const bodyText = message || (isExit 
    ? `Apakah Anda yakin ingin ${itemName}?`
    : `Apakah Anda yakin ingin menghapus data "${itemName}"?`)
  const headerTitle = title || 'Konfirmasi Hapus'
  const btnConfirmText = confirmText || (isExit ? 'Ya' : 'Hapus')
  const btnCancelText = cancelText || 'Batal'
  const [activeButton, setActiveButton] = useState('cancel')

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!singleAction && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault()
        setActiveButton((prev) => (prev === 'confirm' ? 'cancel' : 'confirm'))
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        if (singleAction || activeButton === 'confirm') onConfirm()
        else onCancel()
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeButton, onConfirm, onCancel, singleAction])

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
          <button
            type="button"
            className={`btn-confirm ${singleAction || activeButton === 'confirm' ? 'is-active' : ''}`}
            onClick={onConfirm}
          >
            {btnConfirmText}
          </button>
          {!singleAction && (
            <button
              type="button"
              className={`btn-cancel ${activeButton === 'cancel' ? 'is-active' : ''}`}
              onClick={onCancel}
            >
              {btnCancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
