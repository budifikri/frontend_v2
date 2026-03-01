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

  const headers = {
    Accept: 'application/json',
  }
  if (opts?.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts?.token) headers['Authorization'] = `Bearer ${opts.token}`

  console.debug('[HTTP] Request', {
    url,
    method: opts?.method ?? (opts?.body !== undefined ? 'POST' : 'GET'),
    body: opts?.body,
  })

  const res = await fetch(url, {
    method: opts?.method ?? (opts?.body !== undefined ? 'POST' : 'GET'),
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
    console.debug('[HTTP] Response error', { url, status: res.status, body: json })
    if (res.status === 401 || res.status === 403) {
      window.location.href = '/login'
    }
    const msg =
      json?.error ||
      json?.message ||
      `HTTP ${res.status}`
    throw new ApiError(msg, { status: res.status, details: json })
  }

  return json ?? { success: true }
}
