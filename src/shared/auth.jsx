import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'

export const UserRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  STAFF: 'staff',
}

export const AUTH_STORAGE_KEY = 'pos_retail_auth'
export const AUTH_EXPIRED_EVENT = 'pos-retail:auth-expired'

const AuthContext = createContext(null)

function isUserRole(value) {
  return value === 'admin' || value === 'manager' || value === 'cashier' || value === 'staff'
}

export function extractRoleFromToken(token) {
  try {
    const payload = jwtDecode(token)
    const role = payload.role ?? payload.user_role ?? payload.userRole
    return isUserRole(role) ? role : null
  } catch {
    return null
  }
}

export function extractTokenFromLoginData(data) {
  if (!data) return null
  if (typeof data === 'string') {
    return data.includes('.') ? data : null
  }

  const candidates = [
    data?.token,
    data?.access_token,
    data?.accessToken,
    data?.jwt,
    data?.data?.token,
    data?.data?.access_token,
    data?.data?.jwt,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  return null
}

export function extractRoleFromLoginData(data) {
  if (!data || typeof data !== 'object') return null

  const direct = data?.role ?? data?.user?.role ?? data?.data?.role
  if (isUserRole(direct)) return direct

  const token = extractTokenFromLoginData(data)
  return token ? extractRoleFromToken(token) : null
}

function loadAuthFromStorage() {
  try {
    if (typeof localStorage === 'undefined') return { token: null, role: null }
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return { token: null, role: null }

    const parsed = JSON.parse(raw)
    const token = typeof parsed?.token === 'string' ? parsed.token : null
    const role = isUserRole(parsed?.role) ? parsed.role : token ? extractRoleFromToken(token) : null

    return { token, role }
  } catch {
    return { token: null, role: null }
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuthState] = useState(() => loadAuthFromStorage())

  const setAuth = useCallback((next) => {
    const normalized = {
      token: next.token,
      role: next.role ?? (next.token ? extractRoleFromToken(next.token) : null),
    }
    setAuthState(normalized)
    if (typeof localStorage !== 'undefined') localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized))
  }, [])

  const clearAuth = useCallback(() => {
    setAuthState({ token: null, role: null })
    if (typeof localStorage !== 'undefined') localStorage.removeItem(AUTH_STORAGE_KEY)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handleAuthExpired = () => {
      clearAuth()
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
  }, [clearAuth])

  const value = useMemo(() => ({ auth, setAuth, clearAuth }), [auth, setAuth, clearAuth])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
