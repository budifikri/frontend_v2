import { useEffect, useMemo, useState } from 'react'

const STOCK_CARD_COLUMNS = [
  { key: 'no', label: 'NO', width: '50px' },
  { key: 'date', label: 'TANGGAL', width: '110px' },
  { key: 'reference', label: 'REFERENSI', width: '150px' },
  { key: 'qty_in', label: 'MASUK', width: '80px' },
  { key: 'qty_out', label: 'KELUAR', width: '80px' },
  { key: 'balance', label: 'SALDO', width: '80px' },
  { key: 'note', label: 'KETERANGAN' },
]

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

function formatDateISO(date) {
  if (!date || isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

export function StockCardModal({ 
  isOpen, 
  onClose, 
  data, 
  productName, 
  isLoading, 
  error, 
  pagination,
  onFilterChange,
  onPageChange 
}) {
  console.log('[StockCardModal] Props - isOpen:', isOpen, 'data:', data, 'productName:', productName, 'isLoading:', isLoading, 'error:', error, 'pagination:', pagination)

  const [dateFilter, setDateFilter] = useState('this_month')
  const [showDateModal, setShowDateModal] = useState(false)
  const today = new Date()
  const todayStr = formatDateISO(today)
  const [customDateFrom, setCustomDateFrom] = useState(todayStr)
  const [customDateTo, setCustomDateTo] = useState(todayStr)

  const totals = useMemo(() => {
    const totalIn = data.reduce((sum, row) => sum + (Number(row.qty_in) || 0), 0)
    const totalOut = data.reduce((sum, row) => sum + (Number(row.qty_out) || 0), 0)
    return { totalIn, totalOut }
  }, [data])

  const handleFilterChange = (newFilter) => {
    setDateFilter(newFilter)
    if (newFilter === 'custom') {
      setShowDateModal(true)
      return
    }
    const { date_from, date_to } = getDateRange(newFilter, customDateFrom, customDateTo)
    onFilterChange?.({ dateFilter: newFilter, date_from, date_to })
  }

  const handleCustomDateApply = () => {
    setShowDateModal(false)
    const { date_from, date_to } = getDateRange('custom', customDateFrom, customDateTo)
    onFilterChange?.({ dateFilter: 'custom', date_from, date_to })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleFirstPage = () => onPageChange?.(0)
  const handlePrevPage = () => onPageChange?.((pagination?.offset || 0) - (pagination?.limit || 10))
  const handleNextPage = () => onPageChange?.((pagination?.offset || 0) + (pagination?.limit || 10))
  const handleLastPage = () => {
    const totalPages = Math.ceil((pagination?.total || 0) / (pagination?.limit || 10))
    onPageChange?.((totalPages - 1) * (pagination?.limit || 10))
  }

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const currentPage = Math.floor((pagination?.offset || 0) / (pagination?.limit || 10)) + 1
  const totalPages = Math.ceil((pagination?.total || 0) / (pagination?.limit || 10))
  const canPrev = (pagination?.offset || 0) > 0
  const canNext = pagination?.hasMore

  return (
    <div className="delete-master-overlay" onClick={onClose}>
      <div className="stock-card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-master-header">
          <div className="stock-card-header-left">
            <span className="material-icons-round material-icon orange">assignment</span>
            <h2>Kartu Stok - {productName || '-'}</h2>
          </div>
          <div className="stock-card-header-right"> Date
            <div className="stock-card-filter">
              <select 
                value={dateFilter} 
                onChange={(e) => handleFilterChange(e.target.value)}
                className="form-select"
              >
                <option value="all">All Data</option>
                <option value="this_month">This Month</option>
                <option value="this_year">This Year</option>
                <option value="custom">Custom</option>
              </select>

              {dateFilter === 'custom' && (
                <div className="stock-card-custom-dates">
                  <input 
                    type="date" 
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="form-input"
                  />
                  <span>-</span>
                  <input 
                    type="date" 
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="form-input"
                  />
                  <button type="button" className="master-footer-btn" onClick={handleCustomDateApply}>
                    <span className="material-icons-round master-footer-icon green">check</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="stock-card-body">
          {isLoading && (
            <div className="stock-card-loading">
              <span className="material-icons-round animate-spin">sync</span>
              <span>Loading...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="stock-card-error">
              <span className="material-icons-round material-icon red">error</span>
              <span>{error}</span>
            </div>
          )}

          {!isLoading && !error && (
            <div className="master-table-container">
              <table className="master-table">
                <thead>
                  <tr>
                    {STOCK_CARD_COLUMNS.map((col) => (
                      <th key={col.key} style={col.width ? { width: col.width } : {}}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.length > 0 ? (
                    data.map((row, index) => (
                      <tr key={row.id || index}>
                        <td>{index + 1 + (pagination?.offset || 0)}</td>
                        <td>{formatDate(row.date)}</td>
                        <td>{row.reference || '-'}</td>
                        <td className={`text-right ${Number(row.qty_in) > 0 ? 'qty-in-positive' : ''}`}>{Number(row.qty_in) > 0 ? row.qty_in : ''}</td>
                        <td className={`text-right ${Number(row.qty_out) > 0 ? 'qty-out-positive' : ''}`}>{Number(row.qty_out) > 0 ? row.qty_out : ''}</td>
                        <td className="text-right">{row.balance || 0}</td>
                        <td>{row.note || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center">No data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="stock-card-footer">
          <div className="stock-card-footer-left">
            <button type="button" className="master-footer-btn" onClick={handlePrint}>
              <span className="material-icons-round master-footer-icon blue">print</span>          
            </button>
            <button type="button" className="master-footer-btn" onClick={onClose}>
              <span className="material-icons-round master-footer-icon red">exit_to_app</span>
            </button>
           
          </div>
          <div className="stock-card-footer-right">
           <span className="stock-card-total-in">Total Masuk: {totals.totalIn}</span>
            <span className="stock-card-total-out">Total Keluar: {totals.totalOut}</span>
             <span className="stock-card-total-row">Total Row: {pagination?.total || data.length}</span>
          
            <div className="master-footer-pagination">
            
              <button type="button" className="master-page-btn" title="First Page" onClick={handleFirstPage} disabled={!canPrev}>
                <span className="material-icons-round master-page-icon">first_page</span>
              </button>
              <button type="button" className="master-page-btn" title="Previous Page" onClick={handlePrevPage} disabled={!canPrev}>
                <span className="material-icons-round master-page-icon">chevron_left</span>
              </button>
              <span className="master-page-info">Page {currentPage} of {totalPages}</span>
              <button type="button" className="master-page-btn" title="Next Page" onClick={handleNextPage} disabled={!canNext}>
                <span className="material-icons-round master-page-icon">chevron_right</span>
              </button>
              <button type="button" className="master-page-btn" title="Last Page" onClick={handleLastPage} disabled={!canNext}>
                <span className="material-icons-round master-page-icon">last_page</span>
              </button>
            </div>
           
          </div>
        </div>
      </div>

      {showDateModal && (
        <div className="modal-overlay" onClick={() => setShowDateModal(false)}>
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
              <button type="button" className="action-btn action-btn-add" onClick={handleCustomDateApply}>
                <span className="action-btn-label">Apply</span>
              </button>
              <button type="button" className="action-btn action-btn-cancel" onClick={() => setShowDateModal(false)}>
                <span className="action-btn-label">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
