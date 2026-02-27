import { statusBar } from '../../data'

export function DashboardFooter({ user }) {
  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/ /g, ' ')

  return (
    <footer className="dashboard-statusbar">
      <div className="status-left">
        <span>{user || statusBar.user}</span>
        <span>{formattedDate}</span>
        <span>Version 3.0</span>
      </div>
      <div className="status-right">
        <span className="status-light" aria-hidden="true" />
        <span>System Connected</span>
      </div>
    </footer>
  )
}
