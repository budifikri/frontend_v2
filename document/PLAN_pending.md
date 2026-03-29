# Plan: Fitur Pending Nota Penjualan

## Overview
Fitur untuk menyimpan nota penjualan yang belum selesai ke localStorage, dan dapat dipanggil kembali kapan saja.

## Role

### 1. Simpan Pending (Aksi: Pending)
- **Trigger**: Pilih Aksi -> Pending
- **Data yang disimpan**:
  ```javascript
  {
    id: timestamp,
    createdAt: new Date(),
    items: [...],
    subtotal: number,
    tax: number,
    total: number,
    cashier: auth.username,
    status: 'PENDING'
  }
  ```
- **Storage**: `localStorage.setItem('pos_pending_notes', JSON.stringify([...]))`

### 2. Panggil Pending (Restore)
- **Trigger**: F6 (shortcut)
- **Behavior**:
  - Jika ada nota di localStorage, tampilkan popup list pending
  - User pilih salah satu pending nota
  - Data nota di-restore ke state `items`
  - Nota pending dihapus dari localStorage (atau status diubah)

## Implementation Plan

### Step 1: Update State
```javascript
const [pendingNotes, setPendingNotes] = useState([])
const [showPendingPopup, setShowPendingPopup] = useState(false)
const [pendingSelectedIndex, setPendingSelectedIndex] = useState(0)
```

### Step 2: Load Pending Notes on Mount
```javascript
useEffect(() => {
  const saved = localStorage.getItem('pos_pending_notes')
  if (saved) {
    setPendingNotes(JSON.parse(saved))
  }
}, [])
```

### Step 3: Handle Save Pending
```javascript
const handleSavePending = () => {
  if (items.length === 0) return
  
  const pendingNote = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    items: [...items],
    subtotal,
    tax,
    total,
    cashier: auth.username
  }
  
  const updated = [...pendingNotes, pendingNote]
  setPendingNotes(updated)
  localStorage.setItem('pos_pending_notes', JSON.stringify(updated))
  
  // Clear current nota
  setItems([])
  setSelectedIndex(-1)
}
```

### Step 4: Handle Restore Pending
```javascript
const handleRestorePending = (pendingNote) => {
  setItems(pendingNote.items)
  // Remove from pending list
  const updated = pendingNotes.filter(n => n.id !== pendingNote.id)
  setPendingNotes(updated)
  localStorage.setItem('pos_pending_notes', JSON.stringify(updated))
  setShowPendingPopup(false)
}
```

### Step 5: Keyboard Shortcut F6
```javascript
if (e.key === 'F6') {
  e.preventDefault()
  setShowPendingPopup(true)
  setPendingSelectedIndex(0)
}
```

### Step 6: UI Components

#### Popup List Pending
```jsx
{showPendingPopup && (
  <div className="product-popup-overlay">
    <div className="pending-popup">
      <h3>Daftar Nota Pending</h3>
      <div className="pending-list">
        {pendingNotes.map((note, idx) => (
          <div 
            key={note.id}
            className={`pending-item ${pendingSelectedIndex === idx ? 'selected' : ''}`}
            onClick={() => handleRestorePending(note)}
          >
            <span>{formatDateTime(note.createdAt)}</span>
            <span>{note.cashier}</span>
            <span>{formatCurrency(note.total)}</span>
            <span>{note.items.length} item</span>
          </div>
        ))}
      </div>
      <button onClick={() => setShowPendingPopup(false)}>Tutup</button>
    </div>
  </div>
)}
```

#### Update Action Popup
- Add "Pending" option in action popup (Bayar / Pending / Batal)

### Step 7: CSS Styles
- `.pending-popup` - popup container
- `.pending-list` - list container
- `.pending-item` - individual pending item
- `.pending-item.selected` - selected state

## Files to Modify

1. `src/components/POS/POS.jsx`
   - Add state for pending notes
   - Add `handleSavePending` function
   - Add `handleRestorePending` function
   - Update keyboard handler for F6
   - Update action popup to include Pending option
   - Add Pending popup UI
   - Update useEffect deps

2. `src/components/POS/POS.css`
   - Add styles for pending popup

## API/Storage
- **Storage**: localStorage (no backend API needed)
- **Key**: `pos_pending_notes`
- **Format**: JSON array of pending note objects
