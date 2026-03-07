# PLAN REFACTORING MASTER-DETAIL PATTERN

## Tujuan

Menciptakan pattern Master-Detail yang **konsisten**, **reusable**, dan **maintainable** untuk semua form CRUD di aplikasi POS Retail.

---

## 1. DESIGN PATTERN STANDAR

### 1.1 Struktur Komponen

```
┌─────────────────────────────────────────────────────┐
│  Master List Component (e.g., Purchase.jsx)         │
│  ├── Table dengan filters                           │
│  ├── Pagination                                     │
│  ├── Footer dengan action buttons                   │
│  └── Toast notification (parent state)              │
│                                                     │
│  └── Master Detail Component (e.g., PurchaseDetail) │
│      ├── Sticky Header (form fields)                │
│      ├── Items Table (editable)                     │
│      ├── Summary Section (computed values)          │
│      └── Sticky Footer (action buttons)             │
└─────────────────────────────────────────────────────┘
```

### 1.2 File Structure

```
src/
├── components/
│   ├── ToolbarItem/
│   │   ├── {module}/
│   │   │   ├── {Feature}.jsx           # Master List
│   │   │   └── {Feature}Detail.jsx     # Master Detail
│   │   └── transaksi/
│   │       ├── Purchase.jsx
│   │       ├── PurchaseDetail.jsx
│   │       ├── StockOpname.jsx
│   │       └── StockOpnameDetail.jsx
│   │
│   └── templates/                       # Reusable components
│       ├── MasterDetailTable.jsx
│       ├── MasterDetailFooter.jsx
│       ├── MasterTableHeader.jsx
│       └── AddItemModal.jsx
│
├── features/
│   ├── {module}/
│   │   └── {feature}.api.js            # API functions
│   └── transaksi/
│       └── purchase/
│           └── purchase.api.js
│
└── hooks/
    ├── useMasterDetail.js              # State management
    ├── useMasterPagination.js
    └── useMasterTableSort.js
```

---

## 2. KOMPONEN REUSABLE

### 2.1 Master List Component Template

**File:** `src/components/ToolbarItem/{module}/{Feature}.jsx`

```javascript
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import { listItems, deleteItem } from '../../../features/{module}/{feature}.api'
import { FooterMaster } from '../footer/FooterMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'
import { FeatureDetail } from './{Feature}Detail'
import { Toast } from '../../Toast'

export function Feature({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  // State
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Pagination hook
  const pager = useMasterPagination({ initialLimit: 10, total: pagination.total, hasMore: pagination.has_more })
  const { limit, offset } = pager

  // Selection state
  const [selectedId, setSelectedId] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  
  // Toast state (PARENT handles toast)
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' })

  const handleSaveSuccess = (message, type = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  // Fetch data
  const fetchData = useCallback(async () => {
    // ... implementation
  }, [token, searchKeyword, statusFilter, limit, offset])

  useEffect(() => { fetchData() }, [fetchData])

  // Sorting
  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'created_at',
    direction: 'desc',
  })

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showDeleteConfirm || showExitConfirm) return
      if (e.key === 'F2') { e.preventDefault(); handleViewDetail() }
      else if (e.key === 'Delete') { e.preventDefault(); handleDeleteClick() }
      else if (e.key === '+' || e.key === 'F1') { e.preventDefault(); handleNew() }
      else if (e.key === 'Escape') { e.preventDefault(); setShowExitConfirm(true) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showDeleteConfirm, showExitConfirm])

  // Actions
  const selectedItem = selectedId == null ? null : data.find((row) => row.id === selectedId) || null
  const handleSelect = (row) => setSelectedId(row.id)
  const handleViewDetail = () => { const target = selectedItem || sortedData[0]; if (!target) return; setSelectedId(target.id); setShowDetail(true) }
  const handleNew = () => { setSelectedId(null); setShowDetail(true) }
  const handleDeleteClick = () => { if (selectedItem) setShowDeleteConfirm(true) }
  
  const handleConfirmDelete = async () => {
    if (!selectedItem) { setShowDeleteConfirm(false); return }
    try {
      if (token) { await deleteItem(token, selectedItem.id); await fetchData() }
      else { setData((prev) => prev.filter((row) => row.id !== selectedItem.id)) }
      setShowDeleteConfirm(false)
      setSelectedId(null)
    } catch (err) { setError(err.message || 'Failed to delete') }
  }

  const handleExitClick = () => setShowExitConfirm(true)
  const handleConfirmExit = () => { setShowExitConfirm(false); onExit() }

  // Render Detail View
  if (showDetail) {
    return (
      <FeatureDetail
        selectedId={selectedId}
        onExit={() => { setShowDetail(false); setSelectedId(null); fetchData() }}
        onSaveSuccess={handleSaveSuccess}  // ✅ Pass callback
      />
    )
  }

  // Render List View
  return (
    <div className="master-content">
      {/* Header with filters */}
      {/* Table */}
      {/* Footer */}
      
      {/* Confirmation Dialogs */}
      {showDeleteConfirm && <DeleteMaster ... />}
      {showExitConfirm && <DeleteMaster ... />}
      
      {/* Toast (rendered in parent) */}
      <Toast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        duration={3000}
      />
    </div>
  )
}
```

