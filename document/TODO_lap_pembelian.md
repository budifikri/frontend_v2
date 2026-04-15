# TODO: Laporan Pembelian (Lap. Pembelian)

## Overview
Implementasi halaman laporan pembelian mengikuti pattern Laporan Penjualan (LapPenjualan.jsx).

---

## Tasks

### Phase 1: Setup & Structure

- [x] **1.1** Create directory `src/features/laporan/pembelian/`
  - File: `pembelian.api.js`
  - Reuse/extend functions dari `src/features/transaksi/purchase/purchase.api.js`

- [x] **1.2** Create directory `src/components/ToolbarItem/laporan/pembelian/`
  - File: `LapPembelian.jsx`
  - File: `PembelianDetailModal.jsx`

- [x] **1.3** Update `src/components/Dashboard/DashboardCanvas.jsx`
  - Add import `LapPembelian`
  - Add mapping `activeTool === 'lapbeli'` -> render `<LapPembelian />`

---

### Phase 2: API Module (pembelian.api.js)

- [x] **2.1** Create `listPurchasesReport(params, token)` function
  - Support params: search, status, supplier_id, warehouse_id, date_from, date_to, limit, offset
  - Normalize response ke format yang konsisten
  - Return: `{ items: [...], pagination: {...} }`

- [x] **2.2** Create `getPurchaseDetail(id, token)` function
  - Fetch single purchase dengan items
  - Return detail data untuk modal

- [x] **2.3** Create `calculateSummary(purchases)` helper
  - Calculate total from array of purchases
  - Return: `{ totalRows, totalPembelian }`

- [x] **2.4** (Optional) Export supplier/warehouse lookup functions
  - Atau reuse dari `purchase.api.js`

---

### Phase 3: Main Component (LapPembelian.jsx)

#### State Management
- [x] **3.1** Setup state hooks
  ```javascript
  const [purchases, setPurchases] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [warehouses, setWarehouses] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [filters, setFilters] = useState({ ... })
  const [pagination, setPagination] = useState({ total: 0, hasMore: false })
  const [summary, setSummary] = useState({ totalRows: 0, totalPembelian: 0 })
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)
  const [isAllRecords, setIsAllRecords] = useState(false)
  ```

#### Filter State
- [x] **3.2** Setup filters state dengan defaults
  - `datePreset`: 'month' (default)
  - `date_from`, `date_to`: (based on preset)
  - `status`: 'all'
  - `warehouse_id`: ''
  - `supplier_id`: ''
  - `search`: ''

#### Pagination Hooks
- [x] **3.3** Integrate `useMasterPagination` hook
- [x] **3.4** Integrate `useMasterTableSort` hook
  - Default sort: created_at DESC

#### Constants
- [x] **3.5** Define TABLE_COLUMNS array
  ```javascript
  const TABLE_COLUMNS = [
    { key: 'no', label: 'NO', sortable: false },
    { key: 'po_number', label: 'NO. PO', sortable: true },
    { key: 'po_date', label: 'TANGGAL', sortable: true },
    { key: 'supplier_name', label: 'SUPPLIER', sortable: true },
    { key: 'warehouse_name', label: 'GUDANG', sortable: true },
    { key: 'grand_total', label: 'GRAND TOTAL', sortable: true },
    { key: 'status', label: 'STATUS', sortable: true },
  ]
  ```

- [x] **3.6** Define DATE_PRESETS array
  ```javascript
  const DATE_PRESETS = [
    { value: 'today', label: 'Hari Ini' },
    { value: 'week', label: 'Minggu Ini' },
    { value: 'month', label: 'Bulan Ini' },
    { value: 'year', label: 'Tahun Ini' },
    { value: 'custom', label: 'Pilih Tanggal' },
    { value: 'all', label: 'Semua' },
  ]
  ```

#### Helper Functions
- [x] **3.7** Implement `getDateRange(preset)` function
- [x] **3.8** Implement `formatCurrency(value)` function
- [x] **3.9** Implement `formatDate(dateStr)` function
- [x] **3.10** Implement `getStatusLabel(status)` function

#### Fetch Functions
- [x] **3.11** Implement `fetchData()` with debounce
- [x] **3.12** Implement `fetchWarehouses()` for dropdown
- [x] **3.13** Implement `fetchSuppliers()` for dropdown
- [x] **3.14** Implement `fetchSummary()` to calculate totals
- [x] **3.15** Implement `buildFilters()` helper

