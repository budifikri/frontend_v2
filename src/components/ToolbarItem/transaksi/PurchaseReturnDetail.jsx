import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import { getPurchaseReturn, createPurchaseReturn, updatePurchaseReturn, listSuppliers, listPurchaseOrders, generateReturnNumber } from '../../../features/transaksi/purchase-return/purchaseReturn.api'
import { listWarehouses } from '../../../features/master/warehouse/warehouse.api'
import { AddPurchaseItemModal } from './AddPurchaseItemModal'
import { DeleteMaster } from '../footer/DeleteMaster'
import { Toast } from '../../../components/Toast'

export function PurchaseReturnDetail({ selectedId: propSelectedId, onExit, onSaveSuccess }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [supplierOptions, setSupplierOptions] = useState([])
  const [warehouseOptions, setWarehouseOptions] = useState([])
  const [poOptions, setPoOptions] = useState([])
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
  const [selectedIds, setSelectedIds] = useState([])

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
      setPoOptions([
        { id: 'PO001', po_number: 'PO-20260307-001' },
        { id: 'PO002', po_number: 'PO-20260310-002' },
      ])
      return
    }
    try {
      const [supplierRes, warehouseRes, poRes] = await Promise.all([
        listSuppliers(token, { limit: 200 }),
        listWarehouses(token, { limit: 200 }),
        listPurchaseOrders(token, { limit: 200, status: 'approved' }),
      ])
      setSupplierOptions(supplierRes.items || [])
      setWarehouseOptions(warehouseRes.items || [])
      setPoOptions((poRes.items || []).map(po => ({ id: po.id, po_number: po.po_number })))
    } catch (err) {
      console.error('[PurchaseReturnDetail] Failed to load lookups:', err)
      setToastMessage('Gagal memuat data')
      setToastType('error')
      setShowToast(true)
    }
  }, [token])

  useEffect(() => { fetchLookups() }, [fetchLookups])

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
            line_total: item.line_total,
          })))
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

  const handleAddItemFromModal = useCallback((item) => {
    const lineTotal = (item.quantity || 0) * (item.unit_price || 0)
    const itemWithId = {
      id: `item-${Date.now()}`,
      product_id: item.product_id,
      product_name: item.product_name,
      sku: item.sku,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount || 0,
      tax_rate: item.tax_rate || 0,
      line_total: lineTotal,
    }
    setItems((prev) => [...prev, itemWithId])
    setShowAddModal(false)
  }, [])

  const removeItem = useCallback((ids) => {
    const idsToRemove = Array.isArray(ids) ? ids : [ids]
    setItems((prev) => prev.filter((item) => !idsToRemove.includes(item.id)))
    setSelectedIds([])
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
    setToastMessage('')
    setToastType('info')
    setShowToast(false)

    try {
      if (token) {
        const targetStatus = header.status || 'draft'
        const itemsCopy = items.map(it => ({ ...it }))
        const payload = {
          po_id: header.po_id || null,
          po_number: header.po_number || null,
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
  }, [token, header, items, propSelectedId, onExit, onSaveSuccess])

  const handlePOChange = (poId) => {
    const po = poOptions.find(p => p.id === poId)
    setHeader(prev => ({
      ...prev,
      po_id: poId,
      po_number: po?.po_number || '',
    }))
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const handleStatusChange = (newStatus) => {
    setHeader(prev => ({ ...prev, status: newStatus }))
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
    <div className="stock-opname-container">
      <header className="stock-opname-header">
        <div className="stock-opname-header-top">
          <div className="stock-opname-title-section">
            <div className="stock-opname-accent-bar"></div>
            <h1 className="stock-opname-title">
              PURCHASE RETURN - {propSelectedId ? header.pr_number : 'NEW'}
            </h1>
          </div>
          {propSelectedId && (
            <div className="stock-opname-status-group">
              <button
                type="button"
                className={`status-button ${header.status === 'draft' ? 'status-button-active' : 'status-button-inactive'}`}
                onClick={() => handleStatusChange('draft')}
              >
                Draft
              </button>
              <button
                type="button"
                className={`status-button ${header.status === 'approved' ? 'status-button-active' : 'status-button-inactive'}`}
                onClick={() => handleStatusChange('approved')}
              >
                Approved
              </button>
              <button
                type="button"
                className={`status-button ${header.status === 'done' ? 'status-button-active' : 'status-button-inactive'}`}
                onClick={() => handleStatusChange('done')}
              >
                Done
              </button>
            </div>
          )}
        </div>

        <div className="stock-opname-header-form">
          {propSelectedId && (
            <div className="form-group">
              <label className="form-label">Return Number</label>
              <input
                type="text"
                value={header.pr_number}
                readOnly
                className="form-input form-input-readonly"
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Return Date *</label>
            <input
              type="date"
              value={header.pr_date}
              onChange={(e) => setHeader({ ...header, pr_date: e.target.value })}
              className="form-input"
            />
          </div>
          {propSelectedId && (
            <div className="form-group">
              <label className="form-label">PO Reference</label>
              <select
                value={header.po_id}
                onChange={(e) => handlePOChange(e.target.value)}
                className="form-input"
              >
                <option value="">Select PO...</option>
                {poOptions.map(po => (
                  <option key={po.id} value={po.id}>{po.po_number}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Supplier *</label>
            <select
              value={header.supplier_id}
              onChange={(e) => setHeader({ ...header, supplier_id: e.target.value })}
              className="form-input"
            >
              <option value="">Select supplier...</option>
              {supplierOptions.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Warehouse *</label>
            <select
              value={header.warehouse_id}
              onChange={(e) => setHeader({ ...header, warehouse_id: e.target.value })}
              className="form-input"
            >
              <option value="">Select warehouse...</option>
              {warehouseOptions.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="stock-opname-items">
        {error && <div className="stock-opname-error"><span className="material-icons-round">error</span>{error}</div>}

        <div className="stock-opname-table-container">
          <table className="stock-opname-table master-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Product</th>
                <th>SKU</th>
                <th style={{ width: '100px' }}>Qty</th>
                <th style={{ width: '120px' }}>Unit Price</th>
                <th style={{ width: '80px' }}>Discount</th>
                <th style={{ width: '80px' }}>Tax %</th>
                <th style={{ width: '120px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id || index}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => {
                        setSelectedIds(prev =>
                          prev.includes(item.id)
                            ? prev.filter(id => id !== item.id)
                            : [...prev, item.id]
                        )
                      }}
                    />
                  </td>
                  <td>{item.product_name || '-'}</td>
                  <td>{item.sku || '-'}</td>
                  <td className="text-right">{item.quantity || 0}</td>
                  <td className="text-right">{formatCurrency(item.unit_price || 0)}</td>
                  <td className="text-right">{item.discount || 0}%</td>
                  <td className="text-right">{item.tax_rate || 0}%</td>
                  <td className="text-right">{formatCurrency(item.line_total || 0)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted">
                    No items added yet. Click "Add" (F1) to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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

      <AddPurchaseItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddItemFromModal}
        token={token}
      />

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
