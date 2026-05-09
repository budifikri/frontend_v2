import { useState } from 'react'

export function LoginForm({ userId, onUserIdChange, onSubmit, onReset, isLoading, error }) {
  const [password, setPassword] = useState('')

  const handleFormSubmit = async (event) => {
    event.preventDefault()
    await onSubmit(password)
    setPassword('')
  }

  const handleResetClick = async () => {
    setPassword('')
    await onReset()
  }

  return (
    <main className="app-shell">
      <section className="login-window" aria-label="Minimarket login">
        <header className="window-titlebar">
          <span className="titlebar-icon" aria-hidden="true">P</span>
          <strong>PosXpress </strong>
        </header>

        <div className="window-body">
          <div className="lock-wrap" aria-hidden="true">
            <div className="lock-shackle" />
            <div className="lock-body">
              <div className="lock-hole" />
            </div>
            <div className="lock-shadow" />
          </div>

          <form id="login-form" className="login-form" onSubmit={handleFormSubmit}>
            <label htmlFor="userId">USER ID</label>
            <input
              id="userId"
              name="userId"
              value={userId}
              onChange={(event) => onUserIdChange(event.target.value)}
              placeholder="Isi User Name"
              autoComplete="username"
              disabled={isLoading}
            />

            <label htmlFor="password">PASSWORD</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Isi password"
              data-lpignore="true"
              data-1p-ignore="true"
              disabled={isLoading}
            />

            {error && (
              <div className="login-error">{error}</div>
            )}
          </form>
        </div>

        <footer className="window-footer">
          <span className="version-pill">Ver 3.0</span>
          <div className="action-buttons" aria-label="login actions">
            <button type="button" className="circle-button cancel" aria-label="Batal" onClick={handleResetClick} disabled={isLoading}>
              &times;
            </button>
            <button type="submit" form="login-form" className="circle-button submit" aria-label="Masuk" disabled={isLoading || !userId.trim() || !password.trim()}>
              {isLoading ? '...' : '✓'}
            </button>
          </div>
        </footer>
      </section>
    </main>
  )
}
