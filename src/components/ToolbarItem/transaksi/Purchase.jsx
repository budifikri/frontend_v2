import { useCallback, useEffect, useState, useRef } from 'react'
import { useAuth } from '../../../shared/auth'
import { listPurchases, deletePurchase, getPurchase, createPurchase } from '../../../features/transaksi/purchase/purchase.api'
import { FooterMaster } from '../footer/FooterMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'
import { useMasterTableKeyboardNav } from '../../../hooks/useMasterTableKeyboardNav'
import { PurchaseDetail } from './PurchaseDetail'
import { Toast } from '../../Toast'

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false, width: '50px' },
  { key: 'po_number', label: 'PO NUMBER', sortable: true },
  { key: 'supplier_name', label: 'SUPPLIER', sortable: true },
  { key: 'warehouse_name', label: 'WAREHOUSE', sortable: true },
  { key: 'po_date', label: 'DATE', sortable: true, width: '120px' },
  { key: 'grand_total', label: 'TOTAL', sortable: true },
  { key: 'status', label: 'STATUS PO/RECEIVE', sortable: true, width: '220px' },
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

const ALL_RECORDS_SUMMARY_LIMIT = 999999

function getPoStatusMeta(status) {
  const value = String(status || '').toLowerCase()
  if (value === 'approve' || value === 'approved') return { label: 'Approve', variant: 'approve', icon: 'check_circle' }
  if (value === 'pending') return { label: 'Pending', variant: 'pending', icon: 'schedule' }
  if (value === 'reject' || value === 'rejected') return { label: 'Reject', variant: 'reject', icon: 'cancel' }
  return { label: 'Draft', variant: 'draft', icon: 'edit_note' }
}

