import { useEffect, useState } from 'react'

export function DashboardHeader({ companyName }) {
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [activeExitButton, setActiveExitButton] = useState('cancel')

  const handleMinimize = async () => {
    if (window.__TAURI__) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const appWindow = getCurrentWindow()
        await appWindow.minimize()
      } catch (e) {
        console.error('Tauri error:', e)
      }
    }
  }

  const handleClose = async () => {
    if (window.__TAURI__) {
      setActiveExitButton('cancel')
      setShowExitConfirm(true)
    }
  }

  const handleConfirmExit = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const appWindow = getCurrentWindow()
      await appWindow.close()
    } catch (e) {
      console.error('Tauri error:', e)
    }
    setShowExitConfirm(false)
  }

  const handleCancelExit = () => {
    setShowExitConfirm(false)
  }

  useEffect(() => {
    if (!showExitConfirm) return

    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        setActiveExitButton((prev) => (prev === 'confirm' ? 'cancel' : 'confirm'))
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        if (activeExitButton === 'confirm') handleConfirmExit()
        else handleCancelExit()
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        handleCancelExit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showExitConfirm, activeExitButton])

  const title = `POS Admin - ${companyName || ''}`

  return (
    <>
      <header className="dashboard-titlebar">
        <div className="dashboard-title-group">
          <span className="desktop-dot" aria-hidden="true" />
          <strong>{title}</strong>
        </div>
        <div className="window-controls" aria-label="window controls">
          <button type="button" aria-label="Minimize" onClick={handleMinimize}>-</button>
          <button type="button" className="close" aria-label="Close" onClick={handleClose}>x</button>
        </div>
      </header>

      {showExitConfirm && (
        <div className="exit-popup-overlay" onClick={handleCancelExit}>
          <div className="exit-popup-modal" onClick={e => e.stopPropagation()}>
            <div className="exit-popup-icon">!</div>
            <h3>Exit Application?</h3>
            <p>Are you sure you want to exit? All unsaved changes will be lost.</p>
            <div className="exit-popup-actions">
              <button
                type="button"
                className={`exit-popup-cancel ${activeExitButton === 'cancel' ? 'is-active' : ''}`}
                onClick={handleCancelExit}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`exit-popup-confirm ${activeExitButton === 'confirm' ? 'is-active' : ''}`}
                onClick={handleConfirmExit}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
