import { useState, useRef, useEffect } from 'react'
import { toolbarItems } from '../../data'
import { useModule } from '../../shared/useModule'
import { getVisibleToolbarItems } from '../../shared/moduleAccess'

export function DashboardToolbar({ activeMenu, onLoginClick, onToolClick, shortcutPopupKey }) {
  const { companyConfig } = useModule()
  const items = getVisibleToolbarItems(toolbarItems[activeMenu] || toolbarItems.master, companyConfig)
  const [openPopupKey, setOpenPopupKey] = useState(null)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const popupButtonRefs = useRef({})
  const toolbarRef = useRef(null)
  const popupMenuRef = useRef(null)

  useEffect(() => {
    if (shortcutPopupKey) {
      const popupItem = items.find((t) => t.isPopup && t.key === shortcutPopupKey)
      if (popupItem) {
        const buttonElement = popupButtonRefs.current[shortcutPopupKey]
        if (buttonElement) {
          const rect = buttonElement.getBoundingClientRect()
          setPopupPosition({
            top: rect.bottom + 4,
            left: rect.left,
          })
        }
        setOpenPopupKey(shortcutPopupKey)
      }
    }
  }, [shortcutPopupKey, items])

  const handlePopupClick = (key, event) => {
    if (openPopupKey === key) {
      setOpenPopupKey(null)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    setPopupPosition({
      top: rect.bottom + 4,
      left: rect.left,
    })
    setOpenPopupKey(key)
  }

  const handleSubItemClick = (subKey, subLabel) => {
    onToolClick?.(subKey, subLabel)
    setOpenPopupKey(null)
  }

  const handleClickOutside = (e) => {
    const isInsideButton = toolbarRef.current?.contains(e.target)
    const isInsidePopup = popupMenuRef.current?.contains(e.target)
    if (!isInsideButton && !isInsidePopup) setOpenPopupKey(null)
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getLabel = (tool) => {
    if (tool.key === 'customer' && companyConfig?.businessType === 'clinic') {
      return 'Pasien'
    }
    return tool.label
  }

  return (
    <div className="dashboard-toolbar" ref={toolbarRef}>
      {items.map((tool) => {
        if (tool.divider) {
          return <span key={tool.key} className="toolbar-divider" aria-hidden="true" />
        }

        if (tool.isPopup) {
          return (
            <div key={tool.key} style={{ position: 'relative' }} className="toolbar-popup-container">
              <button
                type="button"
                className="toolbar-item"
                ref={(el) => {
                  popupButtonRefs.current[tool.key] = el
                }}
                onClick={(event) => handlePopupClick(tool.key, event)}
              >
                <span className={`icon tone-${tool.tone}`}>
                  {tool.mark}
                  <span className="toolbar-popdown-icon">▼</span>
                </span>
                <span>{getLabel(tool)}</span>
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
            <span>{getLabel(tool)}</span>
          </button>
        )
      })}
      {openPopupKey && (
        <div
          ref={popupMenuRef}
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
                onClick={() => handleSubItemClick(sub.key, getLabel(sub))}
              >
                <span className={`icon tone-${sub.tone}`}>{sub.mark}</span>
                <span>{getLabel(sub)}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
