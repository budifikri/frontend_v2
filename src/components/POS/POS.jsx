import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../shared/auth'
import './POS.css'

export function POS() {
  const { auth, clearAuth } = useAuth()
  const [items, _setItems] = useState([
    { id: 1, name: 'Organic Coffee Beans 250g', qty: 2, price: 85000 },
    { id: 2, name: 'Stainless Milk Pitcher 600ml', qty: 1, price: 225000 },
    { id: 3, name: 'Paper Filters (V60-02)', qty: 3, price: 45000 },
  ])
  const [search, setSearch] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchInputRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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
  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : null
  const displayItem = selectedItem || items[items.length - 1]

  const handleItemClick = (item, index) => {
    setSelectedIndex(index)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (items.length > 0) {
        const nextIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : items.length - 1
        setSelectedIndex(nextIndex)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (items.length > 0) {
        const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : 0
        setSelectedIndex(prevIndex)
      }
    }
  }

  const promos = [
    'Beli 2 Kopi Gratis 1',
    'Diskon 10% Khusus Member Baru',
    'Flash Sale Jam 3 Sore!',
    'Voucher Cashback Rp 25rb',
    'Belanja min. 200rb dapat kupon undian',
    'Weekend Special: Coffee Beans Buy 1 Get 1',
    'Extra Point for reusable cup users',
    'Free Cookies for purchase over 300k',
  ]

  const company = `${auth.companyName || ''}`
  const merk = 'PosXpress' 

  return (
    <div className="pos-screen">
      {/* Top Header 
      <header className="pos-header">
        <div className="pos-header-left">
          <span className="desktop-dot" aria-hidden="true" />
          <strong>{title}</strong>
        </div>
        <div className="pos-header-right">
          <div className="pos-cashier">Cashier: <strong>{auth.username}</strong></div>
          <div className="pos-status-badge">System Online</div>
        </div>
      </header>
      */}

      {/* Main Content */}
      <div className="pos-content">
        {/* Left: Receipt Paper (40%) */}
        <main className="pos-main-left">
          <div className="receipt-paper">
            <div className="receipt-header">
              <h2 className="receipt-title">NOTA PENJUALAN</h2>
              <div>
              <div className="receipt-subtitle">{company}
              </div>
              <div className="receipt-meta">              
                <span>INV/20231024/001</span>
                <span>{currentTime.toLocaleDateString('en-GB')} {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              </div>
            </div>

            <div className="receipt-items-wrapper">
              <div className="receipt-items">
                {items.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className={`receipt-item ${selectedIndex === idx ? 'is-selected' : ''}`}
                    onClick={() => handleItemClick(item, idx)}
                  >
                    <div className="receipt-item-no">{idx + 1}</div>
                    <div className="receipt-item-info">
                      <div className="receipt-item-name">{item.name}</div>
                      <div className="receipt-item-price">{item.qty} x {formatCurrency(item.price)}</div>
                    </div>
                    <div className="receipt-item-total">{formatCurrency(item.price * item.qty)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="receipt-summary">
              <div className="receipt-total-row">
                <span>TOTAL ({items.length} item)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="receipt-tax-row">
                <span>Tax (PPN 11%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            </div>

            <div className="receipt-footer">
              <div className="pos-search-container">
                <span className="material-icons">search</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Cari barang atau scan barcode..."
                  className="pos-search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  autoFocus
                />
                <span className="material-icons barcode-icon">qr_code_scanner</span>
              </div>
              <button className="pos-btn-bayar">
                <span className="material-icons">payments</span>
                <span className="pos-btn-bayar-text">BAYAR</span>
              </button>
            </div>
          </div>
        </main>

        {/* Right: Monitor + Promo (60%) */}
        <section className="pos-main-right">
          {/* Customer Display Monitor */}
          <div className="monitor-frame">
            <div className="monitor-screen">
              <div className="monitor-top">
                <div className="monitor-status">
          <strong>{merk}</strong>
      
                </div>
 <div className="pos-header-right">
          <div className="pos-cashier">Cashier: <strong>{auth.username}</strong></div>
           <div className="monitor-time">{currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
              </div>
        </div>
                
               
              <div className="monitor-item">
                <div className="monitor-item-name">{displayItem?.name || 'No Item'}</div>
                <div className="monitor-item-price">{displayItem ? formatCurrency(displayItem.price) : 'Rp 0'}</div>
              </div>
              <div className="monitor-bottom">
                  <div className="monitor-count">    <div className="pos-status-badge">System Online</div>  {/*  ITEMS: {String(items.length).padStart(2, '0')}  */}</div>  
                <div className="monitor-amount">
               {/*    <div className="monitor-amount-label">AMOUNT DUE</div> */}
                  <div className="monitor-amount-value">{formatCurrency(total)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Promo Sticky Note */}
          <div className="sticky-note">
            <div className="push-pin"></div>
            <div className="sticky-note-content">
              <h3 className="promo-title">PROMO HARI INI</h3>
              <ul className="promo-list">
                {promos.map((promo, idx) => (
                  <li key={idx}>{promo}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Right Sidebar (Action Keys) */}
        <aside className="pos-sidebar">
          <button className="action-key action-key-amber">
            <span className="material-icons">pause_circle</span>
            <span>Pending</span>
          </button>
          <button className="action-key action-key-slate">
            <span className="material-icons">print</span>
            <span>Cetak</span>
          </button>
          <button className="action-key action-key-emerald">
            <span className="material-icons">account_balance_wallet</span>
            <span>Cash In</span>
          </button>
          <button className="action-key action-key-rose">
            <span className="material-icons">account_balance_wallet</span>
            <span>Cash Out</span>
          </button>
          <button className="action-key action-key-gray">
            <span className="material-icons">settings</span>
            <span>Setting</span>
          </button>
          <button className="action-key action-key-indigo">
            <span className="material-icons">help_outline</span>
            <span>Help</span>
          </button>
          <button className="action-key action-key-dark" onClick={handleLogout}>
            <span className="material-icons power-icon">power_settings_new</span>
            <span>Close</span>
          </button>
        </aside>
      </div>
    </div>
  )
}
