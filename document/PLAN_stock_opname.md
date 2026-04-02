# PLAN: Stock Opname Form Implementation

**Date:** 5 March 2026  
**Module:** Transaksi → Stock Opname  
**Status:** Planned  

---

## 1. Overview

### 1.1 Purpose
Stock Opname (stock adjustment/inventory count) is a critical inventory management feature that allows users to:
- Record physical stock counts from warehouse audits
- Adjust system inventory to match actual quantities
- Track variances between expected and actual stock
- Document reasons for stock discrepancies
- Maintain audit trail for inventory adjustments

### 1.2 Business Context
Stock opname is essential for:
- **Periodic inventory audits** - Monthly/quarterly stock takes
- **Damage/expiration management** - Remove damaged goods from inventory
- **Loss prevention** - Track shrinkage and investigate discrepancies
- **System accuracy** - Ensure POS/inventory system matches physical reality
- **Financial reporting** - Accurate stock valuation for accounting

### 1.3 Integration Points
- **Stock Card** - Adjustments appear in stock card history
- **Product Module** - Uses product master data
- **Warehouse Module** - Uses warehouse master data
- **Laporan Stok** - Adjusted quantities reflected in stock reports

---

## 2. Workflow Design

### 2.1 Stock Opname Process Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        STOCK OPNAME WORKFLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   SELECT     │ ──→ │    ENTER     │ ──→ │   REVIEW     │
  │  PRODUCT +   │     │   PHYSICAL   │     │  VARIANCE    │
  │  WAREHOUSE   │     │  QUANTITY    │     │              │
  └──────────────┘     └──────────────┘     └──────────────┘
         │                                       │
         │                                       ▼
         │                              ┌──────────────┐
         │                              │    ADD       │
         │                              │ REASON +     │
         │                              │   NOTES      │
         │                              └──────────────┘
         │                                       │
         ▼                                       ▼
  ┌──────────────┐                       ┌──────────────┐
  │   SYSTEM     │                       │     SAVE     │
  │  FETCHES     │                       │  TRANSACTION │
  │CURRENT STOCK │                       └──────────────┘
  └──────────────┘                               │
                                                 ▼
                                        ┌──────────────┐
                                        │   UPDATE     │
                                        │  STOCK CARD  │
                                        │   HISTORY    │
                                        └──────────────┘
```

### 2.2 Step-by-Step Description

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | User selects product from dropdown | System loads product details |
| 2 | User selects warehouse from dropdown | System fetches current stock for product+warehouse combination |
| 3 | System displays current stock (read-only) | Auto-populated from API |
| 4 | User enters physical quantity | System auto-calculates variance (physical - system) |
| 5 | Variance displayed with color coding | Green (positive), Red (negative), Gray (zero) |
| 6 | User selects reason from dropdown | Standard reasons: damage, expired, lost, found, counting_error, other |
| 7 | User adds optional notes | Free text for additional context |
| 8 | User saves transaction | System validates, creates adjustment record |
| 9 | Stock card updated | New entry appears in stock card history |

### 2.3 Status Flow (if approval workflow enabled)

```
PENDING ──→ APPROVED ──→ POSTED
    │           │
    │           └──→ REJECTED
    │
    └──→ CANCELLED
