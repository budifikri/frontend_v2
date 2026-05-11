import { useCallback, useEffect, useState, useRef } from 'react'
import { useAuth } from '../../../shared/auth'
import { listPurchaseReturns, deletePurchaseReturn } from '../../../features/transaksi/purchase-return/purchaseReturn.api'
import { FooterMaster } from '../footer/FooterMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'
import { useMasterTableKeyboardNav } from '../../../hooks/useMasterTableKeyboardNav'
import { PurchaseReturnDetail } from './PurchaseReturnDetail'
import { Toast } from '../../Toast'

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false, width: '50px' },
  { key: 'pr_number', label: 'RETURN NUMBER', sortable: true },
  { key: 'supplier_name', label: 'SUPPLIER', sortable: true },
  { key: 'warehouse_name', label: 'WAREHOUSE', sortable: true },
  { key: 'pr_date', label: 'DATE', sortable: true, width: '120px' },
  { key: 'grand_total', label: 'TOTAL', sortable: true },
  { key: 'status', label: 'STATUS', sortable: true, width: '220px' },
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

const ALL_RECORDS_SUMMARY_LIMIT = 999999

function getReturnStatusMeta(status) {
  const value = String(status || '').toLowerCase()
  if (value === 'approved' || value === 'approve') return { label: 'Approve', variant: 'approve', icon: 'check_circle' }
  if (value === 'pending') return { label: 'Pending', variant: 'pending', icon: 'schedule' }
  if (value === 'reject' || value === 'rejected') return { label: 'Reject', variant: 'reject', icon: 'cancel' }
  return { label: 'Draft', variant: 'draft', icon: 'edit_note' }
}