---

### 2.2 Master Detail Component Template

**File:** `src/components/ToolbarItem/{module}/{Feature}Detail.jsx`

```javascript
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import { getItem, createItem, updateItem, listLookups } from '../../../features/{module}/{feature}.api'
import { AddItemModal } from './AddItemModal'
import { DeleteMaster } from '../footer/DeleteMaster'
// NO Toast import - parent handles toast

export function FeatureDetail({ selectedId: propSelectedId, onExit, onSaveSuccess }) {
  const { auth } = useAuth()
  const token = auth?.token

  // Loading & Error state
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Modal & Confirm state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  
  // Lookup options
  const [lookupOptions, setLookupOptions] = useState([])

  // Header form state
  const [header, setHeader] = useState({
    number: generateNumber(),
    lookup_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'draft',
    notes: '',
  })

  // Items state
  const [items, setItems] = useState([])
  const [selectedIds, setSelectedIds] = useState([])

  // Fetch lookups
  const fetchLookups = useCallback(async () => {
    if (!token) {
      // Dummy data for offline mode
      return
    }
    try {
      const res = await listLookups(token, { limit: 200 })
      setLookupOptions(res.items || [])
    } catch (err) {
      console.error('[FeatureDetail] Failed to load lookups:', err)
    }
  }, [token])

  useEffect(() => { fetchLookups() }, [fetchLookups])

  // Load existing item
  useEffect(() => {
    if (!propSelectedId) return
    const loadItem = async () => {
      setIsLoading(true)
      try {
        const data = await getItem(token, propSelectedId)
        setHeader({
          number: data.number || generateNumber(),
          lookup_id: data.lookup_id || '',
          date: data.date || new Date().toISOString().split('T')[0],
          status: (data.status || 'draft').toLowerCase(), // Normalize to lowercase
          notes: data.notes || '',
        })
        if (data.items && data.items.length > 0) {
          setItems(data.items.map(item => ({ ...item })))
        }
      } catch (err) {
        console.error('[FeatureDetail] Error loading data:', err)
        setError('Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }
    loadItem()
  }, [propSelectedId, token])

  // Add item
  const addItem = useCallback((newItem) => {
    const itemWithId = {
      id: newItem.id || `item-${Date.now()}`,
      ...newItem,
    }
    setItems((prev) => [...prev, itemWithId])
    setShowAddModal(false)
  }, [])

  // Update item
  const updateItem = useCallback((itemId, updates) => {
    setItems((prev) => prev.map((item) => {
      if (item.id === itemId) {
        return { ...item, ...updates }
      }
      return item
    }))
  }, [])

  // Remove item
  const removeItem = useCallback((ids) => {
    const idsToRemove = Array.isArray(ids) ? ids : [ids]
    setItems((prev) => prev.filter((item) => !idsToRemove.includes(item.id)))
    setSelectedIds([])
  }, [])

  // Computed values
  const summary = useMemo(() => {
    // Compute summary from items
    return { itemCount: items.length }
  }, [items])

  // Validation
  const validate = () => {
    const errors = []
    if (!header.lookup_id) errors.push('Lookup harus dipilih')
    if (items.length === 0) errors.push('Minimal 1 item harus ditambahkan')
    return { isValid: errors.length === 0, errors }
  }

  // Handle save
  const handleSave = useCallback(async () => {
    const { isValid, errors } = validate()
    if (!isValid) { setError(errors.join(', ')); return }

    setIsSaving(true)
    setError('')

    // Build payload according to Swagger spec
    const payload = {
      lookup_id: header.lookup_id,
      date: header.date,
      notes: header.notes || '',
      items: items.map(item => ({
        id: item.id.startsWith('item-') ? '' : item.id, // Don't send temp IDs
        ...item,
      })),
    }

    console.log('[FeatureDetail] === SAVE REQUEST ===')
    console.log('[FeatureDetail] URL:', propSelectedId ? `/api/items/${propSelectedId}` : '/api/items')
    console.log('[FeatureDetail] Payload:', JSON.stringify(payload, null, 2))

    try {
      if (token) {
        if (propSelectedId) {
          const result = await updateItem(token, propSelectedId, payload)
          console.log('[FeatureDetail] === UPDATE RESPONSE ===')
          console.log('[FeatureDetail] Response:', result)
          // ✅ Close first, then show toast from parent
          onExit()
          if (onSaveSuccess) {
            setTimeout(() => {
              onSaveSuccess('Data berhasil diupdate', 'success')
            }, 300)
          }
        } else {
          const result = await createItem(token, payload)
          console.log('[FeatureDetail] === CREATE RESPONSE ===')
          console.log('[FeatureDetail] Response:', result)
          // ✅ Close first, then show toast from parent
          onExit()
          if (onSaveSuccess) {
            setTimeout(() => {
              onSaveSuccess('Data berhasil dibuat', 'success')
            }, 300)
          }
        }
      }
    } catch (err) {
      console.error('[FeatureDetail] === SAVE ERROR ===')
      console.error('[FeatureDetail] Error:', err)
      setError(err.message || 'Failed to save')
      // Show error toast
      if (onSaveSuccess) {
        onSaveSuccess(err.message || 'Failed to save', 'error')
      }
    } finally {
      setIsSaving(false)
    }
  }, [header, items, token, propSelectedId, onExit, onSaveSuccess])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showAddModal || showExitConfirm) return
      if (e.key === 'F1') { e.preventDefault(); setShowAddModal(true) }
      else if (e.key === 'Delete' && selectedIds.length > 0) { e.preventDefault(); removeItem(selectedIds) }
      else if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave() }
      else if (e.key === 'Escape') { e.preventDefault(); setShowExitConfirm(true) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showAddModal, showExitConfirm, selectedIds, handleSave, removeItem])

  // Options for selects
  const lookupOptionsForSelect = useMemo(() =>
    lookupOptions.map(item => ({ id: item.id, name: item.name })), [lookupOptions])

  return (
    <div className="stock-opname-container">  {/* Use standard container class */}
      {/* Header - Sticky Top */}
      <header className="stock-opname-header">
        <div className="stock-opname-header-top">
          <div className="stock-opname-title-section">
            <div className="stock-opname-accent-bar"></div>
            <h1 className="stock-opname-title">{FEATURE_NAME} - {header.number}</h1>
          </div>
          {/* Status buttons if needed */}
        </div>
        <div className="stock-opname-header-form">
          {/* Form fields using standard classes */}
        </div>
      </header>

      {error && <div className="master-error">{error}</div>}

      {/* Items Table - Scrollable */}
      <main className="stock-opname-items">
        <div className="stock-opname-table-container">
          <table className="stock-opname-table master-table">
            <thead className="table-header">
              {/* Columns */}
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className={selectedIds.includes(item.id) ? 'master-row-selected' : 'master-row'}>
                  {/* Cells */}
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-muted">No items yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div className="stock-opname-summary">
          <span className="summary-title">Summary</span>
          <div className="summary-items">
            {/* Summary items */}
          </div>
        </div>
      </main>

      {/* Footer - Sticky Bottom */}
      <footer className="stock-opname-footer">
        <div className="footer-content">
          <div className="footer-actions-left">
            <button type="button" className="master-footer-btn" onClick={() => setShowAddModal(true)} title="Add (F1)">
              <span className="material-icons-round master-footer-icon orange">add_box</span>
              <span className="master-footer-key">+</span>
            </button>
            <button type="button" className="master-footer-btn" onClick={() => removeItem(selectedIds)} disabled={selectedIds.length === 0} title="Remove (DEL)">
              <span className="material-icons-round master-footer-icon orange">remove_circle</span>
              <span className="master-footer-key">DEL</span>
            </button>
            <button type="button" className="master-footer-btn" onClick={handleSave} disabled={isSaving || isLoading} title="Save (Ctrl+S)">
              <span className="material-icons-round master-footer-icon green">save</span>
            </button>
            <button type="button" className="master-footer-btn" onClick={() => setShowExitConfirm(true)} disabled={isSaving} title="Exit (Esc)">
              <span className="material-icons-round master-footer-icon red">exit_to_app</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addItem}
        token={token}
      />

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
      
      {/* NO Toast here - parent handles it */}
    </div>
  )
}
```

