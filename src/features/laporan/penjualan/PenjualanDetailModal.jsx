import { useEffect, useState } from 'react'

const ITEM_COLUMNS = [
  { key: 'no', label: 'NO', width: '50px' },
  { key: 'product_name', label: 'PRODUK' },
  { key: 'quantity', label: 'QTY', width: '80px' },
  { key: 'unit', label: 'SATUAN', width: '80px' },
  { key: 'price', label: 'HARGA', width: '120px' },
  { key: 'subtotal', label: 'SUBTOTAL', width: '120px' },
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
  const labels = {
    OPEN: 'Open',
    COMPLETED: 'Selesai',
    VOID: 'Batal',
    HOLD: 'Tunda',
  }
  return labels[status] || status || '-'
}

export function PenjualanDetailModal({
  isOpen,
  onClose,
  data,
  isLoading,
  error,
}) {
  const sale = data?.sale
  const items = data?.items || []
  const payments = data?.payments || []

  const [activeTab, setActiveTab] = useState('summary')

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
                className={`master-tab-btn ${activeTab === 'items' ? 'active' : ''}`}
                onClick={() => setActiveTab('items')}
              >
                Items
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

          {!isLoading && !error && sale && (
            <>
              {activeTab === 'summary' && (
                <div className="cash-drawer-summary-simple">
                  <div className="summary-simple-row">
                    <span className="summary-simple-label">No. Nota</span>
                    <span className="summary-simple-value">{sale.sale_number}</span>
                  </div>
                  <div className="summary-simple-row">
                    <span className="summary-simple-label">Tanggal</span>
                    <span className="summary-simple-value">{formatDate(sale.sale_date)}</span>
                  </div>
                  <div className="summary-simple-row">
                    <span className="summary-simple-label">Konsumen</span>
                    <span className="summary-simple-value">{sale.customer_name || '-'}</span>
                  </div>
                  <div className="summary-simple-row">
                    <span className="summary-simple-label">Kasir</span>
                    <span className="summary-simple-value">{sale.cashier_name || '-'}</span>
                  </div>
                  <div className="summary-simple-row">
                    <span className="summary-simple-label">Gudang</span>
                    <span className="summary-simple-value">{sale.warehouse_name || '-'}</span>
                  </div>
                  <div className="summary-simple-row">
                    <span className="summary-simple-label">Status</span>
                    <span className={`summary-simple-value status-badge status-${sale.status?.toLowerCase()}`}>
                      {getStatusLabel(sale.status)}
                    </span>
                  </div>
                  <div className="summary-simple-row">
                    <span className="summary-simple-label">Subtotal</span>
                    <span className="summary-simple-value">{formatCurrency(sale.subtotal)}</span>
                  </div>
                  <div className="summary-simple-row">
                    <span className="summary-simple-label">Diskon</span>
                    <span className="summary-simple-value text-red">-{formatCurrency(sale.discount_amount)}</span>
                  </div>
                  <div className="summary-simple-row">
                    <span className="summary-simple-label">Pajak</span>
                    <span className="summary-simple-value text-blue">{formatCurrency(sale.tax_amount)}</span>
                  </div>
                  <div className="summary-simple-row">
                    <span className="summary-simple-label">Total</span>
                    <span className="summary-simple-value text-green">{formatCurrency(sale.total_amount)}</span>
                  </div>

                  {payments.length > 0 && (
                    <>
                      <div className="summary-simple-row" style={{ marginTop: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                        <span className="summary-simple-label" style={{ fontWeight: 600 }}>Pembayaran</span>
                      </div>
                      {payments.map((payment, idx) => (
                        <div key={idx} className="summary-simple-row">
                          <span className="summary-simple-label">{payment.payment_method || 'Tunai'}</span>
                          <span className="summary-simple-value">{formatCurrency(payment.amount)}</span>
                        </div>
                      ))}
                      <div className="summary-simple-row">
                        <span className="summary-simple-label">Total Bayar</span>
                        <span className="summary-simple-value text-green">{formatCurrency(sale.paid_amount)}</span>
                      </div>
                      <div className="summary-simple-row">
                        <span className="summary-simple-label">Kembalian</span>
                        <span className="summary-simple-value">{formatCurrency(sale.change_amount)}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'items' && (
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
                            <td>{item.product_name || item.product_id}</td>
                            <td className="text-right">{item.quantity}</td>
                            <td>{item.unit || '-'}</td>
                            <td className="text-right">{formatCurrency(item.price)}</td>
                            <td className="text-right">{formatCurrency(item.subtotal)}</td>
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
            {activeTab === 'items' && (
              <span className="stock-card-total-row">Total Item: {items.length}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}