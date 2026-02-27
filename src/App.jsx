import { useState } from 'react'
import './App.css'

const dashboardTools = [
  { key: 'login', label: 'Login', mark: 'L', tone: 'slate', backToLogin: true },
  { key: 'divider-1', divider: true },
  { key: 'gudang', label: 'Gudang', mark: 'G', tone: 'orange' },
  { key: 'satuan', label: 'Satuan', mark: 'S', tone: 'green' },
  { key: 'wilayah', label: 'Wilayah', mark: 'W', tone: 'cyan' },
  { key: 'dept', label: 'Dept.', mark: 'D', tone: 'blue' },
  { key: 'golongan', label: 'Golongan', mark: 'O', tone: 'indigo' },
  { key: 'meja', label: 'Meja', mark: 'M', tone: 'amber' },
  { key: 'divider-2', divider: true },
  { key: 'barcode', label: 'Barcode', mark: 'B', tone: 'slate' },
  { key: 'daftar', label: 'Daftar Barang', mark: 'D', tone: 'slate' },
  { key: 'divider-3', divider: true },
  { key: 'payment', label: 'Payment', mark: 'P', tone: 'yellow' },
  { key: 'customer', label: 'Customer', mark: 'C', tone: 'pink' },
  { key: 'supplier', label: 'Supplier', mark: 'U', tone: 'lime' },
  { key: 'barang', label: 'Barang', mark: 'R', tone: 'orange' },
  { key: 'divider-4', divider: true },
  { key: 'voucher', label: 'Voucher', mark: 'V', tone: 'red' },
]

function App() {
  const [view, setView] = useState('login')
  const [userId, setUserId] = useState('A')
  const [password, setPassword] = useState('')

  const handleLogin = (event) => {
    event.preventDefault()
    setView('dashboard')
  }

  const handleReset = () => {
    setUserId('')
    setPassword('')
  }

  if (view === 'dashboard') {
    return (
      <main className="dashboard-shell" aria-label="POS Admin Menu Dashboard">
        <section className="dashboard-window">
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

          <div className="dashboard-menu-bar">
            <button type="button" className="active">Master</button>
            <button type="button">Transaksi</button>
            <button type="button">Laporan</button>
            <button type="button">Setting</button>
            <button type="button">Help</button>
          </div>

          <div className="dashboard-toolbar">
            {dashboardTools.map((tool) => {
              if (tool.divider) {
                return <span key={tool.key} className="toolbar-divider" aria-hidden="true" />
              }

              return (
                <button
                  key={tool.key}
                  type="button"
                  className="toolbar-item"
                  onClick={tool.backToLogin ? () => setView('login') : undefined}
                >
                  <span className={`icon tone-${tool.tone}`}>{tool.mark}</span>
                  <span>{tool.label}</span>
                </button>
              )
            })}
          </div>

          <div className="dashboard-canvas" aria-hidden="true">
            <div className="cash-register">
              <div className="display" />
              <div className="keys" />
              <div className="base" />
            </div>
          </div>

          <footer className="dashboard-statusbar">
            <div className="status-left">
              <span>Admin</span>
              <span>20 Oct 2023</span>
              <span>Version 2.16.01.08</span>
            </div>
            <div className="status-right">
              <span className="status-light" aria-hidden="true" />
              <span>System Connected</span>
            </div>
          </footer>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="login-window" aria-label="Minimarket login">
        <header className="window-titlebar">
          <span className="titlebar-icon" aria-hidden="true">M</span>
          <strong>Minimarket Ver 2.16.01</strong>
        </header>

        <div className="window-body">
          <div className="lock-wrap" aria-hidden="true">
            <div className="lock-shackle" />
            <div className="lock-body">
              <div className="lock-hole" />
            </div>
            <div className="lock-shadow" />
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <label htmlFor="userId">USER ID</label>
            <input
              id="userId"
              name="userId"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              autoComplete="username"
            />

            <label htmlFor="password">PASSWORD</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />

            <button type="submit" className="visually-hidden" aria-hidden="true" tabIndex={-1}>
              Login
            </button>
          </form>
        </div>

        <footer className="window-footer">
          <span className="version-pill">Minimarket Ver 2.16.01.08</span>
          <div className="action-buttons" aria-label="login actions">
            <button type="button" className="circle-button cancel" aria-label="Batal" onClick={handleReset}>
              &times;
            </button>
            <button type="button" className="circle-button submit" aria-label="Masuk" onClick={handleLogin}>
              &#10003;
            </button>
          </div>
        </footer>
      </section>
    </main>
  )
}

export default App
