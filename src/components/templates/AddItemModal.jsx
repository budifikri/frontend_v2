import { useState } from 'react'

export function AddItemModal({
  isOpen,
  onClose,
  onAdd,
  itemConfig,
  title = 'Add Item',
}) {
  const [selectedId, setSelectedId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleAdd = () => {
    if (!selectedId) return
    setIsLoading(true)
    onAdd({ product_id: selectedId })
    setIsLoading(false)
    setSelectedId('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAdd()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="delete-master-overlay" onClick={onClose}>
      <div className="stock-card-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="delete-master-header">
          <span className="material-icons-round material-icon orange">add_circle</span>
          <h2>{title}</h2>
        </div>

        <div className="stock-card-body">
          <div className="master-form-grid">
            {itemConfig?.selectFields?.map((field) => (
              <div key={field.name} className="master-form-group-wide">
                <label className="master-form-label">
                  {field.label} {field.required && '*'}
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="master-form-input"
                  autoFocus
                >
                  <option value="">Select {field.label}...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="stock-card-footer">
          <div className="stock-card-actions">
            <button
              type="button"
              className="master-footer-btn"
              onClick={handleAdd}
              disabled={!selectedId || isLoading}
            >
              <span className="material-icons-round master-footer-icon green">check</span>
              Add
            </button>
            <button
              type="button"
              className="master-footer-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              <span className="material-icons-round master-footer-icon red">close</span>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
