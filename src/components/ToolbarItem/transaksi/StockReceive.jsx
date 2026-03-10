import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import { listPurchases } from '../../../features/transaksi/purchase/purchase.api'
import { FooterMaster } from '../footer/FooterMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'
import { PurchaseDetail } from './PurchaseDetail'
import { Toast } from '../../Toast'

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false, width: '50px' },
  { key: 'receive_number', label: 'RECEIVE NUMBER', sortable: true },
  { key: 'supplier_name', label: 'SUPPLIER', sortable: true },
  { key: 'warehouse_name', label: 'WAREHOUSE', sortable: true },
  { key: 'po_date', label: 'DATE', sortable: true, width: '120px' },
  { key: 'status_receive', label: 'STATUS RECEIVE', sortable: true },
  { key: 'grand_total', label: 'TOTAL', sortable: true },
]

const DUMMY_RECEIVES = [
  {
    id: 'RCV001',
    receive_number: 'RCV-20260307-001',
    po_number: 'PO-20260306-001',
    supplier_name: 'PT. Supplier Utama',
    warehouse_name: 'Gudang Utama',
    po_date: '2026-03-07T10:00:00Z',
    status: 'approved',
    status_receive: 'receive',
    grand_total: 1110000,
  },
]

function getStatusBadgeClass(status) {
  const statusLower = status?.toLowerCase()

  if (statusLower === 'draft') return 'status-badge-pending'
  if (statusLower === 'approve') return 'status-badge-approved'
  if (statusLower === 'pending') return 'status-badge-approved'

  if (statusLower === 'reject') return 'status-badge-rejected'
  if (statusLower === 'receive') return 'status-badge-posted'

  const legacyClasses = {
    approved: 'status-badge-posted',
    rejected: 'status-badge-rejected',
    cancelled: 'status-badge-rejected',
    completed: 'status-badge-posted',
  }
  return legacyClasses[statusLower] || 'status-badge-pending'
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

function getDateRange(filterType, customFrom, customTo) {
  const now = new Date()
  let date_from = ''
  let date_to = ''

  if (filterType === 'all') {
    return { date_from: '', date_to: '' }
  } else if (filterType === 'this_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    date_from = formatDateISO(firstDay)
    date_to = formatDateISO(lastDay)
  } else if (filterType === 'this_year') {
    const firstDay = new Date(now.getFullYear(), 0, 1)
    const lastDay = new Date(now.getFullYear(), 11, 31)
    date_from = formatDateISO(firstDay)
    date_to = formatDateISO(lastDay)
  } else if (filterType === 'custom' && customFrom && customTo) {
    date_from = formatDateISO(new Date(customFrom))
    date_to = formatDateISO(new Date(customTo))
  }

  return { date_from, date_to }
}

function formatDateISO(date) {
  if (!date || isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function StockReceive({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const FIXED_STATUS_PO = 'approved'

  const normalizeStatusPo = (value) => {
    const v = String(value || '').toLowerCase()
    if (v === 'approve') return 'approved'
    return v
  }

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusReceiveFilter, setStatusReceiveFilter] = useState('all')
  const pager = useMasterPagination({ initialLimit: 10, total: pagination.total, hasMore: pagination.has_more })
  const { limit, offset } = pager

  const [selectedId, setSelectedId] = useState(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  const [dateFilter, setDateFilter] = useState('this_month')
  const [showDateModal, setShowDateModal] = useState(false)
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const [customDateFrom, setCustomDateFrom] = useState(todayStr)
  const [customDateTo, setCustomDateTo] = useState(todayStr)

  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' })
  const fetchDataRef = useRef(false)

  const handleSaveSuccess = (message, type = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  const fetchData = useCallback(async (overrides = {}) => {
    setError('')
    setIsLoading(true)

    const { date_from: df, date_to: dt } = getDateRange(dateFilter, customDateFrom, customDateTo)
    const date_from = overrides.date_from ?? df
    const date_to = overrides.date_to ?? dt
    const filterStatusReceive = 'status_receive' in overrides
      ? overrides.status_receive
      : (statusReceiveFilter !== 'all' ? statusReceiveFilter : undefined)

    if (!token) {
      let items = [...DUMMY_RECEIVES]
      if (searchKeyword.trim()) {
        const keyword = searchKeyword.trim().toLowerCase()
        items = items.filter(item =>
          String(item.receive_number || item.po_number || '').toLowerCase().includes(keyword) ||
          String(item.supplier_name || '').toLowerCase().includes(keyword)
        )
      }

      items = items.filter(item => normalizeStatusPo(item.status) === FIXED_STATUS_PO)
      if (filterStatusReceive) {
        items = items.filter(item => String(item.status_receive || '').toLowerCase() === String(filterStatusReceive).toLowerCase())
      }

      if (date_from && date_to) {
        const from = new Date(date_from)
        const to = new Date(date_to)
        items = items.filter(item => {
          const itemDate = new Date(item.po_date)
          return itemDate >= from && itemDate <= to
        })
      }
      const total = items.length
      const sliced = items.slice(offset, offset + limit)
      setData(sliced)
      setPagination({ total, has_more: offset + limit < total })
      setIsLoading(false)
      return
    }

    try {
      const result = await listPurchases(token, {
        search: searchKeyword.trim() || undefined,
        status: FIXED_STATUS_PO,
        status_receive: filterStatusReceive,
        date_from: date_from || undefined,
        date_to: date_to || undefined,
        limit,
        offset,
      })
      const items = (result.items || []).map((row) => ({
        ...row,
        receive_number: row.receive_number || row.receiveNumber || row.po_number,
      }))
      setData(items)
      const nextPagination = result.pagination || {}
      setPagination({
        total: Number(nextPagination.total ?? 0),
        has_more: Boolean(nextPagination.has_more),
      })
    } catch (err) {
      setError(err.message || 'Failed to load stock receives')
      setData([])
      setPagination({ total: 0, has_more: false })
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, statusReceiveFilter, dateFilter, customDateFrom, customDateTo, limit, offset])

  useEffect(() => {
    if (fetchDataRef.current) return
    fetchDataRef.current = true
    fetchData()
  }, [fetchData])

  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'po_date',
    direction: 'desc',
  })

  const selectedItem = selectedId == null ? null : data.find((row) => row.id === selectedId) || null

  const handleSelect = (row) => setSelectedId(row.id)

  const handleViewDetail = useCallback(() => {
    const target = selectedItem || sortedData[0]
    if (!target) return
    setSelectedId(target.id)
    setShowDetail(true)
  }, [selectedItem, sortedData])

  const handlePrint = () => window.print()
  const handleExitClick = () => setShowExitConfirm(true)
  const handleConfirmExit = () => { setShowExitConfirm(false); onExit() }

  const handleDateFilterChange = (value) => {
    if (value === 'custom') {
      const today = new Date().toISOString().split('T')[0]
      setCustomDateFrom(today)
      setCustomDateTo(today)
      setShowDateModal(true)
    } else {
      setCustomDateFrom('')
      setCustomDateTo('')
      setDateFilter(value)
      const { date_from, date_to } = getDateRange(value, '', '')
      fetchData({ date_from, date_to })
      pager.reset()
    }
  }

  const handleApplyCustomDate = () => {
    if (!customDateFrom || !customDateTo) {
      setToast({ isOpen: true, message: 'Please select both from and to dates', type: 'info' })
      return
    }
    const from = new Date(customDateFrom)
    const to = new Date(customDateTo)
    if (from > to) {
      setToast({ isOpen: true, message: 'From date must be before to date', type: 'info' })
      return
    }
    setShowDateModal(false)
    setDateFilter('custom')
    pager.reset()
    const { date_from, date_to } = getDateRange('custom', customDateFrom, customDateTo)
    fetchData({ date_from, date_to })
  }

  const handleCancelDateModal = () => {
    if (dateFilter === 'custom' && (!customDateFrom || !customDateTo)) {
      setDateFilter('this_month')
    }
    setShowDateModal(false)
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showExitConfirm) return
      if (e.key === 'F2') {
        e.preventDefault()
        handleViewDetail()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setShowExitConfirm(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showExitConfirm, handleViewDetail])

  if (showDetail) {
    return (
      <PurchaseDetail
        selectedId={selectedId}
        onExit={() => {
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
        <h1 className="master-title">Stock Receive</h1>
        <div className="master-header-filters">
          <div className="master-footer-search">
            <input
              type="text"
              placeholder="Search Receive Number..."
              className="master-search-input"
              value={searchKeyword}
              onChange={(e) => { pager.reset(); setSearchKeyword(e.target.value) }}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchData() }}
            />
            <button type="button" className="master-search-btn" onClick={() => fetchData()}>
              <span className="material-icons-round material-icon">search</span>
            </button>
          </div>

          <div className="master-filter-wrap">
            <label htmlFor="stock-receive-date-filter" className="master-filter-label">Date</label>
            <select
              id="stock-receive-date-filter"
              className="master-filter-select"
              value={dateFilter}
              onChange={(e) => handleDateFilterChange(e.target.value)}
            >
              <option value="all">All Dates</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="master-filter-wrap">
            <label htmlFor="stock-receive-status-receive-filter" className="master-filter-label">Status Receive</label>
            <select
              id="stock-receive-status-receive-filter"
              className="master-filter-select"
              value={statusReceiveFilter}
              onChange={(e) => {
                const newStatus = e.target.value
                pager.reset()
                setStatusReceiveFilter(newStatus)
                fetchData({ status_receive: newStatus === 'all' ? undefined : newStatus })
              }}
            >
              <option value="all">All Status Receive</option>
              <option value="draft">Draft</option>
              <option value="reject">Reject</option>
              <option value="receive">Receive</option>
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
                  onDoubleClick={() => handleViewDetail()}
                >
                  <td>{offset + index + 1}</td>
                  <td>{row.receive_number || row.po_number || '-'}</td>
                  <td>{row.supplier_name || '-'}</td>
                  <td>{row.warehouse_name || '-'}</td>
                  <td>{formatDate(row.po_date)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(row.status_receive)}`}>
                      {row.status_receive || '-'}
                    </span>
                  </td>
                  <td className="text-right">{formatCurrency(row.grand_total)}</td>
                </tr>
              ))}
              {!isLoading && sortedData.length === 0 && (
                <tr><td colSpan={7} className="text-center">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FooterMaster
        showNew={false}
        showDelete={false}
        onNew={() => {}}
        onEdit={handleViewDetail}
        onDelete={() => {}}
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

      {showDateModal && (
        <div className="delete-master-overlay">
          <div className="delete-master-modal date-filter-modal">
            <div className="delete-master-header">
              <span className="material-icons-round material-icon red">calendar_today</span>
              <h2>Custom Date Range</h2>
            </div>
            <div className="delete-master-body">
              <div className="date-filter-group">
                <label htmlFor="stock-receive-date-from" className="master-form-label">From Date</label>
                <input
                  id="stock-receive-date-from"
                  type="date"
                  className="master-form-input date-input"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                />
              </div>
              <div className="date-filter-group">
                <label htmlFor="stock-receive-date-to" className="master-form-label">To Date</label>
                <input
                  id="stock-receive-date-to"
                  type="date"
                  className="master-form-input date-input"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="delete-master-footer">
              <button
                type="button"
                className="master-btn-cancel-secondary"
                onClick={handleCancelDateModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="master-btn-save-primary"
                onClick={handleApplyCustomDate}
              >
                <span className="material-icons-round">check</span>
                Apply
              </button>
            </div>
          </div>
        </div>
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
