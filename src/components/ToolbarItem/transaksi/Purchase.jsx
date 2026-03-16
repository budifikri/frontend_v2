import { useCallback, useEffect, useState, useRef } from 'react'
import { useAuth } from '../../../shared/auth'
import { listPurchases, deletePurchase } from '../../../features/transaksi/purchase/purchase.api'
import { FooterMaster } from '../footer/FooterMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'
import { PurchaseDetail } from './PurchaseDetail'
import { Toast } from '../../Toast'

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false, width: '50px' },
  { key: 'po_number', label: 'PO NUMBER', sortable: true },
  { key: 'supplier_name', label: 'SUPPLIER', sortable: true },
  { key: 'warehouse_name', label: 'WAREHOUSE', sortable: true },
  { key: 'po_date', label: 'DATE', sortable: true, width: '120px' },
  { key: 'status', label: 'STATUS PO', sortable: true },
  { key: 'status_receive', label: 'STATUS RECEIVE', sortable: true },
  { key: 'grand_total', label: 'TOTAL', sortable: true },
]

const DUMMY_PURCHASES = [
  {
    id: 'PO001',
    po_number: 'PO-20260307-001',
    supplier_name: 'PT. Supplier Utama',
    warehouse_name: 'Gudang Utama',
    po_date: '2026-03-07T10:00:00Z',
    status: 'draft',
    status_receive: 'draft',
    grand_total: 1110000,
  },
]

