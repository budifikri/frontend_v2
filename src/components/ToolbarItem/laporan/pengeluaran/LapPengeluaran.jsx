import { useState } from 'react'

export function LapPengeluaran({ onExit }) {
  const [isLoading] = useState(false)

  return (
    <div className="master-window">
      <div className="window-titlebar">
        <div className="window-title">Laporan Pengeluaran</div>
        <button type="button" className="window-btn-exit" onClick={onExit}>
          <span className="material-icons-round">close</span>
        </button>
      </div>
      <div className="window-body">
        {isLoading ? (
          <div className="master-loading">
            <span className="material-icons-round spinning">sync</span>
          </div>
        ) : (
          <div className="master-empty">
            <span className="material-icons-round">description</span>
            <span>Coming Soon</span>
          </div>
        )}
      </div>
    </div>
  )
}