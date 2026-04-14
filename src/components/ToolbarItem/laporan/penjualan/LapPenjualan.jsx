import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../../shared/auth'
import { listSales, getSaleById } from '../../../../features/laporan/penjualan/penjualan.api'
import { useMasterTableSort } from '../../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../../hooks/useMasterPagination'
import { PenjualanDetailModal } from './PenjualanDetailModal'
import { listWarehouses } from '../../../../features/master/warehouse/warehouse.api'

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false },
  { key: 'sale_number', label: 'NO. NOTA' },
  { key: 'customer_name', label: 'KONSUMEN' },
  { key: 'cashier_name', label: 'KASIR' },
  { key: 'warehouse_name', label: 'GUDANG' },
  { key: 'total', label: 'TOTAL' },
  { key: 'status', label: 'STATUS' },
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

function getDateKey(dateStr) {
  if (!dateStr) return 'Unknown'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return 'Unknown'
  }
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function getStatusLabel(status) {
  const labels = {
    OPEN: 'Open',
    COMPLETED: 'Selesai',
    VOID: 'Batal',
    HOLD: 'Tunda',
  }
  return labels[status] || status || '-'
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

export function LapPenjualan({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [sales, setSales] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [warehouses, setWarehouses] = useState([])

  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null, isLoading: false })

  const [filters, setFilters] = useState({
    datePreset: 'month',
    date_from: '',
    date_to: '',
    status: 'all',
    warehouse_id: '',
    search: '',
  })

  const pager = useMasterPagination({ initialLimit: 50, total: 0 })
  const { limit, offset, total, setOffset, setTotal, setPagination } = pager
  const { sort, setSort } = useMasterTableSort()

  const buildFilters = useCallback(() => {
    const f = { ...filters }
    if (filters.datePreset !== 'custom') {
      const range = getDateRange(filters.datePreset)
      f.date_from = range.date_from
      f.date_to = range.date_to
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
      setSales([])
      setTotal(0)
      setPagination((p) => ({ ...p, total: 0, hasMore: false }))
      setIsLoading(false)
      return
    }

    const f = buildFilters()
    const result = await listSales({ ...f, limit, offset }, token)

    if (result.success) {
      setSales(result.data || [])
      setTotal(result.total || 0)
      setPagination((p) => ({ ...p, total: result.total || 0, hasMore: result.total > offset + limit }))
    } else {
      setError(result.message || 'Failed to fetch sales')
      setSales([])
    }
    setIsLoading(false)
  }, [buildFilters, limit, offset, token, setTotal, setPagination])

  const fetchDetail = useCallback(async (id) => {
    if (!token) return
    setDetailModal((d) => ({ ...d, isLoading: true }))
    const result = await getSaleById(id, token)
    if (result.success) {
      setDetailModal({ isOpen: true, data: result.data, isLoading: false })
    } else {
      setDetailModal({ isOpen: false, data: null, isLoading: false })
    }
  }, [token])

  const fetchWarehouses = useCallback(async () => {
    if (!token) {
      setWarehouses([])
      return
    }
    const result = await listWarehouses(token, {})
    if (result.success) {
      setWarehouses(result.data || [])
    }
  }, [token])

  useEffect(() => {
    fetchData()
    fetchWarehouses()
  }, [fetchData, fetchWarehouses])

  const groupedSales = useMemo(() => {
    const groups = {}
    sales.forEach((sale) => {
      const dateKey = getDateKey(sale.created_at)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(sale)
    })
    return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]))
  }, [sales])

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }))
  }

  const handleApplyFilters = () => {
    setOffset(0)
    fetchData()
  }

  const handleRowClick = (sale) => {
    fetchDetail(sale.id)
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
    <div className="master-container">
      <div className="master-header">
        <h1 className="master-title">Laporan Penjualan</h1>
        <button type="button" className="master-exit-btn" onClick={onExit}>
          <span className="material-icons-round">close</span>
        </button>
      </div>

      <div className="master-filter-bar">
        <div className="master-filter-row">
          <div className="master-filter-group">
            <label className="master-filter-label">Tanggal</label>
            <select
              className="form-select"
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
                  className="form-input"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                />
              </div>
              <div className="master-filter-group">
                <label className="master-filter-label">Sampai</label>
                <input
                  type="date"
                  className="form-input"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                />
              </div>
            </>
          )}

          <div className="master-filter-group">
            <label className="master-filter-label">Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">Semua</option>
              <option value="COMPLETED">Selesai</option>
              <option value="VOID">Batal</option>
              <option value="HOLD">Tunda</option>
            </select>
          </div>

          <div className="master-filter-group">
            <label className="master-filter-label">Gudang</label>
            <select
              className="form-select"
              value={filters.warehouse_id}
              onChange={(e) => handleFilterChange('warehouse_id', e.target.value)}
            >
              <option value="">Semua</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="master-filter-btn"
            onClick={handleApplyFilters}
          >
            Terapkan
          </button>
        </div>
      </div>

      <div className="master-table-container">
        {isLoading ? (
          <div className="master-loading">
            <span className="material-icons-round animate-spin">sync</span>
            <span>Loading...</span>
          </div>
        ) : error ? (
          <div className="master-error">
            <span className="material-icons-round material-icon red">error</span>
            <span>{error}</span>
          </div>
        ) : (
          <>
            {groupedSales.map(([dateKey, dateSales]) => (
              <div key={dateKey} className="master-date-group">
                <div className="master-date-header">{formatDisplayDate(dateKey)}</div>
                <table className="master-table">
                  <thead>
                    <tr>
                      {TABLE_COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          onClick={() => col.sortable !== false && setSort(col.key)}
                          className={col.sortable !== false ? 'sortable' : ''}
                        >
                          {col.label}
                          {sort.key === col.key && (
                            <span className="material-icons-round sort-icon">
                              {sort.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dateSales.length > 0 ? (
                      dateSales.map((sale, idx) => (
                        <tr
                          key={sale.id}
                          onClick={() => handleRowClick(sale)}
                          className="clickable"
                        >
                          <td>{offset + idx + 1}</td>
                          <td>{sale.sale_number}</td>
                          <td>{sale.customer_name || '-'}</td>
                          <td>{sale.cashier_name || '-'}</td>
                          <td>{sale.warehouse_name || '-'}</td>
                          <td className="text-right">{formatCurrency(sale.total_amount)}</td>
                          <td>
                            <span className={`status-badge status-${sale.status?.toLowerCase()}`}>
                              {getStatusLabel(sale.status)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={TABLE_COLUMNS.length} className="text-center">
                          No data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="master-footer">
        <div className="master-footer-left">
          <span className="master-total-records">
            Total: {total} records
          </span>
        </div>
        <div className="master-footer-right">
          <button
            type="button"
            className="master-footer-btn"
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
          >
            <span className="material-icons-round">chevron_left</span>
          </button>
          <span className="master-page-info">
            {Math.floor(offset / limit) + 1} / {Math.ceil(total / limit) || 1}
          </span>
          <button
            type="button"
            className="master-footer-btn"
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
          >
            <span className="material-icons-round">chevron_right</span>
          </button>
        </div>
      </div>

      <PenjualanDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, date: null, isLoading: false })}
        data={detailModal.data}
        isLoading={detailModal.isLoading}
        error={null}
      />
    </div>
  )
}