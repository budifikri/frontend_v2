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
import { Toast } from '../../Toast'

const REASON_OPTIONS = getReasonOptions()
const STATUS_OPTIONS = getStatusOptions()

export function StockOpnameDetail({ selectedId: propSelectedId, onExit, onSaveSuccess }) {
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

  // Toast state
  const [toast, setToast] = useState({
    isOpen: false,
    message: '',
    type: 'info',
  })

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
      
      // Normalize product options
      const normalizedProducts = (productRes.items || []).map(item => ({
        id: item.id || '',
        code: item.sku || item.code || item.product_code || '-',
        name: item.name || item.product_name || '-',
        unit: item.unit_name || item.unit || item.product_unit || '-',
      }))
      
      setProductOptions(normalizedProducts)
      setWarehouseOptions(warehouseRes.items || [])
    } catch (err) {
      console.error('[StockOpnameDetail] Failed to load lookups:', err)
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
            product_sku: item.product_sku || '',
            product_name: item.product_name || '',
            product_unit_name: item.product_unit_name || '',
            system_quantity: item.system_quantity || 0,
            actual_quantity: item.actual_quantity || 0,
            difference: item.difference || 0,
            status: item.status || '',
            notes: item.notes || '',
            reason: item.reason || '',
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
    const systemQty = newItem.system_quantity || 0
    const actualQty = newItem.actual_quantity || 0
    const itemWithId = {
      id: `item-${Date.now()}`,
      product_id: newItem.product_id,
      product_sku: product?.code || '-',
      product_name: product?.name || '-',
      product_unit_name: product?.unit || '-',
      system_quantity: systemQty,
      actual_quantity: actualQty,
      difference: actualQty - systemQty,
      status: 'pending',
      reason: newItem.reason || null,
      notes: newItem.notes || null,
      _isNew: true,
    }
    console.log('[StockOpnameDetail] Adding item:', itemWithId)
    setItems((prev) => [...prev, itemWithId])
    setShowAddModal(false)
  }, [productOptions])

  // Update item
  const updateItem = useCallback((itemId, updates) => {
    setItems((prev) => prev.map((item) => {
      if (item.id === itemId) {
        const updated = { ...item, ...updates }
        // Recalculate difference if actual_quantity changed
        if (updates.actual_quantity !== undefined) {
          updated.difference = updated.actual_quantity - updated.system_quantity
        }
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
        id: item.id || '',  // Empty for new items
        product_id: item.product_id,
        system_quantity: item.system_quantity,
        actual_quantity: item.actual_quantity,
        difference: item.difference,
        status: item.status || 'pending',
        notes: item.notes || item.reason || '',
      })),
    }

    try {
      if (token) {
        if (propSelectedId) {
          // UPDATE existing stock opname
          console.log('[StockOpnameDetail] Updating existing:', propSelectedId)
          await updateStockOpname(token, propSelectedId, payload)
          // Close first, then show toast in parent
          onExit()
          if (onSaveSuccess) onSaveSuccess('Stock Opname berhasil disimpan', 'success')
        } else {
          // CREATE new stock opname
          console.log('[StockOpnameDetail] Creating new')
          await createStockOpname(token, payload)
          // Close first, then show toast in parent
          onExit()
          if (onSaveSuccess) onSaveSuccess('Stock Opname berhasil dibuat', 'success')
        }
      } else {
        // Offline mode - just simulate
        console.log('[StockOpnameDetail] Offline mode save')
        onExit()
        if (onSaveSuccess) onSaveSuccess('Stock Opname berhasil disimpan (offline mode)', 'success')
      }
    } catch (err) {
      console.error('[StockOpnameDetail] Save error:', err)
      setError(err.message || 'Failed to save stock opname')
    } finally {
      setIsSaving(false)
    }
  }

  // Show toast helper
  const showToast = (message, type = 'info') => {
    setToast({ isOpen: true, message, type })
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
    variance_positive: items.filter(i => i.difference > 0).length,
    variance_negative: items.filter(i => i.difference < 0).length,
    variance_zero: items.filter(i => i.difference === 0).length,
  }), [items])

  const productOptionsForSelect = useMemo(() => {
    return productOptions.map((item) => ({
      id: item.id,
      name: `${item.code || '-'} - ${item.name || '-'}`,
      code: item.code || '-',
      name_only: item.name || '-',
      unit: item.unit || '-',
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
            <table className="stock-opname-table master-table">
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
                  <th>SKU</th>
                  <th>Product</th>
                  <th className="table-center">Unit</th>
                  <th className="table-center">System</th>
                  <th className="table-center">Physical</th>
                  <th className="table-center">Variance</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
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
                    <td className="font-bold">{item.product_sku || item.product?.sku || '-'}</td>
                    <td className="table-product">
                      <div className="product-name">{item.product_name || item.product?.name || '-'}</div>
                    </td>
                    <td className="table-center text-muted">{item.product_unit_name || item.product?.unit || '-'}</td>
                    <td className="table-center font-bold">{Number(item.system_quantity || item.system_qty || 0)}</td>
                    <td className="table-center">
                      <input
                        type="number"
                        value={item.actual_quantity !== undefined ? item.actual_quantity : (item.physical_qty || 0)}
                        onChange={(e) => updateItem(item.id, { actual_quantity: Number(e.target.value) })}
                        className="physical-input"
                      />
                    </td>
                    <td className={`table-center font-black ${item.difference !== undefined ? (item.difference > 0 ? 'variance-positive' : item.difference < 0 ? 'variance-negative' : '') : (item.variance > 0 ? 'variance-positive' : item.variance < 0 ? 'variance-negative' : '')}`}>
                      {Number(item.difference !== undefined ? item.difference : (item.variance || 0))}
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
                    <td colSpan={9} className="text-center py-8 text-muted">
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
        onProductSelect={(productId, callback) => {
          // Fetch system stock for selected product
          if (token && header.warehouse_id) {
            getProductStock(token, {
              product_id: productId,
              warehouse_id: header.warehouse_id,
            }).then((result) => {
              callback(result.current_stock || 0)
            }).catch(() => {
              callback(0)
            })
          } else {
            // Offline mode - use dummy data
            const dummyStocks = {
              'PRD001': 150,
              'PRD002': 80,
              'PRD003': 200,
            }
            callback(dummyStocks[productId] || 0)
          }
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

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        duration={3000}
      />
    </div>
  )
}
