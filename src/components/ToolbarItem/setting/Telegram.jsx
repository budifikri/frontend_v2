import { useCallback, useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../../shared/auth'
import { getTelegramConfig, saveTelegramConfig, testTelegramConnection } from '../../../features/setting/telegram.api'

const SAMPLE_SALE = {
  sale_number: 'SL-2026-0001',
  created_at: '17 Apr 2026, 10:30:00',
  total_amount: 125000,
  cashier_name: 'Admin',
}

const SAMPLE_SALE_ITEMS = [
  { product_name: 'Kopi Kapal Api 250g', quantity: 2, unit_price: 15000 },
  { product_name: 'Gula Putih 1Kg', quantity: 1, unit_price: 14000 },
  { product_name: 'Kopi Instant 3in1', quantity: 3, unit_price: 2500 },
  { product_name: 'Teh Botol Sosro 350ml', quantity: 6, unit_price: 4000 },
  { product_name: 'Indomie Goreng', quantity: 4, unit_price: 3500 },
]

const SAMPLE_PURCHASE = {
  po_number: 'PO-2026-0001',
  created_at: '17 Apr 2026',
  total_amount: 2500000,
  supplier_name: 'PT Sumber Rejeki',
}

const SAMPLE_PURCHASE_ITEMS = [
  { product_name: 'Kopi Kapal Api 250g', qty_po: 50, line_total: 750000 },
  { product_name: 'Gula Putih 1Kg', qty_po: 100, line_total: 1400000 },
  { product_name: 'Teh Botol Sosro 350ml', qty_po: 200, line_total: 350000 },
]

const SAMPLE_STOCK_OPNAME = {
  warehouse_name: 'Gudang Pusat',
  created_at: '17 Apr 2026',
  status: 'SELESAI',
  total_sku: 150,
  sesuai: 145,
  selisih: 5,
}

const SAMPLE_CLOSING_DRAWER = {
  drawer_number: 'CD-2026-0001',
  created_at: '17 Apr 2026, 21:00:00',
  total_amount: 2500000,
  cashier_name: 'Admin',
  bank_name: 'BCA',
  account_number: '1234567890',
}

const DEFAULT_FORM = {
  telegram_id_penjualan: '',
  telegram_id_pembelian: '',
  telegram_id_stock_opname: '',
  telegram_id_closing_drawer: '',
  notify_penjualan: false,
  notify_pembelian: false,
  notify_stock_opname: false,
  notify_closing_drawer: false,
  is_active: true,
}

function mapFormFromData(data) {
  return {
    telegram_id_penjualan: data.telegram_id_penjualan || '',
    telegram_id_pembelian: data.telegram_id_pembelian || '',
    telegram_id_stock_opname: data.telegram_id_stock_opname || '',
    telegram_id_closing_drawer: data.telegram_id_closing_drawer || '',
    notify_penjualan: data.notify_penjualan || false,
    notify_pembelian: data.notify_pembelian || false,
    notify_stock_opname: data.notify_stock_opname || false,
    notify_closing_drawer: data.notify_closing_drawer || false,
    is_active: data.is_active !== false,
  }
}

function formatPenjualanPreview(sale, items) {
  let msg = '*PENJUALAN BARU*\n\n'
  msg += `🕒 Waktu: ${sale.created_at}\n`
  msg += `💰 Total: Rp ${sale.total_amount.toLocaleString('id-ID')}\n`
  msg += `👤 Kasir: ${sale.cashier_name}\n`
  msg += `🏷️ No: ${sale.sale_number}\n`
  msg += '\n📦 *Detail Produk:*\n'
  msg += '━━━━━━━━━━━━━━━━━━━━━━━\n'
  items.forEach((item) => {
    const lineTotal = item.unit_price * item.quantity
    msg += `• ${item.product_name} × ${item.quantity} = Rp ${lineTotal.toLocaleString('id-ID')}\n`
  })
  msg += '━━━━━━━━━━━━━━━━━━━━━━━\n'
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0)
  msg += `📊 Total Item: ${items.length} | Qty: ${totalQty}\n`
  return msg
}

