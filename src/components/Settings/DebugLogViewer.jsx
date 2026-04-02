import { useState, useEffect, useCallback, useRef } from 'react'
import './DebugLogViewer.css'
import { getLogs, clearLogs, exportLogs, copyLogsToClipboard } from '../../utils/debugLogger'

export function DebugLogViewer({ onClose }) {
  const [logs, setLogs] = useState(() => getLogs())
  const [filter, setFilter] = useState('all') // all, REQUEST, RESPONSE, ERROR
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [expandedBodies, setExpandedBodies] = useState({})
  const [copiedIndex, setCopiedIndex] = useState(null)
  const refreshRef = useRef()

  const loadLogs = useCallback(() => {
    setLogs(getLogs())
  }, [])

  // Store loadLogs in ref for interval access
  useEffect(() => {
    refreshRef.current = loadLogs
  }, [loadLogs])

  useEffect(() => {
    let interval
    if (autoRefresh) {
      interval = setInterval(() => {
        refreshRef.current?.()
      }, 2000) // Refresh every 2 seconds
    }
    return () => clearInterval(interval)
  }, [autoRefresh])

  const toggleBodyExpand = (index, bodyKey) => {
    setExpandedBodies(prev => ({
      ...prev,
      [`${index}-${bodyKey}`]: !prev[`${index}-${bodyKey}`]
    }))
  }

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(`${index}-copied`)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all debug logs?')) {
      clearLogs()
      loadLogs()
    }
  }

  const handleCopy = async () => {
    const success = await copyLogsToClipboard()
    if (success) {
      alert('Logs copied to clipboard!')
    } else {
      alert('Failed to copy logs')
    }
  }

  const handleExport = () => {
    if (logs.length === 0) {
      alert('No logs to export')
      return
    }
    exportLogs()
  }

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(log => log.type === filter)

  const getLogIcon = (type) => {
    switch (type) {
      case 'REQUEST': return 'arrow_upward'
      case 'RESPONSE': return 'arrow_downward'
      case 'ERROR': return 'error'
      default: return 'info'
    }
  }

  const getLogClass = (type) => {
    return `log-entry ${type.toLowerCase()}`
  }

  // Format JSON data for better display
  const formatJson = (data) => {
    if (!data) return '(empty)'

    if (typeof data === 'string') {
      try {
        return JSON.stringify(JSON.parse(data), null, 2)
      } catch {
        return data
      }
    }

    return JSON.stringify(data, null, 2)
  }

  // Format response data for better display
  const formatResponseData = (data) => {
    if (!data) return null

    let parsedData = data
    // Try to parse if it's a JSON string
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data)
      } catch {
        return data
      }
    }

    return parsedData
  }

  const renderResponseContent = (log, index) => {
    if (!log.data) return null

    const formattedData = formatResponseData(log.data)
    const requestBodyKey = `${index}-request`
    const responseBodyKey = `${index}-response`
    const isRequestBodyExpanded = expandedBodies[requestBodyKey]
    const isResponseBodyExpanded = expandedBodies[responseBodyKey]

    // Get request body and response body
    const requestBody = formattedData?.body || null
    const responseBody = formattedData?.response || formattedData?.data || null

    // Handle REQUEST logs with body field
    if (log.type === 'REQUEST' && requestBody) {
      // Request block header with actions placed near Copy button
      return (
        <div className="log-data-structured">
          {/* Request Info */}
          <div className="data-section">
            <div className="data-section-header">
              <span className="material-icons">http</span>
              <span>Request Details</span>
            </div>
            <div className="request-info">
              <div className="request-item">
                <strong>URL:</strong> {formattedData.url}
              </div>
              <div className="request-item">
                <strong>Method:</strong> {formattedData.method}
              </div>
            </div>
          </div>

          {/* Request Body */}
          <div className="data-section">
          <div className="data-section-header">
            <div className="header-left" style={{flex: 1, display: 'flex', alignItems: 'center', gap: 6}}>
              <span className="material-icons">data_object</span>
              <span>Request Body</span>
            </div>
            <div className="body-actions">
              <button
                className="body-expand-btn"
                onClick={() => toggleBodyExpand(index, 'request')}
                title={isRequestBodyExpanded ? 'Collapse' : 'Expand'}
              >
                <span className="material-icons">{isRequestBodyExpanded ? 'expand_less' : 'expand_more'}</span>
              </button>
              <button
                className="body-copy-btn"
                onClick={() => copyToClipboard(formatJson(requestBody), index)}
                title="Copy to clipboard"
              >
                <span className="material-icons">{copiedIndex === `${index}-copied` ? 'check' : 'content_copy'}</span>
              </button>
            </div>
          </div>
            {isRequestBodyExpanded ? (
              <pre className="data-content data-content-dark">
                {formatJson(requestBody)}
              </pre>
            ) : (
              <pre className="data-content data-content-collapsed">
                {getFirstLine(requestBody)}
              </pre>
            )}
          </div>
        </div>
      )
    }

    // If it's a parsed object (likely a response), show structured view
    if (typeof formattedData === 'object' && formattedData !== null) {
      // Gate: show only if there is a body in the response
      const hasResponseBody = Boolean(formattedData?.response || formattedData?.data)
      if (!hasResponseBody) return null

      return (
        <div className="log-data-structured">
          {/* Status Badge */}
          {log.type === 'RESPONSE' && formattedData.success !== undefined && (
            <div className="response-status">
              <span className={`status-badge ${formattedData.success ? 'success' : 'error'}`}>
                <span className="material-icons">{formattedData.success ? 'check_circle' : 'error'}</span>
                {formattedData.success ? 'Success' : 'Failed'}
              </span>
              {formattedData.status && (
                <span className={`http-status ${formattedData.status >= 400 ? 'error' : 'success'}`}>
                  HTTP {formattedData.status}
                </span>
              )}
            </div>
          )}

          {/* Response Body */}
          {Boolean(formattedData?.response || formattedData?.data) && (
            <div className="data-section">
          <div className="data-section-header">
            <div className="header-left" style={{flex: 1, display: 'flex', alignItems: 'center', gap: 6}}>
              <span className="material-icons">data_object</span>
              <span>Response Body</span>
            </div>
            <div className="body-actions">
              <button
                className="body-expand-btn"
                onClick={() => toggleBodyExpand(index, 'response')}
                title={isResponseBodyExpanded ? 'Collapse' : 'Expand'}
              >
                <span className="material-icons">{isResponseBodyExpanded ? 'expand_less' : 'expand_more'}</span>
              </button>
              <button
                className="body-copy-btn"
                onClick={() => copyToClipboard(formatJson(responseBody), index)}
                title="Copy to clipboard"
              >
                <span className="material-icons">{copiedIndex === `${index}-copied` ? 'check' : 'content_copy'}</span>
              </button>
            </div>
          </div>
              {isResponseBodyExpanded ? (
                <pre className="data-content data-content-dark">
                  {formatJson(responseBody)}
                </pre>
              ) : (
                <pre className="data-content data-content-collapsed">
                  {getFirstLine(responseBody)}
                </pre>
              )}
            </div>
          )}

          {/* Pagination Info (if exists) */}
          {formattedData.pagination && (
            <div className="data-section">
              <div className="data-section-header">
                <span className="material-icons">table_view</span>
                <span>Pagination</span>
              </div>
              <div className="pagination-info">
                <span className="pagination-item">
                  <strong>Total:</strong> {formattedData.pagination.total}
                </span>
                <span className="pagination-item">
                  <strong>Limit:</strong> {formattedData.pagination.limit}
                </span>
                <span className="pagination-item">
                  <strong>Offset:</strong> {formattedData.pagination.offset}
                </span>
                <span className="pagination-item">
                  <strong>Has More:</strong> {formattedData.pagination.has_more ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          )}
        </div>
      )
    }

    // Fallback for simple string data
    return (
      <pre className="log-data">
        {typeof log.data === 'string'
          ? log.data
          : JSON.stringify(log.data, null, 2)}
      </pre>
    )
  }

  // Get only the first line of JSON data
  const getFirstLine = (data) => {
    if (!data) return '(empty)'

    let jsonString = data
    if (typeof data !== 'string') {
      jsonString = JSON.stringify(data, null, 2)
    }

    const lines = jsonString.split('\n')
    return lines[0] || '(empty)'
  }

  return (
    <div className="debug-viewer-overlay" onClick={onClose}>
      <div className="debug-viewer-modal" onClick={e => e.stopPropagation()}>
        <div className="debug-viewer-header">
          <div className="debug-viewer-title">
            <span className="material-icons">bug_report</span>
            <h3>Debug Log Viewer</h3>
          </div>
          <button className="debug-viewer-close" onClick={onClose}>×</button>
        </div>

        <div className="debug-viewer-toolbar">
          <div className="debug-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({logs.length})
            </button>
            <button
              className={`filter-btn ${filter === 'REQUEST' ? 'active' : ''}`}
              onClick={() => setFilter('REQUEST')}
            >
              Requests ({logs.filter(l => l.type === 'REQUEST').length})
            </button>
            <button
              className={`filter-btn ${filter === 'RESPONSE' ? 'active' : ''}`}
              onClick={() => setFilter('RESPONSE')}
            >
              Responses ({logs.filter(l => l.type === 'RESPONSE').length})
            </button>
            <button
              className={`filter-btn ${filter === 'ERROR' ? 'active' : ''}`}
              onClick={() => setFilter('ERROR')}
            >
              Errors ({logs.filter(l => l.type === 'ERROR').length})
            </button>
          </div>

          <div className="debug-actions">
            <label className="auto-refresh-toggle">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
            <button className="action-btn" onClick={handleCopy} title="Copy to clipboard">
              <span className="material-icons">content_copy</span>
              Copy
            </button>
            <button className="action-btn" onClick={handleExport} title="Export to file">
              <span className="material-icons">download</span>
              Export
            </button>
            <button className="action-btn danger" onClick={handleClear} title="Clear all logs">
              <span className="material-icons">delete</span>
              Clear
            </button>
          </div>
        </div>

        <div className="debug-viewer-content">
          {filteredLogs.length === 0 ? (
            <div className="no-logs">
              <span className="material-icons">inbox</span>
              <p>No debug logs found</p>
              <p className="hint">
                Navigate with <code>?debug</code> in the URL to enable logging
              </p>
            </div>
          ) : (
            <div className="logs-container">
              {filteredLogs.map((log, index) => (
                <div key={index} className={getLogClass(log.type)}>
                  <div className="log-header">
                    <span className="material-icons log-icon">{getLogIcon(log.type)}</span>
                    <span className="log-timestamp">[{log.timestamp}]</span>
                    <span className={`log-type ${log.type.toLowerCase()}`}>{log.type}</span>
                    <span className="log-message">{log.message}</span>
                    {log.data && (
                      // Expand per-body sections (handled inside Request/Response blocks)
                      null
                    )}
                  </div>
                  {log.data && renderResponseContent(log, index)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="debug-viewer-footer">
          <span className="log-count">
            Showing {filteredLogs.length} of {logs.length} logs
          </span>
        </div>
      </div>
    </div>
  )
}
