import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
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
import { useMasterTableKeyboardNav } from '../../../hooks/useMasterTableKeyboardNav'
import { StockOpnameDetail } from './StockOpnameDetail'
import { Toast } from '../../Toast'

const REASON_OPTIONS = getReasonOptions()
const ALL_RECORDS_SUMMARY_LIMIT = 999999

const DEFAULT_FORM = {
  warehouse_id: '',
  opname_date: '',
  status: 'draft',
  is_opening: false,
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
    is_opening: true,
    notes: 'Stock opname bulanan',
    created_at: '2026-03-05T10:30:00Z',
    total_selisih: 0,
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
    is_opening: false,
    notes: 'Stock opname mingguan',
    created_at: '2026-03-05T14:00:00Z',
    total_selisih: 0,
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
    is_opening: false,
    notes: 'Stock opname cabang',
    created_at: '2026-03-05T15:00:00Z',
    total_selisih: 0,
  },
]

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false, width: '50px' },
  { key: 'opname_date', label: 'TANGGAL', sortable: true, width: '120px' },
  { key: 'opname_number', label: 'REFERENSI', sortable: true },
  { key: 'opname_type', label: 'TIPE', sortable: false, width: '120px' },
  { key: 'warehouse_name', label: 'WAREHOUSE', sortable: true },
  { key: 'notes', label: 'NOTES', sortable: true },
  { key: 'username', label: 'USERNAME', sortable: true },
  { key: 'grand_total', label: 'TOTAL', sortable: true },
  { key: 'status', label: 'STATUS', sortable: true, width: '220px' },
]

function getOpnameStatusMeta(status) {
  const value = String(status || '').toLowerCase()
  if (value === 'approved' || value === 'approve') return { label: 'Approved', variant: 'approve', icon: 'check_circle' }
  if (value === 'posted') return { label: 'Posted', variant: 'receive', icon: 'check_circle' }
  if (value === 'rejected') return { label: 'Rejected', variant: 'reject', icon: 'cancel' }
  return { label: 'Draft', variant: 'draft', icon: 'edit_note' }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

function formatNumber(amount) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(amount) || 0)
}

function getOpnameTypeMeta(isOpening) {
  if (isOpening) {
    return {
      label: 'Opening',
      background: 'rgba(249, 115, 22, 0.14)',
      color: '#f97316',
      border: '1px solid rgba(249, 115, 22, 0.28)',
    }
  }

  return {
    label: 'Regular',
    background: 'rgba(59, 130, 246, 0.12)',
    color: '#60a5fa',
    border: '1px solid rgba(96, 165, 250, 0.24)',
  }
}

