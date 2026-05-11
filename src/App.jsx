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
  Toast,
} from './components'
import { AuthProvider, useAuth } from './shared/auth'
import { ModuleProvider } from './shared/ModuleContext'
import { useModule } from './shared/useModule'
import { defaultMenu } from './data'
import { toolbarItems } from './data/toolbarItems'
import { login } from './features/auth/login.api'
import { apiFetch } from './shared/http'
import { applyTitlebarColors, applyWallpaper } from './utils/colorHelper'
import { resolveShortcutTool } from './utils/shortcutHelper'
import { canAccessTool } from './shared/moduleAccess'

const IMPLEMENTED_TOOLS = new Set(['warehouse', 'satuan', 'categori', 'product', 'customer', 'supplier', 'dokter', 'jadwal_dokter', 'paket', 'treatment', 'company', 'theme', 'user', 'lapstok', 'laphargagrosir', 'lapjual', 'lapbeli', 'opname', 'beli', 'receive', 'retur', 'promotion', 'lapcashdrawer', 'report_setting', 'backup', 'telegram', 'module', 'business_type', 'module_package', 'appointment'])
const LAST_USERNAME_STORAGE_KEY = 'pos_retail_last_username'

function loadLastUsername() {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(LAST_USERNAME_STORAGE_KEY) || ''
}

function AppContent() {
  const { auth, setAuth, clearAuth } = useAuth()
  const { companyConfig } = useModule()
  const [view, setView] = useState('login')
  const [activeMenu, setActiveMenu] = useState(defaultMenu)
  const [activeTool, setActiveTool] = useState(null)
  const [toolContext, setToolContext] = useState(null)
  const [isToolbarVisible, setIsToolbarVisible] = useState(true)
  const [userId, setUserId] = useState(() => loadLastUsername())
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'error' })
  const [shortcutPopupKey, setShortcutPopupKey] = useState(null)

  const activateTool = useCallback((toolKey, label = toolKey, context = null) => {
    if (!toolKey) return

    if (!IMPLEMENTED_TOOLS.has(toolKey)) {
      window.alert(`${label} masih dalam pengembangan`)
      return
    }

    if (!canAccessTool(toolbarItems, toolKey, companyConfig, auth.role)) {
      window.alert(`${label} tidak aktif untuk company ini`)
      return
    }

    if (toolKey === 'customer') setActiveMenu('master')
    if (toolKey === 'appointment') setActiveMenu('transaksi')

    setActiveTool(toolKey)
    setToolContext(context)
    setIsToolbarVisible(false)
  }, [companyConfig])

  useEffect(() => {
    let mounted = true

    if (!auth.token) {
      if (mounted) {
        setView('login')
        setActiveTool(null)
        setToolContext(null)
        setIsToolbarVisible(true)
        setIsInitializing(false)
      }
      return
    }

    apiFetch('/api/auth/me', { token: auth.token })
      .then(() => {
        if (!mounted) return
        if (auth.role === 'cashier') {
          setView('pos')
        } else {
          setView('dashboard')
          setActiveMenu(defaultMenu)
          setIsToolbarVisible(true)
        }
      })
      .catch(() => {
        if (!mounted) return
        clearAuth()
        setView('login')
        setActiveTool(null)
        setToolContext(null)
        setIsToolbarVisible(true)
      })
      .finally(() => {
        if (mounted) setIsInitializing(false)
      })

    return () => { mounted = false }
  }, [])

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

const handleLogin = async (password) => {
    const username = userId.trim()

    setIsLoading(true)

    try {
      const result = await login({ username, password })
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LAST_USERNAME_STORAGE_KEY, username)
      }
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
      setToast({ isOpen: true, message: err.message || 'Login failed', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async () => {
    setUserId('')
    setToast({ isOpen: false, message: '', type: 'error' })
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

  const handleLogout = useCallback(() => {
    clearAuth()
    setView('login')
    setUserId(loadLastUsername())
  }, [clearAuth])

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

  const handleToolClick = (toolKey, label, context = null) => {
    if (toolKey === 'pos') {
      setToolContext(context)
      setView('pos')
      setIsToolbarVisible(false)
      return
    }

    if (!IMPLEMENTED_TOOLS.has(toolKey)) {
      window.alert(`${label || toolKey} masih dalam pengembangan`)
      return
    }
    activateTool(toolKey, label || toolKey, context)
  }

  const handleExit = () => {
    setActiveTool(null)
    setToolContext(null)
    setIsToolbarVisible(true)
  }

  const handlePosExit = useCallback((nextContext = null) => {
    if (toolContext?.returnTo === 'appointment') {
      setView('dashboard')
      setActiveMenu('transaksi')
      setActiveTool('appointment')
      setToolContext(nextContext)
      setIsToolbarVisible(false)
      return
    }

    if (auth.role === 'cashier') {
      handleLogout()
      return
    }

    setView('dashboard')
    setToolContext(null)
  }, [auth.role, handleLogout, toolContext])

  if (isInitializing) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
      </div>
    )
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
            <DashboardCanvas activeTool={activeTool} toolContext={toolContext} onExit={handleExit} onOpenTool={handleToolClick} />
          </div>
        </section>
        <DashboardFooter username={auth.username} role={auth.role} />
      </main>
    )
  }

  if (view === 'pos') {
    return <POS posContext={toolContext} onExit={handlePosExit} />
  }

  return (
    <>
      <LoginForm
        userId={userId}
        onUserIdChange={setUserId}
        onSubmit={handleLogin}
        onReset={handleReset}
        isLoading={isLoading}
      />
      <Toast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />
    </>
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
