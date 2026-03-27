import { AUTH_EXPIRED_EVENT } from './auth'
import { isDebugEnabled, logRequest, logResponse, logError } from '../utils/debugLogger'

const baseUrl = import.meta.env.VITE_API_BASE_URL || ''

export const ApiResponse = {
  success: (data) => ({ success: true, data }),
  error: (message, error) => ({ success: false, message, error }),
}

export class ApiError extends Error {
  status
  details

  constructor(message, opts) {
    super(message)
    this.name = 'ApiError'
    this.status = opts?.status
    this.details = opts?.details
  }
}

export async function apiFetch(path, opts = {}) {
  const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
  const method = opts?.method ?? (opts?.body !== undefined ? 'POST' : 'GET')

  const headers = {
    Accept: 'application/json',
  }
  if (opts?.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts?.token) headers['Authorization'] = `Bearer ${opts.token}`

  // Debug logging for request
  if (isDebugEnabled()) {
    logRequest(url, method, opts?.body)
  } else {
    console.log('[HTTP] Request', { url, method, body: opts?.body })
  }

  const res = await fetch(url, {
    method,
    headers,
    body: opts?.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: opts?.signal,
  })

  let json
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    json = await res.json().catch(() => undefined)
  }

  if (!res.ok) {
    // Debug logging for error response
    console.error('[HTTP] Error response', {
      url,
      method,
      status: res.status,
      statusText: res.statusText,
      body: json,
      requestBody: opts?.body,
    })
    if (isDebugEnabled()) {
      logError(url, new ApiError(json?.error || json?.message || `HTTP ${res.status}`, { status: res.status, details: json }))
    } else {
      console.log('[HTTP] Response error', { url, status: res.status, body: json })
    }

    if (res.status === 401 || res.status === 403) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
      }
    }
    const msg =
      json?.error ||
      json?.message ||
      `HTTP ${res.status}`
    throw new ApiError(msg, { status: res.status, details: json })
  }

  // Debug logging for successful response
  if (isDebugEnabled()) {
    logResponse(url, res.status, res.statusText, json)
  }

  return json ?? { success: true }
}
