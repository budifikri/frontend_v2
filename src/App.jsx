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
import { AuthProvider, useAuth } from './shared/auth'
import { defaultMenu } from './data'
import { login } from './features/auth/login.api'

function AppContent() {
  const { auth, setAuth, clearAuth } = useAuth()
  const [view, setView] = useState('login')
  const [activeMenu, setActiveMenu] = useState(defaultMenu)
  const [activeTool, setActiveTool] = useState(null)
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (auth.token) {
      setView('dashboard')
      setActiveMenu(defaultMenu)
    }
  }, [auth.token])

  useEffect(() => {
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

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await login({ username: userId, password })
      setAuth({ token: result.token, role: result.role })
      setView('dashboard')
      setActiveMenu(defaultMenu)
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async () => {
    setUserId('')
    setPassword('')
    setError('')
    if (window.__TAURI__) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const appWindow = getCurrentWindow()
        await appWindow.close()
      } catch (e) {
        console.error('Tauri error:', e)
      }
    }
  }

  const handleLogout = () => {
    clearAuth()
    setView('login')
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
            onLoginClick={handleLogout}
            onToolClick={handleToolClick}
          />
          <DashboardCanvas activeTool={activeTool} onExit={handleExit} />
        </section>
        <DashboardFooter user={auth.role || userId} />
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
      isLoading={isLoading}
      error={error}
    />
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
