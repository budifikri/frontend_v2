# PLAN: Laporan Pembelian (Menu Laporan > Lap. Pembelian)

## Tujuan
Membuat halaman report pembelian pada menu `Dashboard > Laporan > Lap. Pembelian` dengan format UI yang identik dengan **Laporan Penjualan**:

1. Header dengan filter tanggal, status, warehouse, supplier
2. Data table dengan kolom: No, No. PO, Tanggal, Supplier, Gudang, Grand Total, Status
3. Summary bar menampilkan Total Pembelian
4. Footer dengan tombol Print, Refresh, Exit + pagination

Halaman ini **read-only report** (tanpa NEW/EDIT/DELETE).

---

## Visual Design

### Main Layout
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ██████████████████████████████████████████████████████████████████████     │
│  █                                                                      █     │
│  █                    LAPORAN PEMBELIAN                                  █     │
│  █                                                                      █     │
│  ██████████████████████████████████████████████████████████████████████     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │ Tanggal  ▼ │ │ Status   ▼ │ │ Gudang   ▼ │ │Supplier  ▼ │              │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────┬───────────┬───────────┬──────────────┬──────────────┬───────────────┐ │
│  │ NO │ NO. PO   │ TANGGAL   │ SUPPLIER     │ GUDANG       │ GRAND TOTAL  │►│
│  ├────┼───────────┼───────────┼──────────────┼──────────────┼───────────────┤ │
│  │ 1  │ PO-001   │ 15/04/26  │ PT. Suplier  │ Gudang Utama │ Rp 500.000   │►│
│  ├────┼───────────┼───────────┼──────────────┼──────────────┼───────────────┤ │
│  │ 2  │ PO-002   │ 16/04/26  │ CV. Supplier │ Gudang Utama │ Rp 750.000   │►│
│  └────┴───────────┴───────────┴──────────────┴──────────────┴───────────────┘ │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Summary                                                             │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │  TOTAL PEMBELIAN: Rp 1.250.000                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────┐ ┌──────────┐ ┌─────────┐                    ┌──────────────┐   │
│   │ 🖨 PRINT │ │ ↻ REFRESH│ │🚪 EXIT  │                    │ ☐ All Records│   │
│   └─────────┘ └──────────┘ └─────────┘                    └──────────────┘   │
│                                                                              │
│   Total Row: 2                                          Page 1 of 1          │
│   ┌────┐ ┌────┐               ┌────┐ ┌────┐                                  │
│   │|◄ │ │ ◄  │               │ ► │ │ ►| │                                  │
│   └────┘ └────┘               └────┘ └────┘                                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Detail Modal (Double-Click Row)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  🧾 DETAIL PEMBELIAN                                    [X] Close   │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                      │    │
│  │  No. PO      : PO-001                    Status     : APPROVED     │    │
│  │  Tanggal     : 15 April 2026             Supplier   : PT. Supplier │    │
│  │  Gudang      : Gudang Utama                                            │    │
│  │                                                                      │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                      │    │
│  │  ┌────┬────────────────────────────┬─────┬────────┬─────────────┐   │    │
│  │  │ NO │ PRODUK                    │ QTY │ SATUAN │ HARGA       │   │    │
│  │  ├────┼────────────────────────────┼─────┼────────┼─────────────┤   │    │
│  │  │ 1  │ Kopi Luwak                │ 10  │ PCS    │ Rp 50.000   │   │    │
│  │  │ 2  │ Gula Pasir                │ 20  │ KG     │ Rp 15.000   │   │    │
│  │  └────┴────────────────────────────┴─────┴────────┴─────────────┘   │    │
│  │                                                                      │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                      │    │
│  │                              Total Item: 2                          │    │
│  │                              GRAND TOTAL: Rp 1.250.000             │    │
│  │                                                                      │    │
│  │         ┌─────────┐                    ┌─────────┐                  │    │
│  │         │ 🖨 PRINT │                    │   EXIT  │                  │    │
│  │         └─────────┘                    └─────────┘                  │    │
│  │                                                                      │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Color Scheme (Keyframe Design)

