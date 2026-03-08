import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import { getPurchase, createPurchase, updatePurchase, listSuppliers, generatePONumber } from '../../../features/transaksi/purchase/purchase.api'
import { listWarehouses } from '../../../features/master/warehouse/warehouse.api'
import { AddPurchaseItemModal } from './AddPurchaseItemModal'
import { DeleteMaster } from '../footer/DeleteMaster'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]

export function PurchaseDetail({ selectedId: propSelectedId, onExit, onSaveSuccess }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [supplierOptions, setSupplierOptions] = useState([])
  const [warehouseOptions, setWarehouseOptions] = useState([])

  const [header, setHeader] = useState({
    po_number: generatePONumber(),
    supplier_id: '',
    warehouse_id: '',
    po_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    status: 'draft',
    notes: '',
  })

  const [items, setItems] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [editingId, setEditingId] = useState(null)

  // Fetch lookups
  const fetchLookups = useCallback(async () => {
    if (!token) {
      setSupplierOptions([
        { id: 'SUP001', name: 'PT. Supplier Utama' },
        { id: 'SUP002', name: 'CV. Berkah Jaya' },
      ])
      setWarehouseOptions([
        { id: 'WH001', name: 'Gudang Utama' },
        { id: 'WH002', name: 'Gudang Cabang' },
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
      console.error('[PurchaseDetail] Failed to load lookups:', err)
    }
  }, [token])

  useEffect(() => { fetchLookups() }, [fetchLookups])

  // Load existing purchase
  useEffect(() => {
    if (!propSelectedId) return
    const loadPurchase = async () => {
      setIsLoading(true)
      try {
        const data = await getPurchase(token, propSelectedId)
        console.log('[PurchaseDetail] Loaded data:', data)
        console.log('[PurchaseDetail] Data status:', data.status)
        
        // Normalize status to lowercase for consistency
        const normalizedStatus = (data.status || 'draft').toLowerCase()
        
        setHeader({
          po_number: data.po_number || generatePONumber(),
          supplier_id: data.supplier_id || '',
          warehouse_id: data.warehouse_id || '',
          po_date: data.po_date || data.order_date || new Date().toISOString().split('T')[0],
          expected_date: data.expected_date || data.expected_delivery || '',
          status: normalizedStatus,
          notes: data.notes || '',
        })
        console.log('[PurchaseDetail] Normalized status:', normalizedStatus)
        
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
        console.log('[PurchaseDetail] Header after load:', { status: normalizedStatus })
      } catch (err) {
        console.error('[PurchaseDetail] Error loading data:', err)
        setError('Failed to load purchase order')
      } finally {
        setIsLoading(false)
      }
    }
    loadPurchase()
  }, [propSelectedId, token])

  // Add item
  const addItem = useCallback((newItem) => {
    const itemWithId = {
      id: newItem.id || `item-${Date.now()}`,
      product_id: newItem.product_id,
      product_name: newItem.product_name,
      sku: newItem.sku,
      quantity: newItem.quantity,
      unit_price: newItem.unit_price,
      discount: newItem.discount || 0,
      tax_rate: newItem.tax_rate || 0,
      line_total: (newItem.quantity || 0) * (newItem.unit_price || 0),
    }
    setItems((prev) => [...prev, itemWithId])
    setShowAddModal(false)
  }, [])

  // Update item
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

  // Remove item
  const removeItem = useCallback((ids) => {
    const idsToRemove = Array.isArray(ids) ? ids : [ids]
    setItems((prev) => prev.filter((item) => !idsToRemove.includes(item.id)))
    setSelectedIds([])
  }, [])

  // Calculations
  const summary = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const discountTotal = items.reduce((sum, item) => sum + (item.discount || 0), 0)
    const taxTotal = items.reduce((sum, item) => {
      const lineTotal = (item.quantity * item.unit_price) - (item.discount || 0)
      return sum + (lineTotal * (item.tax_rate || 0) / 100)
    }, 0)
    const grandTotal = subtotal - discountTotal + taxTotal
    return { subtotal, discountTotal, taxTotal, grandTotal, itemCount: items.length }
  }, [items])

  // Handle save
  const handleSave = useCallback(async () => {
    if (!header.supplier_id) { setError('Supplier harus dipilih'); return }
    if (!header.warehouse_id) { setError('Warehouse harus dipilih'); return }
    if (items.length === 0) { setError('Minimal 1 item harus ditambahkan'); return }

    setIsSaving(true)
    setError('')

    // Swagger spec: UpdatePurchaseOrderRequest
    // Required: supplier_id, warehouse_id, expected_date, items
    const payload = {
      supplier_id: header.supplier_id,
      warehouse_id: header.warehouse_id,
      expected_date: header.expected_date || null,
      notes: header.notes || '',
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount || 0,
        tax_rate: item.tax_rate || 0,
      })),
    }

    console.log('[PurchaseDetail] === UPDATE REQUEST ===')
    console.log('[PurchaseDetail] URL:', `/api/purchases/${propSelectedId}`)
    console.log('[PurchaseDetail] Payload:', JSON.stringify(payload, null, 2))

    try {
      if (token) {
        // Swagger spec: Create/Update Purchase Order
        // Required fields: supplier_id, warehouse_id, expected_date, items
        const payload = {
          supplier_id: header.supplier_id,
          warehouse_id: header.warehouse_id,
          expected_date: header.expected_date || null,
          notes: header.notes || '',
          items: items.map(item => ({
            // For update: include item id if it exists
            // For create: don't include id (backend will generate)
            ...(item.id && !item.id.startsWith('item-') ? { id: item.id } : {}),
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount || 0,
            tax_rate: item.tax_rate || 0,
          })),
        }

        console.log('[PurchaseDetail] === SAVE REQUEST ===')
        console.log('[PurchaseDetail] URL:', propSelectedId ? `/api/purchases/${propSelectedId}` : '/api/purchases')
        console.log('[PurchaseDetail] Method:', propSelectedId ? 'PUT' : 'POST')
        console.log('[PurchaseDetail] Payload:', JSON.stringify(payload, null, 2))

        if (propSelectedId) {
          // UPDATE existing
          const result = await updatePurchase(token, propSelectedId, payload)
          console.log('[PurchaseDetail] === UPDATE RESPONSE ===')
          console.log('[PurchaseDetail] Response:', result)
          console.log('[PurchaseDetail] Response data.items:', result.data?.items?.length || 0)
          // Close first, then show toast from parent
          console.log('[PurchaseDetail] Calling onExit()...')
          onExit()
          if (onSaveSuccess) {
            setTimeout(() => {
              console.log('[PurchaseDetail] Showing success toast...')
              onSaveSuccess('Purchase Order berhasil diupdate', 'success')
            }, 300)
          }
        } else {
          // CREATE new
          console.log('[PurchaseDetail] Creating NEW purchase order...')
          const result = await createPurchase(token, payload)
          console.log('[PurchaseDetail] === CREATE RESPONSE ===')
          console.log('[PurchaseDetail] Response:', result)
          console.log('[PurchaseDetail] Created ID:', result.data?.id)
          console.log('[PurchaseDetail] Response data.items:', result.data?.items?.length || 0)
          // Close first, then show toast from parent
          console.log('[PurchaseDetail] Calling onExit()...')
          onExit()
          if (onSaveSuccess) {
            setTimeout(() => {
              console.log('[PurchaseDetail] Showing success toast...')
              onSaveSuccess('Purchase Order berhasil dibuat', 'success')
            }, 300)
          }
        }
      } else {
        // Offline mode
        console.log('[PurchaseDetail] Offline mode - simulating save')
        onExit()
        if (onSaveSuccess) {
          setTimeout(() => {
            onSaveSuccess('Purchase Order berhasil disimpan (offline)', 'success')
          }, 300)
        }
      }
    } catch (err) {
      console.error('[PurchaseDetail] === SAVE ERROR ===')
      console.error('[PurchaseDetail] Error:', err)
      setError(err.message || 'Failed to save purchase order')
      if (onSaveSuccess) {
        onSaveSuccess(err.message || 'Failed to save', 'error')
      }
    } finally {
      setIsSaving(false)
    }
  }, [header, items, token, propSelectedId, onExit, onSaveSuccess])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showAddModal || showExitConfirm) return
      if (e.key === 'F1') { e.preventDefault(); setShowAddModal(true) }
      else if (e.key === 'Delete' && selectedIds.length > 0) { e.preventDefault(); removeItem(selectedIds) }
      else if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave() }
      else if (e.key === 'Escape') { e.preventDefault(); setShowExitConfirm(true) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showAddModal, showExitConfirm, selectedIds, handleSave, removeItem])

  const supplierOptionsForSelect = useMemo(() =>
    supplierOptions.map(item => ({ id: item.id, name: item.name })), [supplierOptions])

  const warehouseOptionsForSelect = useMemo(() =>
    warehouseOptions.map(item => ({ id: item.id, name: item.name })), [warehouseOptions])

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

  return (
    <div className="stock-opname-container">
      {/* Header */}
      <header className="stock-opname-header">
        <div className="stock-opname-header-top">
          <div className="stock-opname-title-section">
            <div className="stock-opname-accent-bar"></div>
            <h1 className="stock-opname-title">PURCHASE ORDER - {header.po_number}</h1>
          </div>
          <div className="stock-opname-status-group">
            <button type="button" className={`status-button ${header.status === 'draft' ? 'status-button-active' : 'status-button-inactive'}`} onClick={() => setHeader({ ...header, status: 'draft' })}>
              Draft
            </button>
            <button type="button" className={`status-button ${header.status === 'pending' ? 'status-button-active' : 'status-button-inactive'}`} onClick={() => setHeader({ ...header, status: 'pending' })}>
              Pending
            </button>
            <button type="button" className={`status-button ${header.status === 'approved' ? 'status-button-active' : 'status-button-inactive'}`} onClick={() => setHeader({ ...header, status: 'approved' })}>
              Approve
            </button>
          </div>
        </div>
        <div className="stock-opname-header-form">
          <div className="form-group">
            <label className="master-form-label">PO Number</label>
            <input type="text" value={header.po_number} readOnly className="master-form-input master-form-input-readonly" />
          </div>
          <div className="form-group">
            <label className="master-form-label">Supplier *</label>
            <select value={header.supplier_id} onChange={(e) => setHeader({ ...header, supplier_id: e.target.value })} className="master-form-input">
              <option value="">Select supplier...</option>
              {supplierOptionsForSelect.map(item => (<option key={item.id} value={item.id}>{item.name}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label className="master-form-label">PO Date *</label>
            <input type="date" value={header.po_date} onChange={(e) => setHeader({ ...header, po_date: e.target.value })} className="master-form-input" />
          </div>
          <div className="form-group">
            <label className="master-form-label">Expected Date</label>
            <input type="date" value={header.expected_date} onChange={(e) => setHeader({ ...header, expected_date: e.target.value })} className="master-form-input" />
          </div>
          <div className="form-group">
            <label className="master-form-label">Warehouse *</label>
            <select value={header.warehouse_id} onChange={(e) => setHeader({ ...header, warehouse_id: e.target.value })} className="master-form-input">
              <option value="">Select warehouse...</option>
              {warehouseOptionsForSelect.map(item => (<option key={item.id} value={item.id}>{item.name}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label className="master-form-label">Notes</label>
            <textarea value={header.notes} onChange={(e) => setHeader({ ...header, notes: e.target.value })} className="master-form-input master-form-textarea" rows={2} placeholder="Add remarks..." />
          </div>
        </div>
      </header>

      {error && <div className="master-error">{error}</div>}

      {/* Items Table */}
      <main className="stock-opname-items">
        <div className="stock-opname-table-container">
          <div className="table-wrapper custom-scrollbar">
            <table className="stock-opname-table master-table">
              <thead className="table-header">
                <tr>
                  <th className="table-checkbox" style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      className="table-checkbox-input"
                      checked={selectedIds.length === items.length && items.length > 0}
                      onChange={(e) => setSelectedIds(e.target.checked ? items.map(i => i.id) : [])}
                    />
                  </th>
                  <th style={{ width: '60px' }}>No</th>
                  <th>SKU</th>
                  <th>Product</th>
                  <th className="table-center" style={{ width: '100px' }}>QTY PO</th>
                  <th className="table-center" style={{ width: '120px' }}>Unit Price</th>
                  <th className="table-center" style={{ width: '100px' }}>Discount</th>
                  <th className="table-center" style={{ width: '80px' }}>Tax %</th>
                  <th className="table-center" style={{ width: '120px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    className={selectedIds.includes(item.id) ? 'master-row-selected' : 'master-row'}
                    onClick={() => setSelectedIds([item.id])}
                  >
                    <td className="table-checkbox">
                      <input
                        type="checkbox"
                        className="table-checkbox-input"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => setSelectedIds(e.target.checked ? [item.id] : [])}
                      />
                    </td>
                    <td className="table-center text-muted">{index + 1}</td>
                    <td className="font-bold">{item.sku || '-'}</td>
                    <td className="table-product">
                      <div className="product-name">{item.product_name || '-'}</div>
                    </td>
                    <td className="table-center">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                        className="physical-input"
                      />
                    </td>
                    <td className="table-center">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.id, { unit_price: Number(e.target.value) })}
                        className="physical-input"
                      />
                    </td>
                    <td className="table-center">
                      <input
                        type="number"
                        value={item.discount}
                        onChange={(e) => updateItem(item.id, { discount: Number(e.target.value) })}
                        className="physical-input"
                      />
                    </td>
                    <td className="table-center">
                      <input
                        type="number"
                        value={item.tax_rate}
                        onChange={(e) => updateItem(item.id, { tax_rate: Number(e.target.value) })}
                        className="physical-input"
                      />
                    </td>
                    <td className="table-center font-bold">{formatCurrency(item.line_total)}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted">
                      No items added yet. Click "Add" (F1) to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="stock-opname-summary">
          <span className="summary-title">Summary</span>
          <div className="summary-items">
            <span className="summary-item">
              TOTAL ITEMS: <span className="summary-value">{summary.itemCount}</span>
            </span>
            <span className="summary-divider"></span>
            <span className="summary-item">
              SUBTOTAL: <span className="summary-value">{formatCurrency(summary.subtotal)}</span>
            </span>
            <span className="summary-divider"></span>
            <span className="summary-item">
              DISCOUNT: <span className="summary-value">{formatCurrency(summary.discountTotal)}</span>
            </span>
            <span className="summary-divider"></span>
            <span className="summary-item">
              TAX: <span className="summary-value">{formatCurrency(summary.taxTotal)}</span>
            </span>
            <span className="summary-divider"></span>
            <span className="summary-item summary-positive">
              GRAND TOTAL: <span className="summary-value">{formatCurrency(summary.grandTotal)}</span>
            </span>
          </div>
        </div>
      </main>

      {/* Action Footer - Sticky Bottom */}
      <footer className="stock-opname-footer">
        <div className="footer-content">
          <div className="footer-actions-left">
            <button type="button" className="master-footer-btn" onClick={() => setShowAddModal(true)} title="Add Item (F1)" aria-label="New">
              <span className="material-icons-round master-footer-icon orange">add_box</span>
              <span className="master-footer-key">+</span>
            </button>
            <button type="button" className="master-footer-btn" onClick={() => removeItem(selectedIds)} disabled={selectedIds.length === 0} title="Remove Selected (DEL)" aria-label="Delete">
              <span className="material-icons-round master-footer-icon orange">remove_circle</span>
              <span className="master-footer-key">DEL</span>
            </button>
            <button type="button" className="master-footer-btn" onClick={handleSave} disabled={isSaving || isLoading} title="Save (Ctrl+S)" aria-label="Save">
              <span className="material-icons-round master-footer-icon green">save</span>
            </button>
            <button type="button" className="master-footer-btn" onClick={() => setShowExitConfirm(true)} disabled={isSaving} title="Exit (Esc)" aria-label="Exit">
              <span className="material-icons-round master-footer-icon red">exit_to_app</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddPurchaseItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addItem}
        token={token}
      />
      {showAddModal && console.log('[PurchaseDetail] AddModal open, token:', !!token)}

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