---

## 3. API MODULE TEMPLATE

**File:** `src/features/{module}/{feature}.api.js`

```javascript
import { apiFetch } from '../../shared/http'

// Dummy data for offline mode
const DUMMY_ITEMS = []

function normalizeItem(raw) {
  const items = (raw?.items ?? []).map((item, index) => ({
    id: item?.id || `item-${index}`,
    ...item,
  }))
  
  return {
    id: raw?.id || '',
    number: raw?.number || '',
    lookup_id: raw?.lookup_id || '',
    status: (raw?.status || 'draft').toLowerCase(), // Normalize to lowercase
    date: raw?.date || '',
    notes: raw?.notes || '',
    created_at: raw?.created_at || '',
    updated_at: raw?.updated_at || '',
    items,
  }
}

export async function listItems(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.status) qs.set('status', params.status)
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const url = `/api/items${queryString}`
  console.log('[API] listItems REQUEST URL:', url)

  if (!token) {
    console.log('[API] No token - using DUMMY data')
    return { items: DUMMY_ITEMS, pagination: { total: 0, limit: 10, offset: 0 } }
  }

  const raw = await apiFetch(url, { token })
  console.log('[API] listItems RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load items')

  const rows = Array.isArray(raw.data) ? raw.data : (raw.data?.items ?? raw.data?.data ?? [])
  const pagination = raw.pagination ?? raw.data?.pagination ?? {}

  return {
    items: (rows ?? []).map(item => normalizeItem(item)),
    pagination: { limit: params.limit || 10, offset: params.offset || 0, ...pagination },
  }
}

export async function getItem(token, id) {
  const url = `/api/items/${encodeURIComponent(id)}`
  console.log('[API] getItem REQUEST URL:', url)

  if (!token) {
    console.log('[API] No token - using DUMMY data')
    const record = DUMMY_ITEMS.find(r => r.id === id)
    if (!record) throw new Error('Item not found')
    return normalizeItem(record)
  }

  const raw = await apiFetch(url, { token })
  console.log('[API] getItem RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to get item')

  return normalizeItem(raw.data || raw)
}

export async function createItem(token, input) {
  const url = '/api/items'
  console.log('[API] createItem REQUEST URL:', url)
  console.log('[API] createItem PAYLOAD:', JSON.stringify(input, null, 2))

  if (!token) {
    console.log('[API] No token - simulating create')
    const newRecord = { id: `ITEM${Date.now()}`, ...input, created_at: new Date().toISOString() }
    DUMMY_ITEMS.unshift(newRecord)
    return { success: true, data: normalizeItem(newRecord), message: 'Created successfully' }
  }

  const raw = await apiFetch(url, { method: 'POST', token, body: input })
  console.log('[API] createItem RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to create item')

  return raw
}

export async function updateItem(token, id, input) {
  const url = `/api/items/${encodeURIComponent(id)}`
  console.log('[API] updateItem REQUEST URL:', url)
  console.log('[API] updateItem PAYLOAD:', JSON.stringify(input, null, 2))

  if (!token) {
    console.log('[API] No token - simulating update')
    const index = DUMMY_ITEMS.findIndex(r => r.id === id)
    if (index === -1) throw new Error('Item not found')
    const updated = { ...DUMMY_ITEMS[index], ...input, updated_at: new Date().toISOString() }
    DUMMY_ITEMS[index] = updated
    return { success: true, data: normalizeItem(updated), message: 'Updated successfully' }
  }

  const raw = await apiFetch(url, { method: 'PUT', token, body: input })
  console.log('[API] updateItem RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to update item')

  return raw
}

export async function deleteItem(token, id) {
  const url = `/api/items/${encodeURIComponent(id)}`
  console.log('[API] deleteItem REQUEST URL:', url)

  if (!token) {
    console.log('[API] No token - simulating delete')
    const index = DUMMY_ITEMS.findIndex(r => r.id === id)
    if (index === -1) throw new Error('Item not found')
    DUMMY_ITEMS.splice(index, 1)
    return { success: true, message: 'Deleted successfully' }
  }

  const raw = await apiFetch(url, { method: 'DELETE', token })
  console.log('[API] deleteItem RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to delete item')

  return raw
}
```

