import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import { listPurchases } from '../../../features/transaksi/purchase/purchase.api'
import { FooterMaster } from '../footer/FooterMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'
import { PurchaseDetail } from './PurchaseDetail'

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false, width: '50px' },
  { key: 'po_number', label: 'PO NUMBER', sortable: true },
  { key: 'supplier_name', label: 'SUPPLIER', sortable: true },
  { key: 'warehouse_name', label: 'WAREHOUSE', sortable: true },
  { key: 'po_date', label: 'DATE', sortable: true, width: '120px' },
  { key: 'status', label: 'STATUS', sortable: true },
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
    grand_total: 1110000,
  },
]

function getStatusBadgeClass(status) {
  const classes = {
    draft: 'status-badge-pending',
    pending: 'status-badge-approved',
    approved: 'status-badge-posted',
    rejected: 'status-badge-rejected',
    cancelled: 'status-badge-rejected',
    completed: 'status-badge-posted',
  }
  return classes[status?.toLowerCase()] || 'status-badge-pending'
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

export function Purchase({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const pager = useMasterPagination({ initialLimit: 10, total: pagination.total, hasMore: pagination.has_more })
  const { limit, offset } = pager

  const [selectedId, setSelectedId] = useState(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  const fetchData = useCallback(async () => {
    setError('')
    setIsLoading(true)

    if (!token) {
      let items = [...DUMMY_PURCHASES]
      if (searchKeyword.trim()) {
        const keyword = searchKeyword.trim().toLowerCase()
        items = items.filter(item =>
          item.po_number.toLowerCase().includes(keyword) ||
          item.supplier_name.toLowerCase().includes(keyword)
        )
      }
      if (statusFilter !== 'all') {
        items = items.filter(item => item.status === statusFilter)
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
        status: statusFilter !== 'all' ? statusFilter : undefined,
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
  }, [token, searchKeyword, statusFilter, limit, offset])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'po_date',
    direction: 'desc',
  })

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showExitConfirm) return
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
  }, [showExitConfirm])

  const selectedItem = selectedId == null ? null : data.find((row) => row.id === selectedId) || null

  const handleSelect = (row) => setSelectedId(row.id)

  const handleViewDetail = () => {
    const target = selectedItem || sortedData[0]
    if (!target) return
    setSelectedId(target.id)
    setShowDetail(true)
  }

  const handleNew = () => {
    setSelectedId(null)
    setShowDetail(true)
  }

  const handleDeleteClick = () => {
    if (selectedItem) {
      setError('Delete functionality not yet implemented')
    }
  }

  const handlePrint = () => window.print()
  const handleExitClick = () => setShowExitConfirm(true)
  const handleConfirmExit = () => { setShowExitConfirm(false); onExit() }

  // If showing detail view, render only that
  if (showDetail) {
    return (
      <PurchaseDetail
        selectedId={selectedId}
        onExit={() => {
          setShowDetail(false)
          setSelectedId(null)
          fetchData()
        }}
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
            />
            <button type="button" className="master-search-btn">
              <span className="material-icons-round material-icon">search</span>
            </button>
          </div>
          <div className="master-filter-wrap">
            <label htmlFor="purchase-status-filter" className="master-filter-label">Status</label>
            <select
              id="purchase-status-filter"
              className="master-filter-select"
              value={statusFilter}
              onChange={(e) => { pager.reset(); setStatusFilter(e.target.value) }}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
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
        onNew={handleNew}
        onEdit={handleViewDetail}
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
    </div>
  )
}
