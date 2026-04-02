# PLAN PEMBELIAN (PURCHASE ORDER)

## 1. Design System Reference

### 1.1 Master-Detail Template (Stock Opname Pattern)

Implement exactly the same visual and structural pattern as **StockOpnameDetail.jsx**:

```
┌─────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────┐  │
│  │ HEADER (sticky top)                          │  │
│  │ ├─ Title Section: "PURCHASE ORDER - PO-001" │  │
│  │ ├─ Status Buttons (Draft|Pending|Approved)  │  │
│  │ └─ Form Fields (grid layout):                │  │
│  │    • Supplier (required, select)             │  │
│  │    • Warehouse (required, select)            │  │
│  │    • PO Date (date picker)                   │  │
│  │    • Expected Date (optional, date picker)  │  │
│  │    • Notes (textarea)                        │  │
│  └─────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  MAIN CONTENT (scrollable)                         │
│  ┌─────────────────────────────────────────────┐  │
│  │ Items Table                                 │  │
│  │ ├─ Checkbox column                          │  │
│  │ ├─ No                                       │  │
│  │ ├─ SKU                                      │  │
│  │ ├─ Product Name                             │  │
│  │ ├─ Qty (editable in table? or modal only?) │  │
│  │ ├─ Unit Price (editable)                    │  │
│  │ ├─ Discount                                │  │
│  │ ├─ Tax %                                   │  │
│  │ ├─ Line Total (computed)                    │  │
│  │ └─ Actions (Remove button)                  │  │
│  └─────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────┐  │
│  │ Summary Bar (below table)                   │  │
│  │ • Total Items: 5                            │  │
│  │ • Subtotal: Rp 500,000                      │  │
│  │ • Discount: Rp 50,000                       │  │
│  │ • Tax: Rp 55,000                           │  │
│  │ • Grand Total: Rp 555,000                  │  │
│  └─────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  FOOTER (sticky bottom)                            │
│  ┌─────────────────────────────────────────────┐  │
│  │ [Add Item] [Remove] [Save Draft] [Submit]  │  │
│  │ [Cancel] [Exit]                             │  │
│  │ + shortcut hints                            │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 1.2 CSS Class Naming Convention

Follow Stock Opname naming pattern:

```css
/* Container */
.purchase-container

/* Header */
.purchase-header
.purchase-header-top
.purchase-title-section
.purchase-accent-bar (optional decorative bar)
.purchase-title
.purchase-status-group (if using status buttons)

/* Header Form Grid */
.purchase-header-form
.form-group (reusable)
.form-label (reusable)
.form-input (reusable)
.form-input-readonly (reusable)
.form-textarea (reusable)

/* Items Section */
.purchase-items
.purchase-table-container
.purchase-table (extends .master-table)

/* Table Styles */
.purchase-table .table-header th { ... }
.purchase-table tbody tr.table-row { ... }
.purchase-table .table-checkbox { ... }
.purchase-table .table-center { ... }
.purchase-table .table-product { ... }
.purchase-table .text-muted { ... }
.purchase-table .font-bold { ... }
.purchase-table .variance-positive { ... } /* if needed */
.purchase-table .variance-negative { ... } /* if needed */

/* Summary */
.purchase-summary
.summary-title
.summary-items
.summary-item
.summary-value
.summary-positive (if showing positive amount)
.summary-negative (if showing negative amount)
.summary-divider

