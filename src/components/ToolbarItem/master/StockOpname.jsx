import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import {
  listStockOpname,
  createStockOpname,
  updateStockOpname,
  deleteStockOpname,
  getProductStock,
  getReasonOptions,
  generateReference,
} from '../../../features/master/stock-opname/stockOpname.api'
import { listProducts } from '../../../features/master/product/product.api'
import { listWarehouses } from '../../../features/master/warehouse/warehouse.api'
import { FooterMaster } from '../footer/FooterMaster'
import { FooterFormMaster } from '../footer/FooterFormMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'

const REASON_OPTIONS = getReasonOptions()

const DEFAULT_FORM = {
  product_id: '',
  warehouse_id: '',
  system_qty: 0,
  physical_qty: 0,
  reason: '',
  notes: '',
  reference: '',
}

const DUMMY_PRODUCTS = [
  { id: 'PRD001', code: 'PRD-001', name: 'Kopi Luwak', unit: 'PCS' },
  { id: 'PRD002', code: 'PRD-002', name: 'Gula Pasir', unit: 'KG' },
  { id: 'PRD003', code: 'PRD-003', name: 'Teh Botol', unit: 'BOX' },
  { id: 'PRD004', code: 'PRD-004', name: 'Mineral Water', unit: 'PCS' },
  { id: 'PRD005', code: 'PRD-005', name: 'Roti Tawar', unit: 'PCS' },
]

const DUMMY_WAREHOUSES = [
  { id: 'WH001', code: 'WH-001', name: 'Gudang Utama' },
  { id: 'WH002', code: 'WH-002', name: 'Gudang Cabang' },
]

const DUMMY_OPNAME_RECORDS = [
  {
    id: 'OPN001',
    reference: 'OPN-20260305-001',
    product_id: 'PRD001',
    product: { code: 'PRD-001', name: 'Kopi Luwak', unit: 'PCS' },
    warehouse_id: 'WH001',
    warehouse: { code: 'WH-001', name: 'Gudang Utama' },
    system_qty: 150,
    physical_qty: 145,
    variance: -5,
    reason: 'counting_error',
    notes: 'Selisih saat stock opname bulanan',
    status: 'posted',
    created_by: 'admin',
    created_at: '2026-03-05T10:30:00Z',
  },
  {
    id: 'OPN002',
    reference: 'OPN-20260305-002',
    product_id: 'PRD002',
    product: { code: 'PRD-002', name: 'Gula Pasir', unit: 'KG' },
    warehouse_id: 'WH001',
    warehouse: { code: 'WH-001', name: 'Gudang Utama' },
    system_qty: 80,
    physical_qty: 75,
    variance: -5,
    reason: 'expired',
    notes: 'Gula kadaluarsa, perlu dibuang',
    status: 'pending',
    created_by: 'admin',
    created_at: '2026-03-05T14:00:00Z',
  },
  {
    id: 'OPN003',
    reference: 'OPN-20260305-003',
    product_id: 'PRD003',
    product: { code: 'PRD-003', name: 'Teh Botol', unit: 'BOX' },
    warehouse_id: 'WH001',
    warehouse: { code: 'WH-001', name: 'Gudang Utama' },
    system_qty: 200,
    physical_qty: 205,
    variance: 5,
    reason: 'found',
    notes: 'Stok ditemukan saat pengecekan',
    status: 'approved',
    created_by: 'admin',
    created_at: '2026-03-05T15:00:00Z',
  },
]

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false, width: '50px' },
  { key: 'reference', label: 'REFERENSI', sortable: true },
  { key: 'product_name', label: 'PRODUK', sortable: true },
  { key: 'warehouse_name', label: 'GUDANG', sortable: true },
  { key: 'system_qty', label: 'STOK SISTEM', sortable: true },
  { key: 'physical_qty', label: 'STOK FISIK', sortable: true },
  { key: 'variance', label: 'SELISIH', sortable: true },
  { key: 'reason', label: 'ALASAN', sortable: true },
  { key: 'status', label: 'STATUS', sortable: true },
  { key: 'created_at', label: 'TANGGAL', sortable: true, width: '120px' },
]

