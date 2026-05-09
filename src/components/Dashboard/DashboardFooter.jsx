import { useEffect, useState } from 'react'
import { statusBar } from '../../data'

export function DashboardFooter({ username, role }) {
  const [dbName, setDbName] = useState('---')

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/ /g, ' ')

  const displayUsername = username || statusBar.user
  const displayRole = role || statusBar.role

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
    const url = `${baseUrl}/api/health`
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data?.database?.database) {
          setDbName(data.database.database)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <footer className="dashboard-statusbar">
      <div className="status-left">
        <span>{displayUsername}({displayRole})</span>
        <span>{formattedDate}</span>
        <span>Version 3.0</span>
      </div>
      <div className="status-right">
      {/*  <span className="db-icon" aria-hidden="true">🗄️</span> */}
        <span className="db-name">Database: {dbName}</span>
        <span className="status-separator" />
        <span className="status-light" aria-hidden="true" />
        <span>System Connected</span>
      </div>
    </footer>
  )
}
