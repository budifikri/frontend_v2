import { statusBar } from '../../data'

export function DashboardFooter({ username, role }) {
  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/ /g, ' ')

  const displayUsername = username || statusBar.user
  const displayRole = role || statusBar.role

  return (
    <footer className="dashboard-statusbar">
      <div className="status-left">
        <span>{displayUsername}({displayRole})</span>
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
