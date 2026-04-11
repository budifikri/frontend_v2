import { useEffect, useState } from 'react'

export function ImportConfirmMaster({
  onConfirm,
  onCancel,
  fileName,
  recordCount,
  isValid = true,
  errorMessage = '',
  title = '',
  confirmText = 'Import',
  cancelText = 'Batal',
}) {
  const headerTitle = title || (isValid ? 'Konfirmasi Import' : 'Format Tidak Sesuai')
  const [activeButton, setActiveButton] = useState('cancel')

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isValid) {
        if (event.key === 'Escape') {
          event.preventDefault()
          onCancel()
        }
        return
      }

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
  }, [activeButton, onConfirm, onCancel, isValid])

  return (
    <div className="delete-master-overlay">
      <div className="delete-master-modal">
        <div className="delete-master-header">
          <span className={`material-icons-round material-icon ${isValid ? 'blue' : 'red'}`}>
            {isValid ? 'file_upload' : 'error'}
          </span>
          <h2>{headerTitle}</h2>
        </div>
        <div className="delete-master-body">
          {isValid ? (
            <>
              <p>Apakah Anda yakin ingin mengimport data?</p>
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                <table style={{ width: '100%', fontSize: '14px' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#6b7280', paddingBottom: '8px' }}>Nama File</td>
                      <td style={{ paddingBottom: '8px', fontWeight: '500' }}>{fileName}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#6b7280' }}>Jumlah Record</td>
                      <td style={{ fontWeight: '500' }}>{recordCount} baris</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <p style={{ color: '#dc2626', fontWeight: '500' }}>{errorMessage || 'Format data / tipe file Tidak Sesuai'}</p>
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <table style={{ width: '100%', fontSize: '14px' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#6b7280', paddingBottom: '8px' }}>Nama File</td>
                      <td style={{ paddingBottom: '8px', fontWeight: '500' }}>{fileName}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        <div className="delete-master-footer">
          <button
            type="button"
            className={`btn-confirm ${isValid && activeButton === 'confirm' ? 'is-active' : ''}`}
            onClick={onConfirm}
            disabled={!isValid}
            style={{ opacity: !isValid ? 0.5 : 1, cursor: !isValid ? 'not-allowed' : 'pointer' }}
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