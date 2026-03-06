import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import {
  listStockOpname,
  createStockOpname,
  updateStockOpname,
  deleteStockOpname,
  getReasonOptions,
  generateReference,
} from '../../../features/master/stock-opname/stockOpname.api'
import { listWarehouses } from '../../../features/master/warehouse/warehouse.api'
import { FooterMaster } from '../footer/FooterMaster'
import { FooterFormMaster } from '../footer/FooterFormMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'
import { StockOpnameDetail } from './StockOpnameDetail'

const REASON_OPTIONS = getReasonOptions()

const DEFAULT_FORM = {
  warehouse_id: '',
  opname_date: '',
  status: 'draft',
  notes: '',
  reference: '',
}

const DUMMY_WAREHOUSES = [
  { id: 'WH001', code: 'WH-001', name: 'Gudang Utama' },
  { id: 'WH002', code: 'WH-002', name: 'Gudang Cabang' },
]

const DUMMY_OPNAME_RECORDS = [
  {
    id: 'OPN001',
    opname_number: 'OPN-20260305-001',
    warehouse_id: 'WH001',
    warehouse: { id: 'WH001', code: 'WH-001', name: 'Gudang Utama' },
    user_id: 'user1',
    username: 'Admin Utama',
    opname_date: '2026-03-05T10:30:00Z',
    status: 'posted',
    notes: 'Stock opname bulanan',
    created_at: '2026-03-05T10:30:00Z',
  },
  {
    id: 'OPN002',
    opname_number: 'OPN-20260305-002',
    warehouse_id: 'WH001',
    warehouse: { id: 'WH001', code: 'WH-001', name: 'Gudang Utama' },
    user_id: 'user1',
    username: 'Admin Utama',
    opname_date: '2026-03-05T14:00:00Z',
    status: 'draft',
    notes: 'Stock opname mingguan',
    created_at: '2026-03-05T14:00:00Z',
  },
  {
    id: 'OPN003',
    opname_number: 'OPN-20260305-003',
    warehouse_id: 'WH002',
    warehouse: { id: 'WH002', code: 'WH-002', name: 'Gudang Cabang' },
    user_id: 'user2',
    username: 'Admin Cabang',
    opname_date: '2026-03-05T15:00:00Z',
    status: 'draft',
    notes: 'Stock opname cabang',
    created_at: '2026-03-05T15:00:00Z',
  },
]

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false, width: '50px' },
  { key: 'opname_date', label: 'TANGGAL', sortable: true, width: '120px' },
  { key: 'opname_number', label: 'REFERENSI', sortable: true },
  { key: 'warehouse_name', label: 'WAREHOUSE', sortable: true },
  { key: 'notes', label: 'NOTES', sortable: true },
  { key: 'username', label: 'USERNAME', sortable: true },
  { key: 'status', label: 'STATUS', sortable: true },
]

