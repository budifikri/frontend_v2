# PLAN: Master-Detail Stock Opname Form Implementation

**Date:** 5 March 2026  
**Module:** Transaksi → Stock Opname (Master-Detail)  
**Status:** Planned  
**Version:** 2.0 (Master-Detail Enhancement)

---

## 1. Overview

### 1.1 Purpose
Implement **Master-Detail Stock Opname** form yang memungkinkan user melakukan stock opname untuk **multiple products** dalam satu transaksi opname. Ini adalah enhancement dari form Stock Opname existing yang hanya single-entry.

### 1.2 Business Context
Dalam praktik stock opname nyata:
- User melakukan counting untuk **banyak produk sekaligus** dalam satu sesi opname
- Setiap warehouse opname session memiliki **multiple product counts**
- Perlu tracking **per-product variance** dalam satu opname batch
- Efisiensi input: satu header opname, banyak detail produk

### 1.3 Use Case Scenario

```
Scenario: Monthly Stock Opname - Gudang Utama

1. User membuat Stock Opname baru
   - Header: Warehouse, Tanggal, Status, Notes
   
2. User menambahkan multiple products:
   - Product A: System=100, Physical=95, Variance=-5
   - Product B: System=200, Physical=200, Variance=0
   - Product C: System=150, Physical=155, Variance=+5
   
3. User submit semua items dalam satu transaksi
```

### 1.4 Data Model

```
┌─────────────────────────────────────────────────────────┐
│                   STOCK OPNAME (Header)                 │
├─────────────────────────────────────────────────────────┤
│ id: uuid                                                │
│ opname_number: string (OPN-YYYYMMDD-###)               │
│ warehouse_id: uuid                                      │
│ user_id: uuid                                           │
│ opname_date: datetime                                   │
│ status: enum (draft, approved, posted, rejected)       │
│ notes: text                                             │
│ created_at, updated_at                                  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ 1:N
                          ▼
┌─────────────────────────────────────────────────────────┐
│              STOCK OPNAME DETAILS (Lines)               │
├─────────────────────────────────────────────────────────┤
│ id: uuid                                                │
│ opname_id: uuid (FK to header)                          │
│ product_id: uuid                                        │
│ system_qty: decimal                                     │
│ physical_qty: decimal                                   │
│ variance: decimal (calculated)                          │
│ reason: enum                                            │
│ notes: text                                             │
│ created_at, updated_at                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. API Design

### 2.1 Endpoints

#### 2.1.1 Create Stock Opname (Master-Detail)
```
POST /api/stock-opname
```

**Request Body:**
```json
{
  "warehouse_id": "ba5226d8-...",
  "opname_date": "2026-03-05",
  "status": "draft",
  "notes": "Monthly stock opname",
  "items": [
    {
      "product_id": "PRD001",
      "system_qty": 150,
      "physical_qty": 145,
      "reason": "counting_error",
      "notes": "Selisih counting"
    },
    {
      "product_id": "PRD002",
      "system_qty": 80,
      "physical_qty": 80,
      "reason": null,
      "notes": null
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "fb63ecc8-...",
    "opname_number": "OPN-20260305-001",
    "warehouse_id": "ba5226d8-...",
    "opname_date": "2026-03-05T07:00:00+07:00",
    "status": "draft",
    "notes": "Monthly stock opname",
    "created_at": "2026-03-05T20:58:54+07:00",
    "items": [
      {
        "id": "item-001",
        "product_id": "PRD001",
        "system_qty": 150,
        "physical_qty": 145,
        "variance": -5,
        "reason": "counting_error"
      },
      {
        "id": "item-002",
        "product_id": "PRD002",
        "system_qty": 80,
        "physical_qty": 80,
        "variance": 0,
        "reason": null
      }
    ]
  }
}
```

---

#### 2.1.2 Get Stock Opname Detail
```
GET /api/stock-opname/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "fb63ecc8-...",
    "opname_number": "OPN-20260305-001",
    "warehouse_id": "ba5226d8-...",
    "warehouse": {
      "id": "ba5226d8-...",
      "code": "TK",
      "name": "TOKO123"
    },
    "user_id": "583e3b50-...",
    "username": "Admin Utama",
    "opname_date": "2026-03-05T07:00:00+07:00",
    "status": "draft",
    "notes": "Monthly stock opname",
    "created_at": "2026-03-05T20:58:54+07:00",
    "updated_at": "2026-03-05T20:58:54+07:00",
    "items": [
      {
        "id": "item-001",
        "product_id": "PRD001",
        "product": {
          "code": "PRD-001",
          "name": "Kopi Luwak",
          "unit": "PCS"
        },
        "system_qty": 150,
        "physical_qty": 145,
        "variance": -5,
        "reason": "counting_error",
        "notes": "Selisih counting"
      }
    ],
    "summary": {
      "total_items": 10,
      "total_variance_positive": 3,
      "total_variance_negative": 2,
      "total_variance_zero": 5
    }
  }
}
```

---

#### 2.1.3 Update Stock Opname (Master-Detail)
```
PUT /api/stock-opname/:id
```

**Request Body:**
```json
{
  "warehouse_id": "ba5226d8-...",
  "opname_date": "2026-03-05",
  "status": "draft",
  "notes": "Updated notes",
  "items": [
    {
      "id": "item-001",
      "product_id": "PRD001",
      "system_qty": 150,
      "physical_qty": 148,
      "reason": "counting_error"
    },
    {
      "id": "item-002",
      "product_id": "PRD002",
      "system_qty": 80,
      "physical_qty": 75,
      "reason": "expired"
    }
  ]
}
```

**Note:** Items yang tidak di-include akan dihapus (sync behavior)

---

#### 2.1.4 Get Product Stock for Opname
```
GET /api/inventory/stock?warehouse_id=:warehouse_id&product_id=:product_id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product_id": "PRD001",
    "warehouse_id": "ba5226d8-...",
    "current_stock": 150,
    "product": {
      "code": "PRD-001",
      "name": "Kopi Luwak",
      "unit": "PCS"
    },
    "warehouse": {
      "code": "TK",
      "name": "TOKO123"
    }
  }
}
```

---

### 2.2 API Module Functions

**File:** `src/features/master/stock-opname/stockOpname.api.js`

```javascript
// Create dengan items
export async function createStockOpname(token, input)