function formatNumber(amount) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(amount) || 0)
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
  const [summaryCounts, setSummaryCounts] = useState({ totalReturns: 0, draftCount: 0, approvedCount: 0 })
  const [summaryTotalAmount, setSummaryTotalAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const pager = useMasterPagination({ initialLimit: 10, total: pagination.total, hasMore: pagination.has_more })

  const [selectedId, setSelectedId] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const tableRef = useRef(null)

  const [dateFilter, setDateFilter] = useState('this_month')
  const [showDateModal, setShowDateModal] = useState(false)
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const [customDateFrom, setCustomDateFrom] = useState(todayStr)
  const [customDateTo, setCustomDateTo] = useState(todayStr)

  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' })
  const fetchDataRef = useRef(false)
  const isInitialLoad = useRef(true)

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
      const grandTotalAll = items.reduce((sum, item) => sum + (Number(item.grand_total) || 0), 0)
      const draft = items.filter(item => String(item.status || '').toLowerCase() === 'draft').length
      const approved = items.filter(item => {
        const status = String(item.status || '').toLowerCase()
        return status === 'approve' || status === 'approved'
      }).length
      setData(sliced)
      setPagination({ total, has_more: pager.offset + pager.limit < total })
      setSummaryCounts({ totalReturns: total, draftCount: draft, approvedCount: approved })
      setSummaryTotalAmount(grandTotalAll)
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

      const baseSummaryParams = {
        search: searchKeyword.trim() || undefined,
        date_from: date_from || undefined,
        date_to: date_to || undefined,
        limit: 1,
        offset: 0,
      }

      const [totalSummary, draftSummary, approvedSummary, allRecordsSummary] = await Promise.all([
        listPurchaseReturns(token, baseSummaryParams),
        listPurchaseReturns(token, { ...baseSummaryParams, status: 'draft' }),
        listPurchaseReturns(token, { ...baseSummaryParams, status: 'approved' }),
        listPurchaseReturns(token, {
          search: searchKeyword.trim() || undefined,
          date_from: date_from || undefined,
          date_to: date_to || undefined,
          limit: ALL_RECORDS_SUMMARY_LIMIT,
          offset: 0,
        }),
      ])

      setSummaryCounts({
        totalReturns: Number(totalSummary?.pagination?.total ?? 0),
        draftCount: Number(draftSummary?.pagination?.total ?? 0),
        approvedCount: Number(approvedSummary?.pagination?.total ?? 0),
      })
      setSummaryTotalAmount(
        (allRecordsSummary?.items || []).reduce((sum, row) => sum + (Number(row.grand_total) || 0), 0),
      )
    } catch (err) {
      setError(err.message || 'Failed to load purchase returns')
      setData([])
      setPagination({ total: 0, has_more: false })
      setSummaryCounts({ totalReturns: 0, draftCount: 0, approvedCount: 0 })
      setSummaryTotalAmount(0)
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, statusFilter, dateFilter, customDateFrom, customDateTo, pager])

  useEffect(() => {
    if (fetchDataRef.current) return
    fetchDataRef.current = true
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!isInitialLoad.current) {
      fetchData()
    }
    isInitialLoad.current = false
  }, [pager.offset])

  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'pr_date',
    direction: 'desc',
  })

  const totalAmount = sortedData.reduce((sum, row) => sum + (Number(row.grand_total) || 0), 0)
  const totalReturns = summaryCounts.totalReturns
  const draftCount = summaryCounts.draftCount
  const approvedCount = summaryCounts.approvedCount

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
    if (!selectedItem) return

    const returnStatus = String(selectedItem?.status || '').toLowerCase()
    if (returnStatus === 'approved' || returnStatus === 'approve' || returnStatus === 'void' || returnStatus === 'voided') {
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
    isModalOpen: showDeleteConfirm || showDetail || showDateModal,
  })

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showDeleteConfirm) return
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
        onExit()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showDeleteConfirm, handleViewDetail, handleDeleteClick, handleNew, onExit])

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
  const handleExitClick = () => onExit()

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

          <div className="master-filter-wrap">
            <label className="checkbox-all-records">
              <input
                type="checkbox"
                checked={pager.isAllRecords}
                onChange={(e) => pager.toggleAllRecords(e.target.checked)}
              />
              <span>All Records</span>
            </label>
          </div>
        </div>
      </div>

      {error && <div className="master-error">{error}</div>}

      <div className="master-table-wrapper" ref={tableRef} tabIndex={0}>
        <div className="master-table-container purchase-list-table-container">
          <table className="master-table purchase-list-table">
            <MasterTableHeader columns={TABLE_COLUMNS} sortConfig={sortConfig} onSort={handleSort} />
            <tbody>
              {sortedData.map((row, index) => {
                const returnStatus = getReturnStatusMeta(row.status)
                return (
                  <tr
                    key={row.id || index}
                    className={selectedId === row.id ? 'master-row-selected' : 'master-row'}
                    onClick={() => handleSelect(row)}
                    onDoubleClick={() => handleViewDetail()}
                  >
                    <td className="text-right purchase-col-no">{pager.offset + index + 1}</td>
                    <td className="purchase-col-po">{row.pr_number || '-'}</td>
                    <td className="purchase-col-supplier">{row.supplier_name || '-'}</td>
                    <td className="purchase-col-warehouse">{row.warehouse_name || '-'}</td>
                    <td className="purchase-col-date">{formatDate(row.pr_date)}</td>
                    <td className="text-right purchase-col-total">{formatCurrency(row.grand_total)}</td>
                    <td className="text-center">
                      <div className="purchase-status-stack">
                        <span className={`purchase-status-pill is-${returnStatus.variant}`}>
                          <span className="material-icons-round purchase-status-icon">{returnStatus.icon}</span>
                          {returnStatus.label}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!isLoading && sortedData.length === 0 && (
                <tr><td colSpan={7} className="text-center">No data</td></tr>
              )}
            </tbody>
          </table>
          <div className="master-table-sticky-footer purchase-table-summary">
            <div className="purchase-table-summary-left">
              <div className="purchase-summary-item">
                <p>Total Returns</p>
                <strong>{totalReturns}</strong>
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
              <p>Total Purchase Return</p>
              <div className="purchase-total-value">
                <span className="purchase-total-currency">Rp</span>
                <strong>{formatNumber(summaryTotalAmount)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FooterMaster
        onNew={handleNew}
        onEdit={handleViewDetail}
        onDelete={handleDeleteClick}
        totalAmount={totalAmount}
        totalAmountLabel="Purchase Return"
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
          itemName={selectedItem?.pr_number || 'this record'}
          title="Konfirmasi Hapus"
          confirmText="Hapus"
          cancelText="Batal"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
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
