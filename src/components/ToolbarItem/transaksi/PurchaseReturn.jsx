import { useCallback, useEffect, useState, useRef } from 'react'
import { useAuth } from '../../../shared/auth'
import { listPurchaseReturns, deletePurchaseReturn } from '../../../features/transaksi/purchase-return/purchaseReturn.api'
import { FooterMaster } from '../footer/FooterMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'
import { PurchaseReturnDetail } from './PurchaseReturnDetail'
import { Toast } from '../../Toast'

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false, width: '50px' },
  { key: 'pr_number', label: 'RETURN NUMBER', sortable: true },
  { key: 'supplier_name', label: 'SUPPLIER', sortable: true },
  { key: 'warehouse_name', label: 'WAREHOUSE', sortable: true },
  { key: 'pr_date', label: 'DATE', sortable: true, width: '120px' },
  { key: 'status', label: 'STATUS', sortable: true },
  { key: 'grand_total', label: 'TOTAL', sortable: true },
]

const DUMMY_PURCHASE_RETURNS = [
  {
    id: 'PR001',
    pr_number: 'PR-20260315-001',

    supplier_name: 'PT. Supplier Utama',
    warehouse_name: 'Gudang Utama',
    pr_date: '2026-03-15T10:00:00Z',
    status: 'draft',
    grand_total: 150000,
  },
]

function getStatusBadgeClass(status) {
  const statusLower = status?.toLowerCase()
  
  if (statusLower === 'draft') return 'status-badge-pending'
  if (statusLower === 'approved') return 'status-badge-approved'
  if (statusLower === 'done' || statusLower === 'completed') return 'status-badge-posted'
  if (statusLower === 'rejected') return 'status-badge-rejected'
  
  return 'status-badge-pending'
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

export function PurchaseReturn({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const pager = useMasterPagination({ initialLimit: 10, total: pagination.total, hasMore: pagination.has_more })

  const [selectedId, setSelectedId] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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
    const filterStatus = 'status' in overrides ? overrides.status : (statusFilter !== 'all' ? statusFilter : undefined)

    if (!token) {
      let items = [...DUMMY_PURCHASE_RETURNS]
      if (searchKeyword.trim()) {
        const keyword = searchKeyword.trim().toLowerCase()
        items = items.filter(item =>
          item.pr_number.toLowerCase().includes(keyword) ||
          item.po_number.toLowerCase().includes(keyword) ||
          item.supplier_name.toLowerCase().includes(keyword)
        )
      }
      if (filterStatus) {
        items = items.filter(item => item.status === filterStatus)
      }
      if (date_from && date_to) {
        const from = new Date(date_from)
        const to = new Date(date_to)
        items = items.filter(item => {
          const itemDate = new Date(item.pr_date)
          return itemDate >= from && itemDate <= to
        })
      }
      const total = items.length
      const sliced = items.slice(pager.offset, pager.offset + pager.limit)
      setData(sliced)
      setPagination({ total, has_more: pager.offset + pager.limit < total })
      setIsLoading(false)
      return
    }

    try {
      const result = await listPurchaseReturns(token, {
        search: searchKeyword.trim() || undefined,
        status: filterStatus,
        date_from: date_from || undefined,
        date_to: date_to || undefined,
        limit: pager.limit,
        offset: pager.offset,
      })
      setData(result.items || [])
      const nextPagination = result.pagination || {}
      setPagination({
        total: Number(nextPagination.total ?? 0),
        has_more: Boolean(nextPagination.has_more),
      })
    } catch (err) {
      setError(err.message || 'Failed to load purchase returns')
      setData([])
      setPagination({ total: 0, has_more: false })
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, statusFilter, dateFilter, customDateFrom, customDateTo, pager])

  useEffect(() => {
    if (fetchDataRef.current) return
    fetchDataRef.current = true
    fetchData()
  }, [fetchData])

  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'pr_date',
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
        await deletePurchaseReturn(token, selectedItem.id)
        await fetchData()
      } else {
        setData((prev) => prev.filter((row) => row.id !== selectedItem.id))
      }
      setShowDeleteConfirm(false)
      setSelectedId(null)
    } catch (err) {
      setError(err.message || 'Failed to delete purchase return')
    }
  }

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
      pager.reset()
      const { date_from, date_to } = getDateRange(value, '', '')
      fetchData({ date_from, date_to })
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

  if (showDetail) {
    return (
      <PurchaseReturnDetail
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
        <h1 className="master-title">Retur Pembelian</h1>
        <div className="master-header-filters">
          <div className="master-footer-search">
            <input
              type="text"
              placeholder="Search return number or supplier..."
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
            <label htmlFor="return-date-filter" className="master-filter-label">Date</label>
            <select
              id="return-date-filter"
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
            <label htmlFor="return-status-filter" className="master-filter-label">Status</label>
            <select
              id="return-status-filter"
              className="master-filter-select"
              value={statusFilter}
              onChange={(e) => {
                const newStatus = e.target.value
                pager.reset()
                setStatusFilter(newStatus)
                fetchData({ status: newStatus === 'all' ? undefined : newStatus })
              }}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="done">Done</option>
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
                  onDoubleClick={() => handleViewDetail()}
                >
                  <td>{pager.offset + index + 1}</td>
                  <td>{row.pr_number || '-'}</td>
                  <td>{row.supplier_name || '-'}</td>
                  <td>{row.warehouse_name || '-'}</td>
                  <td>{formatDate(row.pr_date)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(row.status)}`}>
                      {row.status || '-'}
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
          <div className="master-table-sticky-footer">
            <span>Total Row: {pagination.total}</span>
            <span>Total: {formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      <FooterMaster
        onNew={handleNew}
        onEdit={handleViewDetail}
        onDelete={handleDeleteClick}
        totalRow={pagination.total}
        totalAmount={totalAmount}
        totalAmountLabel="Retur Pembelian"
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
          itemName={selectedItem?.pr_number || 'this record'}
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
        <div className="modal-overlay" onClick={handleCancelDateModal}>
          <div className="modal-container modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Date Range</h2>
            </div>
            <div className="modal-body">
              <div className="form-section">
                <label className="form-label">From</label>
                <input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-section">
                <label className="form-label">To</label>
                <input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="action-btn action-btn-add" onClick={handleApplyCustomDate}>
                <span className="action-btn-label">Apply</span>
              </button>
              <button type="button" className="action-btn action-btn-cancel" onClick={handleCancelDateModal}>
                <span className="action-btn-label">Cancel</span>
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
