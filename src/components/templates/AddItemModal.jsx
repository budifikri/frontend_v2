import { useState, useEffect, useMemo, useCallback } from 'react'

export function AddItemModal({
  isOpen,
  onClose,
  onAdd,
  itemConfig,
  title = 'Add Product to Opname',
  onProductSelect,  // Callback to fetch system stock
}) {
  const [selectedId, setSelectedId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [physicalQty, setPhysicalQty] = useState('')
  const [systemQty, setSystemQty] = useState(0)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isProductSelected, setIsProductSelected] = useState(false)

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    const products = itemConfig?.selectFields?.[0]?.options || []
    if (!searchQuery.trim()) return products.slice(0, 50) // Limit initial display

    const query = searchQuery.toLowerCase().trim()
    return products.filter(product => {
      const sku = (product.code || product.sku || '').toLowerCase()
      const name = (product.name || product.name_only || '').toLowerCase()
      const barcode = (product.barcode || '').toLowerCase()

      return sku.includes(query) || name.includes(query) || barcode.includes(query)
    }).slice(0, 100) // Limit results
  }, [itemConfig, searchQuery])

  // Handle product selection - derive state instead of using useEffect
  const derivedProduct = useMemo(() => {
    if (selectedId && onProductSelect) {
      return filteredProducts.find(opt => opt.id === selectedId) || null
    }
    return null
  }, [selectedId, filteredProducts, onProductSelect])

  useEffect(() => {
    if (derivedProduct) {
      onProductSelect?.(derivedProduct.id, (stock) => {
        setSystemQty(stock || 0)
      })
    }
  }, [derivedProduct, onProductSelect])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!searchQuery.trim() || filteredProducts.length === 0 || isProductSelected) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev =>
        prev < filteredProducts.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev =>
        prev > 0 ? prev - 1 : filteredProducts.length - 1
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < filteredProducts.length) {
        const product = filteredProducts[highlightedIndex]
        setSelectedId(product.id)
        setSearchQuery(product.name)  // Show only product name
        setIsProductSelected(true)
        setHighlightedIndex(-1)
      }
    } else if (e.key === 'Escape') {
      setHighlightedIndex(-1)
    }
  }, [searchQuery, filteredProducts, highlightedIndex, isProductSelected])

  if (!isOpen) return null

  const handleAdd = () => {
    if (!selectedId) return
    setIsAdding(true)
    onAdd({
      product_id: selectedId,
      system_quantity: systemQty,
      actual_quantity: Number(physicalQty) || 0,
      reason: reason || null,
      notes: notes || null,
    })
    setIsAdding(false)
    setSelectedId('')
    setSearchQuery('')
    setPhysicalQty('')
    setSystemQty(0)
    setReason('')
    setNotes('')
    setIsProductSelected(false)
    setHighlightedIndex(-1)
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
        onKeyDown={(e) => {
          if (!isProductSelected) {
            handleKeyDown(e)
          } else if (e.key === 'Escape') {
            onClose()
          }
        }}
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
              Search Product <span className="required-mark">*</span>
            </label>
            <div className="search-wrapper">
              <span className="material-icons-round search-icon">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedId('')
                  setIsProductSelected(false)
                }}
                className="form-input search-input"
                placeholder="Search by SKU, barcode, or product name..."
                autoFocus
                disabled={isProductSelected}
              />
              {isProductSelected && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedId('')
                    setIsProductSelected(false)
                  }}
                  title="Clear selection"
                >
                  <span className="material-icons-round">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Product List - Only show if not selected */}
          {!isProductSelected && searchQuery.trim() && filteredProducts.length > 0 && (
            <div className="product-list">
              <div className="product-list-container">
                {filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className={`product-list-item ${selectedId === product.id ? 'selected' : ''} ${highlightedIndex === index ? 'highlighted' : ''}`}
                    onClick={() => {
                      setSelectedId(product.id)
                      setSearchQuery(product.name)  // Show only product name
                      setIsProductSelected(true)
                      setHighlightedIndex(-1)
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="product-list-sku">{product.code || product.sku || '-'}</div>
                    <div className="product-list-name">{product.name || product.name_only || '-'}</div>
                    {product.retail_price && (
                      <div className="product-list-price">
                        Rp {Number(product.retail_price).toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="product-list-hint">
                Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to select
              </p>
            </div>
          )}

          {/* No Results */}
          {!isProductSelected && searchQuery.trim() && filteredProducts.length === 0 && (
            <div className="no-results">
              <span className="material-icons-round">search_off</span>
              <p>No products found matching "{searchQuery}"</p>
            </div>
          )}

          {/* Form Fields - Only show after product is selected */}
          {isProductSelected && derivedProduct && (
            <>
              <div className="selected-product-info">
                <div className="selected-product-sku">{derivedProduct.code || derivedProduct.sku || '-'}</div>
                <div className="selected-product-name">{derivedProduct.name || derivedProduct.name_only || '-'}</div>
                <div className="selected-product-stock">
                  <span className="material-icons-round">inventory</span>
                  System Stock: <strong>{systemQty}</strong>
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
                    autoFocus
                  />
                </div>
                <div className="form-section">
                  <label className="form-label">Variance</label>
                  <div className={`variance-display ${(Number(physicalQty) - systemQty) < 0 ? 'variance-negative' : (Number(physicalQty) - systemQty) > 0 ? 'variance-positive' : ''}`}>
                    {physicalQty ? (Number(physicalQty) - systemQty) : 0}
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
            </>
          )}
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
