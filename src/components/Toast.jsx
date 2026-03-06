import { useEffect, useCallback } from 'react'

/**
 * Toast Notification Component
 * @param {Object} props
 * @param {string} props.message - Message to display
 * @param {string} props.type - Type: 'success' | 'error' | 'info' | 'warning'
 * @param {boolean} props.isOpen - Visibility state
 * @param {Function} props.onClose - Close handler
 * @param {number} props.duration - Auto-close duration in ms (default: 3000)
 */
export function Toast({ message, type = 'info', isOpen, onClose, duration = 3000 }) {
  const handleClose = useCallback(() => {
    if (onClose) onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, handleClose])

  if (!isOpen || !message) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check_circle'
      case 'error':
        return 'error'
      case 'warning':
        return 'warning'
      default:
        return 'info'
    }
  }

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return 'toast-success'
      case 'error':
        return 'toast-error'
      case 'warning':
        return 'toast-warning'
      default:
        return 'toast-info'
    }
  }

  return (
    <div className={`toast-container ${getTypeClass()}`}>
      <div className="toast-content">
        <span className="material-icons-round toast-icon">{getIcon()}</span>
        <span className="toast-message">{message}</span>
        <button
          type="button"
          className="toast-close"
          onClick={handleClose}
          title="Close"
        >
          <span className="material-icons-round">close</span>
        </button>
      </div>
    </div>
  )
}
