import { useEffect, useMemo, useState } from 'react'

const TRANSACTION_COLUMNS = [
  { key: 'no', label: 'NO', width: '50px' },
  { key: 'date', label: 'TANGGAL', width: '140px' },
  { key: 'reference', label: 'REFERENSI', width: '120px' },
  { key: 'type', label: 'JENIS', width: '100px' },
  { key: 'amount', label: 'NOMINAL', width: '120px' },
  { key: 'reason', label: 'KETERANGAN' },
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
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${day}-${month}-${year} ${hour}:${minute}`
}

const TYPE_MAPPING = {
  'sale': 'SALE_IN',
  'return': 'RETURN_OUT',
  'cash_in': 'CASH_IN',
  'cash_out': 'CASH_OUT',
}

const REVERSE_TYPE_MAPPING = {
  'SALE_IN': 'sale',
  'RETURN_OUT': 'return',
  'CASH_IN': 'cash_in',
  'CASH_OUT': 'cash_out',
}

function getTypeLabel(type) {
  const labels = {
    SALE_IN: 'Penjualan',
    RETURN_OUT: 'Retur',
    CASH_IN: 'Cash In',
    CASH_OUT: 'Cash Out',
    SALE_OUT: 'Penjualan',
    purchase: 'Pembelian',
    purchase_return: 'Retur Beli',
  }
  return labels[type?.toUpperCase()] || type || '-'
}

export function CashDrawerDetailModal({
  isOpen,
  onClose,
  data,
  isLoading,
  error,
}) {
  const drawer = data?.drawer

  const [activeTab, setActiveTab] = useState('summary')
  const [typeFilter, setTypeFilter] = useState('all')

  const filteredTransactions = useMemo(() => {
    let result = data?.transactions || []
    if (typeFilter !== 'all') {
      const dbType = TYPE_MAPPING[typeFilter]
      result = result.filter((t) => t.type === dbType)
    }
    return result.sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [data, typeFilter])

  const summaryTotals = useMemo(() => {
    const s = data?.summary || {}
    return {
      total_sales: s.total_sales || 0,
      total_returns: s.total_returns || 0,
      total_purchases: s.total_purchases || 0,
      total_purchase_returns: s.total_purchase_returns || 0,
      total_cash_in: s.total_cash_in || 0,
      total_cash_out: s.total_cash_out || 0,
    }
  }, [data])

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

  return (
    <div className="delete-master-overlay" onClick={onClose}>
      <div className="stock-card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-master-header">
          <div className="stock-card-header-left">
            <span className="material-icons-round material-icon orange">account_balance_wallet</span>
            <h2>Detail Cash Drawer</h2>
          </div>
          <div className="stock-card-header-right">
            <div className="master-tab-buttons">
              <button
                type="button"
                className={`master-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                Summary
              </button>
              <button
                type="button"
                className={`master-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                History
              </button>
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
            <>
              {activeTab === 'summary' && drawer && (
                <div className="cash-drawer-summary-simple">
                  <div className="summary-simple-row">
                    <span className="summary-simple-label">Saldo Awal</span>
                    <span className="summary-simple-value">{formatCurrency(drawer.opening_balance)}</span>
                  </div>
                  <div className="summary-simple-row">
                    <span className="summary-simple-label">Total Penjualan</span>
                    <span className="summary-simple-value text-green">{formatCurrency(summaryTotals.total_sales)}</span>
                  </div>
                  <div className="summary-simple-row">
                    <span className="summary-simple-label">Total Retur</span>
                    <span className="summary-simple-value text-red">{formatCurrency(summaryTotals.total_returns)}</span>
                  </div>
                  <div className="summary-simple-row">
                    <span className="summary-simple-label">Total Cash In</span>
                    <span className="summary-simple-value text-blue">{formatCurrency(summaryTotals.total_cash_in)}</span>
                  </div>
                  <div className="summary-simple-row">
                    <span className="summary-simple-label">Total Cash Out</span>
                    <span className="summary-simple-value text-orange">{formatCurrency(summaryTotals.total_cash_out)}</span>
                  </div>
                  <div className="summary-simple-row">
                    <span className="summary-simple-label">Saldo Akhir (Teori)</span>
                    <span className="summary-simple-value">{formatCurrency(drawer.theoretical_balance)}</span>
                  </div>
                  <div className="summary-simple-row">
                    <span className="summary-simple-label">Saldo Aktual</span>
                    <span className="summary-simple-value">{formatCurrency(drawer.actual_balance)}</span>
                  </div>
                  <div className="summary-simple-row">
                    <span className="summary-simple-label">Selisih</span>
                    <span className={`summary-simple-value ${Number(drawer.difference) !== 0 ? 'text-red' : ''}`}>
                      {formatCurrency(drawer.difference)}
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <>
                  <div className="stock-card-filter-bar">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="form-select"
                    >
                      <option value="all">Semua</option>
                      <option value="sale">Penjualan</option>
                      <option value="return">Retur</option>
                      <option value="cash_in">Cash In</option>
                      <option value="cash_out">Cash Out</option>
                    </select>
                  </div>

                  <div className="master-table-container">
                    <table className="master-table">
                      <thead>
                        <tr>
                          {TRANSACTION_COLUMNS.map((col) => (
                            <th key={col.key} style={col.width ? { width: col.width } : {}}>{col.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.length > 0 ? (
                          filteredTransactions.map((row, index) => (
                            <tr key={row.id || index} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                              <td>{index + 1}</td>
                              <td>{formatDate(row.date)}</td>
                              <td>{row.reference || '-'}</td>
                              <td>
                                <span className={`type-badge type-${row.type}`}>
                                  {getTypeLabel(row.type)}
                                </span>
                              </td>
                              <td className={`text-right ${Number(row.amount) < 0 ? 'text-red' : 'text-green'}`}>
                                {formatCurrency(row.amount)}
                              </td>
                              <td>{row.reason || '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center">No data</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="stock-card-footer">
          <div className="stock-card-footer-left">
            <button type="button" className="master-footer-btn" onClick={() => window.print()}>
              <span className="material-icons-round master-footer-icon blue">print</span>
            </button>
            <button type="button" className="master-footer-btn" onClick={onClose}>
              <span className="material-icons-round master-footer-icon red">exit_to_app</span>
            </button>
          </div>
          <div className="stock-card-footer-right">
            {activeTab === 'history' && (
              <span className="stock-card-total-row">Total Row: {filteredTransactions.length}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}