// Get single opname dengan items
export async function getStockOpnameById(token, id)

// Update dengan items
export async function updateStockOpname(token, id, input)

// Delete opname (cascade delete items)
export async function deleteStockOpname(token, id)

// List opname (header only)
export async function listStockOpname(token, params)

// Get product stock
export async function getProductStock(token, params)
```

---

## 3. File Structure

### 3.1 Files to Create

```
src/
├── components/
│   └── ToolbarItem/
│       └── master/
│           ├── StockOpname.jsx              # MODIFY - List view
│           └── StockOpnameDetail.jsx        # NEW - Master-Detail form
│
├── features/
│   └── master/
│       └── stock-opname/
│           └── stockOpname.api.js           # MODIFY - Add detail functions
│
└── hooks/
│     └── useStockOpnameItems.js             # NEW - Items state management
```

### 3.2 Files to Modify

```
src/
├── components/
│   └── Dashboard/
│       └── DashboardCanvas.jsx              # No change - same route
│
└── features/
    └── master/
        └── stock-opname/
            └── stockOpname.api.js           # Add detail functions
```

---

## 4. Component Design

### 4.1 StockOpnameDetail Component (Main Form)

```jsx
export function StockOpnameDetail({ opnameId, onExit }) {
  // Auth
  const { auth } = useAuth()
  const token = auth?.token

  // Header State
  const [header, setHeader] = useState({
    warehouse_id: '',
    opname_date: '',
    status: 'draft',
    notes: '',
  })

  // Items State
  const [items, setItems] = useState([])
  // [{ 
  //   id, product_id, product_name, system_qty, 
  //   physical_qty, variance, reason, notes, isEditing 
  // }]

  // UI State
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')

  // Lookups
  const [warehouseOptions, setWarehouseOptions] = useState([])
  const [productOptions, setProductOptions] = useState([])
  const [reasonOptions] = useState(REASON_OPTIONS)
}
```

---

### 4.2 Form Layout Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📦 Stock Opname - OPN-20260305-001                          [X] Exit  │
├─────────────────────────────────────────────────────────────────────────┤
│  HEADER                                                                  │
│  ─────────────────────────────────────────────────────────────────────  │
│  Warehouse  : [ TOKO123                                      ▼ ]      │
│  Tanggal    : [ 05/03/2026                                  📅 ]      │
│  Status     : [ Draft                                       ▼ ]      │
│  Notes      : [ Monthly stock opname                           ]      │
│               [                                                  ]      │
├─────────────────────────────────────────────────────────────────────────┤
│  ITEMS                                                                   │
│  ─────────────────────────────────────────────────────────────────────  │
│  [+ Add Product]  [🗑️ Remove Selected]  [🔄 Refresh Stock]             │
│                                                                          │
│  ┌────┬─────────────┬──────────┬─────────┬─────────┬────────┬────────┐ │
│  │ ☐  │ PRODUK      │ UNIT     │ SYSTEM  │ PHYSICAL│ VARIANCE│ REASON │ │
│  ├────┼─────────────┼──────────┼─────────┼─────────┼────────┼────────┤ │
│  │ ☐  │ Kopi Luwak  │ PCS      │   150   │   145   │     -5 │ Count..│ │
│  │    │ PRD-001     │          │         │   [▓▓]  │  (red) │        │ │
│  ├────┼─────────────┼──────────┼─────────┼─────────┼────────┼────────┤ │
│  │ ☐  │ Gula Pasir  │ KG       │    80   │    80   │      0 │ -      │ │
│  │    │ PRD-002     │          │         │   [▓▓]  │ (gray) │        │ │
│  ├────┼─────────────┼──────────┼─────────┼─────────┼────────┼────────┤ │
│  │ ☐  │ Teh Botol   │ BOX      │   200   │   205   │     +5 │ Found  │ │
│  │    │ PRD-003     │          │         │   [▓▓]  │(green) │        │ │
│  └────┴─────────────┴──────────┴─────────┴─────────┴────────┴────────┘ │
│                                                                          │
│  Summary: Total Items: 3 | Variance +: 1 | Variance -: 1 | Variance 0: 1│
├─────────────────────────────────────────────────────────────────────────┤
│  FOOTER                                                                  │
│  ─────────────────────────────────────────────────────────────────────  │
│  [💾 Save]  [❌ Cancel]  [🖨️ Print]  [🚪 Exit]                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 4.3 Add Product Modal/Dialog

```
┌─────────────────────────────────────────────────────────┐
│  ➕ Add Product to Opname                    [X] Close │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Product : [ 🔍 Search product...          ▼ ]         │
│                                                         │
│  ───────────────────────────────────────────────────── │
│                                                         │
│  Current Stock (Gudang Utama): 150 PCS                 │
│                                                         │
│  ───────────────────────────────────────────────────── │
│                                                         │
│              [ Add to Opname ]  [ Cancel ]              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 4.4 Item Row States