---

## 4. CSS CLASS STANDAR

### 4.1 Container & Layout

```css
.stock-opname-container {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}

.stock-opname-header {
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.stock-opname-items {
  overflow-y: auto;
  background: #f1f5f9;
}

.stock-opname-footer {
  background: #dbeafe;
  border-top: 1px solid #bfdbfe;
  flex-shrink: 0;
}
```

### 4.2 Header Elements

```css
.stock-opname-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.stock-opname-title-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stock-opname-accent-bar {
  width: 6px;
  height: 32px;
  background: #3b82f6;
  border-radius: 9999px;
}

.stock-opname-title {
  font-size: 1.25rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #1e3a8a;
}
```

### 4.3 Form Elements

```css
.stock-opname-header-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #f8fafc;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group-wide {
  grid-column: span 2;
}

.master-form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.master-form-input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}
```

### 4.4 Table Elements

```css
.stock-opname-table-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stock-opname-table {
  width: 100%;
  border-collapse: collapse;
}

.stock-opname-table thead {
  background: #1e3a8a;
  color: #fff;
}

.stock-opname-table tbody tr {
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
}

.stock-opname-table tbody tr.master-row-selected {
  background: #dbeafe;
}
```

### 4.5 Summary Section

```css
.stock-opname-summary {
  background: #fff;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-top: 1rem;
}

.summary-title {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
}

.summary-items {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}
```