```

---

## 3. API Design

### 3.1 API Module
**File:** `src/features/master/stock-opname/stockOpname.api.js`

### 3.2 Functions

#### 3.2.1 `getProductStock(token, params)`
Fetch current stock level for a specific product and warehouse.

**Parameters:**
```javascript
{
  product_id: string,      // Required
  warehouse_id: string,    // Required
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    product_id: string,
    warehouse_id: string,
    current_stock: number,
    product: {
      id: string,
      code: string,
      name: string,
      unit: string,
    },
    warehouse: {
      id: string,
      code: string,
      name: string,
    },
  },
}
```

**Endpoint:** `GET /api/inventory/stock?product_id=&warehouse_id=`

---

#### 3.2.2 `createStockOpname(token, input)`
Submit new stock opname transaction.

**Input:**
```javascript
{
  product_id: string,      // Required
  warehouse_id: string,    // Required
  system_qty: number,      // Required (snapshot at time of opname)
  physical_qty: number,    // Required (actual counted)
  variance: number,        // Required (calculated: physical - system)
  reason: string,          // Required (enum: damage, expired, lost, found, counting_error, other)
  notes: string,           // Optional
  reference: string,       // Optional (auto-generated if not provided)
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    id: string,
    reference: string,
    created_at: string,
    // ... full record
  },
  message: "Stock opname created successfully",
}
```

**Endpoint:** `POST /api/stock-opname`

---

#### 3.2.3 `listStockOpname(token, params)`
Get list of stock opname records (for history view).

**Parameters:**
```javascript
{
  search?: string,         // Search by reference, product name
  warehouse_id?: string,   // Filter by warehouse
  product_id?: string,     // Filter by product
  status?: string,         // Filter by status (pending, approved, posted, rejected)
  date_from?: string,      // Filter by date range
  date_to?: string,
  limit?: number,
  offset?: number,
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    items: [
      {
        id: string,
        reference: string,
        product: { code, name, unit },
        warehouse: { code, name },
        system_qty: number,
        physical_qty: number,
        variance: number,
        reason: string,
        notes: string,
        status: string,
        created_by: string,
        created_at: string,
      },
      // ...
    ],
    pagination: {
      total: number,
      limit: number,
      offset: number,
      has_more: boolean,
    },
  },
}
```

**Endpoint:** `GET /api/stock-opname`

---

#### 3.2.4 `updateStockOpname(token, id, input)`
Update existing stock opname (only if status = pending).

**Parameters:**
```javascript
{
  physical_qty?: number,
  reason?: string,
  notes?: string,
}
```

**Endpoint:** `PUT /api/stock-opname/:id`

---

#### 3.2.5 `approveStockOpname(token, id, action)`
Approve or reject stock opname (if approval workflow enabled).

**Parameters:**
```javascript
{
  action: 'approve' | 'reject',
  rejection_reason?: string,  // Required if reject
}
```

**Endpoint:** `POST /api/stock-opname/:id/approve`

---

#### 3.2.6 `deleteStockOpname(token, id)`
Delete/cancel stock opname (only if status = pending).

**Endpoint:** `DELETE /api/stock-opname/:id`

---

### 3.3 Dummy Data (Offline Mode)

```javascript
const DUMMY_PRODUCTS = [
  { id: 'PRD001', code: 'PRD-001', name: 'Kopi Luwak', unit: 'PCS' },
  { id: 'PRD002', code: 'PRD-002', name: 'Gula Pasir', unit: 'KG' },
  { id: 'PRD003', code: 'PRD-003', name: 'Teh Botol', unit: 'BOX' },
]

const DUMMY_WAREHOUSES = [
  { id: 'WH001', code: 'WH-001', name: 'Gudang Utama' },
  { id: 'WH002', code: 'WH-002', name: 'Gudang Cabang' },
]

const DUMMY_STOCK_LEVELS = {
  'PRD001-WH001': 150,
  'PRD002-WH001': 80,
  'PRD003-WH001': 200,
  'PRD001-WH002': 50,
}