#### State 1: View Mode
```
│ ☐ │ Kopi Luwak  │ PCS │ 150 │ 145 │ -5 │ Counting Error │
│   │ PRD-001     │     │     │     │    │                │
```

#### State 2: Edit Mode
```
│ ☐ │ Kopi Luwak  │ PCS │ 150 │ [145] │ -5 │ [Counting ▼] │
│   │ PRD-001     │     │     │       │    │              │
```

- **System Qty**: Read-only (auto from API)
- **Physical Qty**: Editable (number input)
- **Variance**: Auto-calculated, color-coded
- **Reason**: Dropdown (only if variance != 0)

---

### 4.5 Constants

```javascript
const REASON_OPTIONS = [
  { value: 'damage', label: 'Barang Rusak' },
  { value: 'expired', label: 'Kadaluarsa' },
  { value: 'lost', label: 'Hilang' },
  { value: 'found', label: 'Ditemukan (Surplus)' },
  { value: 'counting_error', label: 'Kesalahan Hitung' },
  { value: 'return', label: 'Retur' },
  { value: 'adjustment', label: 'Penyesuaian' },
  { value: 'other', label: 'Lainnya' },
]

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'posted', label: 'Posted' },
  { value: 'rejected', label: 'Rejected' },
]

const ITEM_TABLE_COLUMNS = [
  { key: 'select', label: '', sortable: false, width: '40px' },
  { key: 'product', label: 'PRODUK', sortable: true },
  { key: 'unit', label: 'UNIT', sortable: true, width: '80px' },
  { key: 'system_qty', label: 'SYSTEM', sortable: true, width: '100px' },
  { key: 'physical_qty', label: 'PHYSICAL', sortable: true, width: '100px' },
  { key: 'variance', label: 'VARIANCE', sortable: true, width: '100px' },
  { key: 'reason', label: 'REASON', sortable: true, width: '150px' },
]
```

