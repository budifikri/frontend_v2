import { useEffect } from 'react'

const ITEM_COLUMNS = [
  { key: 'no', label: 'NO', width: '50px' },
  { key: 'product_name', label: 'PRODUK' },
  { key: 'quantity', label: 'QTY', width: '80px' },
  { key: 'unit', label: 'SATUAN', width: '90px' },
  { key: 'price', label: 'HARGA', width: '140px' },
  { key: 'cost_price', label: 'MODAL', width: '140px' },
  { key: 'discount', label: 'DISKON', width: '130px' },
  { key: 'profit', label: 'PROFIT', width: '140px' },
  { key: 'subtotal', label: 'SUBTOTAL', width: '140px' },
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
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function getStatusLabel(status) {
  return status || '-'
}

export function PenjualanDetailModal({
  isOpen,
  onClose,
  data,
  isLoading,
  error,
}) {
  const sale = data?.sale || data || null
  const items = data?.items || []
  const totalAmount = Number(
    sale?.total_amount
    ?? items.reduce((sum, item) => {
      const subtotal = Number(item.subtotal ?? item.line_total ?? (Number(item.unit_price ?? item.price ?? 0) * Number(item.quantity ?? 0)))
      return sum + subtotal
    }, 0),
  )
  const totalProfit = Number(
    sale?.total_profit
    ?? items.reduce((sum, item) => sum + Number(item.profit ?? ((((item.unit_price ?? item.price ?? 0) - (item.cost_price ?? 0)) * (item.quantity ?? 0)) - (item.discount_amount ?? 0))), 0),
  )

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
            <span className="material-icons-round material-icon orange">receipt_long</span>
            <h2>Detail Penjualan</h2>
          </div>
          <div className="stock-card-header-right">
            <div className="sale-detail-meta">
              <div className="sale-detail-meta-item">
                <span className="sale-detail-meta-label">No. Nota</span>
                <span className="sale-detail-meta-value">{sale?.sale_number || '-'}</span>
              </div>
              <div className="sale-detail-meta-item">
                <span className="sale-detail-meta-label">Tanggal</span>
                <span className="sale-detail-meta-value">{formatDate(sale?.sale_date || sale?.created_at)}</span>
              </div>
              <div className="sale-detail-meta-item">
                <span className="sale-detail-meta-label">Status</span>
                <span className={`sale-detail-meta-value status-badge status-${sale?.status?.toLowerCase()}`}>
                  {getStatusLabel(sale?.status)}
                </span>
              </div>
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
                    {ITEM_COLUMNS.map((col) => (
                      <th key={col.key} style={col.width ? { width: col.width } : {}}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <tr key={item.id || index} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                        <td>{index + 1}</td>
                        <td>{item.product_name || item.product_id || '-'}</td>
                        <td className="text-right">{item.quantity || 0}</td>
                        <td>{item.unit_name || item.unit || '-'}</td>
                        <td className="text-right">{formatCurrency(item.original_price ?? item.price ?? item.unit_price)}</td>
                        <td className="text-right">{formatCurrency(item.cost_price)}</td>
                        <td className="text-right">{formatCurrency(item.discount_amount)}</td>
                        <td className="text-right">{formatCurrency(item.profit ?? ((((item.unit_price ?? item.price ?? 0) - (item.cost_price ?? 0)) * (item.quantity ?? 0)) - (item.discount_amount ?? 0)))}</td>
                        <td className="text-right">{formatCurrency(item.subtotal ?? item.line_total ?? ((item.unit_price ?? item.price ?? 0) * (item.quantity ?? 0)))}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={ITEM_COLUMNS.length} className="text-center">No data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
            <span className="stock-card-total-row">Total Item: {items.length}</span>
            <span className="stock-card-total-row">Profit: {formatCurrency(totalProfit)}</span>
            <span className="stock-card-total-row sale-detail-footer-total">Total: {formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