const DUMMY_OPNAME_RECORDS = [
  {
    id: 'OPN001',
    reference: 'OPN-20260305-001',
    product_id: 'PRD001',
    product: { code: 'PRD-001', name: 'Kopi Luwak', unit: 'PCS' },
    warehouse_id: 'WH001',
    warehouse: { code: 'WH-001', name: 'Gudang Utama' },
    system_qty: 150,
    physical_qty: 145,
    variance: -5,
    reason: 'counting_error',
    notes: 'Selisih saat stock opname bulanan',
    status: 'posted',
    created_by: 'admin',
    created_at: '2026-03-05T10:30:00Z',
  },
  {
    id: 'OPN002',
    reference: 'OPN-20260305-002',
    product_id: 'PRD002',
    product: { code: 'PRD-002', name: 'Gula Pasir', unit: 'KG' },
    warehouse_id: 'WH001',
    warehouse: { code: 'WH-001', name: 'Gudang Utama' },
    system_qty: 80,
    physical_qty: 75,
    variance: -5,
    reason: 'expired',
    notes: 'Gula kadaluarsa, perlu dibuang',
    status: 'pending',
    created_by: 'admin',
    created_at: '2026-03-05T14:00:00Z',
  },
]
```

---

## 4. File Structure

### 4.1 Files to Create

```
src/
├── features/
│   └── master/
│       └── stock-opname/
│           └── stockOpname.api.js          # NEW - API functions
└── components/
    └── ToolbarItem/
        └── master/
            └── StockOpname.jsx             # NEW - Main component

document/
└── PLAN_stock_opname.md                    # NEW - This document
```

### 4.2 Files to Modify

```
src/
└── components/
    └── Dashboard/
        └── DashboardCanvas.jsx             # MODIFY - Add opname route
```

---

## 5. Component Design

### 5.1 StockOpname Component Structure

```jsx
export function StockOpname({ onExit }) {
  // Auth
  const { auth } = useAuth()
  const token = auth?.token

  // Data state
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isFetchingStock, setIsFetchingStock] = useState(false)
  const [error, setError] = useState('')

  // Filters
  const [searchKeyword, setSearchKeyword] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Selection
  const [selectedId, setSelectedId] = useState(null)
  
  // Form visibility
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  // Lookup data
  const [productOptions, setProductOptions] = useState([])
  const [warehouseOptions, setWarehouseOptions] = useState([])
  const [reasonOptions] = useState(REASON_OPTIONS)

  // Form state
  const [form, setForm] = useState(DEFAULT_FORM)
  const [currentStock, setCurrentStock] = useState(0)
  const [variance, setVariance] = useState(0)

  // ... handlers and effects
}
```

### 5.2 Constants

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

const DEFAULT_FORM = {
  product_id: '',
  warehouse_id: '',
  system_qty: 0,
  physical_qty: 0,
  reason: '',
  notes: '',
  reference: '',
}

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false },
  { key: 'reference', label: 'REFERENSI' },
  { key: 'product_name', label: 'PRODUK' },
  { key: 'warehouse_name', label: 'GUDANG' },
  { key: 'system_qty', label: 'STOK SISTEM' },
  { key: 'physical_qty', label: 'STOK FISIK' },
  { key: 'variance', label: 'SELISIH' },
  { key: 'reason', label: 'ALASAN' },
  { key: 'status', label: 'STATUS' },
  { key: 'created_at', label: 'TANGGAL' },
]
```

### 5.3 Form Fields