function formatPembelianPreview(purchase, items) {
  let msg = '*PEMBELIAN BARU*\n\n'
  msg += `🏢 Supplier: ${purchase.supplier_name}\n`
  msg += `📅 Tanggal: ${purchase.created_at}\n`
  msg += `💰 Total: Rp ${purchase.total_amount.toLocaleString('id-ID')}\n`
  msg += `📄 No: ${purchase.po_number}\n`
  msg += '\n📦 *Detail Produk:*\n'
  msg += '━━━━━━━━━━━━━━━━━━━━━━━\n'
  items.forEach((item) => {
    msg += `• ${item.product_name} × ${item.qty_po} = Rp ${item.line_total.toLocaleString('id-ID')}\n`
  })
  msg += '━━━━━━━━━━━━━━━━━━━━━━━\n'
  const totalQty = items.reduce((sum, item) => sum + item.qty_po, 0)
  msg += `📊 Total Item: ${items.length} | Qty: ${totalQty}\n`
  return msg
}

function formatStockOpnamePreview(opname) {
  let msg = '*STOCK OPNAME SELESAI*\n\n'
  msg += `🏢 Warehouse: ${opname.warehouse_name}\n`
  msg += `📅 Tanggal: ${opname.created_at}\n`
  msg += `✅ Status: ${opname.status}\n`
  msg += '\n📊 *Ringkasan:*\n'
  msg += '━━━━━━━━━━━━━━━━━━━━━━━\n'
  msg += `📋 Total SKU: ${opname.total_sku}\n`
  msg += `✅ Sesuai: ${opname.sesuai}\n`
  msg += `⚠️ Selisih: ${opname.selisih} item\n`
  msg += '━━━━━━━━━━━━━━━━━━━━━━━\n'
  return msg
}

function formatClosingDrawerPreview(drawer) {
  let msg = '*CLOSING DRAWER*\n\n'
  msg += `🕒 Waktu: ${drawer.created_at}\n`
  msg += `👤 Kasir: ${drawer.cashier_name}\n`
  msg += `🏷️ No: ${drawer.drawer_number}\n`
  msg += '\n💰 *Setoran:*\n'
  msg += '━━━━━━━━━━━━━━━━━━━━━━━\n'
  msg += `🏦 Bank: ${drawer.bank_name}\n`
  msg += `📃 No. Rek: ${drawer.account_number}\n`
  msg += `💵 Total: Rp ${drawer.total_amount.toLocaleString('id-ID')}\n`
  msg += '━━━━━━━━━━━━━━━━━━━━━━━\n'
  msg += '\n✅ Penutupan laci telah dilakukan!'
  return msg
}

