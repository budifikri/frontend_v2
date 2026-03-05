import { useEffect, useMemo } from 'react'

const STOCK_CARD_COLUMNS = [
  { key: 'no', label: 'NO', width: '50px' },
  { key: 'date', label: 'TANGGAL', width: '100px' },
  { key: 'reference', label: 'REFERENSI' },
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

export function StockCardModal({ isOpen, onClose, data, productName, isLoading, error }) {
  console.log('[StockCardModal] Props - isOpen:', isOpen, 'data:', data, 'productName:', productName, 'isLoading:', isLoading, 'error:', error)

  const totals = useMemo(() => {
    const totalIn = data.reduce((sum, row) => sum + (Number(row.qty_in) || 0), 0)
    const totalOut = data.reduce((sum, row) => sum + (Number(row.qty_out) || 0), 0)
    return { totalIn, totalOut }
  }, [data])

  const handlePrint = () => {
    window.print()
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

  return (
    <div className="delete-master-overlay" onClick={onClose}>
      <div className="stock-card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-master-header">
          <span className="material-icons-round material-icon orange">assignment</span>
          <h2>Kartu Stok - {productName || '-'}</h2>
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
                        <td>{index + 1}</td>
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
          <div className="stock-card-totals">
            <span className="stock-card-total">Total Row: {data.length}</span>
            <span className="stock-card-total-in">Total Masuk: {totals.totalIn}</span>
            <span className="stock-card-total-out">Total Keluar: {totals.totalOut}</span>
          </div>
          <div className="stock-card-actions">
            <button type="button" className="master-btn-print" onClick={handlePrint}>
              PRINT
            </button>
            <button type="button" className="master-btn-cancel-secondary" onClick={onClose}>
              TUTUP
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