| Element | Color | Hex Code | Usage |
|---------|-------|----------|-------|
| Header Background | Deep Orange | `#E65100` | Accent bar, title |
| Header Text | White | `#FFFFFF` | Title text |
| Table Header | Slate 700 | `#334155` | Column headers |
| Table Row (Even) | Slate 50 | `#F8FAFC` | Alternate row |
| Table Row (Odd) | White | `#FFFFFF` | Default row |
| Table Row (Hover) | Amber 100 | `#FEF3C7` | Row highlight |
| Table Row (Selected) | Blue 100 | `#DBEAFE` | Selection |
| Status - Draft | Gray | `#6B7280` | Badge background |
| Status - Pending | Amber | `#F59E0B` | Badge background |
| Status - Approved | Blue | `#3B82F6` | Badge background |
| Status - Completed | Green | `#10B981` | Badge background |
| Status - Cancelled | Red | `#EF4444` | Badge background |
| Summary Bar | Slate 200 | `#E2E8F0` | Background |
| Summary Text | Slate 800 | `#1E293B` | Value text |
| Button - Print | Blue 600 | `#2563EB` | Icon color |
| Button - Refresh | Green 600 | `#16A34A` | Icon color |
| Button - Exit | Red 600 | `#DC2626` | Icon color |
| Footer Background | Slate 100 | `#F1F5F9` | Footer area |

---

## Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Title | System | 18px | 600 (Semi-bold) |
| Table Header | System | 13px | 600 |
| Table Cell | System | 13px | 400 |
| Status Badge | System | 11px | 500 |
| Summary Label | System | 14px | 600 |
| Summary Value | System | 14px | 700 |
| Button Text | System | 12px | 500 |
| Footer Info | System | 12px | 400 |

---

## Spacing System

```
Padding:
- Container: 16px
- Header: 12px 16px
- Filter Group: 8px
- Table Cell: 8px 12px
- Summary: 12px 16px
- Footer: 12px 16px

Margins:
- Section Gap: 16px
- Filter Gap: 12px
- Button Gap: 8px

Border Radius:
- Container: 8px
- Filter: 4px
- Button: 4px
- Badge: 4px
- Modal: 8px
```

---

## Component States

| Component | Default | Hover | Active | Disabled |
|-----------|---------|-------|--------|----------|
| Table Row | White/Gray | Amber 100 | Blue 100 | Gray |
| Button | Opacity 1 | Opacity 0.8 | Scale 0.98 | Opacity 0.5 |
| Checkbox | Border Gray | Border Blue | Fill Blue | Gray |
| Pagination | Blue 600 | Blue 700 | Scale 0.95 | Gray |

---

## Referensi API

### Endpoint Utama Report
```
GET /api/purchases
```
**Query Parameters:**
- `search` (string) - Search by PO number, supplier name
- `status` (string) - Filter by PO status
- `supplier_id` (string) - Filter by supplier
- `warehouse_id` (string) - Filter by warehouse
- `date_from` (string) - Start date (YYYY-MM-DD)
- `date_to` (string) - End date (YYYY-MM-DD)
- `limit` (integer) - Default 50
- `offset` (integer) - Default 0

**Response:** `PaginatedResponse` (array of Purchase)

### Endpoint Detail
```
GET /api/purchases/{id}
```
**Response:** `ApiResponse` with full PO details including items

### Lookup Filters
- `GET /api/suppliers` - List suppliers (for supplier dropdown)
- `GET /api/warehouses` - List warehouses (for warehouse dropdown)

---

## Data Structure

### Purchase Model (from API)
```javascript
{
  id: string (uuid)
  po_number: string (e.g., "PO-20260305-001")
  supplier_id: string
  supplier_name: string
  warehouse_id: string
  warehouse_name: string
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'
  po_date: string (date)
  expected_date: string (date)
  notes: string
  subtotal: number
  discount_total: number
  tax_total: number
  grand_total: number
  created_at: string
  updated_at: string
  items: PurchaseItem[]
}
```

### PurchaseItem Model
```javascript
{
  id: string
  product_id: string
  product_name: string
  sku: string
  quantity: number
  unit_price: number
  discount: number
  tax_rate: number
  line_total: number
}
```

---

## Scope Implementasi

### In Scope (Fase Ini)
1. Menambah halaman `LapPembelian` di canvas dashboard
2. Menampilkan tabel list purchase dari `GET /api/purchases`
3. Filter di header: Tanggal preset, Status, Gudang, Supplier
4. Summary bar menampilkan Total Pembelian
5. Tombol report di footer: Print, Refresh, Exit
6. Pagination + All Records toggle
7. Detail modal saat double-click row
8. Integrasi ke menu `lapbeli`

### Out of Scope (Fase Berikutnya)
1. Export file (xlsx/csv/pdf)
2. Filter by date range langsung (tanpa preset)
3. Edit/void purchase dari report
4. Print template khusus

---

## Rancangan UI

### 1) Header
- Judul: `Laporan Pembelian`
- Accent bar + Title style konsisten
- Filter group:
  - Tanggal preset dropdown (Hari Ini, Minggu Ini, Bulan Ini, Tahun Ini, Pilih Tanggal, Semua)
  - Custom date inputs (visible when "Pilih Tanggal")
  - Status dropdown (ALL, DRAFT, PENDING, APPROVED, dll)
  - Gudang dropdown (Semua + list warehouses)
  - Supplier dropdown (Semua + list suppliers)

