import { useState } from 'react'

export function AddItemModal({
  isOpen,
  onClose,
  onAdd,
  itemConfig,
  title = 'Add Product to Opname',
}) {
  const [selectedId, setSelectedId] = useState('')
  const [physicalQty, setPhysicalQty] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  if (!isOpen) return null

  const handleAdd = () => {
    if (!selectedId) return
    setIsAdding(true)
    onAdd({
      product_id: selectedId,
      physical_qty: Number(physicalQty) || 0,
      reason: reason || null,
      notes: notes || null,
    })
    setIsAdding(false)
    setSelectedId('')
    setPhysicalQty('')
    setReason('')
    setNotes('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const REASON_OPTIONS = [
    { value: 'broken', label: 'Broken / Damaged' },
    { value: 'expired', label: 'Expired' },
    { value: 'lost', label: 'Lost / Stolen' },
    { value: 'mismatch', label: 'Inventory Mismatch' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container" 
        onClick={(e) => e.stopPropagation()} 
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-icon">
            <span className="material-icons-round">add</span>
          </div>
          <h2 className="modal-title">{title}</h2>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <div className="form-section">
            <label className="form-label">
              Product <span className="required-mark">*</span>
            </label>
            <div className="select-wrapper">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="form-select"
                autoFocus
              >
                <option disabled value="">Select Product...</option>
                {itemConfig?.selectFields?.[0]?.options?.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
              <span className="select-arrow material-icons-round">expand_more</span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-section">
              <label className="form-label">
                Physical Stock <span className="required-mark">*</span>
              </label>
              <input
                type="number"
                value={physicalQty}
                onChange={(e) => setPhysicalQty(e.target.value)}
                className="form-input"
                placeholder="0"
                min="0"
              />
            </div>
            <div className="form-section">
              <label className="form-label">Variance</label>
              <div className="variance-display">
                {physicalQty ? Number(physicalQty) : 0}
              </div>
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">Reason</label>
            <div className="select-wrapper">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="form-select"
              >
                <option value="">Select Reason...</option>
                {REASON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="select-arrow material-icons-round">expand_more</span>
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-textarea"
              placeholder="Enter any additional details..."
              rows={2}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="action-btn action-btn-add"
            onClick={handleAdd}
            disabled={!selectedId || isAdding}
          >
            <div className="action-btn-icon">
              <span className="material-icons-round">check</span>
            </div>
            <span className="action-btn-label">Add</span>
          </button>
          <button
            type="button"
            className="action-btn action-btn-cancel"
            onClick={onClose}
          >
            <div className="action-btn-icon">
              <span className="material-icons-round">close</span>
            </div>
            <span className="action-btn-label">Cancel</span>
          </button>
        </div>
      </div>
    </div>
  )
}