---

## 5. UI/UX Design

### 5.1 Color Coding

```css
/* Variance Colors */
.variance-positive {
  color: #059669;    /* Green - surplus */
  font-weight: bold;
}

.variance-negative {
  color: #dc2626;    /* Red - shortage */
  font-weight: bold;
}

.variance-zero {
  color: #6b7280;    /* Gray - matches */
}

/* Status Badges */
.status-badge-draft {
  background: #fbbf24;
  color: #78350f;
}

.status-badge-approved {
  background: #3b82f6;
  color: #1e3a8a;
}

.status-badge-posted {
  background: #10b981;
  color: #064e3b;
}

.status-badge-rejected {
  background: #ef4444;
  color: #7f1d1d;
}

/* Row States */
.master-row-selected {
  background: #dbeafe;
}

.item-row-editing {
  background: #fef3c7;
}
```

---

### 5.2 Summary Bar

```
┌────────────────────────────────────────────────────────────────────┐
│  Summary:                                                          │
│  Total Items: 15  │  Variance +: 3  │  Variance -: 5  │  Zero: 7  │
└────────────────────────────────────────────────────────────────────┘
```

---

### 5.3 Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| `F1` | Add new product | When on items table |
| `F2` | Edit selected item | When item selected |
| `Delete` | Remove selected items | When items selected |
| `Ctrl+S` | Save opname | Anywhere |
| `Ctrl+P` | Print | Anywhere |
| `Escape` | Exit / Close modal | Context-sensitive |
| `Enter` | Confirm action | In dialog |
| `Tab` | Navigate inputs | In form |

---

## 6. Implementation Steps

### Phase 1: API Enhancement (Priority: High)
**File:** `src/features/master/stock-opname/stockOpname.api.js`

**Tasks:**
- [ ] Add `getStockOpnameById(token, id)` function
- [ ] Update `createStockOpname()` to support items array
- [ ] Update `updateStockOpname()` to support items array
- [ ] Add `syncStockOpnameItems(token, opnameId, items)` function
- [ ] Add dummy data for items
- [ ] Test API functions with mock data

**Estimated Effort:** 2-3 hours

---

### Phase 2: Custom Hook (Priority: Medium)
**File:** `src/hooks/useStockOpnameItems.js`

**Tasks:**
- [ ] Create `useStockOpnameItems()` hook
- [ ] Implement `addItem(product)` function
- [ ] Implement `removeItem(itemId)` function
- [ ] Implement `updateItem(itemId, updates)` function
- [ ] Implement `calculateVariance(item)` function
- [ ] Implement `getSummary()` function
- [ ] Test hook in isolation

**Estimated Effort:** 1-2 hours

---

### Phase 3: Detail Component (Priority: High)
**File:** `src/components/ToolbarItem/master/StockOpnameDetail.jsx`

**Tasks:**
- [ ] Create component file
- [ ] Build header form (warehouse, date, status, notes)
- [ ] Build items table with checkbox selection
- [ ] Implement "Add Product" modal
- [ ] Implement inline editing for physical_qty
- [ ] Implement variance auto-calculation
- [ ] Implement reason dropdown (conditional)
- [ ] Build summary bar
- [ ] Implement CRUD handlers
- [ ] Implement keyboard shortcuts
- [ ] Add validation
- [ ] Test component

**Estimated Effort:** 5-6 hours

---

### Phase 4: Integration (Priority: Medium)
**Files:** Multiple

**Tasks:**
- [ ] Update `StockOpname.jsx` list view
- [ ] Add "View Detail" button in list
- [ ] Navigate to detail form on row double-click
- [ ] Update `DashboardCanvas.jsx` if needed
- [ ] Test end-to-end flow

**Estimated Effort:** 1 hour

---

### Phase 5: Polish & Testing (Priority: Medium)
**Files:** All

**Tasks:**
- [ ] Run `npm run lint` and fix issues
- [ ] Run `npm run build` and verify
- [ ] Test all keyboard shortcuts
- [ ] Test offline mode
- [ ] Test form validation
- [ ] Test variance color coding
- [ ] Test summary calculations
- [ ] Test print layout
- [ ] Cross-browser testing
- [ ] Tauri desktop testing

