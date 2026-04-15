import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../../shared/auth'
import { listPurchasesReport, getPurchaseDetail } from '../../../../features/laporan/pembelian/pembelian.api'
import { useMasterTableSort } from '../../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../../hooks/useMasterPagination'
import { PembelianDetailModal } from './PembelianDetailModal'
import { listWarehouses } from '../../../../features/master/warehouse/warehouse.api'
import { MasterTableHeader } from '../../table/MasterTableHeader'

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false },
  { key: 'po_number', label: 'NO. PO', sortable: true },
  { key: 'po_date', label: 'TANGGAL', sortable: true },
  { key: 'supplier_name', label: 'SUPPLIER', sortable: true },
  { key: 'warehouse_name', label: 'GUDANG', sortable: true },
  { key: 'grand_total', label: 'GRAND TOTAL', sortable: true },
  { key: 'status', label: 'STATUS', sortable: true },
]

function formatCurrency(value) {
  const num = Number(value) || 0
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function getStatusLabel(status) {
  return status || '-'
}

const DATE_PRESETS = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'week', label: 'Minggu Ini' },
  { value: 'month', label: 'Bulan Ini' },
  { value: 'year', label: 'Tahun Ini' },
  { value: 'custom', label: 'Pilih Tanggal' },
  { value: 'all', label: 'Semua' },
]

function getDateRange(preset) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case 'today':
      return {
        date_from: today.toISOString().split('T')[0],
        date_to: today.toISOString().split('T')[0],
      }
    case 'week': {
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      return {
        date_from: startOfWeek.toISOString().split('T')[0],
        date_to: endOfWeek.toISOString().split('T')[0],
      }
    }
    case 'month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return {
        date_from: startOfMonth.toISOString().split('T')[0],
        date_to: endOfMonth.toISOString().split('T')[0],
      }
    }
    case 'year': {
      const startOfYear = new Date(today.getFullYear(), 0, 1)
      const endOfYear = new Date(today.getFullYear(), 11, 31)
      return {
        date_from: startOfYear.toISOString().split('T')[0],
        date_to: endOfYear.toISOString().split('T')[0],
      }
    }
    default:
      return { date_from: '', date_to: '' }
  }
}

function getTodayDateValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function LapPembelian({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [purchases, setPurchases] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [warehouses, setWarehouses] = useState([])

  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null, isLoading: false })
  const [selectedId, setSelectedId] = useState(null)

  const [filters, setFilters] = useState({
    datePreset: 'month',
    date_from: '',
    date_to: '',
    status: 'all',
    warehouse_id: '',
    search: '',
  })

  const [pagination, setPagination] = useState({ total: 0, hasMore: false })
  const [summary, setSummary] = useState({ totalRows: 0, totalPembelian: 0 })
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)
  const [isAllRecords, setIsAllRecords] = useState(false)
  const [tooltipRow, setTooltipRow] = useState(null)
  const pager = useMasterPagination({ initialLimit: isAllRecords ? 10000 : 10, total: pagination.total, hasMore: pagination.hasMore })
  const { limit, offset, setOffset } = pager
  const { sortConfig, sortedData, handleSort } = useMasterTableSort(purchases, {
    initialKey: 'created_at',
    direction: 'desc',
    valueGetters: {
      grand_total: (row) => Number(row.grand_total) || 0,
      po_date: (row) => new Date(row.po_date || row.created_at || 0).getTime(),
      created_at: (row) => new Date(row.created_at || 0).getTime(),
    },
  })

  const buildFilters = useCallback(() => {
    const f = { ...filters }
    if (filters.datePreset !== 'custom' && filters.datePreset !== 'all') {
      const range = getDateRange(filters.datePreset)
      f.date_from = range.date_from
      f.date_to = range.date_to
    }
    if (filters.datePreset === 'all') {
      f.date_from = ''
      f.date_to = ''
    }
    if (filters.status === 'all') {
      delete f.status
    }
    if (!f.warehouse_id) {
      delete f.warehouse_id
    }
    if (!f.search) {
      delete f.search
    }
    return f
  }, [filters])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    if (!token) {
      setPurchases([])
      setPagination({ total: 0, hasMore: false })
      setIsLoading(false)
      return
    }

    const f = buildFilters()
    const result = await listPurchasesReport({ ...f, limit, offset }, token)

    if (result.success) {
      const purchasesData = Array.isArray(result.items)
        ? result.items
        : []
      const total = Number(
        result.pagination?.total
        ?? purchasesData.length
        ?? 0,
      )
      const hasMore = Boolean(
        result.pagination?.has_more
        ?? (total > offset + limit),
      )

      setPurchases(purchasesData)
      setPagination({ total, hasMore })
    } else {
      setError(result.message || 'Failed to fetch purchases')
      setPurchases([])
      setPagination({ total: 0, hasMore: false })
    }
    setIsLoading(false)
  }, [buildFilters, limit, offset, token])

  const fetchDetail = useCallback(async (id) => {
    if (!token) return
    setDetailModal((d) => ({ ...d, isLoading: true }))
    const result = await getPurchaseDetail(id, token)
    if (result.success) {
      setDetailModal({ isOpen: true, data: result.data, isLoading: false })
    } else {
      setDetailModal({ isOpen: false, data: null, isLoading: false })
    }
  }, [token])

  const fetchSummary = useCallback(async () => {
    setIsSummaryLoading(true)

    if (!token) {
      setSummary({ totalRows: 0, totalPembelian: 0 })
      setIsSummaryLoading(false)
      return
    }

    const f = buildFilters()
    const result = await listPurchasesReport({ ...f, limit: 10000, offset: 0 }, token)

    if (result.success) {
      const purchasesData = Array.isArray(result.items) ? result.items : []
      const totalPembelian = purchasesData.reduce((sum, p) => sum + (p.grand_total || 0), 0)
      setSummary({
        totalRows: result.pagination?.total || purchasesData.length,
        totalPembelian,
      })
    } else {
      setSummary({ totalRows: 0, totalPembelian: 0 })
    }

    setIsSummaryLoading(false)
  }, [buildFilters, token])

  const companyId = auth?.company_id

  const fetchWarehouses = useCallback(async () => {
    if (!token) {
      setWarehouses([])
      return
    }
    try {
      const result = await listWarehouses(token, {
        include_inactive: false,
        is_active: true,
        company_id: companyId,
      })
      setWarehouses(result.items || [])
    } catch (err) {
      console.error('Failed to fetch warehouses:', err)
    }
  }, [token, companyId])

  useEffect(() => {
    const timerId = setTimeout(() => {
      fetchData()
    }, 0)

    return () => clearTimeout(timerId)
  }, [fetchData])

  useEffect(() => {
    const timerId = setTimeout(() => {
      fetchWarehouses()
    }, 0)

    return () => clearTimeout(timerId)
  }, [fetchWarehouses])

  useEffect(() => {
    const timerId = setTimeout(() => {
      fetchSummary()
    }, 0)

    return () => clearTimeout(timerId)
  }, [fetchSummary])

  const handleFilterChange = (key, value) => {
    if (key === 'datePreset' && value === 'custom') {
      const today = getTodayDateValue()
      setFilters((f) => ({ ...f, datePreset: value, date_from: today, date_to: today }))
      setOffset(0)
      return
    }

    setFilters((f) => ({ ...f, [key]: value }))
    setOffset(0)
  }

  const handleRowClick = (purchase) => {
    setSelectedId(purchase.id)
    fetchDetail(purchase.id)
  }

  const handleToggleAllRecords = () => {
    const newValue = !isAllRecords
    setIsAllRecords(newValue)
    setOffset(0)
    setTimeout(() => fetchData(), 0)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleRefresh = () => {
    fetchData()
    fetchSummary()
  }

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      onExit()
    }
  }, [onExit])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="master-content lap-pembelian-content">
      <div className="master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Laporan Pembelian</h1>
        <div className="master-header-filters">
          <div className="master-filter-group">
            <label className="master-filter-label">Tanggal</label>
            <select
              className="master-filter-select"
              value={filters.datePreset}
              onChange={(e) => handleFilterChange('datePreset', e.target.value)}
            >
              {DATE_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {filters.datePreset === 'custom' && (
            <>
              <div className="master-filter-group">
                <label className="master-filter-label">Dari</label>
                <input
                  type="date"
                  className="master-filter-input"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                />
              </div>
              <div className="master-filter-group">
                <label className="master-filter-label">Sampai</label>
                <input
                  type="date"
                  className="master-filter-input"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                />
              </div>
            </>
          )}

          <div className="master-filter-group">
            <label className="master-filter-label">Status</label>
            <select
              className="master-filter-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">ALL</option>
              <option value="draft">DRAFT</option>
              <option value="pending">PENDING</option>
              <option value="approved">APPROVED</option>
              <option value="rejected">REJECTED</option>
              <option value="completed">COMPLETED</option>
              <option value="cancelled">CANCELLED</option>
            </select>
          </div>

          <div className="master-filter-group">
            <label className="master-filter-label">Gudang</label>
            <select
              className="master-filter-select"
              value={filters.warehouse_id}
              onChange={(e) => handleFilterChange('warehouse_id', e.target.value)}
            >
              <option value="">Semua</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="master-error">
          <span className="material-icons-round material-icon red">error</span>
          <span>{error}</span>
        </div>
      )}

      <div className="master-table-wrapper">
        <div className="master-table-container">
          <table className="master-table">
            <MasterTableHeader columns={TABLE_COLUMNS} sortConfig={sortConfig} onSort={handleSort} />
            <tbody>
              {sortedData.map((purchase, index) => (
                <tr
                  key={purchase.id || index}
                  className={selectedId === purchase.id ? 'master-row-selected' : 'master-row'}
                  onClick={() => setSelectedId(purchase.id)}
                  onDoubleClick={() => handleRowClick(purchase)}
                  onMouseEnter={() => setTooltipRow(index)}
                  onMouseLeave={() => setTooltipRow(null)}
                >
                  <td>{offset + index + 1}</td>
                  <td>{purchase.po_number || '-'}</td>
                  <td>{formatDate(purchase.po_date || purchase.created_at)}</td>
                  <td>{purchase.supplier_name || '-'}</td>
                  <td>{purchase.warehouse_name || '-'}</td>
                  <td className="text-right">{formatCurrency(purchase.grand_total)}</td>
                  <td style={{ position: 'relative' }}>
                    <span className={`status-badge status-${purchase.status?.toLowerCase()}`}>
                      {getStatusLabel(purchase.status)}
                    </span>
                    {tooltipRow === index && (
                      <div className="row-tooltip">
                        <span className="material-icons-round">lightbulb</span>
                        <span>Double click for info detail</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && sortedData.length === 0 && (
                <tr>
                  <td colSpan={TABLE_COLUMNS.length} className="text-center">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="stock-opname-summary">
        <span className="summary-title">Summary</span>
        <div className="summary-items">
          <span className="summary-divider"></span>
          <span className="summary-item summary-positive">
            TOTAL PEMBELIAN: <span className="summary-value">{isSummaryLoading ? '...' : formatCurrency(summary.totalPembelian)}</span>
          </span>
        </div>
      </div>

      <div className="master-footer">
        <div className="master-footer-actions">
          <button type="button" className="master-footer-btn" onClick={handlePrint} title="Print" aria-label="Print">
            <span className="material-icons-round master-footer-icon blue">print</span>
          </button>
          <button type="button" className="master-footer-btn" onClick={handleRefresh} disabled={isLoading || isSummaryLoading} title="Refresh" aria-label="Refresh">
            <span className="material-icons-round master-footer-icon green">refresh</span>
          </button>
          <button type="button" className="master-footer-btn" onClick={onExit} title="Exit" aria-label="Exit">
            <span className="material-icons-round master-footer-icon red">exit_to_app</span>
          </button>
        </div>

        <div className="master-footer-info">
          <label className="checkbox-all-records">
            <input
              type="checkbox"
              checked={isAllRecords}
              onChange={handleToggleAllRecords}
            />
            <span>All Records</span>
          </label>
          <span className="footer-divider">|</span>
          <span className="report-total-row">Total Row: {pagination.total}</span>
          {!isAllRecords && (
            <div className="master-footer-pagination">
              <button type="button" className="master-page-btn" onClick={pager.goFirst} disabled={!pager.canPrev}>|&lt;</button>
              <button type="button" className="master-page-btn" onClick={pager.goPrev} disabled={!pager.canPrev}>&lt;</button>
              <span className="master-page-info">Page {pager.page} of {pager.totalPages}</span>
              <button type="button" className="master-page-btn" onClick={pager.goNext} disabled={!pager.canNext}>&gt;</button>
              <button type="button" className="master-page-btn" onClick={pager.goLast} disabled={!pager.canNext}>&gt;|</button>
            </div>
          )}
        </div>
      </div>

      <PembelianDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, data: null, isLoading: false })}
        data={detailModal.data}
        isLoading={detailModal.isLoading}
        error={null}
      />
    </div>
  )
}
