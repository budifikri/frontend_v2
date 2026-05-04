import { useState, useEffect, useCallback } from 'react'
import './App.css'
import {
  DashboardHeader,
  DashboardMenuBar,
  DashboardToolbar,
  DashboardCanvas,
  DashboardFooter,
  LoginForm,
  POS,
} from './components'
import { AuthProvider, useAuth } from './shared/auth'
import { ModuleProvider } from './shared/ModuleContext'
import { useModule } from './shared/useModule'
import { defaultMenu } from './data'
import { toolbarItems } from './data/toolbarItems'
import { login } from './features/auth/login.api'
import { applyTitlebarColors, applyWallpaper } from './utils/colorHelper'
import { resolveShortcutTool } from './utils/shortcutHelper'
import { canAccessTool } from './shared/moduleAccess'

const IMPLEMENTED_TOOLS = new Set(['warehouse', 'satuan', 'categori', 'product', 'customer', 'supplier', 'dokter', 'company', 'theme', 'user', 'lapstok', 'laphargagrosir', 'lapjual', 'lapbeli', 'opname', 'beli', 'receive', 'retur', 'promotion', 'lapcashdrawer', 'report_setting', 'backup', 'telegram', 'module', 'business_type', 'module_package'])

function AppContent() {
  const { auth, setAuth, clearAuth } = useAuth()
  const { companyConfig } = useModule()
  const [view, setView] = useState('login')
  const [activeMenu, setActiveMenu] = useState(defaultMenu)
  const [activeTool, setActiveTool] = useState(null)
  const [isToolbarVisible, setIsToolbarVisible] = useState(true)
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [shortcutPopupKey, setShortcutPopupKey] = useState(null)

  const activateTool = useCallback((toolKey, label = toolKey) => {
    if (!toolKey) return

    if (!IMPLEMENTED_TOOLS.has(toolKey)) {
      window.alert(`${label} masih dalam pengembangan`)
      return
    }

    if (!canAccessTool(toolbarItems, toolKey, companyConfig)) {
      window.alert(`${label} tidak aktif untuk company ini`)
      return
    }

    setActiveTool(toolKey)
    setIsToolbarVisible(false)
  }, [companyConfig])

  useEffect(() => {
    if (auth.token) {
      if (auth.role === 'cashier') {
        setView('pos')
      } else {
        setView('dashboard')
        setActiveMenu(defaultMenu)
        setIsToolbarVisible(true)
      }
      return
    }

    setView('login')
    setActiveTool(null)
    setIsToolbarVisible(true)
  }, [auth.token, auth.role])

  useEffect(() => {
    const savedWallpaper = localStorage.getItem('theme-wallpaper') || import.meta.env.VITE_DEFAULT_WALLPAPER
    const savedTitleColor = localStorage.getItem('theme-title-color') || import.meta.env.VITE_DEFAULT_TITLEBAR_COLOR

    if (savedTitleColor) {
      applyTitlebarColors(savedTitleColor)
    }
    applyWallpaper(savedWallpaper)
  }, [])

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'theme-wallpaper') {
        const newWallpaper = e.newValue || import.meta.env.VITE_DEFAULT_WALLPAPER
        applyWallpaper(newWallpaper)
      }
      if (e.key === 'theme-title-color') {
        const newTitleColor = e.newValue || import.meta.env.VITE_DEFAULT_TITLEBAR_COLOR
        if (newTitleColor) applyTitlebarColors(newTitleColor)
      }
    }

    const handleThemeChange = (e) => {
      const { wallpaper: newWallpaper, titleColor: newTitleColor } = e.detail
      if (newWallpaper !== undefined) {
        applyWallpaper(newWallpaper)
      }
      if (newTitleColor !== undefined) {
        applyTitlebarColors(newTitleColor)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('theme-changed', handleThemeChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('theme-changed', handleThemeChange)
    }
  }, [])

  useEffect(() => {
    if (view !== 'dashboard') return

    const handleKeyDown = (event) => {
      const target = event.target
      const isTypingTarget =
        target instanceof HTMLElement && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        )

      if (isTypingTarget) return

      const key = event.key?.toLowerCase?.()
      if (!key || key.length !== 1) return

      if (event.ctrlKey || event.altKey || event.metaKey) return

      const shortcutTool = resolveShortcutTool(activeMenu, key)
      if (shortcutTool?.key) {
        event.preventDefault()
        if (shortcutTool.isPopup && shortcutTool.subItems?.length > 0) {
          setShortcutPopupKey(shortcutTool.key)
          setTimeout(() => setShortcutPopupKey(null), 100)
        } else if (!IMPLEMENTED_TOOLS.has(shortcutTool.key)) {
          window.alert(`${shortcutTool.label} masih dalam pengembangan`)
        } else {
          activateTool(shortcutTool.key, shortcutTool.label)
        }
      } else if (key) {
        event.preventDefault()
        window.alert(`Menu dengan shortcut '${key.toUpperCase()}' tidak ada`)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [view, activeMenu, activateTool])

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await login({ username: userId, password })
      const role = result.role?.toLowerCase()
      setAuth({ token: result.token, role, username: result.username, companyName: result.companyName, companyId: result.companyId, businessType: result.businessType })
      if (role === 'cashier') {
        setView('pos')
      } else {
        setView('dashboard')
        setActiveMenu(defaultMenu)
        setIsToolbarVisible(true)
      }
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
    if (!activeTool) {
      if (menuKey === activeMenu) return
      setActiveMenu(menuKey)
      setIsToolbarVisible(true)
      return
    }

    if (menuKey === activeMenu) {
      setIsToolbarVisible((prev) => !prev)
      return
    }

    setActiveMenu(menuKey)
    setIsToolbarVisible(true)
  }

  const handleToolClick = (toolKey, label) => {
    if (!IMPLEMENTED_TOOLS.has(toolKey)) {
      window.alert(`${label || toolKey} masih dalam pengembangan`)
      return
    }
    activateTool(toolKey, label || toolKey)
  }

  const handleExit = () => {
    setActiveTool(null)
    setIsToolbarVisible(true)
  }

  if (view === 'dashboard') {
    const dashboardWindowClassName = !isToolbarVisible
      ? 'dashboard-window dashboard-window--toolbar-hidden'
      : 'dashboard-window'

    return (
      <main className="dashboard-shell" aria-label="POS Admin Menu Dashboard">
        <section className={dashboardWindowClassName}>
          <DashboardHeader companyName={auth.companyName} />
          <DashboardMenuBar
            activeMenu={activeMenu}
            onMenuChange={handleMenuChange}
          />
          {isToolbarVisible && (
            <DashboardToolbar
              activeMenu={activeMenu}
              onLoginClick={handleLogout}
              onToolClick={handleToolClick}
              shortcutPopupKey={shortcutPopupKey}
            />
          )}
          <div className="dashboard-canvas-panel">
            <DashboardCanvas activeTool={activeTool} onExit={handleExit} />
          </div>
        </section>
        <DashboardFooter username={auth.username} role={auth.role} />
      </main>
    )
  }

  if (view === 'pos') {
    return <POS />
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
      <ModuleProvider>
        <AppContent />
      </ModuleProvider>
    </AuthProvider>
  )
}

export default App
