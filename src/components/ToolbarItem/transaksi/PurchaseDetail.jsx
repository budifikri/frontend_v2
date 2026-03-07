import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import { getPurchase, createPurchase, updatePurchase, listSuppliers, generatePONumber } from '../../../features/transaksi/purchase/purchase.api'
import { listWarehouses } from '../../../features/master/warehouse/warehouse.api'
import { AddPurchaseItemModal } from './AddPurchaseItemModal'
import { DeleteMaster } from '../footer/DeleteMaster'
import { Toast } from '../../Toast'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]

export function PurchaseDetail({ selectedId: propSelectedId, onExit }) {
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

  // Toast state
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' })

  const handleSaveSuccess = (message, type = 'success') => {
    setToast({ isOpen: true, message, type })
  }

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
        setHeader({
          po_number: data.po_number || generatePONumber(),
          supplier_id: data.supplier_id || '',
          warehouse_id: data.warehouse_id || '',
          po_date: data.po_date || new Date().toISOString().split('T')[0],
          expected_date: data.expected_date || '',
          status: data.status || 'draft',
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
  const handleSave = async () => {
    if (!header.supplier_id) { setError('Supplier harus dipilih'); return }
    if (!header.warehouse_id) { setError('Warehouse harus dipilih'); return }
    if (items.length === 0) { setError('Minimal 1 item harus ditambahkan'); return }

    setIsSaving(true)
    setError('')

    const payload = {
      po_number: header.po_number,
      supplier_id: header.supplier_id,
      warehouse_id: header.warehouse_id,
      po_date: header.po_date,
      expected_date: header.expected_date,
      status: header.status,
      notes: header.notes,
      items: items.map(item => ({
        id: item.id.startsWith('item-') ? '' : item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        tax_rate: item.tax_rate,
      })),
    }

    try {
      if (token) {
        if (propSelectedId) {
          await updatePurchase(token, propSelectedId, payload)
          handleSaveSuccess('Purchase Order berhasil diupdate', 'success')
        } else {
          await createPurchase(token, payload)
          handleSaveSuccess('Purchase Order berhasil dibuat', 'success')
        }
      }
      setTimeout(() => onExit(), 1500)
    } catch (err) {
      setError(err.message || 'Failed to save purchase order')
      handleSaveSuccess(err.message || 'Failed to save', 'error')
    } finally {
      setIsSaving(false)
    }
  }

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
  }, [showAddModal, showExitConfirm, selectedIds, items])

  const supplierOptionsForSelect = useMemo(() => 
    supplierOptions.map(item => ({ id: item.id, name: item.name })), [supplierOptions])

  const warehouseOptionsForSelect = useMemo(() => 
    warehouseOptions.map(item => ({ id: item.id, name: item.name })), [warehouseOptions])

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

  return (
    <div className="purchase-detail-container">
      {/* Header */}
      <header className="purchase-header">
        <div className="purchase-header-top">
          <div className="purchase-title-section">
            <div className="purchase-accent-bar"></div>
            <h1 className="purchase-title">PURCHASE ORDER - {header.po_number}</h1>
          </div>
          <div className="purchase-status-badge">
            <span className={`status-badge status-badge-${header.status}`}>{header.status}</span>
          </div>
        </div>
        <div className="purchase-header-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">PO Number</label>
              <input type="text" value={header.po_number} readOnly className="form-input form-input-readonly" />
            </div>
            <div className="form-group">
              <label className="form-label">PO Date *</label>
              <input type="date" value={header.po_date} onChange={(e) => setHeader({ ...header, po_date: e.target.value })} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Date</label>
              <input type="date" value={header.expected_date} onChange={(e) => setHeader({ ...header, expected_date: e.target.value })} className="form-input" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group-wide">
              <label className="form-label">Supplier *</label>
              <select value={header.supplier_id} onChange={(e) => setHeader({ ...header, supplier_id: e.target.value })} className="form-input">
                <option value="">Select supplier...</option>
                {supplierOptionsForSelect.map(item => (<option key={item.id} value={item.id}>{item.name}</option>))}
              </select>
            </div>
            <div className="form-group-wide">
              <label className="form-label">Warehouse *</label>
              <select value={header.warehouse_id} onChange={(e) => setHeader({ ...header, warehouse_id: e.target.value })} className="form-input">
                <option value="">Select warehouse...</option>
                {warehouseOptionsForSelect.map(item => (<option key={item.id} value={item.id}>{item.name}</option>))}
              </select>
            </div>
          </div>
          <div className="form-group-wide">
            <label className="form-label">Notes</label>
            <textarea value={header.notes} onChange={(e) => setHeader({ ...header, notes: e.target.value })} className="form-input form-textarea" rows={2} />
          </div>
        </div>
      </header>

      {error && <div className="master-error">{error}</div>}

      {/* Items Table */}
      <main className="purchase-items">
        <div className="purchase-items-header">
          <h2>Items ({items.length})</h2>
          <button type="button" className="btn-add-item" onClick={() => setShowAddModal(true)}>
            <span className="material-icons-round">add</span> Add Item (F1)
          </button>
        </div>

        <div className="purchase-table-container">
          <table className="purchase-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>SKU</th>
                <th>Product</th>
                <th style={{ width: '100px' }}>Qty</th>
                <th style={{ width: '120px' }}>Unit Price</th>
                <th style={{ width: '100px' }}>Discount</th>
                <th style={{ width: '80px' }}>Tax %</th>
                <th style={{ width: '120px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className={selectedIds.includes(item.id) ? 'master-row-selected' : ''} onClick={() => setSelectedIds([item.id])}>
                  <td><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => setSelectedIds(selectedIds.includes(item.id) ? [] : [item.id])} /></td>
                  <td className="sku-cell">{item.sku}</td>
                  <td>{item.product_name}</td>
                  <td><input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })} className="qty-input" /></td>
                  <td><input type="number" value={item.unit_price} onChange={(e) => updateItem(item.id, { unit_price: Number(e.target.value) })} className="price-input" /></td>
                  <td><input type="number" value={item.discount} onChange={(e) => updateItem(item.id, { discount: Number(e.target.value) })} className="discount-input" /></td>
                  <td><input type="number" value={item.tax_rate} onChange={(e) => updateItem(item.id, { tax_rate: Number(e.target.value) })} className="tax-input" /></td>
                  <td className="total-cell">{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={8} className="text-center py-8">No items. Click "Add Item" to start.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="purchase-summary">
          <div className="summary-row"><span>Subtotal:</span><span>{formatCurrency(summary.subtotal)}</span></div>
          <div className="summary-row"><span>Discount:</span><span>{formatCurrency(summary.discountTotal)}</span></div>
          <div className="summary-row"><span>Tax:</span><span>{formatCurrency(summary.taxTotal)}</span></div>
          <div className="summary-row summary-grand-total"><span>Grand Total:</span><span>{formatCurrency(summary.grandTotal)}</span></div>
        </div>
      </main>

      {/* Footer */}
      <footer className="purchase-footer">
        <div className="purchase-footer-actions">
          <button type="button" className="footer-btn footer-btn-add" onClick={() => setShowAddModal(true)}>
            <span className="material-icons-round">add</span> Add Item
          </button>
          <button type="button" className="footer-btn footer-btn-remove" onClick={() => removeItem(selectedIds)} disabled={selectedIds.length === 0}>
            <span className="material-icons-round">remove</span> Remove
          </button>
          <button type="button" className="footer-btn footer-btn-save" onClick={handleSave} disabled={isSaving}>
            <span className="material-icons-round">save</span> {isSaving ? 'Saving...' : 'Save (Ctrl+S)'}
          </button>
          <button type="button" className="footer-btn footer-btn-exit" onClick={() => setShowExitConfirm(true)}>
            <span className="material-icons-round">exit_to_app</span> Exit
          </button>
        </div>
      </footer>

      {/* Modals */}
      <AddPurchaseItemModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={addItem} />
      
      {showExitConfirm && (
        <DeleteMaster itemName="keluar dari halaman ini" title="Konfirmasi Keluar" confirmText="Ya" cancelText="Tidak" isExit onConfirm={() => { setShowExitConfirm(false); onExit() }} onCancel={() => setShowExitConfirm(false)} />
      )}

      <Toast message={toast.message} type={toast.type} isOpen={toast.isOpen} onClose={() => setToast({ ...toast, isOpen: false })} duration={3000} />
    </div>
  )
}
