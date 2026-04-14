import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../../shared/auth'
import { getCashDrawers, getCashDrawerSummary } from '../../../../features/laporan/cash-drawer/cashDrawer.api'
import { getCurrentCompany } from '../../../../features/master/company/company.api'
import { openReportPrintWindow } from '../../../../utils/reportPrint'
import { useMasterTableSort } from '../../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../../hooks/useMasterPagination'
import { MasterTableHeader } from '../../table/MasterTableHeader'
import { CashDrawerDetailModal } from './CashDrawerDetailModal'

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false },
  { key: 'open_date', label: 'TANGGAL BUKA' },
  { key: 'close_date', label: 'TANGGAL TUTUP' },
  { key: 'status', label: 'STATUS' },
  { key: 'opening_balance', label: 'SALDO AWAL' },
  { key: 'theoretical_balance', label: 'SALDO AKHIR' },
  { key: 'difference', label: 'SELISIH' },
  { key: 'cashier_name', label: 'NAMA KASIR' },
  { key: 'warehouse_name', label: 'NAMA WAREHOUSE' },
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
  if (!dateStr || dateStr === '-') return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export function LapCashDrawer({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [datePreset, setDatePreset] = useState('TODAY')
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

  const getDateRange = (preset) => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    switch (preset) {
      case 'TODAY':
        return { from: now.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
      case 'THISMONTH':
        const firstDay = new Date(y, m, 1)
        const lastDay = new Date(y, m + 1, 0)
        return { from: firstDay.toISOString().split('T')[0], to: lastDay.toISOString().split('T')[0] }
      case 'THISYEAR':
        return { from: `${y}-01-01`, to: `${y}-12-31` }
      case 'CUSTOM':
        return { from: dateFrom, to: dateFrom }
      case 'ALL':
      default:
        return { from: '', to: '' }
    }
  }

  const handleDatePresetChange = (preset) => {
    setDatePreset(preset)
    pager.reset()
    if (preset === 'ALL') {
      setDateFrom('')
      setDateTo('')
    } else {
      const range = getDateRange(preset)
      if (preset !== 'CUSTOM') {
        setDateFrom(range.from)
        setDateTo(range.to)
      }
    }
  }

  const handleDateFromChange = (value) => {
    pager.reset()
    setDateFrom(value)
    setDatePreset('CUSTOM')
  }

  const [selectedId, setSelectedId] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  const pager = useMasterPagination({ initialLimit: 10, total: pagination.total, hasMore: pagination.has_more })
  const { limit, offset } = pager

  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'open_date',
    valueGetters: {
      open_date: (row) => new Date(row.open_date || 0).getTime(),
      close_date: (row) => new Date(row.close_date || 0).getTime(),
      opening_balance: (row) => Number(row.opening_balance || 0),
      
      theoretical_balance: (row) => Number(row.theoretical_balance || 0),
      difference: (row) => Number(row.difference || 0),
    },
  })

  const fetchData = useCallback(async () => {
    setError('')
    setIsLoading(true)

    const dateRange = getDateRange(datePreset)
    const finalFrom = dateRange.from
    const finalTo = dateRange.to

    console.log('[LapCashDrawer] fetchData - datePreset:', datePreset)
    console.log('[LapCashDrawer] fetchData - finalFrom:', finalFrom)
    console.log('[LapCashDrawer] fetchData - finalTo:', finalTo)

    try {
      const result = await getCashDrawers(token, {
        search: searchKeyword.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        date_from: finalFrom || undefined,
        date_to: finalTo || undefined,
        limit,
        offset,
      })

      setData(result.items || [])
      const nextPagination = result.pagination || {}
      setPagination({
        total: nextPagination.total ?? 0,
        has_more: Boolean(nextPagination.has_more),
      })
    } catch {
      setData([])
      setPagination({ total: 0, has_more: false })
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, statusFilter, dateFrom, dateTo, limit, offset])

  const fetchDetail = useCallback(async (drawerId) => {
    setDetailError('')
    setDetailLoading(true)
    setDetailData(null)

    try {
      console.log('[LapCashDrawer] fetchDetail - drawerId:', drawerId, 'token:', token ? 'exists' : 'missing')
      const result = await getCashDrawerSummary(token, drawerId)
      console.log('[LapCashDrawer] fetchDetail - result:', result)
      setDetailData(result)
    } catch (err) {
      console.log('[LapCashDrawer] fetchDetail - error:', err)
      setDetailError(err.message || 'Failed to load cash drawer detail')
    } finally {
      setDetailLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (sortedData.length > 0 && !selectedId) {
      setSelectedId(sortedData[0].id)
    }
  }, [sortedData, selectedId])

  const handleSearchChange = (value) => {
    pager.reset()
    setSearchKeyword(value)
  }

  const handleStatusFilter = (value) => {
    pager.reset()
    setStatusFilter(value)
  }

  const handleRowClick = (row) => {
    setSelectedId(row.id)
  }

  const handleRowDoubleClick = (row) => {
    setSelectedId(row.id)
    fetchDetail(row.id)
    setShowDetailModal(true)
  }

  const handleOpenDetail = () => {
    if (selectedRow) {
      fetchDetail(selectedRow.id)
      setShowDetailModal(true)
    }
  }

  const handlePrint = async () => {
    try {
      const companyInfo = { name: '', address: '', phone: '' };
      if (token) {
        const res = await getCurrentCompany(token);
        if (res?.data) {
          companyInfo.name = res.data.nama || res.data.name || auth.companyName || '';
          companyInfo.address = res.data.address || '';
          companyInfo.phone = res.data.telp || res.data.phone || '';
        }
      }

      const printColumns = [
        { key: 'no', label: 'NO', align: 'text-center', formatter: (_, __, index) => index + 1 },
        { key: 'open_date', label: 'TGL BUKA', formatter: (v) => formatDate(v) },
        { key: 'close_date', label: 'TGL TUTUP', formatter: (v) => formatDate(v) },
        { key: 'status', label: 'STATUS', align: 'text-center' },
        { key: 'opening_balance', label: 'SALDO AWAL', align: 'text-right', formatter: (v) => formatCurrency(v) },
        { key: 'theoretical_balance', label: 'S. AKHIR', align: 'text-right', formatter: (v) => formatCurrency(v) },
        { key: 'difference', label: 'SELISIH', align: 'text-right', formatter: (v) => formatCurrency(v) },
        { key: 'cashier_name', label: 'KASIR' },
        { key: 'warehouse_name', label: 'GUDANG' },
      ];

      const printData = sortedData.map((item, index) => ({
        ...item,
        no: index + 1
      }));

      openReportPrintWindow({
        title: 'Laporan Cash Drawer',
        company: companyInfo,
        meta: { 
          date: new Date().toLocaleString('id-ID'), 
          user: auth.username || 'Admin' 
        },
        columns: printColumns,
        data: printData,
        footerText: `Laporan Kas per tanggal ${new Date().toLocaleDateString('id-ID')}`,
      });
    } catch (err) {
      console.error('Print error:', err);
      alert('Gagal mencetak laporan: ' + err.message);
    }
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setDetailData(null)
    setDetailError('')
  }

  const selectedRow = sortedData.find((row) => row.id === selectedId)

  return (
    <div className="master-content">
      <div className="master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Laporan Cash Drawer</h1>
        <div className="master-header-filters">
          <div className="master-footer-search">
            <input
              type="text"
              placeholder="Search..."
              className="master-search-input"
              value={searchKeyword}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <button type="button" className="master-search-btn">
              <span className="material-icons-round material-icon">search</span>
            </button>
          </div>
          <select
            className="master-filter-select"
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="OPEN">OPEN</option>
            <option value="CLOSED">CLOSED</option>
          </select>
          <select
            className="master-filter-select"
            value={datePreset}
            onChange={(e) => handleDatePresetChange(e.target.value)}
          >
            <option value="TODAY">TODAY</option>
            <option value="THISMONTH">THIS MONTH</option>
            <option value="THISYEAR">THIS YEAR</option>
            <option value="CUSTOM">CUSTOM</option>
            <option value="ALL">ALL DATA</option>
          </select>
          {datePreset === 'CUSTOM' && (
            <input
              type="date"
              className="master-filter-input"
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              placeholder="Pilih tanggal"
            />
          )}
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
                  onClick={() => handleRowClick(row)}
                  onDoubleClick={() => handleRowDoubleClick(row)}
                >
                  <td>{offset + index + 1}</td>
                  <td>{formatDate(row.open_date)}</td>
                  <td>{formatDate(row.close_date)}</td>
                  <td>
                    <span className={`status-badge status-${row.status}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="text-right">{formatCurrency(row.opening_balance)}</td>
                  <td className="text-right">{formatCurrency(row.theoretical_balance)}</td>
                  <td className={`text-right ${Number(row.difference) !== 0 ? 'text-red' : ''}`}>
                    {formatCurrency(row.difference)}
                  </td>
                  <td>{row.cashier_name || '-'}</td>
                  <td>{row.warehouse_name || '-'}</td>
                </tr>
              ))}
              {!isLoading && sortedData.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="master-footer">
        <div className="master-footer-actions">
           <button type="button" className="master-footer-btn" onClick={handlePrint} title="Print" aria-label="Print">
             <span className="material-icons-round master-footer-icon blue">print</span>
           </button>

          <button type="button" className="master-footer-btn" onClick={handleOpenDetail} disabled={!selectedRow} title="Detail" aria-label="Detail">
            <span className="material-icons-round master-footer-icon orange">description</span>
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
            <button type="button" className="master-page-btn" onClick={pager.goFirst} disabled={!pager.canPrev}>|&lt;</button>
            <button type="button" className="master-page-btn" onClick={pager.goPrev} disabled={!pager.canPrev}>&lt;</button>
            <span className="master-page-info">Page {pager.page} of {pager.totalPages}</span>
            <button type="button" className="master-page-btn" onClick={pager.goNext} disabled={!pager.canNext}>&gt;</button>
            <button type="button" className="master-page-btn" onClick={pager.goLast} disabled={!pager.canNext}>&gt;|</button>
          </div>
        </div>
      </div>

      <CashDrawerDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        data={detailData}
        isLoading={detailLoading}
        error={detailError}
      />
    </div>
  )
}