### 4.6 Footer Buttons

```css
.stock-opname-footer {
  padding: 1rem 1.5rem;
}

.footer-content {
  display: flex;
  gap: 1rem;
}

.master-footer-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.master-footer-icon {
  font-size: 20px;
}

.master-footer-icon.orange { color: #ea580c }
.master-footer-icon.green { color: #16a34a }
.master-footer-icon.red { color: #dc2626 }

.master-footer-key {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
}
```

---

## 5. TOAST NOTIFICATION PATTERN

### 5.1 Standard Flow

```
1. User action (Save/Create/Update/Delete)
   ↓
2. API request
   ↓
3. Success/Error response
   ↓
4. Child calls onExit() → Modal closes
   ↓
5. 300ms delay (smooth transition)
   ↓
6. Child calls onSaveSuccess(message, type)
   ↓
7. Parent shows Toast
```

### 5.2 Implementation

**Parent Component:**
```javascript
const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' })

const handleSaveSuccess = (message, type = 'success') => {
  setToast({ isOpen: true, message, type })
}

<PurchaseDetail
  selectedId={selectedId}
  onExit={() => { setShowDetail(false); setSelectedId(null); fetchData() }}
  onSaveSuccess={handleSaveSuccess}  // ✅ Pass callback
/>

<Toast
  message={toast.message}
  type={toast.type}
  isOpen={toast.isOpen}
  onClose={() => setToast({ ...toast, isOpen: false })}
  duration={3000}
/>
```

**Child Component:**
```javascript
export function PurchaseDetail({ selectedId, onExit, onSaveSuccess }) {
  // ...
  
  const handleSave = async () => {
    try {
      await updatePurchase(token, propSelectedId, payload)
      // ✅ Close first
      onExit()
      // ✅ Then show toast from parent
      if (onSaveSuccess) {
        setTimeout(() => {
          onSaveSuccess('Data berhasil diupdate', 'success')
        }, 300)
      }
    } catch (err) {
      if (onSaveSuccess) {
        onSaveSuccess(err.message, 'error')
      }
    }
  }
}
```

### 5.3 Toast Types

```javascript
'success'  // Green - Operation successful
'error'    // Red - Error occurred
'warning'  // Yellow - Warning message
'info'     // Blue - Informational message
```

---

## 6. KEYBOARD SHORTCUTS STANDAR

| Key | Action | Context |
|-----|--------|---------|
| `F1` | Add new item | Detail view |
| `F2` | Edit/View detail | List view |
| `Delete` | Delete selected | List/Detail view |
| `Ctrl+S` | Save | Detail view |
| `Escape` | Exit/Close | All views |
| `+` | Add new item | Detail view |

---

## 7. STATUS BADGE COLORS

