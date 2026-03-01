import { useState, useEffect } from 'react'
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

  useEffect(() => {
    // Apply theme settings on initial load (localStorage > .env)
    const savedWallpaper = localStorage.getItem('theme-wallpaper') || import.meta.env.VITE_DEFAULT_WALLPAPER
    const savedTitleColor = localStorage.getItem('theme-title-color') || import.meta.env.VITE_DEFAULT_TITLEBAR_COLOR
    
    if (savedTitleColor) {
      document.documentElement.style.setProperty('--titlebar-bg', savedTitleColor)
    }
    if (savedWallpaper) {
      document.documentElement.style.setProperty('--app-wallpaper', `url(${savedWallpaper})`)
      document.body.classList.add('has-wallpaper')
    } else {
      document.body.classList.remove('has-wallpaper')
    }
  }, [])

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