function getStatusBadgeClass(status) {
  switch (status?.toLowerCase()) {
    case 'draft':
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
  const [showDetail, setShowDetail] = useState(false)

  const [warehouseOptions, setWarehouseOptions] = useState([])
  const [reasonOptions] = useState(REASON_OPTIONS)

  const [form, setForm] = useState(DEFAULT_FORM)

  const fetchWarehouses = useCallback(async () => {
    if (!token) {
      setWarehouseOptions(DUMMY_WAREHOUSES)
      return
    }

    try {
      const res = await listWarehouses(token, { limit: 200, offset: 0 })
      setWarehouseOptions(res.items || [])
    } catch {
      setWarehouseOptions(DUMMY_WAREHOUSES)
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
          item.opname_number.toLowerCase().includes(keyword) ||
          item.warehouse.name.toLowerCase().includes(keyword) ||
          item.notes.toLowerCase().includes(keyword)
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
    fetchWarehouses()
  }, [fetchWarehouses])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'opname_date',
    direction: 'desc',
    valueGetters: {
      warehouse_name: (row) => row?.warehouse?.name || row?.warehouse_name || '',
    },
  })

  const selectedItem = selectedId == null ? null : data.find((row) => row.id === selectedId) || null

  const handleSelect = (row) => {
    setSelectedId(row.id)
  }

  const handleViewDetail = (row) => {
    console.log('[StockOpname] handleViewDetail called, row:', row)
    setSelectedId(row.id)
    setShowDetail(true)
  }

  const handleNew = () => {
    setSelectedId(null)
    setShowDetail(true)
  }

  const handleEdit = () => {
    const target = selectedItem || sortedData[0]
    if (!target) return

    setSelectedId(target.id)
    setForm({
      warehouse_id: target.warehouse_id || '',
      opname_date: target.opname_date ? target.opname_date.split('T')[0] : '',
      status: target.status || 'draft',
      notes: target.notes || '',
      reference: target.opname_number || '',
    })
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
    if (!form.warehouse_id) {
      setError('Warehouse harus dipilih')
      return
    }
    if (!form.opname_date) {
      setError('Tanggal harus diisi')
      return
    }
    if (!form.status) {
      setError('Status harus dipilih')
      return
    }

    setIsSaving(true)
    setError('')

    const payload = {
      warehouse_id: form.warehouse_id,
      opname_date: form.opname_date,
      status: form.status,
      notes: form.notes || undefined,
      opname_number: form.reference || generateReference(),
    }

    try {
      if (token) {
        if (selectedItem && selectedItem.status === 'draft') {
          await updateStockOpname(token, selectedItem.id, payload)
        } else {
          await createStockOpname(token, payload)
        }
        await fetchData()
      } else {
        if (selectedItem && selectedItem.status === 'draft') {
          setData((prev) => prev.map((row) =>
            row.id === selectedItem.id ? { ...row, ...payload } : row
          ))
        } else {
          const newItem = {
            id: `OPN${Date.now()}`,
            ...payload,
            opname_number: payload.opname_number || generateReference(),
            user_id: 'user',
            created_at: new Date().toISOString(),
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

  const warehouseOptionsForSelect = useMemo(() => {
    const opts = warehouseOptions.length > 0 ? warehouseOptions : DUMMY_WAREHOUSES
    return opts.map((item) => ({
      id: String(item.id || ''),
      name: item.name || '-',
    }))
  }, [warehouseOptions])

  const statusOptionsForSelect = useMemo(() => {
    return [
      { id: 'draft', name: 'Draft' },
      { id: 'approved', name: 'Approved' },
      { id: 'posted', name: 'Posted' },
      { id: 'rejected', name: 'Rejected' },
    ]
  }, [])

  return (
    <>
      {showDetail ? (
        <StockOpnameDetail
          selectedId={selectedId}
          onExit={() => {
            setShowDetail(false)
            setSelectedId(null)
          }}
        />
      ) : (
        <div className="master-content">
      <div className="master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Stock Opname</h1>
        <div className="master-header-filters">
          <div className="master-footer-search">
            <input
              type="text"
              placeholder="Search reference, warehouse, or notes..."
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
              <option value="draft">Draft</option>
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
                  onDoubleClick={() => handleViewDetail(row)}
                  title="Double-click to view/edit detail"
                >
                  <td>{offset + index + 1}</td>
                  <td>{formatDate(row.opname_date)}</td>
                  <td>{row.opname_number || row.reference || '-'}</td>
                  <td>{row.warehouse?.name || row.warehouse_name || '-'}</td>
                  <td>{row.notes || '-'}</td>
                  <td>{row.username || row.user_id || '-'}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(row.status)}`}>
                      {row.status || '-'}
                    </span>
                  </td>
                </tr>
              ))}
              {!isLoading && sortedData.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center">No data</td>
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
              <label className="master-form-label">Reference</label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                className="master-form-input"
                placeholder="Auto-generated"
              />
            </div>
            <div className="master-form-group-wide">
              <label className="master-form-label">Warehouse *</label>
              <select
                value={form.warehouse_id}
                onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                className="master-form-input"
              >
                <option value="">Select warehouse...</option>
                {warehouseOptionsForSelect.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Tanggal Opname *</label>
              <input
                type="date"
                value={form.opname_date}
                onChange={(e) => setForm({ ...form, opname_date: e.target.value })}
                className="master-form-input"
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Status *</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="master-form-input"
              >
                <option value="">Select status...</option>
                {statusOptionsForSelect.map((item) => (
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
                placeholder="Catatan (opsional)"
                rows={4}
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
        onEdit={() => handleViewDetail(selectedItem || sortedData[0])}
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
          itemName={selectedItem?.opname_number || 'this record'}
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
      )}
    </>
  )
}