function getReceiveStatusMeta(status) {
  const value = String(status || '').toLowerCase()
  if (value === 'receive') return { label: 'Receive', variant: 'receive', icon: 'check_circle' }
  if (value === 'reject' || value === 'rejected') return { label: 'Reject', variant: 'reject', icon: 'cancel' }
  if (value === 'pending') return { label: 'Pending', variant: 'pending', icon: 'schedule' }
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
  const [summaryCounts, setSummaryCounts] = useState({ totalOrders: 0, draftCount: 0, approvedCount: 0 })
  const [summaryTotalAmount, setSummaryTotalAmount] = useState(0)
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
  const tableRef = useRef(null)

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
  const isInitialLoad = useRef(true)

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
      const grandTotalAll = DUMMY_PURCHASES.reduce((sum, item) => sum + (Number(item.grand_total) || 0), 0)
      const draft = items.filter(item => String(item.status || '').toLowerCase() === 'draft').length
      const approved = items.filter(item => {
        const status = String(item.status || '').toLowerCase()
        return status === 'approve' || status === 'approved'
      }).length
      setData(sliced)
      setPagination({ total, has_more: offset + limit < total })
      setSummaryCounts({ totalOrders: total, draftCount: draft, approvedCount: approved })
      setSummaryTotalAmount(grandTotalAll)
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

      const baseSummaryParams = {
        search: searchKeyword.trim() || undefined,
        date_from: date_from || undefined,
        date_to: date_to || undefined,
        limit: 1,
        offset: 0,
      }

      const [totalSummary, draftSummary, approvedSummary, allRecordsSummary] = await Promise.all([
        listPurchases(token, baseSummaryParams),
        listPurchases(token, { ...baseSummaryParams, status: 'draft' }),
        listPurchases(token, { ...baseSummaryParams, status: 'approve' }),
        listPurchases(token, { limit: ALL_RECORDS_SUMMARY_LIMIT, offset: 0 }),
      ])

      setSummaryCounts({
        totalOrders: Number(totalSummary?.pagination?.total ?? 0),
        draftCount: Number(draftSummary?.pagination?.total ?? 0),
        approvedCount: Number(approvedSummary?.pagination?.total ?? 0),
      })
      setSummaryTotalAmount(
        (allRecordsSummary?.items || []).reduce((sum, row) => sum + (Number(row.grand_total) || 0), 0),
      )
    } catch (err) {
      setError(err.message || 'Failed to load purchases')
      setData([])
      setPagination({ total: 0, has_more: false })
      setSummaryCounts({ totalOrders: 0, draftCount: 0, approvedCount: 0 })
      setSummaryTotalAmount(0)
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, statusFilter, statusReceiveFilter, dateFilter, customDateFrom, customDateTo, limit, offset])

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
  }, [offset, limit])

  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'po_date',
    direction: 'desc',
  })

  const totalAmount = sortedData.reduce((sum, row) => sum + (Number(row.grand_total) || 0), 0)
  const totalOrders = summaryCounts.totalOrders
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

    const poStatus = String(selectedItem?.status || '').toLowerCase()
    if (poStatus === 'approved' || poStatus === 'approve') {
      setToast({ isOpen: true, message: 'Tidak bisa dihapus, status sudah Approve', type: 'error' })
      return
    }

    setShowDeleteConfirm(true)
  }, [selectedItem])

  const handleDuplicateClick = useCallback(async () => {
    if (!selectedItem) {
      setToast({ isOpen: true, message: 'Pilih purchase order terlebih dahulu', type: 'info' })
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const source = await getPurchase(token, selectedItem.id)
      const duplicated = await createPurchase(token, {
        supplier_id: source.supplier_id,
        warehouse_id: source.warehouse_id,
        expected_date: source.expected_date || source.po_date || '',
        notes: source.notes || '',
        items: (source.items || []).map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount || 0,
          tax_rate: item.tax_rate || 0,
        })),
      })

      const createdId = duplicated?.data?.id || duplicated?.id
      if (!createdId) {
        throw new Error('Failed to duplicate purchase order')
      }

      setSelectedId(createdId)
      setShowDetail(true)
    } catch (err) {
      setError(err.message || 'Failed to duplicate purchase order')
      setToast({ isOpen: true, message: err.message || 'Failed to duplicate purchase order', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [selectedItem, token])

  useMasterTableKeyboardNav({
    data: sortedData,
    selectedId,
    setSelectedId,
    handleEdit: handleViewDetail,
    tableRef,
    isModalOpen: showDeleteConfirm || showExitConfirm || showDetail || showDateModal,
  })

  useEffect(() => {
    const handleKeyDown = (e) => {
      console.debug('[Purchase.jsx] keydown:', e.key, '| showDetail:', showDetail, '| showExitConfirm:', showExitConfirm)
      if (showDeleteConfirm || showExitConfirm) return
      if (showDetail) {
        console.debug('[Purchase.jsx] ESC blocked - showDetail is true')
        return
      }
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
  }, [showDeleteConfirm, showExitConfirm, showDetail, fetchData, handleViewDetail, handleDeleteClick, handleNew])

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

      <div className="master-table-wrapper" ref={tableRef} tabIndex={0}>
        <div className="master-table-container purchase-list-table-container">
          <table className="master-table purchase-list-table">
            <MasterTableHeader columns={TABLE_COLUMNS} sortConfig={sortConfig} onSort={handleSort} />
            <tbody>
              {sortedData.map((row, index) => {
                const poStatus = getPoStatusMeta(row.status)
                const receiveStatus = getReceiveStatusMeta(row.status_receive)
                const isBothDraft = poStatus.variant === 'draft' && receiveStatus.variant === 'draft'
                return (
                  <tr
                    key={row.id || index}
                    className={selectedId === row.id ? 'master-row-selected' : 'master-row'}
                    onClick={() => handleSelect(row)}
                    onDoubleClick={() => handleViewDetail()}
                  >
                    <td className="text-right purchase-col-no">{offset + index + 1}</td>
                    <td className="purchase-col-po">{row.po_number || '-'}</td>
                    <td className="purchase-col-supplier">{row.supplier_name || '-'}</td>
                    <td className="purchase-col-warehouse">{row.warehouse_name || '-'}</td>
                    <td className="purchase-col-date">{formatDate(row.po_date)}</td>
                    <td className="text-right purchase-col-total">{formatCurrency(row.grand_total)}</td>
                    <td className="text-center">
                      <div className="purchase-status-stack">
                        {isBothDraft ? (
                          <span className="purchase-status-pill is-draft">
                            <span className="material-icons-round purchase-status-icon">edit_note</span>
                            Draft
                          </span>
                        ) : (
                          <>
                            <span className={`purchase-status-pill is-${poStatus.variant}`}>
                              <span className="material-icons-round purchase-status-icon">{poStatus.icon}</span>
                              {poStatus.label}
                            </span>
                            <span className={`purchase-status-pill is-${receiveStatus.variant}`}>
                              <span className="material-icons-round purchase-status-icon">{receiveStatus.icon}</span>
                              {receiveStatus.label}
                            </span>
                          </>
                        )}
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
                <p>Total Orders</p>
                <strong>{totalOrders}</strong>
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
              <p>Total Purchase Order</p>
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
        onDuplicate={handleDuplicateClick}
        duplicateDisabled={!selectedItem || isLoading}
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
        isAllRecords={pager.isAllRecords}
        onToggleAllRecords={pager.toggleAllRecords}
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
