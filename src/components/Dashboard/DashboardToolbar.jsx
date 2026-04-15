import { useState, useRef, useEffect } from 'react'
import { toolbarItems } from '../../data'

export function DashboardToolbar({ activeMenu, onLoginClick, onToolClick, shortcutPopupKey }) {
  const items = toolbarItems[activeMenu] || toolbarItems.master
  const [openPopupKey, setOpenPopupKey] = useState(null)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const popupButtonRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (shortcutPopupKey) {
      const popupItem = items.find((t) => t.isPopup && t.key === shortcutPopupKey)
      if (popupItem) {
        setOpenPopupKey(shortcutPopupKey)
      }
    }
  }, [shortcutPopupKey, items])

  useEffect(() => {
    if (openPopupKey && popupButtonRef.current) {
      const rect = popupButtonRef.current.getBoundingClientRect()
      setPopupPosition({
        top: rect.bottom + 4,
        left: rect.left,
      })
    }
  }, [openPopupKey])

  const handlePopupClick = (key) => {
    setOpenPopupKey(openPopupKey === key ? null : key)
  }

  const handleSubItemClick = (subKey, subLabel) => {
    window.alert(`${subLabel || subKey} masih dalam pengembangan`)
    setOpenPopupKey(null)
  }

  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setOpenPopupKey(null)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="dashboard-toolbar">
      {items.map((tool) => {
        if (tool.divider) {
          return <span key={tool.key} className="toolbar-divider" aria-hidden="true" />
        }

        if (tool.isPopup) {
          return (
            <div key={tool.key} style={{ position: 'relative' }} className="toolbar-popup-container" ref={dropdownRef}>
              <button
                type="button"
                className="toolbar-item"
                ref={popupButtonRef}
                onClick={() => handlePopupClick(tool.key)}
              >
                <span className={`icon tone-${tool.tone}`}>
                  {tool.mark}
                  <span className="toolbar-popdown-icon">▼</span>
                </span>
                <span>{tool.label}</span>
              </button>
            </div>
          )
        }

        return (
          <button
            key={tool.key}
            type="button"
            className="toolbar-item"
            onClick={tool.backToLogin ? onLoginClick : () => onToolClick?.(tool.key)}
          >
            <span className={`icon tone-${tool.tone}`}>{tool.mark}</span>
            <span>{tool.label}</span>
          </button>
        )
      })}
      {openPopupKey && (
        <div
          className="toolbar-popup-dropdown-inline"
          style={{
            position: 'fixed',
            top: popupPosition.top,
            left: popupPosition.left,
          }}
        >
          {items
            .find((t) => t.isPopup && t.key === openPopupKey)
            ?.subItems?.map((sub) => (
              <button
                key={sub.key}
                type="button"
                className="toolbar-popup-item"
                onClick={() => handleSubItemClick(sub.key, sub.label)}
              >
                <span className={`icon tone-${sub.tone}`}>{sub.mark}</span>
                <span>{sub.label}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