/* Footer */
.purchase-footer
.footer-content
.footer-actions-left
.footer-actions-right (optional)
.master-footer-btn (reusable)
.master-footer-icon (reusable)
.master-footer-key (reusable shortcut hint)
```

### 1.3 Component Structure

```jsx
// File: src/components/ToolbarItem/transaksi/PurchaseDetail.jsx
export function PurchaseDetail({ selectedId, onExit, onSaveSuccess }) {
  // State
  const [header, setHeader] = useState({
    po_number: generatePOReference(),
    supplier_id: '',
    warehouse_id: '',
    po_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    notes: '',
    status: 'draft'
  })
  const [items, setItems] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [warehouses, setWarehouses] = useState([])
  
  // Computed
  const subtotal = useMemo(() => ...
  const taxTotal = useMemo(() => ...
  const discountTotal = useMemo(() => ...
  const grandTotal = useMemo(() => subtotal - discountTotal + taxTotal
  
  // Handlers
  const addItem = useCallback((item) => { ... })
  const removeItem = useCallback((ids) => { ... })
  const updateItem = useCallback((id, updates) => { ... })
  const handleSave = useCallback(async () => { ... })
  const handleSubmit = useCallback(async () => { ... })
  
  // Render
  return (
    <div className="purchase-container">
      <header className="purchase-header">
        {/* Title & Status */}
        <div className="purchase-header-top">
          <div className="purchase-title-section">
            <div className="purchase-accent-bar"></div>
            <h1 className="purchase-title">PURCHASE ORDER - {header.po_number}</h1>
          </div>
          <div className="purchase-status-group">
            {/* Status buttons if needed, or just display badge */}
          </div>
        </div>
        
        {/* Form Fields */}
        <div className="purchase-header-form">
          <div className="form-group">
            <label className="form-label">Supplier *</label>
            <select value={header.supplier_id} onChange={...} className="form-input">
              <option value="">Select supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Warehouse *</label>
            <select value={header.warehouse_id} onChange={...} className="form-input">
              <option value="">Select warehouse...</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">PO Date *</label>
            <input type="date" value={header.po_date} onChange={...} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Expected Date</label>
            <input type="date" value={header.expected_date} onChange={...} className="form-input" />
          </div>
          <div className="form-group form-group-full"> {/* full width */}
            <label className="form-label">Notes</label>
            <textarea 
              value={header.notes} 
              onChange={...} 
              className="form-input form-textarea" 
              rows={1}
              placeholder="Add notes..."
            />
          </div>
        </div>
      </header>

      {error && <div className="master-error">{error}</div>}

      <main className="purchase-items">
        <div className="purchase-table-container">
          <div className="table-wrapper custom-scrollbar">
            <table className="purchase-table master-table">
              <thead className="table-header">
                <tr>
                  <th className="table-checkbox">...</th>
                  <th className="table-center" style={{width:'60px'}}>No</th>
                  <th>SKU</th>
                  <th>Product</th>
                  <th className="table-center">Unit</th>
                  <th className="table-center">Qty</th>
                  <th className="table-right">Unit Price</th>
                  <th className="table-right">Discount</th>
                  <th className="table-center">Tax %</th>
                  <th className="table-right">Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="table-row">
                    {/* checkbox */}
                    <td className="table-checkbox">...</td>
                    <td className="table-center text-muted">{index + 1}</td>
                    <td className="font-bold">{item.sku}</td>
                    <td className="table-product">
                      <div className="product-name">{item.product_name}</div>
                    </td>
                    <td className="table-center text-muted">{item.unit}</td>
                    <td className="table-center">
                      <input 
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                        className="quantity-input"
                        min="0"
                      />
                    </td>
                    <td className="table-right">
                      <input 
                        type="number" 
                        value={item.unit_price} 
                        onChange={(e) => updateItem(item.id, { unit_price: Number(e.target.value) })}
                        className="price-input"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="table-right">
                      <input 
                        type="number" 
                        value={item.discount || 0} 
                        onChange={(e) => updateItem(item.id, { discount: Number(e.target.value) })}
                        className="discount-input"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="table-center">
                      <input 
                        type="number" 
                        value={item.tax_rate || 0} 
                        onChange={(e) => updateItem(item.id, { tax_rate: Number(e.target.value) })}
                        className="tax-input"
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="table-right font-bold">
                      {formatCurrency(
                        (item.quantity * item.unit_price) - (item.discount || 0) + 
                        ((item.quantity * item.unit_price - (item.discount || 0)) * (item.tax_rate || 0) / 100)
                      )}
                    </td>
                    <td className="table-center">
                      <button 
                        type="button"
                        className="remove-btn"
                        onClick={() => removeItem([item.id])}
                        title="Remove item"
                      >
                        <span className="material-icons-round">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="purchase-summary">
          <span className="summary-title">Summary</span>
          <div className="summary-items">
            <span className="summary-item">
              TOTAL ITEMS: <span className="summary-value">{items.length}</span>
            </span>
            <span className="summary-divider"></span>
            <span className="summary-item">
              SUBTOTAL: <span className="summary-value">{formatCurrency(subtotal)}</span>
            </span>
            <span className="summary-divider"></span>
            <span className="summary-item summary-negative">
              DISCOUNT: <span className="summary-value">{formatCurrency(discountTotal)}</span>
            </span>
            <span className="summary-divider"></span>
            <span className="summary-item">
              TAX: <span className="summary-value">{formatCurrency(taxTotal)}</span>
            </span>
            <span className="summary-divider"></span>
            <span className="summary-item summary-total">
              GRAND TOTAL: <span className="summary-value">{formatCurrency(grandTotal)}</span>
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="purchase-footer">
        <div className="footer-content">
          <div className="footer-actions-left">
            <button
              type="button"
              className="master-footer-btn"
              onClick={() => setShowAddModal(true)}
              disabled={isSaving}
              title="Add Product (F1)"
            >
              <span className="material-icons-round master-footer-icon orange">add_box</span>
              <span className="master-footer-key">+</span>
            </button>
            <button
              type="button"
              className="master-footer-btn"
              onClick={() => removeItem(selectedIds)}
              disabled={selectedIds.length === 0 || isSaving}
              title="Remove Selected (DEL)"
            >
              <span className="material-icons-round master-footer-icon orange">remove_circle</span>
              <span className="master-footer-key">DEL</span>
            </button>
            <button
              type="button"
              className="master-footer-btn"
              onClick={handleSave}
              disabled={isSaving || !canSave}
              title="Save Draft (Ctrl+S)"
            >
              <span className="material-icons-round master-footer-icon green">save</span>
            </button>
            <button
              type="button"
              className="master-footer-btn"
              onClick={handleSubmit}
              disabled={isSaving || !canSubmit}
              title="Submit for Approval"
            >
              <span className="material-icons-round master-footer-icon blue">send</span>
            </button>
            <button
              type="button"
              className="master-footer-btn"
              onClick={() => setShowExitConfirm(true)}
              disabled={isSaving}
              title="Exit (Esc)"
            >
              <span className="material-icons-round master-footer-icon red">exit_to_app</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
```

---

## 2. API Endpoints (dari swagger.json)

### 2.1 List Purchase Orders
```
GET /api/purchases
```
**Query Parameters:**
- `status` (string) - Filter by PO status (draft, pending, approved, rejected, cancelled, completed)
- `supplier_id` (string) - Filter by supplier
- `warehouse_id` (string) - Filter by destination warehouse
- `search` (string) - Search by PO number, supplier name
- `limit` (int) - Default 50
- `offset` (int) - Default 0

**Response:** `PaginatedResponse` (array of PurchaseOrder)

---

### 2.2 Create Purchase Order
```
POST /api/purchases
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "supplier_id": "string (uuid)",
  "warehouse_id": "string (uuid)",
  "expected_date": "string (date, optional)",
  "notes": "string (optional)",
  "items": [
    {
      "product_id": "string (uuid)",
      "quantity": integer,
      "unit_price": number,
      "discount": number (optional),
      "tax_rate": number (optional)
    }
  ]
}
```

**Response:** `ApiResponse` with created PO data

---

### 2.3 Get Purchase Order Detail
```
GET /api/purchases/{id}
```
**Response:** `ApiResponse` with full PO details including items

---

### 2.4 Update PO Status
```
POST /api/purchases/{id}/status
```
**Request Body:**
```json
{
  "status": "string (approved|rejected|cancelled|completed)"
}
```

---

### 2.5 Cancel Purchase Order
```
POST /api/purchases/{id}/cancel
```
**Response:** `ApiResponse`

---

### 2.6 Related APIs (for lookups)
- `GET /api/suppliers` - List suppliers (for supplier select)
- `GET /api/products` - List products (for add item modal)
- `GET /api/warehouses` - List warehouses (for destination)

---

## 3. Data Structure (Inferred from API)

### 3.1 PurchaseOrder Model
```javascript
{
  id: string (uuid)
  po_number: string (e.g., "PO-20260305-001")
  supplier_id: string
  supplier_name: string (joined)
  warehouse_id: string
  warehouse_name: string (joined)
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'
  po_date: string (date)
  expected_date: string (date, optional)
  subtotal: number
  tax_total: number
  discount_total: number
  grand_total: number
  notes: string (optional)
  created_by: string
  created_at: string
  updated_at: string
  items: PurchaseOrderItem[]
}
```

### 3.2 PurchaseOrderItem Model
```javascript
{
  id: string
  product_id: string
  product_name: string
  sku: string
  quantity: number
  unit_price: number
  discount: number (optional)
  tax_rate: number (optional)
  line_total: number (computed: qty * unit_price - discount + tax)
}
```

---

## 4. Implementation Plan

### Phase 1: Setup & Structure

**4.1 Create Directory Structure**
```
src/components/ToolbarItem/transaksi/
├── Purchase.jsx          (main list view)
├── PurchaseDetail.jsx   (master-detail view)
└── AddPurchaseItemModal.jsx  (modal for adding items)
```

**4.2 API Module**
Create `src/features/transaksi/purchase/purchase.api.js`:
```javascript
export function listPurchases(token, params) { ... }
export function getPurchase(token, id) { ... }
export function createPurchase(token, payload) { ... }
export function updatePurchaseStatus(token, id, status) { ... }
export function cancelPurchase(token, id) { ... }
```

---

### Phase 2: Main List View (Purchase.jsx)

**Features:**
- Table with columns: PO Number, Supplier, Warehouse, Date, Status, Total
- Filter controls: Search (PO number), Status dropdown, Supplier dropdown, Warehouse dropdown
- Action buttons: [New PO] [View/Edit] [Delete/ Void]
- Pagination (use `useMasterPagination`)
- Keyboard shortcuts: F2=Edit, Delete=Void/Cancel, +=New
- Status badges with color coding

**State:**
```javascript
const [data, setData] = useState([])
const [pagination, setPagination] = useState({})
const [filters, setFilters] = useState({ status: '', supplier_id: '', warehouse_id: '' })
const [selectedId, setSelectedId] = useState(null)
const [showForm, setShowForm] = useState(false)  // For detail/edit
```

---

### Phase 3: Master-Detail View (PurchaseDetail.jsx)

**Follow StockOpnameDetail pattern exactly:**

**Header Section:**
- PO Number (readonly, generated)
- Date picker (po_date)
- Supplier select (required) - fetch from `/api/suppliers`
- Warehouse select (required) - fetch from `/api/warehouses`
- Expected date (optional)
- Status badge (non-editable, shows current status)
- Notes textarea
- Buttons (conditional by status):
  - DRAFT: [Save Draft] [Submit for Approval]
  - PENDING: [Cancel] (if owned by current user)
  - APPROVED: [Receive Items] [Complete] [Cancel]
  - COMPLETED: [Print] [View History]
  - CANCELLED:no actions

**Items Table:**
- Columns: No, SKU, Product Name, Qty, Unit Price, Discount, Tax %, Line Total, Actions
- Editable inline? (consider: edit qty/price before submission)
- Remove button per item (only if draft/pending)
- Running totals footer (Subtotal, Discount, Tax, Grand Total)

**Add Item Modal (separate component):**
- Search product (autocomplete, shows SKU + Name)
- Display available stock (optional, from inventory)
- Input: Quantity (required), Unit Price (required, default from product retail_price), Discount (optional), Tax Rate (optional, default from product/setting)
- Pre-calculated line total display

**Footer (MasterDetailFooter):**
- [Add Item] button (opens modal)
- Navigation: Prev/Next page (if viewing historical POs)
- Total: "X items"

---

### Phase 4: State Management & Computations

**Computed Values:**
```javascript
const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
const discountTotal = items.reduce((sum, item) => sum + (item.discount || 0), 0)
const taxTotal = items.reduce((sum, item) => {
  const lineTotal = item.quantity * item.unit_price - (item.discount || 0)
  return sum + (lineTotal * (item.tax_rate || 0) / 100)
}, 0)
const grandTotal = subtotal - discountTotal + taxTotal
```

**Status Transitions (Business Rules):**
1. Draft → Submit → Pending (requires items ≥ 1)
2. Pending → Approved (by manager/supervisor)
3. Pending → Rejected (by manager/supervisor)
4. Pending → Cancelled (by creator before approved)
5. Approved → Completed (after receiving goods)
6. Any → Cancelled (only if no goods received yet)

---

### Phase 5: API Integration

**Create Purchase:**
```javascript
const payload = {
  supplier_id: form.supplier_id,
  warehouse_id: form.warehouse_id,
  expected_date: form.expected_date || null,
  notes: form.notes || '',
  items: items.map(item => ({
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount: item.discount || 0,
    tax_rate: item.tax_rate || 0
  }))
}
```

**Compute totals** on backend? Or send and let backend recalc? (Check backend logic).

---

### Phase 6: Validation Rules

**Header:**
- ✅ Supplier required
- ✅ Warehouse required
- ✅ At least 1 item required before saving/submitting

**Item:**
- ✅ Product required
- ✅ Quantity > 0
- ✅ Unit Price ≥ 0
- ✅ Discount ≥ 0
- ✅ Tax Rate 0-100

---

### Phase 7: UI/UX Polish

**Status Badges:**
- Draft: Gray
- Pending: Orange
- Approved: Blue
- Rejected: Red
- Cancelled: Gray (italic)
- Completed: Green

**Confirmation Dialogs:**
- Submit for approval: "Anda yakin submitting PO ini?"
- Cancel PO: "Batalkan PO? Tindakan ini tidak dapat dibatalkan."
- Delete item: "Hapus item dari daftar?"

---

### Phase 8: Additional Features (Optional)

1. **Print Preview** - Generate PO PDF/print layout
2. **Email to Supplier** - Send PO via email
3. **Duplicate PO** - Copy existing PO to create new one
4. **Version History** - Track changes (audit log)
5. **Receive Items** - Separate modal for partial/full receiving
6. **Attachments** - Upload supporting documents
7. **Approval Workflow** - Multi-level approval with comments

---

## 5. Files to Create

| File | Purpose | Reference |
|------|---------|-----------|
| `src/features/transaksi/purchase/purchase.api.js` | API functions | StockOpnameDetail uses `stockOpname.api` |
| `src/components/ToolbarItem/transaksi/Purchase.jsx` | List view | LapStock.jsx pattern |
| `src/components/ToolbarItem/transaksi/PurchaseDetail.jsx` | Master-detail view | StockOpnameDetail.jsx |
| `src/components/templates/AddPurchaseItemModal.jsx` | Add item modal | AddItemModal.jsx |
| `src/components/ToolbarItem/transaksi/PurchaseItemTable.jsx` *(optional)* | Reusable item table | StockOpnameDetail inline table |
| `document/PLAN_purchase.md` | This document | - |

---

## 6. Comparison: Stock Opname vs Purchase

| Feature | Stock Opname | Purchase |
|---------|-------------|----------|
| **Main Entity** | Stock Opname | Purchase Order |
| **Header Fields** | Warehouse, Date, Status | Supplier, Warehouse, PO Date, Expected Date, Status |
| **Items Source** | Product catalog (search by name/SKU) | Product catalog + Unit Price override |
| **Item Fields** | Product, System Qty, Actual Qty, Reason | Product, Qty, Unit Price, Discount, Tax |
| **Quantity** | Actual count vs system | Planned quantity to order |
| **Pricing** | N/A (cost only) | Unit price, discount, tax (cost calculation) |
| **Total** | N/A | Subtotal + Tax - Discount |
| **Workflow** | Draft → Open → Completed | Draft → Pending → Approved → Completed |
| **Add Item** | Single modal with product search | Same pattern |
| **Receive** | N/A (opname is count) | Future: Receive items (GRN) |

---

## 7. Technical Notes

### 7.1 Product Search (for Add Item)
- Use `listProducts(token, { search, limit, offset })`
- Display: `SKU - Product Name` in dropdown
- Store: `product_id`, `sku`, `name`, `default_unit_price`, `tax_rate`
- On selection: Auto-fill unit price from product's `retail_price` or `cost_price`

### 7.2 Supplier Lookup
- Use `listSuppliers(token, { search, limit, offset })` or `suppliers` from master
- Cache supplier list in component (fetch on mount)

### 7.3 Warehouse Lookup
- Use `listWarehouses(token, {})`
- Cache warehouse list

### 7.4 Status Management
- Map backend status to UI badges:
  ```javascript
  const STATUS_MAP = {
    draft: { label: 'Draft', color: 'gray' },
    pending: { label: 'Pending Approval', color: 'orange' },
    approved: { label: 'Approved', color: 'blue' },
    rejected: { label: 'Rejected', color: 'red' },
    cancelled: { label: 'Cancelled', color: 'gray' },
    completed: { label: 'Completed', color: 'green' }
  }
  ```

### 7.5 Permissions
- Create: Everyone with purchase permission
- Edit Draft: Creator only or manager
- Submit: Creator only (draft → pending)
- Approve: Manager/Supervisor only (pending → approved)
- Cancel: Creator (if draft/pending) or Manager (any)

---

## 8. Next Steps

1. ✅ **Create plan document** (this file)
2. ⬜ **Review & approval** from stakeholder/tech lead
3. ⬜ **Set up API module** (purchase.api.js)
4. ⬜ **Implement Purchase.jsx** (list view)
5. ⬜ **Implement PurchaseDetail.jsx** (master-detail)
6. ⬜ **Implement AddPurchaseItemModal.jsx**
7. ⬜ **Test create/edit flow**
8. ⬜ **Implement status transitions**
9. ⬜ **Add validation & error handling**
10. ⬜ **Polish UI (responsive, loading, empty states)**
11. ⬜ **Write unit tests** (if applicable)
12. ⬜ **Integration testing** with backend

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Backend API incomplete/changes | High | Co-locate with backend team, verify swagger is up-to-date |
| Product pricing logic mismatch | Medium | Confirm which price field to use (cost_price vs retail_price) |
| Tax calculation logic unclear | Medium | Implement backend-side calc first, frontend only displays |
| Large datasets cause performance lag | Medium | Implement pagination, virtualization if > 100 items |
| Concurrency issues (stock changes during PO creation) | Low | Lock product stock? Or allow negative stock? (Business rule) |

---

## 10. Questions for Clarification

1. **Price Source:** Should we use `retail_price` or `cost_price` from product when adding items to PO?
2. **Tax:** Is tax per-item? Global tax on total? Tax included or added?
3. **Discount:** Per-item or per-order? (API shows per-item)
4. **Status Flow:** Who can approve? Is there multi-level approval?
5. **Receive:** Will we implement receiving (GRN) in same module or separate?
6. **Attachment:** Should we allow file upload (PO PDF, quotes)?
7. **Print:** What format? Standard A4 PO template?
8. **Duplicate:** Allow copy existing PO to create new one?
9. **Inventory Impact:** Does creating PO reserve stock? Or only receiving affects stock?
10. **Currency:** Single currency? Multi-currency support?

---

**Document Version:** 1.0  
**Last Updated:** 2025-03-07  
**Status:** Draft
