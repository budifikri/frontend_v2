export function DashboardHeader() {
  return (
    <header className="dashboard-titlebar">
      <div className="dashboard-title-group">
        <span className="desktop-dot" aria-hidden="true" />
        <strong>POS Admin Menu Dashboard</strong>
      </div>
      <div className="window-controls" aria-label="window controls">
        <button type="button" aria-label="Minimize">-</button>
        <button type="button" aria-label="Maximize">+</button>
        <button type="button" className="close" aria-label="Close">x</button>
      </div>
    </header>
  )
}