function getStatusBadgeClass(status) {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'status-badge-pending'
    case 'approved':
      return 'status-badge-approved'
    case 'posted':
      return 'status-badge-posted'
    case 'rejected':
      return 'status-badge-rejected'
    default:
      return 'status-badge-pending'
  }
}

function getVarianceClass(variance) {
  if (variance > 0) return 'variance-positive'
  if (variance < 0) return 'variance-negative'
  return 'variance-zero'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function StockOpname({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isFetchingStock, setIsFetchingStock] = useState(false)
  const [error, setError] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const pager = useMasterPagination({ initialLimit: 10, total: pagination.total, hasMore: pagination.has_more })
  const { limit, offset } = pager

  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const [productOptions, setProductOptions] = useState([])
  const [warehouseOptions, setWarehouseOptions] = useState([])
  const [reasonOptions] = useState(REASON_OPTIONS)

  const [form, setForm] = useState(DEFAULT_FORM)
  const [currentStock, setCurrentStock] = useState(0)
  const [variance, setVariance] = useState(0)

  const fetchLookups = useCallback(async () => {
    if (!token) {
      setProductOptions(DUMMY_PRODUCTS)
      setWarehouseOptions(DUMMY_WAREHOUSES)
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
      setProductOptions(DUMMY_PRODUCTS)
      setWarehouseOptions(DUMMY_WAREHOUSES)
    }
  }, [token])

  const fetchCurrentStock = useCallback(async (productId, warehouseId) => {
    if (!productId || !warehouseId) {
      setCurrentStock(0)
      return
    }

    setIsFetchingStock(true)
    try {
      const result = await getProductStock(token, { product_id: productId, warehouse_id: warehouseId })
      setCurrentStock(result.current_stock || 0)
    } catch {
      setCurrentStock(0)
    } finally {
      setIsFetchingStock(false)
    }
  }, [token])

  const fetchData = useCallback(async () => {
    setError('')
    setIsLoading(true)

    if (!token) {
      let items = [...DUMMY_OPNAME_RECORDS]

      if (searchKeyword.trim()) {
        const keyword = searchKeyword.trim().toLowerCase()
        items = items.filter(item =>
          item.reference.toLowerCase().includes(keyword) ||
          item.product.name.toLowerCase().includes(keyword)
        )
      }
      if (warehouseFilter) {
        items = items.filter(item => item.warehouse_id === warehouseFilter)
      }
      if (statusFilter !== 'all') {
        items = items.filter(item => item.status === statusFilter)
      }

      const total = items.length
      const sliced = items.slice(offset, offset + limit)
      setData(sliced)
      setPagination({ total, has_more: offset + limit < total })
      setIsLoading(false)
      return
    }

    try {
      const result = await listStockOpname(token, {
        search: searchKeyword.trim() || undefined,
        warehouse_id: warehouseFilter || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit,
        offset,
      })

      setData(result.items || [])
      const nextPagination = result.pagination || {}
      setPagination({
        total: Number(nextPagination.total ?? 0),
        has_more: Boolean(nextPagination.has_more),
      })
    } catch (err) {
      setError(err.message || 'Failed to load stock opname')
      setData([])
      setPagination({ total: 0, has_more: false })
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, warehouseFilter, statusFilter, limit, offset])

  useEffect(() => {
    fetchLookups()
  }, [fetchLookups])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (form.product_id && form.warehouse_id && showForm) {
      fetchCurrentStock(form.product_id, form.warehouse_id)
    }
  }, [form.product_id, form.warehouse_id, showForm, fetchCurrentStock])

  useEffect(() => {
    const physicalQty = Number(form.physical_qty || 0)
    setVariance(physicalQty - currentStock)
  }, [form.physical_qty, currentStock])

  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'created_at',
    direction: 'desc',
    valueGetters: {
      product_name: (row) => row?.product?.name || row?.product_name || '',
      warehouse_name: (row) => row?.warehouse?.name || row?.warehouse_name || '',
      system_qty: (row) => Number(row?.system_qty || 0),
      physical_qty: (row) => Number(row?.physical_qty || 0),
      variance: (row) => Number(row?.variance || 0),
    },
  })

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showDeleteConfirm) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setShowDeleteConfirm(false)
        }
        return
      }

      if (showForm) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setShowForm(false)
        }
        return
      }

      if (e.key === 'F2') {
        e.preventDefault()
        handleEdit()
      } else if (e.key === 'Delete') {
        e.preventDefault()
        handleDeleteClick()
      } else if (e.key === '+' || e.key === 'F1') {
        e.preventDefault()
        handleNew()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setShowExitConfirm(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeleteConfirm, showForm, selectedId, data])

  const selectedItem = selectedId == null ? null : data.find((row) => row.id === selectedId) || null

  const handleSearchChange = (value) => {
    pager.reset()
    setSearchKeyword(value)
  }

  const handleWarehouseFilter = (value) => {
    pager.reset()
    setWarehouseFilter(value)
  }

  const handleStatusFilter = (value) => {
    pager.reset()
    setStatusFilter(value)
  }

  const handleSelect = (row) => {
    setSelectedId(row.id)
  }

  const handleNew = () => {
    setSelectedId(null)
    setForm({
      ...DEFAULT_FORM,
      reference: generateReference(),
    })
    setCurrentStock(0)
    setVariance(0)
    setShowForm(true)
  }

  const handleEdit = () => {
    const target = selectedItem || sortedData[0]
    if (!target) return

    setSelectedId(target.id)
    setForm({
      product_id: target.product_id || '',
      warehouse_id: target.warehouse_id || '',
      system_qty: target.system_qty || 0,
      physical_qty: target.physical_qty || 0,
      reason: target.reason || '',
      notes: target.notes || '',
      reference: target.reference || '',
    })
    setCurrentStock(target.system_qty || 0)
    setVariance(target.variance || 0)
    setShowForm(true)
  }

  const handleDeleteClick = () => {
    if (selectedItem) {
      setShowDeleteConfirm(true)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedItem) {
      setShowDeleteConfirm(false)
      return
    }

    try {
      if (token) {
        await deleteStockOpname(token, selectedItem.id)
        await fetchData()
      } else {
        setData((prev) => prev.filter((row) => row.id !== selectedItem.id))
      }
    } catch (err) {
      setError(err.message || 'Failed to delete stock opname')
    } finally {
      setShowDeleteConfirm(false)
      setShowForm(false)
      setSelectedId(null)
      setForm(DEFAULT_FORM)
    }
  }

  const handleSave = async () => {
    if (!form.product_id) {
      setError('Product harus dipilih')
      return
    }
    if (!form.warehouse_id) {
      setError('Warehouse harus dipilih')
      return
    }
    if (!form.physical_qty || Number(form.physical_qty) < 0) {
      setError('Stok fisik harus diisi dan tidak boleh negatif')
      return
    }
    if (!form.reason) {
      setError('Alasan harus dipilih')
      return
    }
    if (form.notes && form.notes.length > 500) {
      setError('Catatan maksimal 500 karakter')
      return
    }

    setIsSaving(true)
    setError('')

    const payload = {
      product_id: form.product_id,
      warehouse_id: form.warehouse_id,
      system_qty: currentStock,
      physical_qty: Number(form.physical_qty),
      variance: variance,
      reason: form.reason,
      notes: form.notes || undefined,
      reference: form.reference || generateReference(),
    }

    try {
      if (token) {
        if (selectedItem && selectedItem.status === 'pending') {
          await updateStockOpname(token, selectedItem.id, payload)
        } else {
          await createStockOpname(token, payload)
        }
        await fetchData()
      } else {
        if (selectedItem && selectedItem.status === 'pending') {
          setData((prev) => prev.map((row) =>
            row.id === selectedItem.id ? { ...row, ...payload } : row
          ))
        } else {
          const newItem = {
            id: `OPN${Date.now()}`,
            ...payload,
            status: 'pending',
            created_by: 'user',
            created_at: new Date().toISOString(),
            product: productOptions.find(p => p.id === form.product_id) || { id: form.product_id, code: '-', name: 'Unknown' },
            warehouse: warehouseOptions.find(w => w.id === form.warehouse_id) || { id: form.warehouse_id, code: '-', name: 'Unknown' },
          }
          setData([newItem, ...data])
        }
      }

      setForm(DEFAULT_FORM)
      setSelectedId(null)
      setShowForm(false)
    } catch (err) {
      setError(err.message || 'Failed to save stock opname')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setForm(DEFAULT_FORM)
    setCurrentStock(0)
    setVariance(0)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExitClick = () => {
    setShowExitConfirm(true)
  }

  const handleConfirmExit = () => {
    setShowExitConfirm(false)
    onExit()
  }

  const productOptionsForSelect = useMemo(() => {
    const opts = productOptions.length > 0 ? productOptions : DUMMY_PRODUCTS
    return opts.map((item) => ({
      id: String(item.id || ''),
      name: `${item.code || '-'} - ${item.name || '-'}`,
    }))
  }, [productOptions])

  const warehouseOptionsForSelect = useMemo(() => {
    const opts = warehouseOptions.length > 0 ? warehouseOptions : DUMMY_WAREHOUSES
    return opts.map((item) => ({
      id: String(item.id || ''),
      name: `${item.code || '-'} - ${item.name || '-'}`,
    }))
  }, [warehouseOptions])

  const reasonOptionsForSelect = useMemo(() => {
    return reasonOptions.map((item) => ({
      id: item.value,
      name: item.label,
    }))
  }, [reasonOptions])

  return (
    <div className="master-content">
      <div className="master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Stock Opname</h1>
        <div className="master-header-filters">
          <div className="master-footer-search">
            <input
              type="text"
              placeholder="Search reference or product..."
              className="master-search-input"
              value={searchKeyword}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <button type="button" className="master-search-btn">
              <span className="material-icons-round material-icon">search</span>
            </button>
          </div>
          <div className="master-filter-wrap">
            <label htmlFor="opname-warehouse-filter" className="master-filter-label">Warehouse</label>
            <select
              id="opname-warehouse-filter"
              className="master-filter-select"
              value={warehouseFilter}
              onChange={(e) => handleWarehouseFilter(e.target.value)}
            >
              <option value="">All Warehouse</option>
              {warehouseOptionsForSelect.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="master-filter-wrap">
            <label htmlFor="opname-status-filter" className="master-filter-label">Status</label>
            <select
              id="opname-status-filter"
              className="master-filter-select"
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="posted">Posted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="master-error">{error}</div>}

      <div className="master-table-wrapper">
        <div className="master-table-container">
          <table className="master-table">
            <MasterTableHeader columns={TABLE_COLUMNS} sortConfig={sortConfig} onSort={handleSort} />
            <tbody>
              {sortedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={selectedId === row.id ? 'master-row-selected' : 'master-row'}
                  onClick={() => handleSelect(row)}
                >
                  <td>{offset + index + 1}</td>
                  <td>{row.reference || '-'}</td>
                  <td>{row.product?.name || row.product_name || '-'}</td>
                  <td>{row.warehouse?.name || row.warehouse_name || '-'}</td>
                  <td className="text-right">{Number(row.system_qty || 0).toLocaleString()}</td>
                  <td className="text-right">{Number(row.physical_qty || 0).toLocaleString()}</td>
                  <td className={`text-right ${getVarianceClass(row.variance)}`}>
                    {row.variance > 0 ? '+' : ''}{Number(row.variance || 0).toLocaleString()}
                  </td>
                  <td>{REASON_OPTIONS.find(r => r.value === row.reason)?.label || row.reason || '-'}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(row.status)}`}>
                      {row.status || '-'}
                    </span>
                  </td>
                  <td>{formatDate(row.created_at)}</td>
                </tr>
              ))}
              {!isLoading && sortedData.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="master-form-card">
          <div className="master-form-header">
            <span className="material-icons-round master-form-icon">inventory</span>
            <h2 className="master-form-title">{selectedItem ? 'Ubah Stock Opname' : 'Stock Opname Baru'}</h2>
          </div>
          <div className="master-form-grid">
            <div className="master-form-group-wide">
              <label className="master-form-label">Product *</label>
              <select
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                className="master-form-input"
                disabled={!!selectedItem}
              >
                <option value="">Select product...</option>
                {productOptionsForSelect.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div className="master-form-group-wide">
              <label className="master-form-label">Warehouse *</label>
              <select
                value={form.warehouse_id}
                onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                className="master-form-input"
                disabled={!!selectedItem}
              >
                <option value="">Select warehouse...</option>
                {warehouseOptionsForSelect.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Current Stock</label>
              <input
                type="number"
                value={currentStock}
                readOnly
                className="master-form-input master-form-input-readonly"
              />
              {isFetchingStock && (
                <span className="material-icons-round animate-spin" style={{ fontSize: '16px' }}>sync</span>
              )}
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Physical Qty *</label>
              <input
                type="number"
                value={form.physical_qty}
                onChange={(e) => setForm({ ...form, physical_qty: Number(e.target.value) })}
                className="master-form-input"
                placeholder="Enter counted quantity"
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Variance</label>
              <input
                type="number"
                value={variance}
                readOnly
                className={`master-form-input master-form-input-readonly ${getVarianceClass(variance)}`}
              />
            </div>
            <div className="master-form-group-wide">
              <label className="master-form-label">Reason *</label>
              <select
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="master-form-input"
              >
                <option value="">Select reason...</option>
                {reasonOptionsForSelect.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div className="master-form-group-wide">
              <label className="master-form-label">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="master-form-input master-form-textarea"
                placeholder="Additional notes (optional, max 500 chars)"
                rows={3}
                maxLength={500}
              />
            </div>
            <div className="master-form-group-wide">
              <label className="master-form-label">Reference</label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                className="master-form-input"
                placeholder="Auto-generated"
              />
            </div>
            <FooterFormMaster
              onSave={handleSave}
              onCancel={handleCancelForm}
              isSaving={isSaving}
              saveLabel={selectedItem ? 'Update' : 'Save'}
            />
          </div>
        </div>
      )}

      <FooterMaster
        onNew={handleNew}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        totalRow={pagination.total}
        onPrint={handlePrint}
        onExit={handleExitClick}
        onRefresh={fetchData}
        isLoading={isLoading}
        page={pager.page}
        totalPages={pager.totalPages}
        canPrev={pager.canPrev}
        canNext={pager.canNext}
        onFirstPage={pager.goFirst}
        onPrevPage={pager.goPrev}
        onNextPage={pager.goNext}
        onLastPage={pager.goLast}
      />

      {showDeleteConfirm && (
        <DeleteMaster
          itemName={selectedItem?.reference || 'this record'}
          title="Konfirmasi Hapus"
          confirmText="Hapus"
          cancelText="Batal"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showExitConfirm && (
        <DeleteMaster
          itemName="keluar dari halaman ini"
          title="Konfirmasi Keluar"
          confirmText="Ya"
          cancelText="Tidak"
          isExit={true}
          onConfirm={handleConfirmExit}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
    </div>
  )
}
