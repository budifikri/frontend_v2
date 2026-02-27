import { useState } from 'react'
import './App.css'
import {
  DashboardHeader,
  DashboardMenuBar,
  DashboardToolbar,
  DashboardCanvas,
  DashboardFooter,
  LoginForm,
} from './components'

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
          <DashboardHeader />
          <DashboardMenuBar />
          <DashboardToolbar onLoginClick={() => setView('login')} />
          <DashboardCanvas />
        </section>
        <DashboardFooter />
      </main>
    )
  }

  return (
    <LoginForm
      userId={userId}
      password={password}
      onUserIdChange={setUserId}
      onPasswordChange={setPassword}
      onSubmit={handleLogin}
      onReset={handleReset}
    />
  )
}

export default App
