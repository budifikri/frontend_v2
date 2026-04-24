import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getPurchase, receivePurchase } from '../../../features/transaksi/purchase/purchase.api'
import { useAuth } from '../../../shared/auth'
import { DeleteMaster } from '../footer/DeleteMaster'
import { Toast } from '../../Toast'
import './PurchaseDetail.css'
import './StockReceiveDetail.css'

function toDateInputValue(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value).slice(0, 10)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function nowDateInputValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function StockReceiveDetail({ selectedId, onExit, onSaveSuccess }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const searchInputRef = useRef(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const [header, setHeader] = useState({
    id: selectedId,
    po_number: '',
    receive_number: '',
    supplier_id: '',
    supplier_name: '',
    warehouse_id: '',
    warehouse_name: '',
    expected_date: '',
    notes: '',
    status_receive: 'draft',
    receive_date: nowDateInputValue(),
  })
  const [items, setItems] = useState([])

  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' })
  const currentStatusReceive = String(header.status_receive || 'draft').toLowerCase()
  const isReceiveLocked = currentStatusReceive === 'receive'
  const isRejectLocked = currentStatusReceive === 'reject'
  const isQtyEditable = !isReceiveLocked && !isRejectLocked

  const load = useCallback(async () => {
    if (!selectedId) return
    setIsLoading(true)
    setError('')
    try {
      const data = await getPurchase(token, selectedId)
      setHeader(prev => ({
        ...prev,
        id: data.id,
        po_number: data.po_number,
        receive_number: data.receive_number,
        supplier_id: data.supplier_id,
        supplier_name: data.supplier_name,
        warehouse_id: data.warehouse_id,
        warehouse_name: data.warehouse_name,
        expected_date: toDateInputValue(data.expected_date),
        notes: data.notes,
        status_receive: data.status_receive || 'draft',
        receive_date: toDateInputValue(data.receive_date) || nowDateInputValue(),
      }))
      setItems((data.items || []).map((it) => ({
        id: it.id,
        product_id: it.product_id,
        sku: it.sku,
        product_name: it.product_name,
        qty_po: Number(it.quantity || 0),
        qty_receive: (() => {
          const qtyPo = Number(it.quantity || 0)
          const qtyReceive = Number(it.qty_receive)

          return Number.isFinite(qtyReceive) && qtyReceive > 0
            ? qtyReceive
            : qtyPo
        })(),
      })))
      setSelectedIndex(0)
      setSearch('')
    } catch (err) {
      setError(err.message || 'Failed to load stock receive')
    } finally {
      setIsLoading(false)
    }
  }, [token, selectedId])

  useEffect(() => {
    load()
  }, [load])

  const summary = useMemo(() => {
    const totalQtyPo = items.reduce((sum, it) => sum + (Number(it.qty_po) || 0), 0)
    const totalQtyReceive = items.reduce((sum, it) => sum + (Number(it.qty_receive) || 0), 0)
    return { totalQtyPo, totalQtyReceive }
  }, [items])

  const updateItem = (id, updates) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it
      const next = { ...it, ...updates }
      if (next.qty_receive < 0) next.qty_receive = 0
      if (next.qty_receive > next.qty_po) next.qty_receive = next.qty_po
      return next
    }))
  }

  useEffect(() => {
    if (currentStatusReceive === 'reject') {
      setItems(prev => prev.map(it => (it.qty_receive === 0 ? it : { ...it, qty_receive: 0 })))
    }
  }, [currentStatusReceive])

  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(items.length > 0 ? items.length - 1 : 0)
    }
  }, [items.length, selectedIndex])

  const focusSearchInput = useCallback(() => {
    const input = searchInputRef.current
    if (!input) return
    input.focus()
  }, [])

  const handleSearchChange = (value) => {
    if (!isQtyEditable) return
    setSearch(value)
  }

  const handleSearchKeyDown = (e) => {
    if (!isQtyEditable) {
      e.preventDefault()
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()

      const currentSearch = search.trim()
      const qtyMatch = currentSearch.match(/^\+(\d+)$/)
      if (qtyMatch && items.length > 0 && selectedIndex >= 0 && selectedIndex < items.length) {
        const newQty = parseInt(qtyMatch[1], 10)
        if (newQty >= 0) {
          const selectedItem = items[selectedIndex]
          updateItem(selectedItem.id, { qty_receive: newQty })
          setToast({ isOpen: true, message: `Qty ${selectedItem.product_name || selectedItem.sku || 'item'} menjadi ${newQty}`, type: 'success' })
        }
        setSearch('')
        focusSearchInput()
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (items.length > 0) {
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1))
      }
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (items.length > 0) {
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      }
    }
  }

  const handleStatusReceiveChange = (newStatus) => {
    const next = String(newStatus || '').toLowerCase()
    const current = String(header.status_receive || 'draft').toLowerCase()

    if (current === 'receive' && next !== 'receive') return
    if (current === 'reject' && next === 'receive') return

    setHeader(prev => ({ ...prev, status_receive: next }))

    if (next === 'reject') {
      setItems(prev => prev.map(it => ({ ...it, qty_receive: 0 })))
      setSearch('')
    }
  }

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setError('')
    try {
      const payload = {
        status_receive: header.status_receive,
        receive_date: header.receive_date,
        items: items.map(it => ({
          id: it.id,
          qty_receive: currentStatusReceive === 'reject' ? 0 : it.qty_receive,
        })),
      }

      if (payload.items.length === 0) {
        setToast({ isOpen: true, message: 'Items belum ada', type: 'info' })
        setIsSaving(false)
        return
      }

      await receivePurchase(token, header.id, payload)
      if (onSaveSuccess) onSaveSuccess('Stock Receive berhasil disimpan', 'success')
      onExit()
    } catch (err) {
      const msg = err.message || 'Failed to save stock receive'
      setError(msg)
      if (onSaveSuccess) onSaveSuccess(msg, 'error')
    } finally {
      setIsSaving(false)
    }
  }, [token, header, items, onExit, onSaveSuccess, currentStatusReceive])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showExitConfirm) return
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave() }
      else if (e.key === 'Escape') { e.preventDefault(); setShowExitConfirm(true) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, showExitConfirm])

  return (
    <div className="po-layout-container stock-receive-layout">
      <Toast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        duration={4000}
      />

      <div className="po-main-content">
        <div className="po-items-wrapper">
          {error && <div className="master-error" style={{ marginBottom: 12 }}>{error}</div>}

          {items.length === 0 ? (
            <div className="po-empty-items">
              <span className="material-icons">receipt_long</span>
              <p>Tidak ada item untuk diterima.</p>
            </div>
          ) : (
            <div className="table-wrapper custom-scrollbar">
              <table className="po-items-table stock-receive-items-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>SKU</th>
                    <th style={{ textAlign: 'left' }}>Produk</th>
                    <th style={{ textAlign: 'center' }}>Qty PO</th>
                    <th style={{ textAlign: 'center' }}>Qty Receive</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className={selectedIndex === index ? 'selected' : ''} onClick={() => setSelectedIndex(index)}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="po-product-name">{item.sku || '-'}</div>
                      </td>
                      <td style={{ textAlign: 'left' }}>
                        <div className="po-product-name">{item.product_name || '-'}</div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.qty_po}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="po-item-qty stock-receive-qty-display">{currentStatusReceive === 'reject' ? 0 : item.qty_receive}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="po-footer-input">
          <div className="po-search-container stock-receive-command-container">
            <span className="material-icons">search</span>
              <input
                ref={searchInputRef}
                type="text"
                inputMode="text"
                className="po-search-input stock-receive-command-input"
                placeholder="Ketik +qty untuk ubah qty receive..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
                disabled={!isQtyEditable}
              />
          </div>
          <div className="po-action-buttons stock-receive-footer-actions">
            <button type="button" className="po-btn po-btn-exit" onClick={() => setShowExitConfirm(true)} disabled={isSaving}>
              <span className="material-icons">exit_to_app</span>
              KELUAR
            </button>
            <button type="button" className="po-btn po-btn-save" onClick={handleSave} disabled={isSaving || isLoading || items.length === 0}>
              <span className="material-icons">save</span>
              SIMPAN
            </button>
          </div>
        </div>
      </div>

      <aside className="po-sidebar">
          <div className="po-header-section">
            <h1 className="po-title">STOCK RECEIVE</h1>
            
          <div className="stock-receive-status-group">
            <button
              type="button"
              className={`stock-receive-status-button ${currentStatusReceive === 'draft' ? 'is-active' : 'is-inactive'}`}
              disabled={isReceiveLocked}
              onClick={() => handleStatusReceiveChange('draft')}
            >
              Draft
            </button>
            <button
              type="button"
              className={`stock-receive-status-button ${currentStatusReceive === 'receive' ? 'is-active' : 'is-inactive'}`}
              disabled={isRejectLocked}
              onClick={() => handleStatusReceiveChange('receive')}
            >
              Receive
            </button>
            <button
              type="button"
              className={`stock-receive-status-button ${currentStatusReceive === 'reject' ? 'is-active' : 'is-inactive'}`}
              disabled={isReceiveLocked}
              onClick={() => handleStatusReceiveChange('reject')}
            >
              Reject
            </button>
          </div>
            {/*
            <div className="po-status-display">
            <span className="po-status-label">Bar Status :</span>
            <span className="po-status-value">{currentStatusReceive.toUpperCase()}</span>
            </div>  */}


            
          </div>

        <div className="po-meta-info">
          <div className="po-meta-item">
            <span className="po-meta-label">No. Receive</span>
            <span className="po-meta-value">{header.receive_number || '-'}</span>
          </div>
          <div className="po-meta-item">
            <span className="po-meta-label">No. PO</span>
            <span className="po-meta-value">{header.po_number || '-'}</span>
          </div>
          <div className="po-meta-item">
            <span className="po-meta-label">Supplier</span>
            <span className="po-meta-value">{header.supplier_name || 'Belum dipilih'}</span>
          </div>
          <div className="po-meta-item">
            <span className="po-meta-label">Receive Date</span>
            <span className="po-meta-value">{header.receive_date || '-'}</span>
          </div>
          <div className="po-meta-item">
            <span className="po-meta-label">Warehouse</span>
            <span className="po-meta-value">{header.warehouse_name || '-'}</span>
          </div>

        </div>

      
      </aside>

      {showExitConfirm && (
        <DeleteMaster
          itemName="keluar dari halaman ini"
          title="Konfirmasi Keluar"
          confirmText="Ya"
          cancelText="Tidak"
          isExit={true}
          onConfirm={() => { setShowExitConfirm(false); onExit() }}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
    </div>
  )
}
