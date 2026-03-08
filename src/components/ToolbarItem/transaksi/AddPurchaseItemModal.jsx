import { useState, useEffect, useMemo, useCallback } from 'react'
import { listProducts } from '../../../features/master/product/product.api'

export function AddPurchaseItemModal({ isOpen, onClose, onAdd, token }) {
  const [selectedId, setSelectedId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  const [isAdding, setIsAdding] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isProductSelected, setIsProductSelected] = useState(false)
  const [productOptions, setProductOptions] = useState([])

  // Fetch products
  useEffect(() => {
    if (!isOpen) return
    console.log('[AddPurchaseItemModal] Fetching products, token:', !!token)
    const fetchProducts = async () => {
      try {
        const res = await listProducts(token, { limit: 200 })
        console.log('[AddPurchaseItemModal] Products loaded:', res.items?.length)
        const normalized = (res.items || []).map(item => ({
          id: item.id || '',
          code: item.sku || item.code || '-',
          name: item.name || '-',
          retail_price: item.retail_price || 0,
          cost_price: item.cost_price || 0,
        }))
        setProductOptions(normalized)
      } catch (err) {
        console.error('[AddPurchaseItemModal] Failed to load products:', err)
      }
    }
    fetchProducts()
  }, [isOpen, token])

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return productOptions.slice(0, 50)
    const query = searchQuery.toLowerCase().trim()
    return productOptions.filter(product => {
      const sku = (product.code || '').toLowerCase()
      const name = (product.name || '').toLowerCase()
      return sku.includes(query) || name.includes(query)
    }).slice(0, 100)
  }, [productOptions, searchQuery])

  // Handle product selection - derive state directly instead of using useEffect
  const derivedProduct = useMemo(() => {
    if (selectedId) {
      return filteredProducts.find(opt => opt.id === selectedId) || null
    }
    return null
  }, [selectedId, filteredProducts])

  // Derive unit price from selected product instead of using setState in effect
  const unitPriceValue = derivedProduct ? derivedProduct.retail_price || 0 : unitPrice

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!searchQuery.trim() || filteredProducts.length === 0 || isProductSelected) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(prev => prev < filteredProducts.length - 1 ? prev + 1 : 0) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(prev => prev > 0 ? prev - 1 : filteredProducts.length - 1) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < filteredProducts.length) {
        const product = filteredProducts[highlightedIndex]
        setSelectedId(product.id)
        setSearchQuery(product.name)
        setIsProductSelected(true)
        setHighlightedIndex(-1)
      }
    } else if (e.key === 'Escape') { setHighlightedIndex(-1) }
  }, [searchQuery, filteredProducts, highlightedIndex, isProductSelected])

  if (!isOpen) return null

  const handleAdd = () => {
    if (!selectedId) return
    setIsAdding(true)
    const product = derivedProduct
    onAdd({
      id: product?.id || '',
      product_id: selectedId,
      product_name: product?.name || '',
      sku: product?.code || '',
      quantity: Number(quantity) || 1,
      unit_price: Number(unitPrice) || 0,
      discount: Number(discount) || 0,
      tax_rate: Number(taxRate) || 0,
    })
    setIsAdding(false)
    setSelectedId('')
    setSearchQuery('')
    setQuantity(1)
    setUnitPrice(0)
    setDiscount(0)
    setTaxRate(0)
    setIsProductSelected(false)
    setHighlightedIndex(-1)
  }

  const lineTotal = (Number(quantity) || 0) * (Number(unitPriceValue) || 0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (!isProductSelected) handleKeyDown(e); else if (e.key === 'Escape') onClose() }} tabIndex={-1}>
        <div className="modal-header">
          <div className="modal-icon"><span className="material-icons-round">add</span></div>
          <h2 className="modal-title">Add Item to Purchase Order</h2>
        </div>

    <div className="modal-body">
          <div className="form-section">
            <label className="form-label">Search Product <span className="required-mark">*</span></label>
            <div className="search-wrapper">
              <span className="material-icons-round search-icon">search</span>
              <input data-testid="po-add-item-search" type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSelectedId(''); setIsProductSelected(false) }} className="form-input search-input" placeholder="Search by SKU or product name..." autoFocus disabled={isProductSelected} />
              {isProductSelected && (<button type="button" className="search-clear-btn" onClick={() => { setSearchQuery(''); setSelectedId(''); setIsProductSelected(false) }} title="Clear"><span className="material-icons-round">close</span></button>)}
            </div>
          </div>

            {!isProductSelected && searchQuery.trim() && filteredProducts.length > 0 && (
            <div className="product-list">
              <div className="product-list-container">
              {filteredProducts.map((product, index) => (
                  <div data-testid={`po-product-item-${product.id}`} key={product.id} className={`product-list-item ${selectedId === product.id ? 'selected' : ''} ${highlightedIndex === index ? 'highlighted' : ''}`} onClick={() => { setSelectedId(product.id); setSearchQuery(product.name); setIsProductSelected(true); setHighlightedIndex(-1) }} onMouseEnter={() => setHighlightedIndex(index)}>
                    <div className="product-list-sku">{product.code}</div>
                    <div className="product-list-name">{product.name}</div>
                    <div className="product-list-price">Rp {Number(product.retail_price).toLocaleString('id-ID')}</div>
                  </div>
                ))}
              </div>
              <p className="product-list-hint">Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to select</p>
            </div>
          )}

          {!isProductSelected && searchQuery.trim() && filteredProducts.length === 0 && (
            <div className="no-results"><span className="material-icons-round">search_off</span><p>No products found</p></div>
          )}

          {derivedProduct && (
            <div className="purchase-item-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="form-input" min="1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Price *</label>
                  <input type="number" value={unitPriceValue} onChange={(e) => setUnitPrice(Number(e.target.value))} className="form-input" min="0" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Discount</label>
                  <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="form-input" min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax Rate (%)</label>
                  <input type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="form-input" min="0" max="100" />
                </div>
              </div>
              <div className="line-total-display">
                <span>Line Total:</span>
                <strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(lineTotal)}</strong>
              </div>
            </div>
          )}
        </div>

          <div className="modal-footer">
          <button data-testid="po-add-item-add" type="button" className="action-btn action-btn-add" onClick={handleAdd} disabled={!selectedId || isAdding}>
            <div className="action-btn-icon"><span className="material-icons-round">check</span></div>
            <span className="action-btn-label">Add</span>
          </button>
          <button type="button" className="action-btn action-btn-cancel" onClick={onClose}>
            <div className="action-btn-icon"><span className="material-icons-round">close</span></div>
            <span className="action-btn-label">Cancel</span>
          </button>
        </div>
      </div>
    </div>
  )
}
