import { useEffect, useMemo, useState } from 'react'

const TRANSACTION_COLUMNS = [
  { key: 'no', label: 'NO', width: '50px' },
  { key: 'date', label: 'TANGGAL', width: '140px' },
  { key: 'type', label: 'JENIS', width: '100px' },
  { key: 'amount', label: 'NOMINAL', width: '120px' },
  { key: 'balance_after', label: 'SALDO', width: '120px' },
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

function getTypeLabel(type) {
  const labels = {
    sale: 'Penjualan',
    return: 'Retur',
    cash_in: 'Cash In',
    cash_out: 'Cash Out',
    purchase: 'Pembelian',
    purchase_return: 'Retur Beli',
  }
  return labels[type?.toLowerCase()] || type || '-'
}

export function CashDrawerDetailModal({
  isOpen,
  onClose,
  data,
  isLoading,
  error,
}) {
  console.log('[CashDrawerDetailModal] data:', data)
  console.log('[CashDrawerDetailModal] data.drawer:', data?.drawer)
  console.log('[CashDrawerDetailModal] data.transactions:', data?.transactions)
  const drawer = data?.drawer
  const allTransactions = data?.transactions || []

  const [typeFilter, setTypeFilter] = useState('all')

  const filteredTransactions = useMemo(() => {
    let result = allTransactions
    if (typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter)
    }
    return result.sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [allTransactions, typeFilter])

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
            <div className="stock-card-filter">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="form-select"
              >
                <option value="all">All Jenis</option>
                <option value="sale">Penjualan</option>
                <option value="return">Retur</option>
                <option value="cash_in">Cash In</option>
                <option value="cash_out">Cash Out</option>
              </select>
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
              {drawer && (
                <div className="cash-drawer-summary">
                  <div className="summary-row">
                    <div className="summary-item">
                      <span className="summary-label">ID</span>
                      <span className="summary-value">{drawer.id || drawer.drawer_id || '-'}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Tanggal Buka</span>
                      <span className="summary-value">{formatDate(drawer.open_date)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Tanggal Tutup</span>
                      <span className="summary-value">{drawer.close_date ? formatDate(drawer.close_date) : '-'}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Status</span>
                      <span className={`summary-value status-badge status-${drawer.status}`}>
                        {drawer.status}
                      </span>
                    </div>
                  </div>

                  <div className="summary-row">
                    <div className="summary-item">
                      <span className="summary-label">Saldo Awal</span>
                      <span className="summary-value">{formatCurrency(drawer.opening_balance)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Total Penjualan</span>
                      <span className="summary-value text-green">{formatCurrency(summaryTotals.total_sales)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Total Retur</span>
                      <span className="summary-value text-red">{formatCurrency(summaryTotals.total_returns)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Total Cash In</span>
                      <span className="summary-value text-blue">{formatCurrency(summaryTotals.total_cash_in)}</span>
                    </div>
                  </div>

                  <div className="summary-row">
                    <div className="summary-item">
                      <span className="summary-label">Total Cash Out</span>
                      <span className="summary-value text-orange">{formatCurrency(summaryTotals.total_cash_out)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Saldo Akhir (Teori)</span>
                      <span className="summary-value">{formatCurrency(drawer.theoretical_balance)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Saldo Aktual</span>
                      <span className="summary-value">{formatCurrency(drawer.actual_balance)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Selisih</span>
                      <span className={`summary-value ${Number(drawer.difference) !== 0 ? 'text-red' : ''}`}>
                        {formatCurrency(drawer.difference)}
                      </span>
                    </div>
                  </div>

                  <div className="summary-row">
                    <div className="summary-item">
                      <span className="summary-label">Kasir Buka</span>
                      <span className="summary-value">{drawer.opened_by || '-'}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Kasir Tutup</span>
                      <span className="summary-value">{drawer.closed_by || '-'}</span>
                    </div>
                    <div className="summary-item summary-full">
                      <span className="summary-label">Catatan</span>
                      <span className="summary-value">{drawer.notes || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

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
                          <td>
                            <span className={`type-badge type-${row.type}`}>
                              {getTypeLabel(row.type)}
                            </span>
                          </td>
                          <td className={`text-right ${Number(row.amount) < 0 ? 'text-red' : 'text-green'}`}>
                            {formatCurrency(row.amount)}
                          </td>
                          <td className="text-right">{formatCurrency(row.balance_after)}</td>
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
            <span className="stock-card-total-row">Total Row: {filteredTransactions.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}