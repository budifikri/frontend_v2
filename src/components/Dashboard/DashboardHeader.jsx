import { useState } from 'react'

export function DashboardHeader() {
  const [showExitConfirm, setShowExitConfirm] = useState(false)

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

  return (
    <>
      <header className="dashboard-titlebar">
        <div className="dashboard-title-group">
          <span className="desktop-dot" aria-hidden="true" />
          <strong>POS Admin Menu Dashboard</strong>
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
              <button type="button" className="exit-popup-cancel" onClick={handleCancelExit}>Cancel</button>
              <button type="button" className="exit-popup-confirm" onClick={handleConfirmExit}>Exit</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
