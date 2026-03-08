/**
 * Debug Logger Utility
 * Logs all API requests and responses when debug mode is enabled via ?debug query parameter
 * Logs are stored in localStorage and can be exported/viewed via Settings
 */

const DEBUG_STORAGE_KEY = 'debug-logs'
const DEBUG_ENABLED_PARAM = 'debug'
const MAX_LOGS = 1000 // Maximum number of logs to keep

/**
 * Check if debug mode is enabled via URL query parameter
 */
export function isDebugEnabled() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return params.has(DEBUG_ENABLED_PARAM)
}

/**
 * Format timestamp for log entries
 */
function formatTimestamp() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const ms = String(now.getMilliseconds()).padStart(3, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`
}

/**
 * Safely stringify an object for logging
 */
function safeStringify(obj, indent = 2) {
  try {
    return JSON.stringify(obj, null, indent)
  } catch (e) {
    return `[Unable to stringify: ${e.message}]`
  }
}

/**
 * Get current logs from localStorage
 */
export function getLogs() {
  if (typeof localStorage === 'undefined') return []
  try {
    const logs = localStorage.getItem(DEBUG_STORAGE_KEY)
    return logs ? JSON.parse(logs) : []
  } catch (e) {
    console.error('[DebugLogger] Error reading logs:', e)
    return []
  }
}

/**
 * Add a log entry to localStorage
 */
function addLogEntry(message, type, data = null) {
  const logs = getLogs()
  const entry = {
    timestamp: formatTimestamp(),
    type, // 'REQUEST' or 'RESPONSE'
    message,
    data,
  }

  logs.push(entry)

  // Trim logs if exceeding max
  if (logs.length > MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS)
  }

  try {
    localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(logs, null, 2))
  } catch (e) {
    console.error('[DebugLogger] Error saving logs:', e)
    // If localStorage is full, clear old logs and try again
    if (e.name === 'QuotaExceededError') {
      logs.splice(0, Math.floor(logs.length / 2))
      localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(logs, null, 2))
    }
  }
}

/**
 * Log an outgoing HTTP request
 */
export function logRequest(url, method, body = null) {
  if (!isDebugEnabled()) return

  const logData = {
    url,
    method: method || (body ? 'POST' : 'GET'),
    body: body ? safeStringify(body) : null,
  }

  addLogEntry(`REQUEST: ${method || 'GET'} ${url}`, 'REQUEST', logData)
  console.debug(`[DEBUG] REQUEST: ${method || 'GET'} ${url}`, body || '')
}

/**
 * Log an HTTP response
 */
export function logResponse(url, status, statusText, data = null) {
  if (!isDebugEnabled()) return

  const logData = {
    url,
    status,
    statusText,
    response: data ? safeStringify(data) : null,
  }

  addLogEntry(`RESPONSE: ${status} ${statusText} - ${url}`, 'RESPONSE', logData)
  console.debug(`[DEBUG] RESPONSE: ${status} ${statusText}`, data || '')
}

/**
 * Log an HTTP error
 */
export function logError(url, error) {
  if (!isDebugEnabled()) return

  const logData = {
    url,
    error: error?.message || String(error),
    status: error?.status,
    details: error?.details,
  }

  addLogEntry(`ERROR: ${error?.message || 'Unknown error'} - ${url}`, 'ERROR', logData)
  console.error(`[DEBUG] ERROR: ${error?.message || 'Unknown error'}`, error)
}

/**
 * Clear all logs from localStorage
 */
export function clearLogs() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(DEBUG_STORAGE_KEY)
  console.debug('[DebugLogger] Logs cleared')
}

/**
 * Export logs as a text file
 */
export function exportLogs() {
  const logs = getLogs()
  if (logs.length === 0) {
    console.warn('[DebugLogger] No logs to export')
    return
  }

  const logText = logs
    .map(log => `[${log.timestamp}] ${log.type}: ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`)
    .join('\n\n')

  const blob = new Blob([logText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `debug-log-${formatTimestamp().replace(/[:\s]/g, '-')}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Copy logs to clipboard
 */
export async function copyLogsToClipboard() {
  const logs = getLogs()
  if (logs.length === 0) {
    console.warn('[DebugLogger] No logs to copy')
    return false
  }

  const logText = logs
    .map(log => `[${log.timestamp}] ${log.type}: ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`)
    .join('\n\n')

  try {
    await navigator.clipboard.writeText(logText)
    console.debug('[DebugLogger] Logs copied to clipboard')
    return true
  } catch (e) {
    console.error('[DebugLogger] Error copying to clipboard:', e)
    return false
  }
}