| Field | Type | Required | Read-Only | Notes |
|-------|------|----------|-----------|-------|
| Product | Dropdown | Yes | No | Searchable dropdown |
| Warehouse | Dropdown | Yes | No | |
| Current Stock | Number | - | Yes | Auto-filled from API |
| Physical Qty | Number | Yes | No | Must be >= 0 |
| Variance | Number | - | Yes | Auto-calculated |
| Reason | Dropdown | Yes | No | From REASON_OPTIONS |
| Notes | Textarea | No | No | Max 500 chars |
| Reference | Text | - | Yes | Auto-generated (OPN-YYYYMMDD-###) |

### 5.4 Table Columns

```javascript
const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false, width: '50px' },
  { key: 'reference', label: 'REFERENSI', sortable: true },
  { key: 'product_name', label: 'PRODUK', sortable: true },
  { key: 'warehouse_name', label: 'GUDANG', sortable: true },
  { key: 'system_qty', label: 'STOK SISTEM', sortable: true, align: 'right' },
  { key: 'physical_qty', label: 'STOK FISIK', sortable: true, align: 'right' },
  { key: 'variance', label: 'SELISIH', sortable: true, align: 'right' },
  { key: 'reason', label: 'ALASAN', sortable: true },
  { key: 'status', label: 'STATUS', sortable: true },
  { key: 'created_at', label: 'TANGGAL', sortable: true, width: '120px' },
]
```

### 5.5 Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| `F1` or `+` | New opname | When form closed |
| `F2` | Edit selected | When row selected |
| `Delete` | Delete selected | When row selected |
| `Escape` | Close form / Exit | Context-sensitive |
| `Enter` | Confirm action | In dialog |

---

## 6. UI/UX Design

### 6.1 Main View Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📦 Stock Opname                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  [Search: ___________]  [Warehouse: All ▼]  [Status: All ▼]  [🔍]      │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌────┬─────────────┬────────────┬──────────┬───────┬───────┬────────┐  │
│ │ NO │ REFERENSI   │ PRODUK     │ GUDANG   │  SYS  │  PHY  │ SELISIH│  │
│ ├────┼─────────────┼────────────┼──────────┼───────┼───────┼────────┤  │
│ │  1 │ OPN-202603..│ Kopi Luwak │ Gudang.. │   150 │   145 │     -5 │  │
│ │  2 │ OPN-202603..│ Gula Pasir │ Gudang.. │    80 │    75 │     -5 │  │
│ │  3 │ OPN-202603..│ Teh Botol  │ Gudang.. │   200 │   200 │      0 │  │
│ └────┴─────────────┴────────────┴──────────┴───────┴───────┴────────┘  │
│                                          Page 1 of 5  [<] [>]          │
├─────────────────────────────────────────────────────────────────────────┤
│  [🆕 New] [✏️ Edit] [🗑️ Delete] [🖨️ Print] [🔄 Refresh] [🚪 Exit]     │
│  Total Row: 45                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Form Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  📦 Stock Opname Form                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Product *    : [ 🔍 Search product...              ▼ ]        │
│                                                                 │
│  Warehouse *  : [ Select warehouse                 ▼ ]        │
│                                                                 │
│  ────────────────────────────────────────────────────────────  │
│                                                                 │
│  Current Stock: [ 150              ] (auto, read-only)         │
│                                                                 │
│  Physical Qty*: [ 145              ] (input)                   │
│                                                                 │
│  Variance     : [ -5                ] (auto, red if negative)  │
│                                                                 │
│  ────────────────────────────────────────────────────────────  │
│                                                                 │
│  Reason *     : [ Barang Rusak                     ▼ ]        │
│                                                                 │
│  Notes        : [ Catatan tambahan (opsional)...           ]  │
│                 [                                         ]  │
│                                                                 │
│  Reference    : [ OPN-20260305-003 ] (auto-generated)         │
│                                                                 │
│  ────────────────────────────────────────────────────────────  │
│                                                                 │
│                    [ 💾 Simpan ]  [ ❌ Batal ]                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Variance Color Coding

```css
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
```

### 6.4 Status Badges

```css
.status-pending {
  background: #fbbf24;  /* Amber */
  color: #78350f;
}

.status-approved {
  background: #3b82f6;  /* Blue */
  color: #1e3a8a;
}

.status-posted {
  background: #10b981;  /* Green */
  color: #064e3b;
}

.status-rejected {
  background: #ef4444;  /* Red */
  color: #7f1d1d;
}
```

---

## 7. Implementation Steps

### Phase 1: API Module (Priority: High)
**File:** `src/features/master/stock-opname/stockOpname.api.js`

**Tasks:**
- [ ] Create file structure
- [ ] Implement `getProductStock()` function
- [ ] Implement `createStockOpname()` function
- [ ] Implement `listStockOpname()` function
- [ ] Implement `updateStockOpname()` function
- [ ] Implement `deleteStockOpname()` function
- [ ] Add dummy data for offline mode
- [ ] Add normalization helpers
- [ ] Test API functions with mock data

**Estimated Effort:** 2-3 hours

---

### Phase 2: Component Development (Priority: High)
**File:** `src/components/ToolbarItem/master/StockOpname.jsx`

**Tasks:**
- [ ] Create component file
- [ ] Set up state management (useState hooks)
- [ ] Implement data fetching (`fetchData()`)
- [ ] Implement lookup fetching (products, warehouses)
- [ ] Implement current stock auto-fetch on product+warehouse change
- [ ] Implement variance auto-calculation
- [ ] Build table view with sorting
- [ ] Build form UI with validation
- [ ] Implement CRUD handlers (create, edit, delete)
- [ ] Implement keyboard shortcuts
- [ ] Implement filters (search, warehouse, status)
- [ ] Implement pagination
- [ ] Add delete confirmation dialog
- [ ] Add exit confirmation dialog
- [ ] Test component in isolation

**Estimated Effort:** 4-5 hours

---

### Phase 3: Integration (Priority: Medium)
**File:** `src/components/Dashboard/DashboardCanvas.jsx`

**Tasks:**
- [ ] Import `StockOpname` component
- [ ] Add route: `if (activeTool === 'opname')`
- [ ] Test navigation from toolbar
- [ ] Test end-to-end flow

**Estimated Effort:** 30 minutes

---

### Phase 4: Polish & Testing (Priority: Medium)
**Files:** All

**Tasks:**
- [ ] Run `npm run lint` and fix issues
- [ ] Run `npm run build` and verify no errors
- [ ] Test all keyboard shortcuts
- [ ] Test offline mode (no token)
- [ ] Test form validation
- [ ] Test variance color coding
- [ ] Test pagination
- [ ] Test filters
- [ ] Test integration with stock card
- [ ] Cross-browser testing (if web mode)
- [ ] Tauri desktop testing

**Estimated Effort:** 2-3 hours

---

## 8. Validation Rules

### 8.1 Field-Level Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| Product | Required | "Product harus dipilih" |
| Warehouse | Required | "Warehouse harus dipilih" |
| Physical Qty | Required, >= 0 | "Stok fisik harus diisi dan tidak boleh negatif" |
| Reason | Required | "Alasan harus dipilih" |
| Notes | Max 500 chars | "Catatan maksimal 500 karakter" |

### 8.2 Business Rules

1. **Product + Warehouse Uniqueness**
   - Cannot create duplicate pending opname for same product+warehouse combination
   - Check before save: `if (existsPending(product_id, warehouse_id)) → error`

2. **Variance Calculation**
   - Formula: `variance = physical_qty - system_qty`
   - Auto-calculated, cannot be manually edited
   - Display with sign: `+5` (surplus), `-5` (shortage)

3. **Reference Number Generation**
   - Format: `OPN-YYYYMMDD-###`
   - Example: `OPN-20260305-001`
   - Auto-incremented daily

4. **Status Transitions**
   ```
   PENDING → APPROVED → POSTED (final)
       │         │
       │         └──→ REJECTED (final)
       │
       └──→ CANCELLED (final)
   ```

5. **Edit/Delete Restrictions**
   - Can only edit/delete if status = 'pending'
   - Cannot modify after approval/posting

### 8.3 Form Validation Flow

```javascript
function validateForm(form) {
  const errors = []
  
  if (!form.product_id) {
    errors.push('Product harus dipilih')
  }
  
  if (!form.warehouse_id) {
    errors.push('Warehouse harus dipilih')
  }
  
  if (!form.physical_qty || form.physical_qty < 0) {
    errors.push('Stok fisik harus diisi dan tidak boleh negatif')
  }
  
  if (!form.reason) {
    errors.push('Alasan harus dipilih')
  }
  
  if (form.notes && form.notes.length > 500) {
    errors.push('Catatan maksimal 500 karakter')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}
```

---

## 9. Testing Checklist

### 9.1 Build & Lint
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `npm run tauri:build -- --debug` passes (if desktop changes)

### 9.2 Data Loading
- [ ] Product dropdown loads correctly
- [ ] Warehouse dropdown loads correctly
- [ ] Current stock auto-fetches on product+warehouse selection
- [ ] List view shows correct data
- [ ] Pagination works (next, prev, first, last)

### 9.3 Form Functionality
- [ ] Form opens on F1 / + / New button
- [ ] Form opens on F2 / Edit button
- [ ] All required fields validated
- [ ] Variance auto-calculates correctly
- [ ] Variance color coding works (green/red/gray)
- [ ] Save creates new record successfully
- [ ] Save updates existing record successfully
- [ ] Cancel closes form without saving
- [ ] Form resets after successful save

### 9.4 Table Operations
- [ ] Row selection works (click)
- [ ] Sorting works on sortable columns
- [ ] Search filter works
- [ ] Warehouse filter works
- [ ] Status filter works
- [ ] Delete confirmation shows
- [ ] Delete removes record
- [ ] Refresh reloads data

### 9.5 Keyboard Shortcuts
- [ ] F1 opens new form
- [ ] + opens new form
- [ ] F2 opens edit form
- [ ] Delete triggers delete confirmation
- [ ] Escape closes form
- [ ] Escape triggers exit confirmation

### 9.6 Offline Mode
- [ ] Dummy data loads when no token
- [ ] Form works with dummy data
- [ ] CRUD operations work locally (no API)

### 9.7 Integration
- [ ] Stock opname appears in stock card
- [ ] Adjusted quantities reflect in stock report
- [ ] Navigation from toolbar works

---

## 10. Notes & Considerations

### 10.1 Technical Notes

- **JavaScript-first:** Do not migrate to TypeScript
- **Pattern consistency:** Follow existing master page patterns (Warehouse, Product)
- **API helper:** Use `apiFetch` from `src/shared/http`
- **Offline support:** Always provide dummy data fallback
- **Stock integration:** Use existing `adjustStock()` from `src/features/laporan/stock/stock.api.js` if applicable

### 10.2 Open Questions

1. **Approval Workflow:**
   - Does backend require approval before posting?
   - Who can approve? (role-based)
   - Is there a separate approval screen needed?

2. **Barcode Scanning:**
   - Should product selection support barcode scanner input?
   - Quick scan mode for fast opname?

3. **Bulk Opname:**
   - Support uploading opname data from CSV/Excel?
   - Batch entry mode for multiple products?

4. **Print Format:**
   - Custom print template for opname documents?
   - Include company logo, signatures?

### 10.3 Future Enhancements

- **Mobile support:** Tablet-friendly interface for warehouse counting
- **QR/Barcode scanning:** Direct scan during opname
- **Photo attachment:** Document damaged goods with photos
- **Scheduled opname:** Recurring opname schedules
- **Variance thresholds:** Alert when variance exceeds threshold
- **Audit log:** Track who made each adjustment

---

## 11. References

### 11.1 Related Documents
- `PLAN_product.md` - Product CRUD implementation
- `PLAN_warehouse.md` - Warehouse management
- `document/PLAN_lap_stock.md` - Stock report
- `document/PLAN_stockcard.md` - Stock card

### 11.2 Related Modules
- `src/components/ToolbarItem/master/Product.jsx` - Pattern reference
- `src/components/ToolbarItem/master/Warehouse.jsx` - Pattern reference
- `src/components/ToolbarItem/laporan/stok/LapStock.jsx` - Stock display pattern
- `src/features/laporan/stock/stock.api.js` - Stock adjustment API

### 11.3 API Endpoints (Summary)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/stock` | Get current stock |
| GET | `/api/stock-opname` | List opname records |
| POST | `/api/stock-opname` | Create opname |
| PUT | `/api/stock-opname/:id` | Update opname |
| DELETE | `/api/stock-opname/:id` | Delete opname |
| POST | `/api/stock-opname/:id/approve` | Approve/reject |

---

**Document Version:** 1.0  
**Last Updated:** 5 March 2026  
**Author:** AI Assistant  
**Status:** Ready for Implementation
