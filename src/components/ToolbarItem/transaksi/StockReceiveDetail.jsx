import { useCallback, useEffect, useMemo, useState } from 'react'

import { getPurchase, receivePurchase } from '../../../features/transaksi/purchase/purchase.api'
import { useAuth } from '../../../shared/auth'
import { DeleteMaster } from '../footer/DeleteMaster'
import { Toast } from '../../Toast'

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
        qty_receive: Number(it.qty_receive || 0),
      })))
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

  const handleStatusReceiveChange = (newStatus) => {
    setHeader(prev => ({ ...prev, status_receive: newStatus }))
  }

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setError('')
    try {
      const payload = {
        status_receive: header.status_receive,
        receive_date: header.receive_date,
        items: items.map(it => ({ id: it.id, qty_receive: it.qty_receive })),
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
  }, [token, header, items, onExit, onSaveSuccess])

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
    <div className="stock-opname-container">
      <Toast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        duration={4000}
      />

      <header className="stock-opname-header">
        <div className="stock-opname-header-top">
          <div className="stock-opname-title-section">
            <div className="stock-opname-accent-bar"></div>
            <h1 className="stock-opname-title">STOCK RECEIVE - {header.receive_number || '-'}</h1>
          </div>

          <div className="stock-opname-status-group">
            {selectedId && (
              <>
                <button
                  type="button"
                  className={`status-button ${header.status_receive === 'draft' ? 'status-button-active' : 'status-button-inactive'}`}
                  onClick={() => handleStatusReceiveChange('draft')}
                >
                  Draft
                </button>
                <button
                  type="button"
                  className={`status-button ${header.status_receive === 'receive' ? 'status-button-active' : 'status-button-inactive'}`}
                  onClick={() => handleStatusReceiveChange('receive')}
                >
                  Receive
                </button>
                <button
                  type="button"
                  className={`status-button ${header.status_receive === 'reject' ? 'status-button-active' : 'status-button-inactive'}`}
                  onClick={() => handleStatusReceiveChange('reject')}
                >
                  Reject
                </button>
              </>
            )}
          </div>
        </div>

        <div className="stock-opname-header-form">
          <div className="form-group">
            <label className="master-form-label">Supplier</label>
            <input type="text" className="master-form-input" value={header.supplier_name || ''} disabled />
          </div>
          <div className="form-group">
            <label className="master-form-label">Expected Date</label>
            <input type="date" className="master-form-input" value={header.expected_date || ''} disabled />
          </div>
          <div className="form-group">
            <label className="master-form-label">Warehouse</label>
            <input type="text" className="master-form-input" value={header.warehouse_name || ''} disabled />
          </div>
          <div className="form-group">
            <label className="master-form-label">Receive Date</label>
            <input
              type="date"
              className="master-form-input"
              value={header.receive_date || ''}
              onChange={(e) => setHeader(prev => ({ ...prev, receive_date: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="master-form-label">Notes</label>
            <textarea className="master-form-input master-form-textarea" value={header.notes || ''} rows={2} disabled />
          </div>
        </div>
      </header>

      <main className="stock-opname-items">
        {error && <div className="master-error">{error}</div>}

        <div className="stock-opname-table-container">
          <div className="table-wrapper custom-scrollbar">
            <table className="stock-opname-table master-table">
              <thead className="table-header">
                <tr>
                  <th style={{ width: '60px' }}>No</th>
                  <th>SKU</th>
                  <th>Product</th>
                  <th className="table-center" style={{ width: '120px' }}>QTY PO</th>
                  <th className="table-center" style={{ width: '140px' }}>QTY RECEIVE</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="master-row">
                    <td className="table-center text-muted">{index + 1}</td>
                    <td className="font-bold">{item.sku || '-'}</td>
                    <td className="table-product">
                      <div className="product-name">{item.product_name || '-'}</div>
                    </td>
                    <td className="table-center">{item.qty_po}</td>
                    <td className="table-center">
                      <input
                        type="number"
                        value={item.qty_receive}
                        onChange={(e) => updateItem(item.id, { qty_receive: Number(e.target.value) })}
                        className="physical-input"
                        min="0"
                        max={item.qty_po}
                      />
                    </td>
                  </tr>
                ))}
                {!isLoading && items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted">No items</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stock-opname-summary">
          <span className="summary-title">Summary</span>
          <div className="summary-items">
            <span className="summary-item">
              TOTAL QTY PO: <span className="summary-value">{summary.totalQtyPo}</span>
            </span>
            <span className="summary-divider"></span>
            <span className="summary-item">
              TOTAL QTY RECEIVE: <span className="summary-value">{summary.totalQtyReceive}</span>
            </span>
          </div>
        </div>
      </main>

      <footer className="stock-opname-footer">
        <div className="footer-content">
          <div className="footer-actions-left">
            <button type="button" className="master-footer-btn" onClick={handleSave} disabled={isSaving || isLoading} title="Save (Ctrl+S)" aria-label="Save">
              <span className="material-icons-round master-footer-icon green">save</span>
            </button>
            <button type="button" className="master-footer-btn" onClick={() => setShowExitConfirm(true)} disabled={isSaving} title="Exit (Esc)" aria-label="Exit">
              <span className="material-icons-round master-footer-icon red">exit_to_app</span>
            </button>
          </div>
        </div>
      </footer>

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