export function Telegram({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token
  const user = { companyName: auth?.companyName }

  const [isSaving, setIsSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  const [form, setForm] = useState(DEFAULT_FORM)
  const [isEditing, setIsEditing] = useState(false)
  const [activePreview, setActivePreview] = useState('penjualan')

  const previewMessages = useMemo(() => ({
    penjualan: formatPenjualanPreview(SAMPLE_SALE, SAMPLE_SALE_ITEMS),
    pembelian: formatPembelianPreview(SAMPLE_PURCHASE, SAMPLE_PURCHASE_ITEMS),
    stock_opname: formatStockOpnamePreview(SAMPLE_STOCK_OPNAME),
    closing_drawer: formatClosingDrawerPreview(SAMPLE_CLOSING_DRAWER),
  }), [])

  const fetchData = useCallback(async () => {
    try {
      if (!token) return

      const data = await getTelegramConfig(token)
      if (data) {
        setForm(mapFormFromData(data))
      }
    } catch (err) {
      setToastMessage(err.message || 'Gagal memuat konfigurasi telegram')
      setToastType('error')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showExitConfirm) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setShowExitConfirm(false)
        }
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        setShowExitConfirm(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showExitConfirm])

  function handleEditClick() {
    setIsEditing(true)
  }

  async function handleSave() {
    setIsSaving(true)

    try {
      await saveTelegramConfig(token, form)
      setIsEditing(false)
      setToastMessage('Konfigurasi tersimpan')
      setToastType('success')
      setShowToast(true)

      setTimeout(() => {
        setShowToast(false)
      }, 3000)
    } catch (err) {
      setToastMessage(err.message || 'Gagal menyimpan konfigurasi')
      setToastType('error')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleTest(telegramId, typeLabel) {
    if (!telegramId) {
      setToastMessage('Telegram ID harus diisi')
      setToastType('error')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
      return
    }

    const typeMap = {
      'Penjualan': 'penjualan',
      'Pembelian': 'pembelian',
      'Stock Opname': 'stock_opname',
      'Closing Drawer': 'closing_drawer',
    }
    const type = typeMap[typeLabel] || typeLabel

    setTesting(true)

    try {
      await testTelegramConnection(token, telegramId, type)
      setToastMessage(`Koneksi ${typeLabel} berhasil!`)
      setToastType('success')
      setShowToast(true)

      setTimeout(() => {
        setShowToast(false)
      }, 3000)
    } catch (err) {
      setToastMessage(`Koneksi ${typeLabel} gagal: ` + (err.message || 'Unknown error'))
      setToastType('error')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } finally {
      setTesting(false)
    }
  }

  function handleConfirmExit() {
    setShowExitConfirm(false)
    onExit()
  }

  return (
    <div className="master-content">
      <div className="master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Pengaturan Telegram</h1>
        <div className="backup-footer-company master-header-filters">
          <span className="material-icons-round">business</span>
          {user?.companyName || 'Company'}
        </div>
      </div>

      {showToast && (
        <div className={`toast-notification toast-${toastType}`}>
          <span className="material-icons-round">{toastType === 'success' ? 'check_circle' : 'error'}</span>
          {toastMessage}
        </div>
      )}

      <div className="master-table-wrapper">
        <div className="master-table-container">
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="receipt-setting-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="receipt-setting-section">                   
                    <div className="receipt-setting-field-inline">  <h4>Notifikasi Penjualan</h4> 
                      <label htmlFor="notify-penjualan">Aktif</label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          id="notify-penjualan"
                          checked={form.notify_penjualan}
                          onChange={(e) => setForm({ ...form, notify_penjualan: e.target.checked })}
                          disabled={!isEditing}
                        />
                        <span className="checkbox-custom"></span>
                      </label>
                    
   {form.notify_penjualan && (
                      <div className="receipt-setting-field-inline">
                        <label htmlFor="telegram-id-penjualan">Telegram ID</label>
                        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                          <input
                            type="text"
                            id="telegram-id-penjualan"
                            className="receipt-text-input"
                            value={form.telegram_id_penjualan}
                            onChange={(e) => setForm({ ...form, telegram_id_penjualan: e.target.value })}
                            readOnly={!isEditing}
                            placeholder="Telegram ID untuk Penjualan"
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            className="master-btn-secondary test-btn"
                            onClick={() => handleTest(form.telegram_id_penjualan, 'Penjualan')}
                            disabled={testing || !form.telegram_id_penjualan || !form.notify_penjualan}
                          >
                            TEST
                          </button>
                        </div>
                      </div>
                    )}
                    </div>
                 
                  </div>

                  <div className="receipt-setting-section">
                
                    <div className="receipt-setting-field-inline">
                        <h4>Notifikasi Pembelian</h4>
                      <label htmlFor="notify-pembelian">Aktif</label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          id="notify-pembelian"
                          checked={form.notify_pembelian}
                          onChange={(e) => setForm({ ...form, notify_pembelian: e.target.checked })}
                          disabled={!isEditing}
                        />
                        <span className="checkbox-custom"></span>
                      </label>
                       {form.notify_pembelian && (
                      <div className="receipt-setting-field-inline">
                        <label htmlFor="telegram-id-pembelian">Telegram ID</label>
                        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                          <input
                            type="text"
                            id="telegram-id-pembelian"
                            className="receipt-text-input"
                            value={form.telegram_id_pembelian}
                            onChange={(e) => setForm({ ...form, telegram_id_pembelian: e.target.value })}
                            readOnly={!isEditing}
                            placeholder="Telegram ID untuk Pembelian"
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            className="master-btn-secondary test-btn"
                            onClick={() => handleTest(form.telegram_id_pembelian, 'Pembelian')}
                            disabled={testing || !form.telegram_id_pembelian || !form.notify_pembelian}
                          >
                            TEST
                          </button>
                        </div>
                      </div>
                    )}
                    </div>
                   
                  </div>

                  <div className="receipt-setting-section">
                  
                    <div className="receipt-setting-field-inline">
                      <h4>Notifikasi Stock Opname</h4>
                      <label htmlFor="notify-stock-opname">Aktif</label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          id="notify-stock-opname"
                          checked={form.notify_stock_opname}
                          onChange={(e) => setForm({ ...form, notify_stock_opname: e.target.checked })}
                          disabled={!isEditing}
                        />
                        <span className="checkbox-custom"></span>
                      </label>
                        {form.notify_stock_opname && (
                      <div className="receipt-setting-field-inline">
                        <label htmlFor="telegram-id-stock-opname">Telegram ID</label>
                        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                          <input
                            type="text"
                            id="telegram-id-stock-opname"
                            className="receipt-text-input"
                            value={form.telegram_id_stock_opname}
                            onChange={(e) => setForm({ ...form, telegram_id_stock_opname: e.target.value })}
                            readOnly={!isEditing}
                            placeholder="Telegram ID untuk Stock Opname"
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            className="master-btn-secondary test-btn"
                            onClick={() => handleTest(form.telegram_id_stock_opname, 'Stock Opname')}
                            disabled={testing || !form.telegram_id_stock_opname || !form.notify_stock_opname}
                          >
                            TEST
                          </button>
                        </div>
                      </div>
                    )}
                    </div>
                  
                  </div>

                  <div className="receipt-setting-section">
          
                    <div className="receipt-setting-field-inline">
                              <h4>Notifikasi Closing Drawer</h4>
                      <label htmlFor="notify-closing-drawer">Aktif</label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          id="notify-closing-drawer"
                          checked={form.notify_closing_drawer}
                          onChange={(e) => setForm({ ...form, notify_closing_drawer: e.target.checked })}
                          disabled={!isEditing}
                        />
                        <span className="checkbox-custom"></span>
                      </label>
                       {form.notify_closing_drawer && (
                      <div className="receipt-setting-field-inline">
                        <label htmlFor="telegram-id-closing-drawer">Telegram ID</label>
                        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                          <input
                            type="text"
                            id="telegram-id-closing-drawer"
                            className="receipt-text-input"
                            value={form.telegram_id_closing_drawer}
                            onChange={(e) => setForm({ ...form, telegram_id_closing_drawer: e.target.value })}
                            readOnly={!isEditing}
                            placeholder="Telegram ID untuk Closing Drawer"
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            className="master-btn-secondary test-btn"
                            onClick={() => handleTest(form.telegram_id_closing_drawer, 'Closing Drawer')}
                            disabled={testing || !form.telegram_id_closing_drawer || !form.notify_closing_drawer}
                          >
                            TEST
                          </button>
                        </div>
                      </div>
                    )}
                    </div>
                   
                  </div>
                </div>
              </div>

              <div style={{ width: '400px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Preview Message</h2>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      className={`product-form-tab ${activePreview === 'penjualan' ? 'active' : ''}`}
                      onClick={() => setActivePreview('penjualan')}
                    >
                      Penjualan
                    </button>
                    <button
                      type="button"
                      className={`product-form-tab ${activePreview === 'pembelian' ? 'active' : ''}`}
                      onClick={() => setActivePreview('pembelian')}
                    >
                      Pembelian
                    </button>
                    <button
                      type="button"
                      className={`product-form-tab ${activePreview === 'stock_opname' ? 'active' : ''}`}
                      onClick={() => setActivePreview('stock_opname')}
                    >
                      Stock Opname
                    </button>
                    <button
                      type="button"
                      className={`product-form-tab ${activePreview === 'closing_drawer' ? 'active' : ''}`}
                      onClick={() => setActivePreview('closing_drawer')}
                    >
                      Closing Drawer
                    </button>
                  </div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', background: '#fff', padding: '12px', minHeight: '350px', maxHeight: '60vh', overflow: 'auto' }}>
                  <pre className="telegram-preview-text">{previewMessages[activePreview]}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="master-footer">
        <div className="master-footer-actions">
          <button type="button" className="master-btn-save-primary" onClick={isEditing ? handleSave : handleEditClick} disabled={isSaving}>
            <span className="material-icons-round">{isEditing ? 'save' : 'edit'}</span>
            {isEditing ? 'SIMPAN' : 'EDIT'}
          </button>
          {isEditing ? (
            <button type="button" className="master-btn-cancel-secondary" onClick={() => setIsEditing(false)}>
              BATAL
            </button>
          ) : (
            <button type="button" className="master-footer-btn" onClick={onExit}>
              <span className="material-icons-round master-footer-icon red">exit_to_app</span>
            </button>
          )}
        </div>
      </div>

      {showExitConfirm && (
        <div className="master-dialog-overlay">
          <div className="master-dialog">
            <h3 className="master-dialog-title">Konfirmasi Keluar</h3>
            <p className="master-dialog-text">Apakah Anda yakin ingin keluar dari halaman ini?</p>
            <div className="master-dialog-actions">
              <button className="master-btn master-btn-primary" onClick={handleConfirmExit}>Ya</button>
              <button className="master-btn master-btn-secondary" onClick={() => setShowExitConfirm(false)}>Tidak</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