#### Event Handlers
- [x] **3.16** Implement `handleFilterChange(key, value)`
- [x] **3.17** Implement `handleSort(key)`
- [x] **3.18** Implement `handleRowClick(purchase)` for detail modal
- [x] **3.19** Implement `handleToggleAllRecords()`
- [x] **3.20** Implement `handlePrint()`
- [x] **3.21** Implement `handleRefresh()`
- [x] **3.22** Implement `handleKeyDown` (Escape = exit)

#### Effects
- [x] **3.23** Add useEffect for fetchData
- [x] **3.24** Add useEffect for fetchWarehouses
- [x] **3.25** Add useEffect for fetchSuppliers
- [x] **3.26** Add useEffect for fetchSummary
- [x] **3.27** Add useEffect for keyboard handler

#### Render - Header
- [x] **3.28** Render header dengan accent bar
- [x] **3.29** Render title "Laporan Pembelian"
- [x] **3.30** Render filter group: Tanggal preset
- [x] **3.31** Render custom date inputs (conditionally)
- [x] **3.32** Render filter group: Status dropdown
- [x] **3.33** Render filter group: Gudang dropdown
- [x] **3.34** Render filter group: Supplier dropdown

#### Render - Error
- [x] **3.35** Render error message (if any)

#### Render - Table
- [x] **3.36** Render table header dengan sort icons
- [x] **3.37** Render table rows dengan hover/selected state
- [x] **3.38** Render status badge per row
- [x] **3.39** Render empty state message

#### Render - Summary
- [x] **3.40** Render summary bar
- [x] **3.41** Display total pembelian dengan currency format

#### Render - Footer
- [x] **3.42** Render action buttons: Print, Refresh, Exit
- [x] **3.43** Render All Records checkbox
- [x] **3.44** Render Total Row info
- [x] **3.45** Render pagination controls

#### Detail Modal
- [x] **3.46** Render `<PembelianDetailModal />` component

---

### Phase 4: Detail Modal (PembelianDetailModal.jsx)

- [x] **4.1** Create component with props: isOpen, onClose, data, isLoading, error

- [x] **4.2** Define ITEM_COLUMNS
  ```javascript
  const ITEM_COLUMNS = [
    { key: 'no', label: 'NO', width: '50px' },
    { key: 'product_name', label: 'PRODUK' },
    { key: 'quantity', label: 'QTY', width: '80px' },
    { key: 'unit', label: 'SATUAN', width: '90px' },
    { key: 'price', label: 'HARGA', width: '140px' },
    { key: 'discount', label: 'DISKON', width: '130px' },
    { key: 'subtotal', label: 'SUBTOTAL', width: '140px' },
  ]
  ```

- [x] **4.3** Implement keyboard handler (Escape = close)

- [x] **4.4** Render modal overlay dengan click-to-close

- [x] **4.5** Render modal header dengan PO info
  - PO Number
  - Tanggal
  - Status badge
  - Supplier, Gudang

- [x] **4.6** Render loading state

- [x] **4.7** Render error state

- [x] **4.8** Render items table

- [x] **4.9** Render modal footer dengan Total dan tombol Print/Close

---

### Phase 5: Styling & Polish

- [x] **5.1** Add CSS class `.lap-pembelian-content` ke container

- [x] **5.2** Verify status badge colors konsisten dengan status lain

- [x] **5.3** Test responsive layout

- [x] **5.4** Add tooltip on row hover (double-click for info)

---

### Phase 6: Integration & Testing

- [x] **6.1** Register `lapbeli` di DashboardCanvas.jsx

- [ ] **6.2** Test navigation dari toolbar ke Lap. Pembelian

- [ ] **6.3** Test semua filter berfungsi

- [ ] **6.4** Test pagination

- [ ] **6.5** Test All Records toggle

- [ ] **6.6** Test detail modal open/close

- [ ] **6.7** Test print function

- [ ] **6.8** Test refresh function

- [ ] **6.9** Test exit function

- [ ] **6.10** Test keyboard shortcuts

---

### Phase 7: Lint & Build

- [x] **7.1** Run `npm run lint` - fix any issues

- [x] **7.2** Run `npm run build` - verify build success

---

## Dependencies
- `useMasterPagination` hook
- `useMasterTableSort` hook
- `useAuth` hook
- `apiFetch` from shared/http
- Material Icons

## Notes
- Refer to `LapPenjualan.jsx` for exact implementation pattern
- Reuse existing API functions from `purchase.api.js` where possible
- Keep CSS class names consistent with existing report pages

## Files Created
- `src/features/laporan/pembelian/pembelian.api.js`
- `src/components/ToolbarItem/laporan/pembelian/LapPembelian.jsx`
- `src/components/ToolbarItem/laporan/pembelian/PembelianDetailModal.jsx`

## Files Updated
- `src/components/Dashboard/DashboardCanvas.jsx`