**Estimated Effort:** 2-3 hours

---

## 7. Validation Rules

### 7.1 Header Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| Warehouse | Required | "Warehouse harus dipilih" |
| Opname Date | Required, valid date | "Tanggal harus diisi" |
| Status | Required, valid enum | "Status tidak valid" |
| Notes | Max 1000 chars | "Notes maksimal 1000 karakter" |

---

### 7.2 Item Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| Product | Required, unique per opname | "Product harus dipilih dan tidak boleh duplikat" |
| System Qty | Required, >= 0 | "Stok sistem tidak valid" |
| Physical Qty | Required, >= 0 | "Stok fisik harus diisi dan tidak boleh negatif" |
| Reason | Required if variance != 0 | "Alasan harus diisi jika ada selisih" |

---

### 7.3 Business Rules

1. **Product Uniqueness**
   - Same product cannot be added twice to same opname
   - Check: `items.some(i => i.product_id === newProductId)`

2. **Variance Calculation**
   ```javascript
   variance = physical_qty - system_qty
   ```
   - Auto-calculated, read-only
   - Triggers reason requirement if != 0

3. **Status Transitions**
   ```
   DRAFT ──→ APPROVED ──→ POSTED (final)
     │          │
     │          └──→ REJECTED (final)
     │
     └──→ CANCELLED (final)
   ```

4. **Edit Restrictions**
   - Can only edit items if status = 'draft'
   - Cannot modify after approval/posting

5. **Minimum Items**
   - Opname must have at least 1 item to save
   - Validate before submit

---

### 7.4 Form Validation Flow

```javascript
function validateOpname(header, items) {
  const errors = []
  
  // Header validation
  if (!header.warehouse_id) {
    errors.push('Warehouse harus dipilih')
  }
  
  if (!header.opname_date) {
    errors.push('Tanggal harus diisi')
  }
  
  // Items validation
  if (!items || items.length === 0) {
    errors.push('Minimal 1 product harus ditambahkan')
  }
  
  items.forEach((item, index) => {
    if (!item.product_id) {
      errors.push(`Product baris ${index + 1} harus dipilih`)
    }
    
    if (item.physical_qty < 0) {
      errors.push(`Stok fisik baris ${index + 1} tidak boleh negatif`)
    }
    
    if (item.variance !== 0 && !item.reason) {
      errors.push(`Alasan harus diisi untuk ${item.product_name} (ada selisih)`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}
```

---

## 8. Testing Checklist

### 8.1 Build & Lint
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `npm run tauri:build -- --debug` passes

### 8.2 Header Form
- [ ] Warehouse dropdown loads correctly
- [ ] Date picker works
- [ ] Status dropdown works
- [ ] Notes textarea accepts input
- [ ] All required fields validated

### 8.3 Items Table
- [ ] Add product opens modal
- [ ] Product search works
- [ ] Current stock auto-fetches
- [ ] Physical qty editable
- [ ] Variance auto-calculates
- [ ] Variance color coding works
- [ ] Reason dropdown shows when variance != 0
- [ ] Remove selected items works
- [ ] Checkbox selection works
- [ ] Sorting works

### 8.4 Summary
- [ ] Total items count correct
- [ ] Variance + count correct
- [ ] Variance - count correct
- [ ] Variance 0 count correct
- [ ] Summary updates on item change

### 8.5 Save & Update
- [ ] Save creates header + items
- [ ] Update modifies header + items
- [ ] Validation prevents invalid save
- [ ] Success message shows
- [ ] Form resets after save

### 8.6 Keyboard Shortcuts
- [ ] F1 adds product
- [ ] F2 edits selected item
- [ ] Delete removes items
- [ ] Ctrl+S saves
- [ ] Escape exits/cancels

### 8.7 Offline Mode
- [ ] Dummy data loads
- [ ] CRUD works locally
- [ ] No API calls when offline

---

## 9. Notes & Considerations

### 9.1 Technical Notes

- **JavaScript-first**: Do not migrate to TypeScript
- **Pattern consistency**: Follow existing master-detail patterns
- **API helper**: Use `apiFetch` from `src/shared/http`
- **Offline support**: Provide dummy data fallback
- **State management**: Consider using reducer for complex items state

