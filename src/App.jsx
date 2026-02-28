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
import { defaultMenu } from './data'

function App() {
  const [view, setView] = useState('login')
  const [activeMenu, setActiveMenu] = useState(defaultMenu)
  const [activeTool, setActiveTool] = useState(null)
  const [userId, setUserId] = useState('A')
  const [password, setPassword] = useState('')

  const handleLogin = (event) => {
    event.preventDefault()
    setView('dashboard')
    setActiveMenu(defaultMenu)
  }

  const handleReset = () => {
    setUserId('')
    setPassword('')
  }

  const handleMenuChange = (menuKey) => {
    setActiveMenu(menuKey)
    setActiveTool(null)
  }

  const handleToolClick = (toolKey) => {
    setActiveTool(toolKey)
  }

  const handleExit = () => {
    setActiveTool(null)
  }

  if (view === 'dashboard') {
    return (
      <main className="dashboard-shell" aria-label="POS Admin Menu Dashboard">
        <section className="dashboard-window">
          <DashboardHeader />
          <DashboardMenuBar 
            activeMenu={activeMenu} 
            onMenuChange={handleMenuChange} 
          />
          <DashboardToolbar 
            activeMenu={activeMenu} 
            onLoginClick={() => setView('login')}
            onToolClick={handleToolClick}
          />
          <DashboardCanvas activeTool={activeTool} onExit={handleExit} />
        </section>
        <DashboardFooter user={userId} />
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
