import { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react'
import { useAuth } from '../../../shared/auth'
import {
  getStockOpnameById,
  createStockOpname,
  updateStockOpname,
  getProductStock,
  generateReference,
} from '../../../features/master/stock-opname/stockOpname.api'
import { listProducts } from '../../../features/master/product/product.api'
import { listWarehouses } from '../../../features/master/warehouse/warehouse.api'
import { DeleteMaster } from '../footer/DeleteMaster'
import { Toast } from '../../Toast'
import './PurchaseDetail.css'

const DUMMY_PRODUCTS = [
  { id: 'PRD001', code: 'PRD-001', name: 'Kopi Luwak', unit: 'PCS', cost_price: 150000 },
  { id: 'PRD002', code: 'PRD-002', name: 'Gula Pasir', unit: 'KG', cost_price: 18000 },
  { id: 'PRD003', code: 'PRD-003', name: 'Teh Botol', unit: 'BOX', cost_price: 45000 },
]

const DUMMY_WAREHOUSES = [
  { id: 'WH001', name: 'Gudang Utama' },
  { id: 'WH002', name: 'Gudang Cabin' },
]

export function StockOpnameDetail({ selectedId: propSelectedId, onExit, onSaveSuccess }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPostingConfirm, setShowPostingConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [warehouseOptions, setWarehouseOptions] = useState([])
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  const [search, setSearch] = useState('')
  const searchInputRef = useRef(null)
  const [showProductPopup, setShowProductPopup] = useState(false)
  const [productResults, setProductResults] = useState([])
  const [popupSelectedIndex, setPopupSelectedIndex] = useState(0)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const postingConfirmBypassRef = useRef(false)

  const [header, setHeader] = useState({
    opname_number: generateReference(),
    warehouse_id: '',
    opname_date: new Date().toISOString().split('T')[0],
    status: 'draft',
    is_opening: false,
    notes: '',
  })

  const [isLocked, setIsLocked] = useState(false)
  const [items, setItems] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const currentStatus = String(header.status || 'draft').toLowerCase()
  const isPosted = currentStatus === 'posted'
  const activeStatus = isPosted ? 'posted' : currentStatus === 'approved' || currentStatus === 'approve' ? 'approved' : 'draft'
  const openingMode = Boolean(header.is_opening)

  const fetchLookups = useCallback(async () => {
    if (!token) {
      setWarehouseOptions(DUMMY_WAREHOUSES)
      return
    }
    try {
      const [, warehouseRes] = await Promise.all([
        listProducts(token, { limit: 200, offset: 0 }),
        listWarehouses(token, { limit: 200, offset: 0 }),
      ])
      setWarehouseOptions(warehouseRes.items || [])
    } catch (err) {
      console.error('[StockOpnameDetail] Failed to load lookups:', err)
      setToastMessage('Gagal memuat data')
      setToastType('error')
      setShowToast(true)
    }
  }, [token])

  useEffect(() => { fetchLookups() }, [fetchLookups])

  const focusSearchInput = useCallback(() => {
    const input = searchInputRef.current
    if (!input) return
    input.focus()
  }, [])

  const queueFocusSearchInput = useCallback((delay = 0) => {
    window.setTimeout(() => {
      requestAnimationFrame(() => focusSearchInput())
    }, delay)
  }, [focusSearchInput])

  useEffect(() => {
    if (showProductPopup || showExitConfirm || showDeleteConfirm) return
    queueFocusSearchInput(0)
    const timer = window.setTimeout(() => queueFocusSearchInput(0), 120)
    return () => window.clearTimeout(timer)
  }, [propSelectedId, showProductPopup, showExitConfirm, showDeleteConfirm, queueFocusSearchInput])

  useLayoutEffect(() => {
    queueFocusSearchInput(0)
  }, [propSelectedId, queueFocusSearchInput])

  useEffect(() => {
    if (!propSelectedId) return
    const loadStockOpname = async () => {
      setIsLoading(true)
      try {
        const data = await getStockOpnameById(token, propSelectedId)
        const normalizedStatus = (data.status || 'draft').toLowerCase()
        setHeader({
          opname_number: data.opname_number || data.reference || generateReference(),
          warehouse_id: data.warehouse_id || '',
          opname_date: data.opname_date ? data.opname_date.split('T')[0] : new Date().toISOString().split('T')[0],
          status: normalizedStatus,
          is_opening: Boolean(data.is_opening),
          notes: data.notes || '',
        })
        setIsLocked(['approved', 'approve', 'posted'].includes(normalizedStatus))
        if (data.items && data.items.length > 0) {
          setItems(data.items.map((item, index) => ({
            id: item.id || `item-${index}`,
            product_id: item.product_id,
            product_name: item.product_name || '',
            sku: item.product_sku || item.product_code || '',
            system_quantity: item.system_quantity || 0,
            actual_quantity: item.actual_quantity || 0,
            cost_price: Number(item.cost_price || 0),
            difference: item.difference || (item.actual_quantity || 0) - (item.system_quantity || 0),
            reason: item.reason || '',
          })))
          setSelectedIndex(0)
        }
      } catch (err) {
        console.error('[StockOpnameDetail] Error loading data:', err)
        setError('Failed to load stock opname data')
      } finally {
        setIsLoading(false)
      }
    }
    loadStockOpname()
  }, [propSelectedId, token])

  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(items.length > 0 ? items.length - 1 : 0)
    }
  }, [items.length, selectedIndex])

  const updateItem = useCallback((itemId, updates) => {
    setItems((prev) => prev.map((item) => {
      if (item.id === itemId) {
        const updated = { ...item, ...updates }
        if (updates.actual_quantity !== undefined) {
          updated.difference = updated.actual_quantity - (updated.system_quantity || 0)
        }
        return updated
      }
      return item
    }))
  }, [])

  const removeItem = useCallback((itemId) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
    setSelectedIndex((prev) => Math.max(prev - 1, 0))
  }, [])

    const summary = useMemo(() => {
    const total = items.length
    const positive = items.filter(i => i.difference > 0).length
    const negative = items.filter(i => i.difference < 0).length
    const zero = items.filter(i => i.difference === 0).length
    const totalQty = items.reduce((sum, item) => sum + (item.actual_quantity || 0), 0)
    const totalQtySelisih = items.reduce((sum, item) => sum + (Number(item.difference) || 0), 0)
    const totalVarianceValue = items.reduce((sum, item) => sum + ((Number(item.difference) || 0) * (Number(item.cost_price) || 0)), 0)
    return { total, positive, negative, zero, totalQty, totalQtySelisih, totalVarianceValue }
  }, [items])

  const handleSelectProduct = useCallback(async (product) => {
    if (isLocked) return
    if (header.is_opening && product.has_opening_stock) {
      setToastMessage(`${product.name} sudah memiliki opening stock global`)
      setToastType('warning')
      setShowToast(true)
      setShowProductPopup(false)
      setSearch('')
      setTimeout(() => focusSearchInput(), 50)
      return
    }
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
    let systemQty = 0
    if (token && header.warehouse_id) {
      try {
        const result = await getProductStock(token, { product_id: product.id, warehouse_id: header.warehouse_id })
        systemQty = result.current_stock || 0
      } catch {
        systemQty = 0
      }
    }
    const newItem = {
      id: `item-${Date.now()}`,
      product_id: product.id,
      product_name: product.name,
      sku: product.sku || product.code || '',
      system_quantity: systemQty,
      actual_quantity: 0,
      cost_price: Number(product.cost_price || 0),
      difference: -systemQty,
      reason: '',
    }
    setItems(prev => [...prev, newItem])
    setShowProductPopup(false)
    setSearch('')
    setSelectedIndex(items.length)
    setTimeout(() => focusSearchInput(), 50)
  }, [isLocked, items, token, header.is_opening, header.warehouse_id, focusSearchInput])

  const handleSave = useCallback(async () => {
    if (isLocked) return
    if (!header.warehouse_id) {
      setToastMessage('Warehouse harus dipilih')
      setToastType('warning')
      setShowToast(true)
      return
    }
    if (items.length === 0) {
      setToastMessage('Minimal 1 item harus ditambahkan')
      setToastType('warning')
      setShowToast(true)
      return
    }

    const invalidCostItems = items.filter((item) => Number(item.cost_price) <= 0)
    if (openingMode && invalidCostItems.length > 0) {
      const invalidNames = invalidCostItems
        .slice(0, 3)
        .map((item) => item.product_name || item.sku || item.product_id || '-')
        .join(', ')
      const extraCount = invalidCostItems.length - Math.min(invalidCostItems.length, 3)
      const extraLabel = extraCount > 0 ? ` dan ${extraCount} produk lainnya` : ''
      setToastMessage(`Cost price opening produk ${invalidNames}${extraLabel} masih 0, opening stock tidak bisa disimpan`)
      setToastType('error')
      setShowToast(true)
      return
    }

    const finalStatus = String(header.status || 'draft').toLowerCase()
    if (openingMode && (finalStatus === 'approved' || finalStatus === 'posted') && !postingConfirmBypassRef.current) {
      setShowPostingConfirm(true)
      return
    }
    postingConfirmBypassRef.current = false

    setIsSaving(true)
    setError('')

    const payload = {
      warehouse_id: header.warehouse_id,
      opname_date: header.opname_date,
      status: header.status,
      is_opening: Boolean(header.is_opening),
      notes: header.notes || '',
      items: items.map((item) => {
        const itemPayload = {
          product_id: item.product_id,
          system_quantity: item.system_quantity,
          actual_quantity: item.actual_quantity,
          cost_price: item.cost_price,
          reason: item.reason || '',
        }
        if (item.id && !item.id.startsWith('item-')) {
          itemPayload.id = item.id
        }
        return itemPayload
      }),
    }

    try {
      if (token) {
        if (propSelectedId) {
          await updateStockOpname(token, propSelectedId, payload)
        } else {
          const created = await createStockOpname(token, payload)
          const createdId = created?.data?.id
          if (createdId && finalStatus !== 'draft') {
            await updateStockOpname(token, createdId, payload)
          }
        }
      } else {
        if (onSaveSuccess) {
          setTimeout(() => onSaveSuccess('Stock Opname berhasil disimpan (offline)', 'success'), 300)
        }
      }

      setHeader(prev => ({ ...prev, status: payload.status || prev.status }))
      
      if (['approved', 'approve', 'posted'].includes(finalStatus)) {
        setIsLocked(true)
      }

      onExit()

      if (onSaveSuccess && token) {
        setTimeout(() => onSaveSuccess('Stock Opname berhasil disimpan', 'success'), 300)
      }
    } catch (err) {
    setToastMessage(err.message || 'Failed to save')
    setToastType('error')
    setShowToast(true)
  } finally {
    setIsSaving(false)
  }
      setShowPostingConfirm(false)
      postingConfirmBypassRef.current = false
}, [header, items, token, propSelectedId, onExit, onSaveSuccess, isLocked, openingMode])

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

    if (e.key === '+' && searchInputRef.current) {
      e.preventDefault()
      const input = searchInputRef.current
      const start = input.selectionStart ?? input.value.length
      const end = input.selectionEnd ?? input.value.length
      const newValue = input.value.substring(0, start) + '+' + input.value.substring(end)
      setSearch(newValue)
      setTimeout(() => {
        const newPos = start + 1
        input.setSelectionRange(newPos, newPos)
      }, 0)
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
      const qtyMatch = currentSearch.match(/^\+(\d+)$/)
      if (qtyMatch) {
        if (!selectedItem) {
          setToastMessage('Pilih item terlebih dahulu untuk mengubah qty')
          setToastType('error')
          setShowToast(true)
          return
        }
        const quantity = Number(qtyMatch[1])
        updateItem(selectedItem.id, { actual_quantity: quantity })
        setToastMessage(`Qty ${selectedItem.product_name} diubah menjadi ${quantity}`)
        setToastType('success')
        setShowToast(true)
        setSearch('')
        return
      }

      const costMatch = currentSearch.match(/^\+\+(\d+)$/)
      if (costMatch) {
        if (!selectedItem) {
          setToastMessage('Pilih item terlebih dahulu untuk mengubah cost')
          setToastType('error')
          setShowToast(true)
          return
        }
        const cost = Number(costMatch[1])
        updateItem(selectedItem.id, { cost_price: cost })
        setToastMessage(`Cost ${selectedItem.product_name} diubah menjadi ${cost}`)
        setToastType('success')
        setShowToast(true)
        setSearch('')
        return
      }

      if (!header.warehouse_id) {
        setToastMessage('Pilih warehouse terlebih dahulu sebelum input item product')
        setToastType('warning')
        setShowToast(true)
        return
      }

      setIsLoadingProducts(true)
      try {
        let result
        if (token) {
          result = await listProducts(token, { search: currentSearch, limit: 50 })
        } else {
          const filtered = DUMMY_PRODUCTS.filter(p =>
            p.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
            p.code.toLowerCase().includes(currentSearch.toLowerCase())
          )
          result = { items: filtered }
        }
        const products = result.items.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku || p.code || '',
          unit: p.unit_name || p.unit || '-',
          cost_price: Number(p.cost_price || p.purchase_price || 0),
          has_opening_stock: Boolean(p.has_opening_stock),
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
        setSelectedIndex(prev => prev < items.length - 1 ? prev + 1 : items.length - 1)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (showProductPopup && popupSelectedIndex > 0) {
        setPopupSelectedIndex(popupSelectedIndex - 1)
      } else if (items.length > 0) {
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0)
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

  const formatNumber = (amount) =>
    new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(amount) || 0)

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0)

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
    <div className="po-layout-container">
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

      {showPostingConfirm && (
        <DeleteMaster
          title={openingMode ? 'Konfirmasi Finalisasi Opening Stock' : 'Konfirmasi Finalisasi Stock Opname'}
          message={openingMode
            ? 'Opening stock yang di-approve atau di-post akan mengunci stok awal dan HPP awal produk. Pastikan quantity dan cost price sudah benar.'
            : 'Dokumen yang di-post akan mengubah stok aktual. Pastikan data opname sudah benar.'}
          confirmText="Lanjutkan"
          cancelText="Periksa Lagi"
          onConfirm={() => {
            postingConfirmBypassRef.current = true
            setShowPostingConfirm(false)
            setTimeout(() => handleSave(), 0)
          }}
          onCancel={() => {
            postingConfirmBypassRef.current = false
            setShowPostingConfirm(false)
          }}
        />
      )}

      <div className="po-main-content">
        <div className="po-items-wrapper">
          {error && <div className="master-error" style={{ marginBottom: 12 }}>{error}</div>}

          {items.length === 0 ? (
            <div className="po-empty-items">
              <span className="material-icons">receipt_long</span>
              <p>Belum ada item. Ketik nama produk di bawah untuk menambah.</p>
            </div>
          ) : (
            <table className="po-items-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Product</th>
                  <th>System Qty</th>
                  <th>Actual Qty</th>
                  <th>Cost</th>
                  <th>Qty Selisih</th>
                  <th>Nilai Selisih</th>
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
                    <td style={{ textAlign: 'right' }}>{item.system_quantity}</td>
                    <td>
                      <span className="po-item-qty">{item.actual_quantity}</span>
                    </td>
                     <td style={{ textAlign: 'right' }}>{formatCurrency(item.cost_price)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: item.difference > 0 ? 'var(--color-success)' : item.difference < 0 ? 'var(--color-error)' : 'inherit' }}>
                      {item.difference > 0 ? `+${item.difference}` : item.difference}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: item.difference > 0 ? 'var(--color-success)' : item.difference < 0 ? 'var(--color-error)' : 'inherit' }}>
                      {formatNumber((Number(item.difference) || 0) * (Number(item.cost_price) || 0))}
                    </td>
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

        <div className="po-footer-input">
          <div className="po-search-container">
            <span className="material-icons">search</span>
            <input
              ref={searchInputRef}
              type="text"
              inputMode="text"
              className="po-search-input"
              placeholder="Ketik produk, +qty ubah actual, ++cost ubah cost..."
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
                queueFocusSearchInput(0)
              }}
              autoComplete="off"
              disabled={isLocked}
              autoFocus
            />
          </div>
          <div className="po-action-buttons">
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="po-title" style={{ margin: 0 }}>STOCK OPNAME</h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                background: openingMode ? 'rgba(249, 115, 22, 0.14)' : 'rgba(59, 130, 246, 0.12)',
                color: openingMode ? '#f97316' : '#60a5fa',
                border: openingMode ? '1px solid rgba(249, 115, 22, 0.28)' : '1px solid rgba(96, 165, 250, 0.24)',
              }}
            >
              {openingMode ? 'Opening Stock' : 'Regular Opname'}
            </span>
          </div>
          <div className="po-arrow-status-bar" aria-label="Stock opname status">
            <button
              type="button"
              className={`po-arrow-step ${activeStatus === 'draft' ? 'is-active' : 'is-inactive'}`}
              onClick={() => handleStatusChange('draft')}
              disabled={isLocked}
            >
              Draft
            </button>
            <button
              type="button"
              className={`po-arrow-step ${activeStatus === 'approved' ? 'is-active' : 'is-inactive'}`}
              onClick={() => handleStatusChange('approved')}
              disabled={isLocked}
            >
              Approved
            </button>
            <button
              type="button"
              className={`po-arrow-step po-arrow-step-void ${activeStatus === 'posted' ? 'is-active' : 'is-inactive'}`}
              onClick={() => handleStatusChange('posted')}
              disabled={isLocked}
            >
              Posted
            </button>
          </div>
        </div>

        <div className="po-form-panel">
          <div className="form-group">
            <label className="form-label">Reference</label>
            <input type="text" value={header.opname_number || '-'} readOnly className="form-input form-input-readonly" />
          </div>
          <div className="form-group">
            <label className="form-label">Tanggal Opname *</label>
            <input type="date" value={header.opname_date || ''} onChange={(e) => setHeader({ ...header, opname_date: e.target.value })} className="form-input" disabled={isLocked} />
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
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={Boolean(header.is_opening)}
                onChange={(e) => setHeader({ ...header, is_opening: e.target.checked })}
                disabled={isLocked}
              />
              Opening Stock
            </label>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary, #94a3b8)', marginTop: 6 }}>
              {openingMode
                ? 'Mode opening aktif. Dokumen ini akan set stok awal dan HPP awal saat disimpan.'
                : 'Mode regular aktif. Dokumen ini hanya menyesuaikan stok tanpa mengubah HPP produk.'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea value={header.notes || ''} onChange={(e) => setHeader({ ...header, notes: e.target.value })} className="form-input form-textarea" rows={3} disabled={isLocked} />
          </div>
        </div>

        <div className="po-summary-section">
          <div className="po-summary-row">
            <span>Total Items</span>
            <span>{summary.total}</span>
          </div>
          <div className="po-summary-total-label">NILAI SELISIH</div>
          <div className="po-summary-total-value" style={{ color: summary.totalVarianceValue > 0 ? 'var(--color-success)' : summary.totalVarianceValue < 0 ? 'var(--color-error)' : 'inherit' }}>
            {formatCurrency(summary.totalVarianceValue)}
          </div>
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
                      productResults.map((product, idx) => {
                        const isBlockedOpeningProduct = openingMode && product.has_opening_stock
                        return (
                      <tr
                        key={product.id}
                        className={popupSelectedIndex === idx ? 'selected' : ''}
                        onClick={() => {
                          if (!isBlockedOpeningProduct) handleSelectProduct(product)
                        }}
                        style={isBlockedOpeningProduct ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                      >
                        <td>{idx + 1}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span>{product.name}</span>
                            {isBlockedOpeningProduct && (
                              <span style={{ fontSize: 11, color: '#f97316', fontWeight: 700 }}>
                                Sudah pernah opening
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{product.unit}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(product.cost_price || product.price)}</td>
                      </tr>
                    )})
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
    </div>
  )
}