```css
.status-badge-draft { background: #f1f5f9; color: #64748b }
.status-badge-pending { background: #ffedd5; color: #c2410c }
.status-badge-approved { background: #dbeafe; color: #1e40af }
.status-badge-posted { background: #dcfce7; color: #166534 }
.status-badge-rejected { background: #fee2e2; color: #991b1b }
.status-badge-cancelled { background: #f1f5f9; color: #64748b }
.status-badge-completed { background: #dcfce7; color: #166534 }
```

---

## 8. IMPLEMENTATION CHECKLIST

### Phase 1: Setup
- [ ] Create directory structure
- [ ] Create API module
- [ ] Create reusable components (if needed)

### Phase 2: Master List
- [ ] Create list component
- [ ] Implement filters & search
- [ ] Implement pagination
- [ ] Add keyboard shortcuts
- [ ] Add delete functionality
- [ ] Add Toast in parent

### Phase 3: Master Detail
- [ ] Create detail component
- [ ] Implement header form
- [ ] Implement items table
- [ ] Implement summary section
- [ ] Add add/edit/remove items
- [ ] Implement save (create/update)
- [ ] Add keyboard shortcuts
- [ ] Use onSaveSuccess callback

### Phase 4: Integration
- [ ] Add route in DashboardCanvas.jsx
- [ ] Add menu in toolbarItems.js
- [ ] Add to IMPLEMENTED_TOOLS in App.jsx
- [ ] Test create flow
- [ ] Test update flow
- [ ] Test delete flow
- [ ] Test offline mode

### Phase 5: Polish
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add validation
- [ ] Test responsive design
- [ ] Run lint & build

---

## 9. EXAMPLE IMPLEMENTATIONS

### 9.1 Stock Opname (Reference)
- **List:** `src/components/ToolbarItem/transaksi/StockOpname.jsx`
- **Detail:** `src/components/ToolbarItem/transaksi/StockOpnameDetail.jsx`
- **API:** `src/features/transaksi/stock-opname/stockOpname.api.js`

### 9.2 Purchase Order
- **List:** `src/components/ToolbarItem/transaksi/Purchase.jsx`
- **Detail:** `src/components/ToolbarItem/transaksi/PurchaseDetail.jsx`
- **API:** `src/features/transaksi/purchase/purchase.api.js`

---

## 10. BEST PRACTICES

### DO ✅
- Use standard CSS classes (`stock-opname-*`)
- Parent handles Toast state
- Child calls `onSaveSuccess` callback
- Normalize status to lowercase
- Use `onExit()` before showing toast
- Add 300ms delay for smooth transition
- Use keyboard shortcuts
- Add debug console.log for API calls
- Handle offline mode with dummy data

### DON'T ❌
- Don't use internal Toast in child component
- Don't show toast before closing modal
- Don't use custom CSS classes (use standard)
- Don't forget to normalize API field names
- Don't skip error handling
- Don't forget keyboard shortcuts
- Don't hardcode status values (use constants)

---

## 11. API FIELD NORMALIZATION

```javascript
// Backend → Frontend normalization
function normalizeItem(raw) {
  return {
    id: raw?.id || '',
    number: raw?.number || raw?.reference || '',
    status: (raw?.status || 'draft').toLowerCase(), // Always lowercase
    date: raw?.date || raw?.order_date || '',
    notes: raw?.notes || '',
    // Handle different field names
    lookup_id: raw?.lookup_id || raw?.warehouse_id || '',
    lookup_name: raw?.lookup_name || raw?.warehouse_name || '',
  }
}

// Frontend → Backend payload
const payload = {
  lookup_id: header.lookup_id,
  date: header.date,
  notes: header.notes,
  items: items.map(item => ({
    // Don't send temp IDs (item-xxx)
    id: item.id.startsWith('item-') ? '' : item.id,
    ...item,
  })),
}
```

---

## 12. COMMON ISSUES & SOLUTIONS

### Issue: Toast tidak muncul
**Solution:** Pastikan parent yang handle Toast state, child hanya call callback

### Issue: Status tidak ter-select
**Solution:** Normalize status ke lowercase: `(data.status || 'draft').toLowerCase()`

### Issue: Backend error "field required"
**Solution:** Cek Swagger spec, pastikan payload sesuai dengan required fields

### Issue: Data tidak muncul di table
**Solution:** Cek API response, pastikan field names sesuai (normalize jika perlu)

### Issue: Modal tidak close setelah save
**Solution:** Pastikan call `onExit()` sebelum show toast

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-07  
**Based On:** Stock Opname & Purchase Order implementations  
**Status:** Ready for implementation
