export function LoginForm({ userId, password, onUserIdChange, onPasswordChange, onSubmit, onReset, isLoading, error }) {
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

          <form className="login-form" onSubmit={onSubmit}>
            <label htmlFor="userId">USER ID</label>
            <input
              id="userId"
              name="userId"
              value={userId}
              onChange={(event) => onUserIdChange(event.target.value)}
              autoComplete="username"
              disabled={isLoading}
            />

            <label htmlFor="password">PASSWORD</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              autoComplete="current-password"
              disabled={isLoading}
            />

            {error && (
              <div className="login-error">{error}</div>
            )}

            <button type="submit" className="visually-hidden" aria-hidden="true" tabIndex={-1}>
              Login
            </button>
          </form>
        </div>

        <footer className="window-footer">
          <span className="version-pill">Ver 3.0</span>
          <div className="action-buttons" aria-label="login actions">
            <button type="button" className="circle-button cancel" aria-label="Batal" onClick={onReset} disabled={isLoading}>
              &times;
            </button>
            <button type="button" className="circle-button submit" aria-label="Masuk" onClick={onSubmit} disabled={isLoading || !userId.trim() || !password.trim()}>
              {isLoading ? '...' : '✓'}
            </button>
          </div>
        </footer>
      </section>
    </main>
  )
}
