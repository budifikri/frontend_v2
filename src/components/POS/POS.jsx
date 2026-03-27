import { useState, useEffect } from 'react'
import { useAuth } from '../../shared/auth'
import './POS.css'

export function POS() {
  const { auth, clearAuth } = useAuth()
  const [items, _setItems] = useState([])
  const [search, setSearch] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    if (window.confirm('Keluar dari POS?')) {
      clearAuth()
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0)
  const tax = subtotal * 0.11
  const total = subtotal + tax

  return (
    <div className="pos-screen">
      {/* Top Header */}
      <header className="pos-header">
        <div className="pos-header-left">
          <span className="material-icons">shopping_cart</span>
          <span className="pos-title">POS RETAIL - {auth.companyName || 'MINIMARKET'}</span>
        </div>
        <div className="pos-header-right">
          <div className="pos-header-info">
            <span className="material-icons">calendar_today</span>
            <span>{currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="pos-header-info">
            <span className="material-icons">schedule</span>
            <span>{currentTime.toLocaleTimeString('id-ID')}</span>
          </div>
          <div className="pos-header-info pos-header-user">
            <span className="material-icons">person</span>
            <span>{auth.username} (KASIR)</span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="pos-main">
        {/* Left Column: Transaction List */}
        <div className="pos-transaction-list">
          <div className="pos-search-container">
            <div className="pos-search-box">
              <span className="material-icons">qr_code_scanner</span>
              <input
                type="text"
                placeholder="Scan Barcode atau Cari Barang... (F2)"
                className="pos-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="pos-table-container">
            <table className="pos-table">
              <thead>
                <tr>
                  <th className="pos-th-no">No</th>
                  <th className="pos-th-name">Nama Barang</th>
                  <th className="pos-th-price">Harga</th>
                  <th className="pos-th-qty">Qty</th>
                  <th className="pos-th-disc">Disc</th>
                  <th className="pos-th-total">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="pos-empty-state">
                      <span className="material-icons">inventory_2</span>
                      <p>Belum ada barang. Silakan scan barcode...</p>
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="text-center">{idx + 1}</td>
                      <td>{item.name}</td>
                      <td className="text-right">{formatCurrency(item.price)}</td>
                      <td className="text-center">{item.qty}</td>
                      <td className="text-right">{formatCurrency(item.discount || 0)}</td>
                      <td className="text-right pos-total-cell">{formatCurrency(item.price * item.qty)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Information & Actions */}
        <div className="pos-sidebar">
          {/* Grand Total Display */}
          <div className="pos-grand-total">
            <span className="pos-grand-total-label">Total Bayar</span>
            <div className="pos-grand-total-amount">
              {formatCurrency(total)}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="pos-summary">
            <div className="pos-summary-row">
              <span>Subtotal</span>
              <span className="pos-summary-value">{formatCurrency(subtotal)}</span>
            </div>
            <div className="pos-summary-row">
              <span>Pajak (11%)</span>
              <span className="pos-summary-value">{formatCurrency(tax)}</span>
            </div>
            <div className="pos-summary-row">
              <span>Diskon</span>
              <span className="pos-summary-value pos-summary-discount">({formatCurrency(0)})</span>
            </div>
            <div className="pos-summary-grand">
              <span>Grand Total</span>
              <span className="pos-summary-grand-value">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Customer Selection */}
          <button className="pos-customer-btn">
            <div className="pos-customer-info">
              <span className="material-icons">groups</span>
              <div>
                <div className="pos-customer-label">Pelanggan (F4)</div>
                <div className="pos-customer-name">CUSTOMER UMUM</div>
              </div>
            </div>
            <span className="material-icons">chevron_right</span>
          </button>

          {/* Action Buttons */}
          <div className="pos-actions">
            <button className="pos-btn-bayar">
              <span className="material-icons">payments</span>
              <span className="pos-btn-bayar-text">BAYAR</span>
              <span className="pos-btn-bayar-shortcut">(F10)</span>
            </button>
            <div className="pos-btn-row">
              <button className="pos-btn-pending">PENDING</button>
              <button className="pos-btn-batal">BATAL</button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Shortcuts */}
      <footer className="pos-footer">
        <div className="pos-shortcuts">
          <span><kbd>F2</kbd> CARI BARANG</span>
          <span><kbd>F4</kbd> PELANGGAN</span>
          <span><kbd>F10</kbd> BAYAR</span>
          <span className="pos-shortcut-danger"><kbd>ESC</kbd> KELUAR</span>
        </div>
        <div className="pos-status">
          <span>Status: <strong>READY</strong></span>
          <span>Shift: <strong>PAGI</strong></span>
          <button onClick={handleLogout} className="pos-logout-btn">LOGOUT</button>
        </div>
      </footer>
    </div>
  )
}
