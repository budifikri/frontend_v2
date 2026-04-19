import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import { getPurchase, createPurchase, updatePurchase, listSuppliers, generatePONumber } from '../../../features/transaksi/purchase/purchase.api'
import { listProducts } from '../../../features/master/product/product.api'
import { listWarehouses } from '../../../features/master/warehouse/warehouse.api'
import { DeleteMaster } from '../footer/DeleteMaster'
import { Toast } from '../../../components/Toast'
import './PurchaseDetail.css'

export function PurchaseDetail({ selectedId: propSelectedId, onExit, onSaveSuccess }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [supplierOptions, setSupplierOptions] = useState([])
  const [warehouseOptions, setWarehouseOptions] = useState([])
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  const getDefaultExpectedDate = (poDate) => {
    const d = new Date(poDate || new Date().toISOString().split('T')[0])
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  }

  const [header, setHeader] = useState({
    po_number: generatePONumber(),
    supplier_id: '',
    supplier_name: '',
    warehouse_id: '',
    po_date: new Date().toISOString().split('T')[0],
    expected_date: getDefaultExpectedDate(),
    status: 'draft',
    notes: '',
  })

  const [items, setItems] = useState([])

  // POS-style state for PO input
  const [search, setSearch] = useState('')
  const searchInputRef = useRef(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showSupplierPopup, setShowSupplierPopup] = useState(false)
  const [showProductPopup, setShowProductPopup] = useState(false)
  const [showActionPopup, setShowActionPopup] = useState(false)
  const [supplierResults, setSupplierResults] = useState([])
  const [productResults, setProductResults] = useState([])
  const [popupSelectedIndex, setPopupSelectedIndex] = useState(0)
  const [actionPopupIndex, setActionPopupIndex] = useState(0)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  const fetchLookups = useCallback(async () => {
    if (!token) {
      setSupplierOptions([
        { id: 'SUP001', name: 'PT. Supplier Utama' },
        { id: 'SUP002', name: 'CV. Berkah Jaya' },
      ])
      const warehouses = [
        { id: 'WH001', name: 'Toko123', type: 'MAIN' },
        { id: 'WH002', name: 'Toko456', type: 'BRANCH' },
      ]
      setWarehouseOptions(warehouses)
      if (!propSelectedId) {
        const mainWh = warehouses.find(w => w.type?.toUpperCase() === 'MAIN')
        if (mainWh) {
          setHeader(prev => ({ ...prev, warehouse_id: mainWh.id }))
        }
      }
      return
    }
    try {
      const [supplierRes, warehouseRes] = await Promise.all([
        listSuppliers(token, { limit: 200 }),
        listWarehouses(token, { limit: 200 }),
      ])
      const warehouses = warehouseRes.items || []
      setSupplierOptions(supplierRes.items || [])
      setWarehouseOptions(warehouses)
      const mainWarehouse = warehouses.find(w => w.type?.toUpperCase() === 'MAIN')
      if (!propSelectedId && mainWarehouse) {
        setHeader(prev => ({ ...prev, warehouse_id: mainWarehouse.id }))
      }
    } catch (err) {
      console.error('[PurchaseDetail] Failed to load lookups:', err)
      if (err.message?.includes('Company dengan ID tersebut tidak ditemukan')) {
        setToastMessage('Company dengan ID tersebut tidak ditemukan')
        setToastType('error')
        setShowToast(true)
      } else {
        setToastMessage('Gagal memuat data supplier')
        setToastType('error')
        setShowToast(true)
      }
    }
  }, [token])

  useEffect(() => { fetchLookups() }, [fetchLookups])

  useEffect(() => {
    if (!propSelectedId && warehouseOptions.length > 0) {
      const mainWh = warehouseOptions.find(w => w.type?.toUpperCase() === 'MAIN')
      if (mainWh) {
        setHeader(prev => ({ ...prev, warehouse_id: mainWh.id }))
      }
    }
  }, [warehouseOptions, propSelectedId])

  useEffect(() => {
    if (!propSelectedId && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [propSelectedId])

  useEffect(() => {
    if (!propSelectedId && (header.supplier_id || items.length > 0)) {
      const pendingData = {
        po_data: { header, items },
        po_mode: true,
        timestamp: Date.now(),
      }
      localStorage.setItem('pos_pending_notes', JSON.stringify(pendingData))
    }
  }, [header, items, propSelectedId])

  const clearPendingPO = useCallback(() => {
    localStorage.removeItem('pos_pending_notes')
  }, [])

  useEffect(() => {
    if (!propSelectedId) return
    const loadPurchase = async () => {
      setIsLoading(true)
      try {
        const data = await getPurchase(token, propSelectedId)
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
          po_number: data.po_number || generatePONumber(),
          supplier_id: data.supplier_id || '',
          supplier_name: data.supplier_name || '',
          warehouse_id: data.warehouse_id || '',
          po_date: normalizeDate(data.po_date || data.order_date),
          expected_date: normalizeDate(data.expected_date || data.expected_delivery),
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
            line_total: item.line_total,
          })))
        }
      } catch (err) {
        console.error('[PurchaseDetail] Error loading data:', err)
        setError('Failed to load purchase order')
      } finally {
        setIsLoading(false)
      }
    }
    loadPurchase()
  }, [propSelectedId, token])

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

  const summary = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0)
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

  const handleSave = useCallback(async () => {
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

    try {
      if (token) {
        const targetStatus = header.status || 'DRAFT'
        const itemsCopy = items.map(it => ({ ...it }))
        const payload = {
          supplier_id: header.supplier_id,
          warehouse_id: header.warehouse_id,
          po_date: header.po_date || null,
          expected_date: header.expected_date || null,
          notes: header.notes || '',
          status_po: targetStatus,
          status_receive: header.status_receive || 'DRAFT',
          items: itemsCopy.map(item => ({
            ...(item.id && !String(item.id).startsWith('item-') ? { id: item.id } : {}),
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price ?? item.price ?? item.unitPrice ?? 0,
            discount: item.discount ?? 0,
            tax_rate: item.tax_rate ?? 0,
          })),
        }

        if (propSelectedId) {
          await updatePurchase(token, propSelectedId, payload)
        } else {
          await createPurchase(token, payload)
        }

        clearPendingPO()
        onExit()
        if (onSaveSuccess) {
          setTimeout(() => {
            onSaveSuccess('Purchase Order berhasil disimpan', 'success')
          }, 300)
        }
      } else {
        clearPendingPO()
        onExit()
        if (onSaveSuccess) {
          setTimeout(() => {
            onSaveSuccess('Purchase Order berhasil disimpan (offline)', 'success')
          }, 300)
        }
      }
    } catch (err) {
      console.error('[PurchaseDetail] === SAVE ERROR ===', err)
      if (err.message?.includes('Company dengan ID tersebut tidak ditemukan')) {
        setToastMessage('Company dengan ID tersebut tidak ditemukan')
        setToastType('error')
        setShowToast(true)
      } else {
        setError(err.message || 'Failed to save purchase order')
      }
      if (onSaveSuccess) {
        onSaveSuccess(err.message || 'Failed to save', 'error')
      }
    } finally {
      setIsSaving(false)
    }
  }, [header, items, token, propSelectedId, onExit, onSaveSuccess, clearPendingPO])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showExitConfirm || showSupplierPopup || showProductPopup || showActionPopup) return
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave() }
      else if (e.key === 'Delete' && items.length > 0 && selectedIndex >= 0) { 
        e.preventDefault()
        const itemToDelete = items[selectedIndex]
        if (itemToDelete) {
          handleDeleteItem(itemToDelete.id, itemToDelete.product_name)
        }
      }
      else if (e.key === 'Escape') { e.preventDefault(); setShowExitConfirm(true) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showExitConfirm, showSupplierPopup, showProductPopup, showActionPopup, handleSave, items, selectedIndex])

  const handleSearchChange = (value) => {
    setSearch(value)
  }

  const handleSearchKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      if (showSupplierPopup && supplierResults.length > 0) {
        await handleSelectSupplier(supplierResults[popupSelectedIndex])
      } else if (showProductPopup && productResults.length > 0) {
        await handleSelectProduct(productResults[popupSelectedIndex])
      } else if (showActionPopup) {
        handleActionSelect(actionPopupIndex)
      } else {
        const supplierMatch = search.match(/^\+([A-Za-z])$/)
        if (supplierMatch) {
          const letter = supplierMatch[1].toUpperCase()
          setSupplierResults(supplierOptions.filter(s => s.name.toUpperCase().includes(letter)))
          setPopupSelectedIndex(0)
          setShowSupplierPopup(true)
          return
        }

        const qtyMatch = search.match(/^\+(\d+)$/)
        if (qtyMatch && items.length > 0) {
          const newQty = parseInt(qtyMatch[1], 10)
          if (newQty >= 0 && selectedIndex >= 0 && selectedIndex < items.length) {
            const selectedItem = items[selectedIndex]
            updateItem(selectedItem.id, { quantity: newQty })
          }
          setSearch('')
          return
        }

        const priceMatch = search.match(/^\+\+(\d+)$/)
        if (priceMatch && items.length > 0) {
          const newPrice = parseInt(priceMatch[1], 10)
          if (newPrice >= 0 && selectedIndex >= 0 && selectedIndex < items.length) {
            const selectedItem = items[selectedIndex]
            updateItem(selectedItem.id, { unit_price: newPrice })
          }
          setSearch('')
          return
        }

        if (search.trim()) {
          setIsLoadingProducts(true)
          try {
            const result = await listProducts(token, { search: search.trim(), limit: 50 })
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
        } else if (search === '' && items.length > 0) {
          setShowActionPopup(true)
          setActionPopupIndex(0)
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (showSupplierPopup && popupSelectedIndex < supplierResults.length - 1) {
        setPopupSelectedIndex(popupSelectedIndex + 1)
      } else if (showProductPopup && popupSelectedIndex < productResults.length - 1) {
        setPopupSelectedIndex(popupSelectedIndex + 1)
      } else if (showActionPopup && actionPopupIndex < 1) {
        setActionPopupIndex(actionPopupIndex + 1)
      } else if (items.length > 0) {
        const nextIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : items.length - 1
        setSelectedIndex(nextIndex)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (showSupplierPopup && popupSelectedIndex > 0) {
        setPopupSelectedIndex(popupSelectedIndex - 1)
      } else if (showProductPopup && popupSelectedIndex > 0) {
        setPopupSelectedIndex(popupSelectedIndex - 1)
      } else if (showActionPopup && actionPopupIndex > 0) {
        setActionPopupIndex(actionPopupIndex - 1)
      } else if (items.length > 0) {
        const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : 0
        setSelectedIndex(prevIndex)
      }
    } else if (e.key === 'Escape') {
      if (showSupplierPopup) setShowSupplierPopup(false)
      else if (showProductPopup) setShowProductPopup(false)
      else if (showActionPopup) setShowActionPopup(false)
    }
  }

  const handleSelectSupplier = (supplier) => {
    setHeader(prev => ({ ...prev, supplier_id: supplier.id, supplier_name: supplier.name }))
    setShowSupplierPopup(false)
    setSearch('')
    if (searchInputRef.current) searchInputRef.current.focus()
  }

  const handleSelectProduct = async (product) => {
    const existingIndex = items.findIndex(item => item.product_id === product.id)
    if (existingIndex >= 0) {
      setToastMessage(`${product.name} sudah ada di daftar`)
      setToastType('warning')
      setShowToast(true)
      setShowProductPopup(false)
      setSearch('')
      setSelectedIndex(existingIndex)
      if (searchInputRef.current) searchInputRef.current.focus()
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
    if (searchInputRef.current) searchInputRef.current.focus()
  }

  const handleActionSelect = (index) => {
    if (index === 0) {
      handleSave()
    } else {
      setShowActionPopup(false)
      setSearch('')
    }
  }

  const handleDeleteItem = (itemId, itemName = '') => {
    setItems(prev => prev.filter(item => item.id !== itemId))
    if (selectedIndex >= items.length - 1) {
      setSelectedIndex(Math.max(0, items.length - 2))
    }
    setToastMessage(itemName ? `${itemName} dihapus` : 'Item dihapus')
    setToastType('info')
    setShowToast(true)
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

  return (
    <div className="po-receipt-container">
      <Toast message={toastMessage} type={toastType} isOpen={showToast} onClose={() => setShowToast(false)} duration={5000} />

      <header className="po-receipt-header">
        <div className="po-receipt-header-top">
          <h1 className="po-receipt-title">PURCHASE ORDER</h1>
          <div className="po-supplier-display">
            <span className="po-supplier-label">Status :</span>
            <span className="po-supplier-name">DRAFT</span>
          </div>
        </div>
        <div className="po-meta-info">
          <div className="po-meta-item">
            <span className="po-meta-label">No. PO</span>
            <span className="po-meta-value">{header.po_number || '-'}</span>
          </div>
   <div className="po-meta-item">
            <span className="po-meta-label">Supplier:</span>
            <span className="po-meta-value">{header.supplier_name || header.supplier_id || 'Belum dipilih'}</span>
          </div>
          
          <div className="po-meta-item">
            <span className="po-meta-label">Tanggal</span>
            <span className="po-meta-value">{header.po_date || '-'}</span>
          </div>
          <div className="po-meta-item">
            <span className="po-meta-label">Gudang</span>
            <span className="po-meta-value">{warehouseOptions.find(w => w.id === header.warehouse_id)?.name || '-'}</span>
          </div>
        </div>
      </header>

      <main className="po-items-container">
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
                <th>Produk</th>
                <th>Harga</th>
                <th>Qty</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className={selectedIndex === index ? 'selected' : ''} onClick={() => setSelectedIndex(index)}>
                  <td>{index + 1}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.sku}</div>
                  </td>
                  <td>{formatCurrency(item.unit_price)}</td>
                  <td><span className="po-item-qty">{item.quantity}</span></td>
                  <td>{formatCurrency(item.line_total)}</td>
                  <td>
                    <button className="po-delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id, item.product_name) }}>
                      <span className="material-icons" style={{ fontSize: 18 }}>delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      <div className="po-summary-section">
        <div className="po-summary-row">
          <span className="po-summary-label">Subtotal (Items: {summary.itemCount} , Total Qty: {items.reduce((sum, item) => sum + (item.quantity || 0), 0)}) </span>
          <span className="po-summary-value">{formatCurrency(summary.subtotal)}</span>
        </div>
        {summary.discountTotal > 0 && (
          <div className="po-summary-row">
            <span className="po-summary-label">Diskon</span>
            <span className="po-summary-value">-{formatCurrency(summary.discountTotal)}</span>
          </div>
        )}
        {summary.taxTotal > 0 && (
          <div className="po-summary-row">
            <span className="po-summary-label">PPN ({((summary.taxTotal / (summary.subtotal - summary.discountTotal)) * 100).toFixed(1)}%)</span>
            <span className="po-summary-value">{formatCurrency(summary.taxTotal)}</span>
          </div>
        )}
        <div className="po-summary-divider"></div>
        <div className="po-summary-row po-summary-total">
          <span className="po-summary-label">GRAND TOTAL</span>
          <span className="po-summary-value">{formatCurrency(summary.grandTotal)}</span>
        </div>
      {/* <div className="po-summary-stats">
         <span>Items: {summary.itemCount}</span>
        <span>Total Qty: {items.reduce((sum, item) => sum + (item.quantity || 0), 0)}</span>
        </div>  */}
      </div>

      <footer className="po-footer-input">
        <div className="po-search-container">
          <span className="material-icons">search</span>
          <input
            ref={searchInputRef}
            type="text"
            className="po-search-input"
            placeholder="Ketik produk, +huruf=supplier, +qty, ++harga..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            autoFocus
          />
        </div>
        <button 
          className="po-action-btn po-action-btn-cancel" 
          onClick={() => setShowExitConfirm(true)}
          disabled={isSaving}
          style={{ padding: '12px 20px' }}
        >
          <span className="material-icons" style={{ fontSize: 18, marginRight: 4 }}>exit_to_app</span>
          KELUAR
        </button>
        <button 
          className="po-action-btn po-action-btn-cancel" 
          disabled={items.length === 0}
          style={{ padding: '12px 20px', background: '#64748b', color: '#fff' }}
        >
          <span className="material-icons" style={{ fontSize: 18, marginRight: 4 }}>print</span>
          CETAK
        </button>
        <button className="po-save-btn" onClick={handleSave} disabled={isSaving || isLoading || items.length === 0 || !header.supplier_id}>
          <span className="material-icons">save</span>
          SIMPAN
        </button>
      </footer>

      {showSupplierPopup && (
        <div className="po-popup-overlay" onClick={() => setShowSupplierPopup(false)}>
          <div className="po-popup" onClick={(e) => e.stopPropagation()}>
            <div className="po-popup-header">
              <h3>CARI SUPPLIER</h3>
              <button className="po-popup-close" onClick={() => setShowSupplierPopup(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="po-popup-table-wrapper">
              <table className="po-popup-table">
                <thead><tr><th>No</th><th>Nama Supplier</th><th></th></tr></thead>
                <tbody>
                  {supplierResults.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8' }}>Supplier tidak ditemukan</td></tr>
                  ) : (
                    supplierResults.map((supplier, idx) => (
                      <tr key={supplier.id} className={popupSelectedIndex === idx ? 'selected' : ''} onClick={() => handleSelectSupplier(supplier)}>
                        <td>{idx + 1}</td>
                        <td>{supplier.name}</td>
                        <td><button className="po-popup-btn">PILIH</button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="po-popup-footer">
              <span>↑↓ Navigasi</span>
              <span>Enter: Pilih | Esc: Tutup</span>
            </div>
          </div>
        </div>
      )}

      {showProductPopup && (
        <div className="po-popup-overlay" onClick={() => setShowProductPopup(false)}>
          <div className="po-popup" onClick={(e) => e.stopPropagation()}>
            <div className="po-popup-header">
              <h3>DAFTAR PRODUK</h3>
              <button className="po-popup-close" onClick={() => setShowProductPopup(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="po-popup-table-wrapper">
              <table className="po-popup-table">
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
            <div className="po-popup-footer">
              <span>↑↓ Navigasi</span>
              <span>Enter: Pilih | Esc: Tutup</span>
            </div>
          </div>
        </div>
      )}

      {showActionPopup && (
        <div className="po-popup-overlay" onClick={() => setShowActionPopup(false)}>
          <div className="po-popup po-action-popup" onClick={(e) => e.stopPropagation()}>
            <div className="po-popup-header"><h3>AKHIRI TRANSAKSI</h3></div>
            <div style={{ padding: 24 }}>
              <p>Anda ingin menyimpan Purchase Order ini?</p>
              <div className="po-action-buttons">
                <button className={`po-action-btn po-action-btn-save ${actionPopupIndex === 0 ? 'selected' : ''}`} onClick={() => handleActionSelect(0)}>SIMPAN</button>
                <button className={`po-action-btn po-action-btn-cancel ${actionPopupIndex === 1 ? 'selected' : ''}`} onClick={() => handleActionSelect(1)}>BATAL</button>
              </div>
            </div>
            <div className="po-popup-footer">
              <span>Enter: Pilih</span>
              <span>Esc: Tutup</span>
            </div>
          </div>
        </div>
      )}

      {showExitConfirm && (
        <div className="po-popup-overlay">
          <div className="po-popup po-action-popup">
            <div className="po-popup-header"><h3>KONFIRMASI KELUAR</h3></div>
            <div style={{ padding: 24 }}>
              <p>Anda yakin ingin keluar dari halaman ini?</p>
              <div className="po-action-buttons">
                <button className="po-action-btn po-action-btn-save" onClick={() => { setShowExitConfirm(false); onExit() }}>YA</button>
                <button className="po-action-btn po-action-btn-cancel" onClick={() => setShowExitConfirm(false)}>TIDAK</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