export function StockOpname({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [summaryCounts, setSummaryCounts] = useState({ totalOpname: 0, draftCount: 0, approvedCount: 0 })
  const [summaryTotalAmount, setSummaryTotalAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const pager = useMasterPagination({ initialLimit: 10, total: pagination.total, hasMore: pagination.has_more })
  const { limit, offset } = pager

  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const tableRef = useRef(null)

  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' })
  const [warehouseOptions, setWarehouseOptions] = useState([])
  const [form, setForm] = useState(DEFAULT_FORM)
  const [isSaving, setIsSaving] = useState(false)

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
    console.log('[StockOpname.jsx] fetchData() called')
    setError('')
    setIsLoading(true)

    if (!token) {
      let items = [...DUMMY_OPNAME_RECORDS]
      if (searchKeyword.trim()) {
        const keyword = searchKeyword.trim().toLowerCase()
        items = items.filter(item =>
          item.opname_number.toLowerCase().includes(keyword) ||
          item.warehouse?.name.toLowerCase().includes(keyword) ||
          item.notes.toLowerCase().includes(keyword)
        )
      }
      if (warehouseFilter) {
        items = items.filter(item => item.warehouse_id === warehouseFilter)
      }
      if (statusFilter !== 'all') {
        items = items.filter(item => item.status === statusFilter)
      }
      if (typeFilter !== 'all') {
        items = items.filter(item => typeFilter === 'opening' ? Boolean(item.is_opening) : !item.is_opening)
      }
      const total = items.length
      const sliced = items.slice(offset, offset + limit)
      const grandTotalAll = items.reduce((sum, item) => sum + (Number(item.total_selisih) || 0), 0)
      const draft = items.filter(item => String(item.status || '').toLowerCase() === 'draft').length
      const approved = items.filter(item => {
        const status = String(item.status || '').toLowerCase()
        return status === 'approve' || status === 'approved' || status === 'posted'
      }).length
      setData(sliced)
      setPagination({ total, has_more: offset + limit < total })
      setSummaryCounts({ totalOpname: total, draftCount: draft, approvedCount: approved })
      setSummaryTotalAmount(grandTotalAll)
      setIsLoading(false)
      return
    }

    try {
      const result = await listStockOpname(token, {
        search: searchKeyword.trim() || undefined,
        warehouse_id: warehouseFilter || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          opname_type: typeFilter !== 'all' ? typeFilter : undefined,
          limit,
          offset,
      })

      setData(result.items || [])
      const nextPagination = result.pagination || {}
      setPagination({
        total: Number(nextPagination.total ?? 0),
        has_more: Boolean(nextPagination.has_more),
      })

        const baseSummaryParams = {
          search: searchKeyword.trim() || undefined,
          warehouse_id: warehouseFilter || undefined,
          opname_type: typeFilter !== 'all' ? typeFilter : undefined,
          limit: 1,
          offset: 0,
        }

      const [totalSummary, draftSummary, approvedSummary, allRecordsSummary] = await Promise.all([
        listStockOpname(token, baseSummaryParams),
        listStockOpname(token, { ...baseSummaryParams, status: 'draft' }),
        listStockOpname(token, { ...baseSummaryParams, status: 'approved' }),
        listStockOpname(token, { ...baseSummaryParams, limit: ALL_RECORDS_SUMMARY_LIMIT, offset: 0 }),
      ])

      setSummaryCounts({
        totalOpname: Number(totalSummary?.pagination?.total ?? 0),
        draftCount: Number(draftSummary?.pagination?.total ?? 0),
        approvedCount: Number(approvedSummary?.pagination?.total ?? 0),
      })
      setSummaryTotalAmount(
        (allRecordsSummary?.items || []).reduce((sum, row) => sum + (Number(row.total_selisih) || 0), 0),
      )
    } catch (err) {
      setError(err.message || 'Failed to load stock opname')
      setData([])
      setPagination({ total: 0, has_more: false })
      setSummaryCounts({ totalOpname: 0, draftCount: 0, approvedCount: 0 })
      setSummaryTotalAmount(0)
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, warehouseFilter, statusFilter, typeFilter, limit, offset])

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

  const handleSaveSuccess = (message, type = 'success') => {
    console.log('[StockOpname.jsx] handleSaveSuccess() called:', { message, type })
    setToast({ isOpen: true, message, type })
  }

  const handleNew = () => {
    setSelectedId(null)
    setShowDetail(true)
  }

  const handleDeleteClick = useCallback(() => {
    if (!selectedItem) return
    const status = String(selectedItem?.status || '').toLowerCase()
    if (status === 'approved' || status === 'approve' || status === 'posted') {
      setToast({ isOpen: true, message: 'Tidak bisa dihapus, status sudah terkunci', type: 'error' })
      return
    }
    setShowDeleteConfirm(true)
  }, [selectedItem])

  useMasterTableKeyboardNav({
    data: sortedData,
    selectedId,
    setSelectedId,
    handleEdit: handleViewDetail,
    tableRef,
    isModalOpen: showForm || showDeleteConfirm || showExitConfirm || showDetail,
  })

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

  const handlePrint = () => window.print()
  const handleExitClick = () => setShowExitConfirm(true)
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

  const statusOptionsForSelect = useMemo(() => [
    { id: 'draft', name: 'Draft' },
    { id: 'approved', name: 'Approved' },
    { id: 'posted', name: 'Posted' },
    { id: 'rejected', name: 'Rejected' },
  ], [])

  const totalOpname = summaryCounts.totalOpname
  const draftCount = summaryCounts.draftCount
  const approvedCount = summaryCounts.approvedCount

  if (showDetail) {
    return (
      <StockOpnameDetail
        selectedId={selectedId}
        onExit={() => {
          console.log('[StockOpname.jsx] onExit called - closing detail view')
          setShowDetail(false)
          setSelectedId(null)
          fetchData()
        }}
        onSaveSuccess={handleSaveSuccess}
      />
    )
  }

  return (
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
              onChange={(e) => { pager.reset(); setSearchKeyword(e.target.value) }}
            />
            <button type="button" className="master-search-btn" onClick={() => fetchData()}>
              <span className="material-icons-round material-icon">search</span>
            </button>
          </div>
          <div className="master-filter-wrap">
            <label htmlFor="opname-warehouse-filter" className="master-filter-label">Warehouse</label>
            <select
              id="opname-warehouse-filter"
              className="master-filter-select"
              value={warehouseFilter}
              onChange={(e) => { pager.reset(); setWarehouseFilter(e.target.value) }}
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
              onChange={(e) => { pager.reset(); setStatusFilter(e.target.value) }}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="posted">Posted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="master-filter-wrap">
            <label htmlFor="opname-type-filter" className="master-filter-label">Tipe</label>
            <select
              id="opname-type-filter"
              className="master-filter-select"
              value={typeFilter}
              onChange={(e) => { pager.reset(); setTypeFilter(e.target.value) }}
            >
              <option value="all">All Type</option>
              <option value="opening">Opening</option>
              <option value="regular">Regular</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="master-error">{error}</div>}

      <div className="master-table-wrapper" ref={tableRef} tabIndex={0}>
        <div className="master-table-container">
          <table className="master-table">
            <MasterTableHeader columns={TABLE_COLUMNS} sortConfig={sortConfig} onSort={handleSort} />
            <tbody>
              {sortedData.map((row, index) => {
                const statusMeta = getOpnameStatusMeta(row.status)
                const typeMeta = getOpnameTypeMeta(row.is_opening)
                return (
                  <tr
                    key={row.id || index}
                    className={selectedId === row.id ? 'master-row-selected' : 'master-row'}
                    onClick={() => handleSelect(row)}
                    onDoubleClick={() => handleViewDetail(row)}
                  >
                    <td className="text-right">{offset + index + 1}</td>
                    <td>{formatDate(row.opname_date)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span>{row.opname_number || row.reference || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          width: 'fit-content',
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          background: typeMeta.background,
                          color: typeMeta.color,
                          border: typeMeta.border,
                        }}
                      >
                        {typeMeta.label}
                      </span>
                    </td>
                    <td>{row.warehouse?.name || row.warehouse_name || '-'}</td>
                    <td>{row.notes || '-'}</td>
                    <td>{row.username || row.user_id || '-'}</td>
                    <td className="text-right">{formatCurrency(row.total_selisih || 0)}</td>
                    <td className="text-center">
                      <div className="purchase-status-stack">
                        <span className={`purchase-status-pill is-${statusMeta.variant}`}>
                          <span className="material-icons-round purchase-status-icon">{statusMeta.icon}</span>
                          {statusMeta.label}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!isLoading && sortedData.length === 0 && (
                <tr><td colSpan={9} className="text-center">No data</td></tr>
              )}
            </tbody>
          </table>
          <div className="master-table-sticky-footer purchase-table-summary">
            <div className="purchase-table-summary-left">
              <div className="purchase-summary-item">
                <p>Total Opname</p>
                <strong>{totalOpname}</strong>
              </div>
              <div className="purchase-summary-item is-draft">
                <p>Draft</p>
                <strong>{draftCount}</strong>
              </div>
              <div className="purchase-summary-item is-approved">
                <p>Approved</p>
                <strong>{approvedCount}</strong>
              </div>
            </div>
            <div className="purchase-table-summary-right">
              <p>Total Stock Opname</p>
              <div className="purchase-total-value">
                <span className="purchase-total-currency">Rp</span>
                <strong>{formatNumber(summaryTotalAmount)}</strong>
              </div>
            </div>
          </div>
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
        isAllRecords={pager.isAllRecords}
        onToggleAllRecords={pager.toggleAllRecords}
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
