import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../../shared/auth'
import { listSales, getSaleById } from './penjualan.api'
import { useMasterTableSort } from '../../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../../hooks/useMasterPagination'
import { PenjualanDetailModal } from './PenjualanDetailModal'
import { listWarehouses } from '../../master/warehouse/warehouse.api'
import { MasterTableHeader } from '../../../components/ToolbarItem/table/MasterTableHeader'

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false },
  { key: 'sale_number', label: 'NO. NOTA', sortable: true },
  { key: 'created_at', label: 'TANGGAL', sortable: true },
  { key: 'customer_name', label: 'KONSUMEN', sortable: true },
  { key: 'cashier_name', label: 'KASIR', sortable: true },
  { key: 'warehouse_name', label: 'GUDANG', sortable: true },
  { key: 'total', label: 'TOTAL', sortable: true },
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
  const labels = {
    OPEN: 'Open',
    COMPLETED: 'Selesai',
    VOID: 'Batal',
    HOLD: 'Tunda',
    DONE: 'Selesai',
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

  const pager = useMasterPagination({ initialLimit: 10, total: 0 })
  const { limit, offset, setOffset, goFirst, goPrev, goNext, goLast, page, totalPages, canPrev, canNext } = pager
  const [pagination, setPagination] = useState({ total: 0, hasMore: false })
  const { sortConfig, sortedData, handleSort } = useMasterTableSort(sales, {
    initialKey: 'created_at',
    direction: 'desc',
    valueGetters: {
      total: (row) => Number(row.total_amount) || 0,
      created_at: (row) => new Date(row.created_at || 0).getTime(),
    },
  })

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
      setPagination({ total: 0, hasMore: false })
      setIsLoading(false)
      return
    }

    const f = buildFilters()
    const result = await listSales({ ...f, limit, offset }, token)

    if (result.success) {
      const salesData = result.data || []
      setSales(salesData)
      setPagination({ total: result.total || salesData.length || 0, hasMore: (result.total || salesData.length) > offset + limit })
    } else {
      setError(result.message || 'Failed to fetch sales')
      setSales([])
    }
    setIsLoading(false)
  }, [buildFilters, limit, offset, token])

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
    try {
      const result = await listWarehouses(token, { 
        include_inactive: false,
        is_active: true,
        company_id: auth?.company_id 
      })
      setWarehouses(result.items || [])
    } catch (err) {
      console.error('Failed to fetch warehouses:', err)
    }
  }, [token, auth])

  useEffect(() => {
    fetchData()
    fetchWarehouses()
  }, [fetchData, fetchWarehouses])

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setOffset(0)
    fetchData()
  }

  const handleRowClick = (sale) => {
    fetchDetail(sale.id)
  }

  const handlePrint = () => {
    window.print()
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
      <div className="master-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh' }}>
        <div className="master-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="master-header">
            <div className="master-header-accent"></div>
            <h1 className="master-title">Laporan Penjualan</h1>
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
                <option value="all">Semua</option>
                <option value="COMPLETED">Selesai</option>
                <option value="VOID">Batal</option>
                <option value="HOLD">Tunda</option>
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
                {sortedData.map((sale, index) => (
                  <tr
                    key={sale.id || index}
                    className="master-row"
                    onClick={() => handleRowClick(sale)}
                  >
                    <td>{offset + index + 1}</td>
                    <td>{sale.sale_number || '-'}</td>
                    <td>{formatDate(sale.created_at)}</td>
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

        <div className="master-footer" style={{ marginTop: 'auto', position: 'sticky', bottom: 0, background: 'var(--bg-color)', zIndex: 10 }}>
          <div className="master-footer-actions">
            <button type="button" className="master-footer-btn" onClick={handlePrint} title="Print" aria-label="Print">
              <span className="material-icons-round master-footer-icon blue">print</span>
            </button>
            <button type="button" className="master-footer-btn" onClick={fetchData} disabled={isLoading} title="Refresh" aria-label="Refresh">
              <span className="material-icons-round master-footer-icon green">refresh</span>
            </button>
            <button type="button" className="master-footer-btn" onClick={onExit} title="Exit" aria-label="Exit">
              <span className="material-icons-round master-footer-icon red">exit_to_app</span>
            </button>
          </div>
          
          <div className="master-footer-info">
            <span className="report-total-row">Total Row: {pagination.total}</span>
            <div className="master-footer-pagination">
              <button type="button" className="master-page-btn" onClick={goFirst} disabled={!canPrev}>
                |&lt;
              </button>
              <button type="button" className="master-page-btn" onClick={goPrev} disabled={!canPrev}>
                &lt;
              </button>
              <span className="master-page-info">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="master-page-btn"
                onClick={goNext}
                disabled={!canNext}
              >
                &gt;
              </button>
              <button
                type="button"
                className="master-page-btn"
                onClick={goLast}
                disabled={!canNext}
              >
                 &gt;|
              </button>
            </div>
          </div>
        </div>

        <PenjualanDetailModal
          isOpen={detailModal.isOpen}
          onClose={() => setDetailModal({ isOpen: false, data: null, isLoading: false })}
          data={detailModal.data}
          isLoading={detailModal.isLoading}
          error={null}
        />
      </div>
    </div>
  )
}