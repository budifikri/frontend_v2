import { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react'
import { useAuth } from '../../../shared/auth'
import { getPurchaseReturn, createPurchaseReturn, updatePurchaseReturn, listSuppliers, generateReturnNumber } from '../../../features/transaksi/purchase-return/purchaseReturn.api'
import { listProducts } from '../../../features/master/product/product.api'
import { listWarehouses } from '../../../features/master/warehouse/warehouse.api'
import { DeleteMaster } from '../footer/DeleteMaster'
import { Toast } from '../../../components/Toast'
import './PurchaseDetail.css'
import './PurchaseReturnDetail.css'

export function PurchaseReturnDetail({ selectedId: propSelectedId, onExit, onSaveSuccess }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [search, setSearch] = useState('')
  const searchInputRef = useRef(null)
  const [showProductPopup, setShowProductPopup] = useState(false)
  const [productResults, setProductResults] = useState([])
  const [popupSelectedIndex, setPopupSelectedIndex] = useState(0)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [supplierOptions, setSupplierOptions] = useState([])
  const [warehouseOptions, setWarehouseOptions] = useState([])
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  const [header, setHeader] = useState({
    pr_number: generateReturnNumber(),
    po_id: '',
    po_number: '',
    supplier_id: '',
    warehouse_id: '',
    pr_date: new Date().toISOString().split('T')[0],
    status: 'draft',
    notes: '',
  })

  const [items, setItems] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const fetchLookups = useCallback(async () => {
    if (!token) {
      setSupplierOptions([
        { id: 'SUP001', name: 'PT. Supplier Utama' },
        { id: 'SUP002', name: 'CV. Berkah Jaya' },
      ])
      setWarehouseOptions([
        { id: 'WH001', name: 'Gudang Utama' },
        { id: 'WH002', name: 'Gudang Cabin' },
      ])
      return
    }
    try {
      const [supplierRes, warehouseRes] = await Promise.all([
        listSuppliers(token, { limit: 200 }),
        listWarehouses(token, { limit: 200 }),
      ])
      setSupplierOptions(supplierRes.items || [])
      setWarehouseOptions(warehouseRes.items || [])
    } catch (err) {
      console.error('[PurchaseReturnDetail] Failed to load lookups:', err)
      setToastMessage('Gagal memuat data')
      setToastType('error')
      setShowToast(true)
    }
  }, [token])

  useEffect(() => { fetchLookups() }, [fetchLookups])

  const focusSearchInput = useCallback((selectText = false) => {
    const input = searchInputRef.current
    if (!input) return
    input.focus()
    if (selectText) input.select()
  }, [])

  const queueFocusSearchInput = useCallback((selectText = false, delay = 0) => {
    window.setTimeout(() => {
      requestAnimationFrame(() => {
        focusSearchInput(selectText)
      })
    }, delay)
  }, [focusSearchInput])

  useEffect(() => {
    if (showProductPopup || showExitConfirm || showDeleteConfirm) return
    queueFocusSearchInput(false)
    const retryTimer = window.setTimeout(() => {
      queueFocusSearchInput(false)
    }, 120)
    return () => window.clearTimeout(retryTimer)
  }, [propSelectedId, showProductPopup, showExitConfirm, showDeleteConfirm, queueFocusSearchInput])

  useLayoutEffect(() => {
    queueFocusSearchInput(false)
  }, [propSelectedId, queueFocusSearchInput])

  useEffect(() => {
    if (!propSelectedId) return
    const loadPurchaseReturn = async () => {
      setIsLoading(true)
      try {
        const data = await getPurchaseReturn(token, propSelectedId)
        console.log('[PurchaseReturnDetail] Loaded data:', data)

        const normalizedStatus = (data.status || 'draft').toLowerCase()

        const normalizeDate = (dateStr) => {
          if (!dateStr) return ''
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
          if (/^\d{4}-\d{2}-\d{2}T/.test(dateStr)) return dateStr.split('T')[0]
          const d = new Date(dateStr)
          if (isNaN(d.getTime())) return dateStr
          return d.toISOString().split('T')[0]
        }

        setHeader({
          pr_number: data.pr_number || generateReturnNumber(),
          po_id: data.po_id || '',
          po_number: data.po_number || '',
          supplier_id: data.supplier_id || '',
          warehouse_id: data.warehouse_id || '',
          pr_date: normalizeDate(data.pr_date),
          status: normalizedStatus,
          notes: data.notes || '',
        })

        if (data.items && data.items.length > 0) {
          setItems(data.items.map(item => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            sku: item.sku,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount || 0,
            tax_rate: item.tax_rate || 0,
            line_total: item.line_total || item.amount || 0,
            amount: item.amount || item.line_total || 0,
          })))
          setSelectedIndex(0)
        }
      } catch (err) {
        console.error('[PurchaseReturnDetail] Error loading data:', err)
        setError('Failed to load purchase return')
      } finally {
        setIsLoading(false)
      }
    }
    loadPurchaseReturn()
  }, [propSelectedId, token])

  const handleSelectProduct = useCallback(async (product) => {
    if (isLocked) return
    const existingIndex = items.findIndex(item => item.product_id === product.id)
    if (existingIndex >= 0) {
      setToastMessage(`${product.name} sudah ada di daftar`)
      setToastType('warning')
      setShowToast(true)
      setShowProductPopup(false)
      setSearch('')
      setSelectedIndex(existingIndex)
      setTimeout(() => focusSearchInput(), 50)
      return
    }
    const newItem = {
      id: `item-${Date.now()}`,
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      quantity: 1,
      unit_price: product.cost_price || product.price || 0,
      discount: 0,
      tax_rate: 0,
      line_total: product.cost_price || product.price || 0,
    }
    setItems(prev => [...prev, newItem])
    setShowProductPopup(false)
    setSearch('')
    setSelectedIndex(items.length)
    setTimeout(() => focusSearchInput(), 50)
  }, [isLocked, items.length, focusSearchInput])

  const updateItem = useCallback((itemId, updates) => {
    setItems((prev) => prev.map((item) => {
      if (item.id === itemId) {
        const updated = { ...item, ...updates }
        updated.line_total = (updated.quantity || 0) * (updated.unit_price || 0)
        return updated
      }
      return item
    }))
  }, [])

  const removeItem = useCallback((itemId) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
    setSelectedIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(items.length > 0 ? items.length - 1 : 0)
    }
  }, [items.length, selectedIndex])

  const summary = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.line_total || item.amount || 0), 0)
    const discountTotal = items.reduce((sum, item) => {
      const lineSubtotal = (item.quantity || 0) * (item.unit_price || 0)
      return sum + (lineSubtotal * ((item.discount || 0) / 100))
    }, 0)
    const taxTotal = items.reduce((sum, item) => {
      const lineSubtotal = (item.quantity || 0) * (item.unit_price || 0)
      const lineDiscount = lineSubtotal * ((item.discount || 0) / 100)
      const taxableAmount = lineSubtotal - lineDiscount
      return sum + (taxableAmount * ((item.tax_rate || 0) / 100))
    }, 0)
    const grandTotal = subtotal - discountTotal + taxTotal
    return { subtotal, discountTotal, taxTotal, grandTotal, itemCount: items.length }
  }, [items])

  const currentReturnStatus = String(header.status || 'draft').toLowerCase()
  const isLocked = ['approved', 'approve', 'void', 'voided'].includes(currentReturnStatus)
  const isApprovedReturn = ['approved', 'approve'].includes(currentReturnStatus)
  const activeReturnStatus = isApprovedReturn ? 'approved' : 'draft'

  const handleSave = useCallback(async () => {
    if (isLocked) return

    if (!header.supplier_id) { 
      setError('Supplier harus dipilih'); 
      return 
    }
    if (!header.warehouse_id) { 
      setError('Warehouse harus dipilih'); 
      return 
    }
    if (items.length === 0) { 
      setError('Minimal 1 item harus ditambahkan'); 
      return 
    }

    setIsSaving(true)
    setError('')
    setToastMessage('')
    setToastType('info')
    setShowToast(false)

    try {
      if (token) {
        const targetStatus = header.status || 'draft'
        const itemsCopy = items.map(it => ({ ...it }))
        
        const payload = {
          supplier_id: header.supplier_id,
          warehouse_id: header.warehouse_id,
          pr_date: header.pr_date || null,
          notes: header.notes || '',
          status: targetStatus,
          items: itemsCopy.map(item => ({
            ...(item.id && !String(item.id).startsWith('item-') ? { id: item.id } : {}),
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price ?? 0,
            discount: item.discount ?? 0,
            tax_rate: item.tax_rate ?? 0,
          })),
        }

        const hasValidPO = header.po_id && header.po_id !== '' && header.po_id !== 'null' && header.po_id !== 'undefined'
        if (hasValidPO) {
          payload.po_id = header.po_id
          payload.po_number = header.po_number || null
        }

        if (propSelectedId) {
          await updatePurchaseReturn(token, propSelectedId, payload)
        } else {
          await createPurchaseReturn(token, payload)
        }

        onExit()
        if (onSaveSuccess) {
          setTimeout(() => {
            onSaveSuccess('Purchase Return berhasil disimpan', 'success')
          }, 300)
        }
      } else {
        console.log('[PurchaseReturnDetail] Offline mode - simulating save')
        onExit()
        if (onSaveSuccess) {
          setTimeout(() => {
            onSaveSuccess('Purchase Return berhasil disimpan (offline)', 'success')
          }, 300)
        }
      }
    } catch (err) {
      console.error('[PurchaseReturnDetail] Save error:', err)
      setError(err.message || 'Failed to save purchase return')
      if (onSaveSuccess) {
        onSaveSuccess(err.message || 'Failed to save', 'error')
      }
    } finally {
      setIsSaving(false)
    }
  }, [token, header, items, propSelectedId, onExit, onSaveSuccess, isLocked])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const handleStatusChange = (newStatus) => {
    if (isLocked) return
    setHeader(prev => ({ ...prev, status: newStatus }))
  }

  const handleSearchChange = (value) => {
    if (isLocked) return
    setSearch(value)
  }

  const handleSearchKeyDown = async (e) => {
    if (isLocked) {
      e.preventDefault()
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()

      if (showProductPopup && productResults.length > 0) {
        await handleSelectProduct(productResults[popupSelectedIndex])
        return
      }

      const currentSearch = search.trim()
      if (!currentSearch) return

      const selectedItem = items[selectedIndex]
      const priceMatch = currentSearch.match(/^\+\+(\d+)$/)
      if (priceMatch) {
        if (!selectedItem) {
          setToastMessage('Pilih item terlebih dahulu untuk mengubah harga')
          setToastType('error')
          setShowToast(true)
          return
        }

        const unitPrice = Number(priceMatch[1])
        updateItem(selectedItem.id, { unit_price: unitPrice })
        setToastMessage(`Harga ${selectedItem.product_name} diubah menjadi ${formatCurrency(unitPrice)}`)
        setToastType('success')
        setShowToast(true)
        setSearch('')
        return
      }

      const qtyMatch = currentSearch.match(/^\+(\d+)$/)
      if (qtyMatch) {
        if (!selectedItem) {
          setToastMessage('Pilih item terlebih dahulu untuk mengubah qty')
          setToastType('error')
          setShowToast(true)
          return
        }

        const quantity = Number(qtyMatch[1])
        updateItem(selectedItem.id, { quantity })
        setToastMessage(`Qty ${selectedItem.product_name} diubah menjadi ${quantity}`)
        setToastType('success')
        setShowToast(true)
        setSearch('')
        return
      }

      setIsLoadingProducts(true)
      try {
        const result = await listProducts(token, { search: currentSearch, limit: 50 })
        const products = result.items.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          unit: p.unit_name || p.unit || 'Pcs',
          cost_price: Number(p.cost_price || p.purchase_price || 0),
          price: Number(p.cost_price || p.purchase_price || 0),
        }))
        if (products.length === 1) {
          await handleSelectProduct(products[0])
        } else if (products.length > 1) {
          setProductResults(products)
          setPopupSelectedIndex(0)
          setShowProductPopup(true)
        } else {
          setToastMessage('Produk tidak ditemukan')
          setToastType('warning')
          setShowToast(true)
        }
      } catch (err) {
        console.error('Failed to load products:', err)
        setProductResults([])
      } finally {
        setIsLoadingProducts(false)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (showProductPopup && popupSelectedIndex < productResults.length - 1) {
        setPopupSelectedIndex(popupSelectedIndex + 1)
      } else if (items.length > 0) {
        const nextIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : items.length - 1
        setSelectedIndex(nextIndex)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (showProductPopup && popupSelectedIndex > 0) {
        setPopupSelectedIndex(popupSelectedIndex - 1)
      } else if (items.length > 0) {
        const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : 0
        setSelectedIndex(prevIndex)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      if (showProductPopup) {
        setShowProductPopup(false)
        setTimeout(() => focusSearchInput(), 50)
        return
      }
      setShowExitConfirm(true)
    }
  }

  const openDeleteConfirm = (item) => {
    if (isLocked) return
    setItemToDelete(item)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      removeItem(itemToDelete.id)
    }
    setItemToDelete(null)
    setShowDeleteConfirm(false)
  }

  const cancelDeleteItem = () => {
    setItemToDelete(null)
    setShowDeleteConfirm(false)
  }

  if (isLoading) {
    return (
      <div className="master-container">
        <div className="master-loading">
          <span className="material-icons-round animate-spin">sync</span>
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="po-layout-container pr-layout-container">
      <Toast
        message={toastMessage}
        type={toastType}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
        duration={3000}
      />

      {showDeleteConfirm && itemToDelete && (
        <DeleteMaster
          title="Konfirmasi Hapus"
          message={`Hapus ${itemToDelete.product_name}?`}
          confirmText="OK"
          cancelText="Cancel"
          onConfirm={confirmDeleteItem}
          onCancel={cancelDeleteItem}
        />
      )}

      <div className="po-main-content">
        <div className="po-items-wrapper">
          {error && <div className="master-error" style={{ marginBottom: 12 }}>{error}</div>}

          {items.length === 0 ? (
            <div className="po-empty-items">
              <span className="material-icons">receipt_long</span>
              <p>Belum ada item return. Klik Add untuk menambah item.</p>
            </div>
          ) : (
            <table className="po-items-table pr-items-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Product</th>
                  <th>Harga</th>
                  <th>QTY</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    className={selectedIndex === index ? 'selected' : ''}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <td>{index + 1}</td>
                    <td>
                      <div className="po-product-name">{item.product_name || '-'}</div>
                      <div className="po-product-sku">{item.sku || '-'}</div>
                    </td>
                    <td>{formatCurrency(item.unit_price)}</td>
                    <td><span className="po-item-qty">{item.quantity}</span></td>
                    <td>{formatCurrency(item.line_total)}</td>
                    <td>
                      <button className="po-delete-btn" disabled={isLocked} onClick={(e) => { e.stopPropagation(); if (!isLocked) openDeleteConfirm(item) }}>
                        <span className="material-icons" style={{ fontSize: 18 }}>delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="po-footer-input pr-footer-input">
          <div className="po-search-container pr-search-container">
            <span className="material-icons">search</span>
            <input
              ref={searchInputRef}
              type="text"
              inputMode="text"
              className="po-search-input pr-search-input"
              placeholder="Ketik produk, +qty, ++harga..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onBlur={(e) => {
                if (showProductPopup || showExitConfirm) return
                const nextFocusedElement = e.relatedTarget
                if (nextFocusedElement instanceof HTMLElement) {
                  const interactiveTagNames = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON']
                  if (interactiveTagNames.includes(nextFocusedElement.tagName)) return
                }
                queueFocusSearchInput(false, 0)
              }}
              autoComplete="off"
              disabled={isLocked}
              autoFocus
            />
          </div>
          <div className="po-action-buttons pr-action-buttons">
            <button type="button" className="po-btn po-btn-exit" onClick={() => setShowExitConfirm(true)} disabled={isSaving} title="Exit (Esc)">
              <span className="material-icons">exit_to_app</span>
              KELUAR
            </button>
            <button type="button" className="po-btn po-btn-print" disabled={items.length === 0} title="Print">
              <span className="material-icons">print</span>
              CETAK
            </button>
            <button type="button" className="po-btn po-btn-save" onClick={handleSave} disabled={isLocked || isSaving || isLoading || items.length === 0} title="Save (Ctrl+S)">
              <span className="material-icons">save</span>
              SIMPAN
            </button>
          </div>
        </div>
      </div>

      <aside className="po-sidebar">
        <div className="po-header-section">
          <h1 className="po-title">PURCHASE RETURN</h1>
          <div className="po-arrow-status-bar" aria-label="Purchase return status">
            <button
              type="button"
              className={`po-arrow-step ${activeReturnStatus === 'draft' ? 'is-active' : 'is-inactive'}`}
              onClick={() => handleStatusChange('draft')}
              disabled={isLocked}
            >
              Draft
            </button>
            <button
              type="button"
              className={`po-arrow-step ${activeReturnStatus === 'approved' ? 'is-active' : 'is-inactive'}`}
              onClick={() => handleStatusChange('approved')}
              disabled={isLocked}
            >
              Approved
            </button>
          </div>
        </div>

        <div className="pr-form-panel">
          <div className="form-group">
            <label className="form-label">Return Number</label>
            <input type="text" value={header.pr_number || '-'} readOnly className="form-input form-input-readonly" />
          </div>
          <div className="form-group">
            <label className="form-label">Return Date *</label>
            <input type="date" value={header.pr_date} onChange={(e) => setHeader({ ...header, pr_date: e.target.value })} className="form-input" disabled={isLocked} />
          </div>
          <div className="form-group">
            <label className="form-label">Supplier *</label>
            <select value={header.supplier_id} onChange={(e) => setHeader({ ...header, supplier_id: e.target.value })} className="form-input" disabled={isLocked}>
              <option value="">Select supplier...</option>
              {supplierOptions.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Warehouse *</label>
            <select value={header.warehouse_id} onChange={(e) => setHeader({ ...header, warehouse_id: e.target.value })} className="form-input" disabled={isLocked}>
              <option value="">Select warehouse...</option>
              {warehouseOptions.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">PO Number</label>
            <input type="text" value={header.po_number || '-'} readOnly className="form-input form-input-readonly" />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea value={header.notes || ''} onChange={(e) => setHeader({ ...header, notes: e.target.value })} className="form-input form-textarea pr-notes-textarea" rows={3} disabled={isLocked} />
          </div>
        </div>

        <div className="po-summary-section">
          <div className="po-summary-row">
            <span>Subtotal (Items: {summary.itemCount} , Total Qty: {items.reduce((sum, item) => sum + (item.quantity || 0), 0)})</span>
            <span>{formatCurrency(summary.subtotal)}</span>
          </div>
          {summary.discountTotal > 0 && (
            <div className="po-summary-row">
              <span>Diskon</span>
              <span>-{formatCurrency(summary.discountTotal)}</span>
            </div>
          )}
          {summary.taxTotal > 0 && (
            <div className="po-summary-row">
              <span>PPN ({((summary.taxTotal / (summary.subtotal - summary.discountTotal)) * 100).toFixed(1)}%)</span>
              <span>{formatCurrency(summary.taxTotal)}</span>
            </div>
          )}
          <div className="po-summary-total-label">GRAND TOTAL</div>
          <div className="po-summary-total-value">{formatCurrency(summary.grandTotal)}</div>
        </div>
      </aside>

      {showProductPopup && (
        <div className="popup-overlay" onClick={() => setShowProductPopup(false)}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>DAFTAR PRODUK</h3>
              <button className="popup-close" onClick={() => setShowProductPopup(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="popup-table-wrapper">
              <table className="popup-table">
                <thead><tr><th>No</th><th>Nama Produk</th><th>Satuan</th><th>Harga</th></tr></thead>
                <tbody>
                  {isLoadingProducts ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>Memuat...</td></tr>
                  ) : productResults.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>Produk tidak ditemukan</td></tr>
                  ) : (
                    productResults.map((product, idx) => (
                      <tr key={product.id} className={popupSelectedIndex === idx ? 'selected' : ''} onClick={() => handleSelectProduct(product)}>
                        <td>{idx + 1}</td>
                        <td>{product.name}</td>
                        <td>{product.unit}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(product.cost_price || product.price)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="popup-footer">
              <span>↑↓ Navigasi</span>
              <span>Enter: Pilih | Esc: Tutup</span>
            </div>
          </div>
        </div>
      )}

      {showExitConfirm && (
        <DeleteMaster
          itemName="keluar dari halaman ini"
          title="Konfirmasi Keluar"
          confirmText="Ya"
          cancelText="Tidak"
          isExit={true}
          onConfirm={() => { setShowExitConfirm(false); onExit() }}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}

      <Toast
        message={toastMessage}
        type={toastType}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
        duration={3000}
      />
    </div>
  )
}