function getStatusBadgeClass(status) {
  const statusLower = status?.toLowerCase()
  
  // Handle STATUS PO enum: draft, approve, pending
  if (statusLower === 'draft') return 'status-badge-pending'
  if (statusLower === 'approve') return 'status-badge-approved'
  if (statusLower === 'approved') return 'status-badge-approved'
  if (statusLower === 'pending') return 'status-badge-approved'
  
  // Handle STATUS RECEIVE enum: draft, reject, receive
  if (statusLower === 'reject') return 'status-badge-rejected'
  if (statusLower === 'receive') return 'status-badge-posted'
  
  // Fallback for old/legacy statuses
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

// Helper functions for date filter
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

export function Purchase({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [statusReceiveFilter, setStatusReceiveFilter] = useState('all')
  const pager = useMasterPagination({ initialLimit: 10, total: pagination.total, hasMore: pagination.has_more })
  const { limit, offset } = pager

  const [selectedId, setSelectedId] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  // Date filter state
  const [dateFilter, setDateFilter] = useState('this_month') // 'all', 'this_month', 'this_year', 'custom'
  const [showDateModal, setShowDateModal] = useState(false)
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const [customDateFrom, setCustomDateFrom] = useState(todayStr)
  const [customDateTo, setCustomDateTo] = useState(todayStr)

  // Toast state
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' })
  const fetchDataRef = useRef(false)

  const handleSaveSuccess = (message, type = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  const fetchData = useCallback(async (overrides = {}) => {
    setError('')
    setIsLoading(true)

    // Get date range from filter - use overrides if provided (for immediate refresh scenarios)
    const { date_from: df, date_to: dt } = getDateRange(dateFilter, customDateFrom, customDateTo)
    const date_from = overrides.date_from ?? df
    const date_to = overrides.date_to ?? dt
    // Use override status if provided (check with 'in' to distinguish undefined from not provided)
    // When status is 'all', we pass undefined to clear the filter
    const filterStatus = 'status' in overrides ? overrides.status : (statusFilter !== 'all' ? statusFilter : undefined)
    const filterStatusReceive = 'status_receive' in overrides ? overrides.status_receive : (statusReceiveFilter !== 'all' ? statusReceiveFilter : undefined)

    if (!token) {
      let items = [...DUMMY_PURCHASES]
      if (searchKeyword.trim()) {
        const keyword = searchKeyword.trim().toLowerCase()
        items = items.filter(item =>
          item.po_number.toLowerCase().includes(keyword) ||
          item.supplier_name.toLowerCase().includes(keyword)
        )
      }
      if (filterStatus) {
        items = items.filter(item => item.status === filterStatus)
      }
      if (filterStatusReceive) {
        items = items.filter(item => item.status_receive === filterStatusReceive)
      }
      // Apply date filter for dummy data
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
        status: filterStatus,
        status_receive: filterStatusReceive,
        date_from: date_from || undefined,
        date_to: date_to || undefined,
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
      setError(err.message || 'Failed to load purchases')
      setData([])
      setPagination({ total: 0, has_more: false })
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, statusFilter, statusReceiveFilter, dateFilter, customDateFrom, customDateTo, limit, offset])

  useEffect(() => {
    if (fetchDataRef.current) return
    fetchDataRef.current = true
    fetchData()
  }, [fetchData])

  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'po_date',
    direction: 'desc',
  })

  const totalAmount = sortedData.reduce((sum, row) => sum + (Number(row.grand_total) || 0), 0)

  const selectedItem = selectedId == null ? null : data.find((row) => row.id === selectedId) || null

  const handleSelect = (row) => setSelectedId(row.id)

  const handleViewDetail = useCallback(() => {
    const target = selectedItem || sortedData[0]
    if (!target) return
    setSelectedId(target.id)
    setShowDetail(true)
  }, [selectedItem, sortedData])

  const handleNew = useCallback(() => {
    setSelectedId(null)
    setShowDetail(true)
  }, [])

  const handleDeleteClick = useCallback(() => {
    if (selectedItem) {
      setShowDeleteConfirm(true)
    }
  }, [selectedItem])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showDeleteConfirm || showExitConfirm) return
      if (e.key === 'F2') {
        e.preventDefault()
        handleViewDetail()
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
  }, [showDeleteConfirm, showExitConfirm, handleViewDetail, handleDeleteClick, handleNew])

  const handleConfirmDelete = async () => {
    if (!selectedItem) {
      setShowDeleteConfirm(false)
      return
    }
    try {
      if (token) {
        await deletePurchase(token, selectedItem.id)
        await fetchData()
      } else {
        setData((prev) => prev.filter((row) => row.id !== selectedItem.id))
      }
      setShowDeleteConfirm(false)
      setSelectedId(null)
    } catch (err) {
      setError(err.message || 'Failed to delete purchase')
    }
  }

  const handlePrint = () => window.print()
  const handleExitClick = () => setShowExitConfirm(true)
  const handleConfirmExit = () => { setShowExitConfirm(false); onExit() }

  // Date filter handlers
  const handleDateFilterChange = (value) => {
    if (value === 'custom') {
      // Set default dates to today when opening custom date modal
      const today = new Date().toISOString().split('T')[0]
      setCustomDateFrom(today)
      setCustomDateTo(today)
      setShowDateModal(true)
    } else {
      // Clear custom dates when switching to non-custom filter
      setCustomDateFrom('')
      setCustomDateTo('')
      setDateFilter(value)
      // Manually trigger fetch since useEffect won't run due to fetchDataRef guard
      // Pass 'all' to getDateRange to get empty date range
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
    // Pass 'custom' directly to getDateRange since state hasn't updated yet
    const { date_from, date_to } = getDateRange('custom', customDateFrom, customDateTo)
    fetchData({ date_from, date_to })
  }

  const handleCancelDateModal = () => {
    // Revert to previous filter if modal is cancelled
    if (dateFilter === 'custom' && (!customDateFrom || !customDateTo)) {
      setDateFilter('this_month')
    }
    setShowDateModal(false)
  }

  // If showing detail view, render only that
  if (showDetail) {
    return (
      <PurchaseDetail
        selectedId={selectedId}
        onExit={() => {
          console.log('[Purchase.jsx] onExit called - closing detail view')
          setShowDetail(false)
          setSelectedId(null)
          console.log('[Purchase.jsx] Calling fetchData() to refresh list...')
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
        <h1 className="master-title">Purchase Orders</h1>
        <div className="master-header-filters">
          <div className="master-footer-search">
            <input
              type="text"
              placeholder="Search PO number or supplier..."
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
            <label htmlFor="purchase-date-filter" className="master-filter-label">Date</label>
            <select
              id="purchase-date-filter"
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
            <label htmlFor="purchase-status-filter" className="master-filter-label">Status PO</label>
            <select
              id="purchase-status-filter"
              className="master-filter-select"
              value={statusFilter}
              onChange={(e) => {
                const newStatus = e.target.value
                pager.reset()
                setStatusFilter(newStatus)
                // Always pass the new status value explicitly (use undefined for 'all')
                fetchData({ status: newStatus === 'all' ? undefined : newStatus })
              }}
            >
              <option value="all">All Status PO</option>
              <option value="draft">Draft</option>
              <option value="approved">Approve</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="master-filter-wrap">
            <label htmlFor="purchase-status-receive-filter" className="master-filter-label">Status Receive</label>
            <select
              id="purchase-status-receive-filter"
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
                  <td>{row.po_number || '-'}</td>
                  <td>{row.supplier_name || '-'}</td>
                  <td>{row.warehouse_name || '-'}</td>
                  <td>{formatDate(row.po_date)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(row.status)}`}>
                      {row.status || '-'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(row.status_receive)}`}>
                      {row.status_receive || '-'}
                    </span>
                  </td>
                  <td className="text-right">{formatCurrency(row.grand_total)}</td>
                </tr>
              ))}
              {!isLoading && sortedData.length === 0 && (
                <tr><td colSpan={8} className="text-center">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FooterMaster
        onNew={handleNew}
        onEdit={handleViewDetail}
        onDelete={handleDeleteClick}
        totalRow={pagination.total}
        totalAmount={totalAmount}
        totalAmountLabel="Purchase Order"
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
          itemName={selectedItem?.po_number || 'this record'}
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

      {showDateModal && (
        <div className="delete-master-overlay">
          <div className="delete-master-modal date-filter-modal">
            <div className="delete-master-header">
              <span className="material-icons-round material-icon red">calendar_today</span>
              <h2>Custom Date Range</h2>
            </div>
            <div className="delete-master-body">
              <div className="date-filter-group">
                <label htmlFor="date-from" className="master-form-label">From Date</label>
                <input
                  id="date-from"
                  type="date"
                  className="master-form-input date-input"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                />
              </div>
              <div className="date-filter-group">
                <label htmlFor="date-to" className="master-form-label">To Date</label>
                <input
                  id="date-to"
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
