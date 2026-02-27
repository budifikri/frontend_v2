import { statusBar } from '../../data'

export function DashboardFooter() {
  return (
    <footer className="dashboard-statusbar">
      <div className="status-left">
        <span>{statusBar.user}</span>
        <span>{statusBar.date}</span>
        <span>Version {statusBar.version}</span>
      </div>
      <div className="status-right">
        <span className="status-light" aria-hidden="true" />
        <span>System Connected</span>
      </div>
    </footer>
  )
}