### 2) Data Table
Kolom:
1. `No` - sequential number
2. `No. PO` - po_number
3. `Tanggal` - po_date (formatted)
4. `Supplier` - supplier_name
5. `Gudang` - warehouse_name
6. `Grand Total` - grand_total (formatted currency)
7. `Status` - status badge

### 3) Summary Bar
```
┌────────────────────────────────────────────────────────────┐
│ Summary                                                    │
│ ────────────────────────────────────────────────────────── │
│ TOTAL PEMBELIAN: Rp X,XXX,XXX                              │
└────────────────────────────────────────────────────────────┘
```

### 4) Footer
Baris 1:
- [PRINT] [REFRESH] [EXIT]

Baris 2:
- Checkbox "All Records"
- Total Row: N
- Pagination: [|<] [<] Page X of Y [>] [>|]

---

## Arsitektur File

### File Baru
```
src/features/laporan/pembelian/pembelian.api.js
├── listPurchasesReport(params, token)  // Reuse from purchase.api or extend
├── getPurchaseDetail(id, token)        // Reuse from purchase.api or extend
└── calculateSummary(purchases)         // Helper to calc totals from array

src/components/ToolbarItem/laporan/pembelian/LapPembelian.jsx
├── Main report component following LapPenjualan pattern
├── Header with filters
├── Table with sorting
├── Summary bar
└── Footer with pagination

src/components/ToolbarItem/laporan/pembelian/PembelianDetailModal.jsx
├── Modal popup for PO detail
├── Items table
└── Footer with print/close
```

### File Update
```
src/components/Dashboard/DashboardCanvas.jsx
├── Add mapping: activeTool === 'lapbeli' -> render <LapPembelian />

src/App.jsx
├── Add 'lapbeli' to IMPLEMENTED_TOOLS (if needed)
```

---

## Logic & Workflow

### 1) Initial Load
- Fetch warehouses (for dropdown)
- Fetch suppliers (for dropdown)
- Fetch purchases page 1 with default filter (Bulan Ini)
- Calculate summary from fetched purchases

### 2) Filter Change
- Reset pagination to page 1 (offset=0)
- Refetch purchases with new query
- Recalculate summary

### 3) Date Presets
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

### 4) Summary Calculation
Since no dedicated summary endpoint, calculate from fetched data:
```javascript
const summary = {
  totalRows: pagination.total,
  totalPembelian: purchases.reduce((sum, p) => sum + (p.grand_total || 0), 0)
}
```

### 5) Sorting
- Sortable columns: No. PO, Tanggal, Supplier, Gudang, Grand Total, Status
- Default sort: Tanggal DESC

### 6) Detail Modal
- Trigger: Double-click row
- Fetch detail: GET /api/purchases/{id}
- Display: Header info + Items table

---

## Status Badge Mapping
```javascript
const STATUS_MAP = {
  draft: { label: 'Draft', color: 'gray' },
  pending: { label: 'Pending', color: 'orange' },
  approved: { label: 'Approved', color: 'blue' },
  rejected: { label: 'Rejected', color: 'red' },
  cancelled: { label: 'Cancelled', color: 'gray' },
  completed: { label: 'Completed', color: 'green' }
}
```

---

## Error & Fallback Strategy

1. **API Gagal:**
   - Tampilkan pesan error non-blocking
   - Fallback data kosong (tanpa crash)

2. **Token Tidak Ada:**
   - Gunakan dummy data untuk mode dev

3. **Session Expired (401/403):**
   - Ikuti mekanisme global auth-expired

---

## Acceptance Criteria

1. Klik `Laporan > Lap. Pembelian` membuka halaman report
2. Layout mengikuti pattern LapPenjualan
3. Filter Tanggal, Status, Gudang, Supplier berfungsi
4. Summary Total Pembelian terdisplay
5. Pagination berfungsi dengan benar
6. Double-click row membuka detail modal
7. Print, Refresh, Exit berfungsi
8. All Records toggle berfungsi
9. Sorting columns berfungsi
10. Lint dan build lolos

---

## Test Checklist

1. Open `Lap. Pembelian` dari toolbar laporan
2. Verifikasi header dengan filter tampil
3. Verifikasi table terisi data
4. Verifikasi summary bar menampilkan total
5. Test filter tanggal preset
6. Test filter status
7. Test filter warehouse
8. Test filter supplier
9. Test search
10. Test pagination next/prev/first/last
11. Test All Records toggle
12. Test double-click row -> detail modal
13. Test print
14. Test refresh
15. Test exit
16. Test sorting columns

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-15  
**Status:** Plan
