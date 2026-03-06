import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import {
  getStockOpnameById,
  createStockOpname,
  updateStockOpname,
  deleteStockOpname,
  getProductStock,
  getReasonOptions,
  getStatusOptions,
  generateReference,
} from '../../../features/master/stock-opname/stockOpname.api'
import { listProducts } from '../../../features/master/product/product.api'
import { listWarehouses } from '../../../features/master/warehouse/warehouse.api'
import { MasterDetailTable, MasterDetailFooter, AddItemModal } from '../../templates'
import { DeleteMaster } from '../footer/DeleteMaster'

const REASON_OPTIONS = getReasonOptions()
const STATUS_OPTIONS = getStatusOptions()

export function StockOpnameDetail({ selectedId: propSelectedId, onExit }) {
  const { auth } = useAuth()
  const token = auth?.token
  
  console.log('[StockOpnameDetail] Rendering, token:', !!token, 'selectedId:', propSelectedId)

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [productOptions, setProductOptions] = useState([])
  const [warehouseOptions, setWarehouseOptions] = useState([])
  const [isFetchingStock, setIsFetchingStock] = useState(false)

  const [header, setHeader] = useState({
    opname_number: generateReference(),
    warehouse_id: '',
    opname_date: new Date().toISOString().split('T')[0],
    status: 'draft',
    notes: '',
  })

  const [items, setItems] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [editingId, setEditingId] = useState(null)

  // Fetch lookups
  const fetchLookups = useCallback(async () => {
    if (!token) {
      setProductOptions([
        { id: 'PRD001', code: 'PRD-001', name: 'Kopi Luwak', unit: 'PCS' },
        { id: 'PRD002', code: 'PRD-002', name: 'Gula Pasir', unit: 'KG' },
        { id: 'PRD003', code: 'PRD-003', name: 'Teh Botol', unit: 'BOX' },
      ])
      setWarehouseOptions([
        { id: 'WH001', name: 'Gudang Utama' },
        { id: 'WH002', name: 'Gudang Cabang' },
      ])
      return
    }

    try {
      const [productRes, warehouseRes] = await Promise.all([
        listProducts(token, { limit: 200, offset: 0 }),
        listWarehouses(token, { limit: 200, offset: 0 }),
      ])
      setProductOptions(productRes.items || [])
      setWarehouseOptions(warehouseRes.items || [])
    } catch {
      setError('Failed to load lookups')
    }
  }, [token])

  useEffect(() => {
    fetchLookups()
  }, [fetchLookups])

  // Load selected stock opname data
  useEffect(() => {
    // If no propSelectedId, this is a new stock opname - don't load anything
    if (!propSelectedId) return

    const loadStockOpname = async () => {
      setIsLoading(true)
      try {
        const data = await getStockOpnameById(token, propSelectedId)
        console.log('[StockOpnameDetail] Loaded data:', data)
        
        // Set header
        setHeader({
          opname_number: data.opname_number || data.reference || generateReference(),
          warehouse_id: data.warehouse_id || data.warehouse?.id || '',
          opname_date: data.opname_date ? data.opname_date.split('T')[0] : new Date().toISOString().split('T')[0],
          status: data.status || 'draft',
          notes: data.notes || '',
        })

        // Set items
        if (data.items && data.items.length > 0) {
          const formattedItems = data.items.map((item, index) => ({
            id: item.id || `item-${index}`,
            product_id: item.product_id,
            product: item.product || { code: '-', name: '-', unit: '-' },
            system_qty: item.system_qty || 0,
            physical_qty: item.physical_qty || 0,
            variance: item.variance || 0,
            reason: item.reason || '',
            notes: item.notes || '',
          }))
          setItems(formattedItems)
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

  // Add item
  const addItem = useCallback((newItem) => {
    const product = productOptions.find(p => p.id === newItem.product_id)
    const systemQty = newItem.system_qty || 0
    const physicalQty = newItem.physical_qty || 0
    const itemWithId = {
      id: `item-${Date.now()}`,
      product_id: newItem.product_id,
      product: {
        code: product?.code || '-',
        name: product?.name || '-',
        unit: product?.unit || '-',
      },
      system_qty: systemQty,
      physical_qty: physicalQty,
      variance: physicalQty - systemQty,
      reason: newItem.reason || null,
      notes: newItem.notes || null,
      _isNew: true,
    }
    setItems((prev) => [...prev, itemWithId])
    setShowAddModal(false)
  }, [productOptions])

  // Update item
  const updateItem = useCallback((itemId, updates) => {
    setItems((prev) => prev.map((item) => {
      if (item.id === itemId) {
        const updated = { ...item, ...updates }
        updated.variance = (updated.physical_qty || 0) - (updated.system_qty || 0)
        return updated
      }
      return item
    }))
  }, [])

  // Remove item
  const removeItem = useCallback((ids) => {
    const idsToRemove = Array.isArray(ids) ? ids : [ids]
    setItems((prev) => prev.filter((item) => !idsToRemove.includes(item.id)))
    setSelectedIds((prev) => prev.filter((id) => !idsToRemove.includes(id)))
  }, [])

  // Validate
  const validate = useCallback(() => {
    const errors = []
    
    if (!header.warehouse_id) {
      errors.push('Warehouse harus dipilih')
    }
    if (!header.opname_date) {
      errors.push('Tanggal harus diisi')
    }
    if (items.length === 0) {
      errors.push('Minimal 1 product harus ditambahkan')
    }

    items.forEach((item, index) => {
      if (!item.product_id) {
        errors.push(`Product baris ${index + 1} harus dipilih`)
      }
      if (item.physical_qty < 0) {
        errors.push(`Stok fisik baris ${index + 1} tidak boleh negatif`)
      }
    })

    return { isValid: errors.length === 0, errors }
  }, [header, items])

  // Handle save
  const handleSave = async () => {
    const { isValid, errors } = validate()
    if (!isValid) {
      setError(errors.join(', '))
      return
    }

    setIsSaving(true)
    setError('')

    const payload = {
      opname_number: header.opname_number || generateReference(),
      warehouse_id: header.warehouse_id,
      opname_date: header.opname_date,
      status: header.status,
      notes: header.notes || '',
      items: items.map((item) => ({
        product_id: item.product_id,
        system_qty: item.system_qty,
        physical_qty: item.physical_qty,
        variance: item.variance,
        reason: item.reason || null,
        notes: item.notes || null,
      })),
    }

    try {
      if (token) {
        await createStockOpname(token, payload)
      } else {
        // Offline mode - just simulate
        console.log('Saving offline:', payload)
      }
      
      // Navigate back to list
      onExit()
    } catch (err) {
      setError(err.message || 'Failed to save stock opname')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showAddModal || showDeleteConfirm || showExitConfirm) return

      if (e.key === 'F1') {
        e.preventDefault()
        setShowAddModal(true)
      } else if (e.key === 'Delete' && selectedIds.length > 0) {
        e.preventDefault()
        removeItem(selectedIds)
      } else if (e.key === 'F2' && selectedIds.length === 1) {
        e.preventDefault()
        setEditingId(selectedIds[0])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setShowExitConfirm(true)
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showAddModal, showDeleteConfirm, showExitConfirm, selectedIds, handleSave])

  // Calculate summary
  const summary = useMemo(() => ({
    total_items: items.length,
    variance_positive: items.filter(i => i.variance > 0).length,
    variance_negative: items.filter(i => i.variance < 0).length,
    variance_zero: items.filter(i => i.variance === 0).length,
  }), [items])

  const productOptionsForSelect = useMemo(() => {
    return productOptions.map((item) => ({
      id: item.id,
      name: `${item.code || '-'} - ${item.name || '-'}`,
    }))
  }, [productOptions])

  const warehouseOptionsForSelect = useMemo(() => {
    return warehouseOptions.map((item) => ({
      id: item.id,
      name: item.name || '-',
    }))
  }, [warehouseOptions])

  const statusOptionsForSelect = useMemo(() => {
    return STATUS_OPTIONS
  }, [])

  return (
    <div className="stock-opname-container">
      {/* Header Section - Sticky Top */}
      <header className="stock-opname-header">
        <div className="stock-opname-header-top">
          <div className="stock-opname-title-section">
            <div className="stock-opname-accent-bar"></div>
            <h1 className="stock-opname-title">
              STOCK OPNAME - {header.opname_number}
            </h1>
          </div>
          <div className="stock-opname-status-group">
            <button
              type="button"
              className={`status-button ${header.status === 'draft' ? 'status-button-active' : 'status-button-inactive'}`}
              onClick={() => setHeader({ ...header, status: 'draft' })}
            >
              Draft
            </button>
            <button
              type="button"
              className={`status-button ${header.status === 'approved' ? 'status-button-active' : 'status-button-inactive'}`}
              onClick={() => setHeader({ ...header, status: 'approved' })}
            >
              Approve
            </button>
            <button
              type="button"
              className={`status-button ${header.status === 'rejected' ? 'status-button-active' : 'status-button-inactive'}`}
              onClick={() => setHeader({ ...header, status: 'rejected' })}
            >
              Rejected
            </button>
          </div>
        </div>

        <div className="stock-opname-header-form">
          <div className="form-group">
            <label className="form-label">Reference</label>
            <input
              type="text"
              value={header.opname_number}
              readOnly
              className="form-input form-input-readonly"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Warehouse *</label>
            <select
              value={header.warehouse_id}
              onChange={(e) => setHeader({ ...header, warehouse_id: e.target.value })}
              className="form-input"
            >
              <option value="">Select warehouse...</option>
              {warehouseOptionsForSelect.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tanggal Opname *</label>
            <input
              type="date"
              value={header.opname_date}
              onChange={(e) => setHeader({ ...header, opname_date: e.target.value })}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              value={header.notes}
              onChange={(e) => setHeader({ ...header, notes: e.target.value })}
              className="form-input form-textarea"
              rows={1}
              placeholder="Add remarks..."
            />
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && <div className="master-error">{error}</div>}

      {/* Items Section - Scrollable */}
      <main className="stock-opname-items">
        <div className="stock-opname-table-container">
          <div className="table-wrapper custom-scrollbar">
            <table className="stock-opname-table">
              <thead className="table-header">
                <tr>
                  <th className="table-checkbox">
                    <input 
                      type="checkbox" 
                      className="table-checkbox-input"
                      checked={selectedIds.length === items.length && items.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(items.map(i => i.id))
                        } else {
                          setSelectedIds([])
                        }
                      }}
                    />
                  </th>
                  <th className="table-center" style={{ width: '60px' }}>No</th>
                  <th>Product</th>
                  <th className="table-center">Unit</th>
                  <th className="table-center">System</th>
                  <th className="table-center">Physical</th>
                  <th className="table-center">Variance</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {items.map((item, index) => (
                  <tr key={item.id} className="table-row">
                    <td className="table-checkbox">
                      <input
                        type="checkbox"
                        className="table-checkbox-input"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, item.id])
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== item.id))
                          }
                        }}
                      />
                    </td>
                    <td className="table-center text-muted">{index + 1}</td>
                    <td className="table-product">
                      <div className="product-name">{item.product?.name || item.product_name || '-'}</div>
                      <div className="product-sku">SKU: {item.product?.code || '-'}</div>
                    </td>
                    <td className="table-center text-muted">{item.product?.unit || '-'}</td>
                    <td className="table-center font-bold">{Number(item.system_qty || 0)}</td>
                    <td className="table-center">
                      <input
                        type="number"
                        value={item.physical_qty || 0}
                        onChange={(e) => updateItem(item.id, { physical_qty: Number(e.target.value) })}
                        className="physical-input"
                      />
                    </td>
                    <td className={`table-center font-black ${item.variance > 0 ? 'variance-positive' : item.variance < 0 ? 'variance-negative' : ''}`}>
                      {Number(item.variance || 0)}
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.reason || ''}
                        onChange={(e) => updateItem(item.id, { reason: e.target.value })}
                        className="reason-input"
                        placeholder="Add reason..."
                      />
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted">
                      No items added yet. Click "Add" (F1) to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stock-opname-summary">
          <span className="summary-title">Summary</span>
          <div className="summary-items">
            <span className="summary-item">
              TOTAL ITEMS: <span className="summary-value">{summary.total_items}</span>
            </span>
            <span className="summary-divider"></span>
            <span className="summary-item summary-positive">
              VARIANCE POSITIVE: <span className="summary-value">{summary.variance_positive}</span>
            </span>
            <span className="summary-divider"></span>
            <span className="summary-item summary-negative">
              VARIANCE NEGATIVE: <span className="summary-value">{summary.variance_negative}</span>
            </span>
            <span className="summary-divider"></span>
            <span className="summary-item">
              VARIANCE ZERO: <span className="summary-value">{summary.variance_zero}</span>
            </span>
          </div>
        </div>
      </main>

      {/* Action Footer - Sticky Bottom */}
      <footer className="stock-opname-footer">
        <div className="footer-content">
          <div className="footer-actions-left">
            <button
              type="button"
              className="footer-btn footer-btn-add"
              onClick={() => setShowAddModal(true)}
              title="Add Product (F1)"
            >
              <span className="material-icons-round">add</span>
              <span className="footer-btn-shortcut">F1</span>
            </button>
            <button
              type="button"
              className="footer-btn footer-btn-remove"
              onClick={() => removeItem(selectedIds)}
              disabled={selectedIds.length === 0}
              title="Remove Selected (DEL)"
            >
              <span className="material-icons-round">remove</span>
              <span className="footer-btn-shortcut">DEL</span>
            </button>
          </div>
          <div className="footer-actions-right">
            <button
              type="button"
              className="footer-btn footer-btn-save"
              onClick={handleSave}
              disabled={isSaving || isLoading}
            >
              <span className="material-icons-round">save</span>
              {isSaving ? 'Saving...' : 'Save (Ctrl+S)'}
            </button>
            <button
              type="button"
              className="footer-btn footer-btn-exit"
              onClick={() => setShowExitConfirm(true)}
              disabled={isSaving}
            >
              <span className="material-icons-round">logout</span>
              Exit (Esc)
            </button>
          </div>
        </div>
      </footer>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addItem}
        title="Add Product to Opname"
        itemConfig={{
          selectFields: [
            {
              name: 'product_id',
              label: 'Product',
              required: true,
              options: productOptionsForSelect,
            },
          ],
        }}
      />

      {/* Exit Confirm */}
      {showExitConfirm && (
        <DeleteMaster
          itemName="keluar dari halaman ini"
          title="Konfirmasi Keluar"
          confirmText="Ya"
          cancelText="Tidak"
          isExit={true}
          onConfirm={() => {
            setShowExitConfirm(false)
            onExit()
          }}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
    </div>
  )
}
