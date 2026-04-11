import { useEffect, useState } from 'react'

export function ImportConfirmMaster({
  onConfirm,
  onCancel,
  itemName,
  title = '',
  confirmText = 'Import',
  cancelText = 'Batal',
}) {
  const headerTitle = title || 'Konfirmasi Import'
  const [activeButton, setActiveButton] = useState('cancel')

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        setActiveButton((prev) => (prev === 'confirm' ? 'cancel' : 'confirm'))
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        if (activeButton === 'confirm') onConfirm()
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
  }, [activeButton, onConfirm, onCancel])

  return (
    <div className="delete-master-overlay">
      <div className="delete-master-modal">
        <div className="delete-master-header">
          <span className="material-icons-round material-icon blue">file_upload</span>
          <h2>{headerTitle}</h2>
        </div>
        <div className="delete-master-body">
          <p>Apakah Anda yakin ingin mengimport data "{itemName}"?</p>
        </div>
        <div className="delete-master-footer">
          <button
            type="button"
            className={`btn-confirm ${activeButton === 'confirm' ? 'is-active' : ''}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            type="button"
            className={`btn-cancel ${activeButton === 'cancel' ? 'is-active' : ''}`}
            onClick={onCancel}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  )
}