### 9.2 Performance Considerations

1. **Large Item Lists**
   - Virtual scrolling if > 100 items
   - Pagination or lazy loading
   - Debounced search

2. **API Calls**
   - Batch stock fetch for multiple products
   - Cache product stock per warehouse
   - Debounce auto-save (if implemented)

3. **Re-renders**
   - Use `React.memo()` for item rows
   - Memoize calculations
   - Optimize state updates

### 9.3 Open Questions

1. **Auto-save Draft**
   - Should draft opname auto-save periodically?
   - Interval: 30 seconds? 1 minute?

2. **Bulk Actions**
   - Bulk update reason for selected items?
   - Bulk set physical_qty = system_qty (no variance)?

3. **Import/Export**
   - Import products from CSV/Excel?
   - Export opname sheet for physical counting?

4. **Barcode Scanning**
   - Scan product barcode to quick-add?
   - Continuous scan mode for fast counting?

### 9.4 Future Enhancements

- **Mobile Support**: Tablet-optimized counting interface
- **Barcode Scanning**: Direct scan during counting
- **Photo Attachment**: Document damaged goods
- **Batch Printing**: Print opname sheets per aisle/shelf
- **Variance Thresholds**: Alert when variance exceeds limit
- **Counting Rounds**: Support multiple count passes
- **Assign Counters**: Assign products to specific counters
- **Blind Count**: Hide system qty for unbiased counting

---

## 10. References

### 10.1 Related Documents
- `PLAN_stock_opname.md` - Original Stock Opname plan
- `PLAN_product.md` - Product CRUD
- `PLAN_warehouse.md` - Warehouse management

### 10.2 Related Modules
- `src/components/ToolbarItem/master/Product.jsx` - Pattern reference
- `src/components/ToolbarItem/master/Warehouse.jsx` - Pattern reference
- `src/features/laporan/stock/stock.api.js` - Stock API

### 10.3 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stock-opname` | List opname (headers) |
| GET | `/api/stock-opname/:id` | Get opname detail with items |
| POST | `/api/stock-opname` | Create opname with items |
| PUT | `/api/stock-opname/:id` | Update opname with items |
| DELETE | `/api/stock-opname/:id` | Delete opname (cascade) |
| GET | `/api/inventory/stock` | Get current stock |

---

## 11. Appendix: Dummy Data

### 11.1 Header Dummy Data

```javascript
const DUMMY_OPNAME_HEADER = {
  id: 'OPN001',
  opname_number: 'OPN-20260305-001',
  warehouse_id: 'WH001',
  warehouse: {
    id: 'WH001',
    code: 'TK',
    name: 'TOKO123',
  },
  user_id: 'user1',
  username: 'Admin Utama',
  opname_date: '2026-03-05T10:30:00Z',
  status: 'draft',
  notes: 'Monthly stock opname',
  created_at: '2026-03-05T10:30:00Z',
  updated_at: '2026-03-05T10:30:00Z',
}
```

### 11.2 Items Dummy Data

```javascript
const DUMMY_OPNAME_ITEMS = [
  {
    id: 'item-001',
    opname_id: 'OPN001',
    product_id: 'PRD001',
    product: {
      code: 'PRD-001',
      name: 'Kopi Luwak',
      unit: 'PCS',
    },
    system_qty: 150,
    physical_qty: 145,
    variance: -5,
    reason: 'counting_error',
    notes: 'Selisih counting',
  },
  {
    id: 'item-002',
    opname_id: 'OPN001',
    product_id: 'PRD002',
    product: {
      code: 'PRD-002',
      name: 'Gula Pasir',
      unit: 'KG',
    },
    system_qty: 80,
    physical_qty: 80,
    variance: 0,
    reason: null,
    notes: null,
  },
  {
    id: 'item-003',
    opname_id: 'OPN001',
    product_id: 'PRD003',
    product: {
      code: 'PRD-003',
      name: 'Teh Botol',
      unit: 'BOX',
    },
    system_qty: 200,
    physical_qty: 205,
    variance: 5,
    reason: 'found',
    notes: 'Stok ditemukan',
  },
]
```

---

**Document Version:** 1.0  
**Last Updated:** 5 March 2026  
**Author:** AI Assistant  
**Status:** Ready for Implementation
