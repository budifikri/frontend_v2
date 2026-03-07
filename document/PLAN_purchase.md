# PLAN PEMBELIAN (PURCHASE ORDER)

## 1. Referensi Design Form

### 1.1 Pola Master-Detail (Template: Stock Opname)

Gunakan **StockOpnameDetail.jsx** sebagai referensi utama untuk implementsi Master-Detail表单:

```jsx
├── Header Section (sticky top)
│   ├── Title & Status
│   ├── Primary Fields (inline)
│   │   ├── Warehouse (select)
│   │   ├── Date (date picker)
│   │   └── Status (badge)
│   └── Action Buttons
│       ├── [Add Item] ← Button untuk membuka modal add product
│       ├── [Save] (if draft)
│       ├── [Verify] (if pending)
│       └── [Cancel] (if pending)
│
├── Main Content
│   └── Items Table
│       ├── Columns: No, SKU, Product Name, Qty, Unit Price, Discount, Tax, Total
│       ├── Inline actions: Remove item
│       └── Summary row (subtotal, tax, grand total)
│
├── Modal Add Item (optional: separate component)
│   ├── Search Product (autocomplete)
│   ├── System Price display (readonly)
│   ├── Quantity input
│   ├── Unit Price input (editable)
│   ├── Discount input
│   ├── Tax Rate input
│   └── Action: [Add] [Cancel]
│
└── Footer (MasterDetailFooter)
    ├── Navigation: First/Prev/Next/Last
    ├── Page info: "Page X of Y"
    └── Total row count
```

**Key Features from StockOpname:**
- ✅ Sticky header with inline form fields
- ✅ Items in MasterDetailTable (expandable/collapsible rows)
- ✅ Separate `AddItemModal` for product selection
- ✅ `MasterDetailFooter` with pagination
- ✅ Status-based button rendering (draft → pending → verified)
- ✅ Computed totals (subtotal, tax, total)
- ✅ Warehouse context (all items belong to selected warehouse)
- ✅ Keyboard navigation support (for add modal)

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
