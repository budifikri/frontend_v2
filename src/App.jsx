import './App.css'

function App() {
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

          <form className="login-form" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="userId">USER ID</label>
            <input id="userId" name="userId" defaultValue="A" autoComplete="username" />

            <label htmlFor="password">PASSWORD</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
            />
          </form>
        </div>

        <footer className="window-footer">
          <span className="version-pill">Minimarket Ver 2.16.01.08</span>
          <div className="action-buttons" aria-label="login actions">
            <button type="button" className="circle-button cancel" aria-label="Batal">
              &times;
            </button>
            <button type="button" className="circle-button submit" aria-label="Masuk">
              &#10003;
            </button>
          </div>
        </footer>
      </section>
    </main>
  )
}

export default App
