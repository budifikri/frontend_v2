# PLAN: Laporan Stok (Menu Laporan > Lap. Stok)

## Tujuan
Membuat halaman report stok pada menu `Dashboard > Laporan > Lap. Stok` dengan format UI final:

1. Header
2. Data table
3. Footer 3 baris dengan urutan:
   - `[Search] [Warehouse] [Category]`
   - `[PRINT] [REFRESH] [EXIT]`
   - `[|<] [<] Page X of Y [>] [>|] Total Row: N`

Halaman ini **read-only report** (tanpa NEW/EDIT/DELETE).

---

## Referensi API (swagger)

### Endpoint utama report
- `GET /api/inventory`
  - Query:
    - `warehouse_id` (string)
    - `product_id` (string)
    - `search` (string)
    - `limit` (integer)
    - `offset` (integer)

### Endpoint terkait inventory (fase lanjutan)
- `POST /api/inventory/adjust` (adjustment, bukan untuk list report utama)
- `GET /api/inventory/stock-card` (detail kartu stok, opsional next phase)

### Endpoint lookup filter
- `GET /api/warehouses` untuk dropdown warehouse
- `GET /api/categories` untuk dropdown category

---

## Scope Implementasi

### In Scope (fase ini)
1. Menambah halaman `LapStock` di canvas dashboard
2. Menampilkan tabel list inventory dari `GET /api/inventory`
3. Menambahkan filter di footer (search, warehouse, category)
4. Menambahkan tombol report di footer (print, refresh, exit)
5. Menambahkan pagination di footer sesuai format final
6. Menampilkan `Total Row` dari response `pagination.total`
7. Integrasi ke menu `lapstok`

### Out of Scope (fase berikutnya)
1. Form adjustment (`POST /api/inventory/adjust`)
2. Stock card detail popup/view (`GET /api/inventory/stock-card`)
3. Export file (xlsx/csv/pdf)

---

## Rancangan UI

### 1) Header
- Judul: `Laporan Stok`
- Konsisten style dengan halaman master/report lain (accent + title).

### 2) Data Table
Kolom awal (sesuai data inventory yang tersedia):
1. `No`
2. `Kode Produk`
3. `Nama Produk`
4. `Warehouse`
5. `Stok`
6. `Satuan`

Catatan:
- Jika field kategori tersedia di response inventory, tambah kolom `Kategori`.
- Status bisa diturunkan dari stok (`stock > 0 => Active`, `stock <= 0 => Inactive`) jika diperlukan tampilan status.

### 3) Footer (3 baris)
Baris 1:
- Search input
- Dropdown Warehouse
- Dropdown Category

Baris 2:
- Button `PRINT`
- Button `REFRESH`
- Button `EXIT`

Baris 3:
- Button `|<` (first page)
- Button `<` (prev)
- Info `Page X of Y`
- Button `>` (next)
- Button `>|` (last)
- Info `Total Row: N`

---

## Arsitektur File

### File baru
1. `src/features/laporan/stock/stock.api.js`
   - `listInventory(token, params)`
   - Normalisasi output menjadi:
     - `items`
     - `pagination` (`total`, `has_more`, `limit`, `offset`)

2. `src/components/ToolbarItem/laporan/stok/LapStock.jsx`
   - Render header/table/footer format report
   - Integrasi filter + pagination + refresh + print + exit

### File update
1. `src/components/Dashboard/DashboardCanvas.jsx`
   - Mapping `activeTool === 'lapstok'` -> render `<LapStock />`

2. `src/App.jsx`
   - Tambah `lapstok` ke `IMPLEMENTED_TOOLS`

3. `src/App.css`
   - Tambah style footer report 3 baris (jika belum ada)
   - Pastikan responsive desktop/mobile tetap baik

---

## Logic & Workflow

1. Saat halaman dibuka:
   - Ambil lookup warehouse + category
   - Fetch inventory page 1 (`limit=10`, `offset=0`)

2. Saat filter/search berubah:
   - Reset pagination ke page 1 (`offset=0`)
   - Refetch inventory dengan query terbaru

3. Pagination:
   - `totalPages = ceil(pagination.total / limit)`
   - Tombol first/prev/next/last aktif/nonaktif sesuai kondisi

4. Footer info:
   - Ambil dari response API:
     - `Total Row: pagination.total`
     - `Page X of Y`

5. Tombol action:
   - `PRINT` => `window.print()`
   - `REFRESH` => refetch data dengan query saat ini
   - `EXIT` => panggil `onExit()`

---

## Mapping Query API

- Search input -> `search`
- Warehouse dropdown -> `warehouse_id`
- Category dropdown -> (strategi awal)
  - jika inventory API support langsung: kirim `category_id`
  - jika tidak support: fallback filter di frontend setelah fetch

Catatan kompatibilitas search:
- Ikuti pola existing: kirim `search` (dan bila perlu kompatibilitas `keyword`/`q`).

---

## Error & Fallback Strategy

1. Jika API gagal:
   - tampilkan pesan error non-blocking di area content
   - fallback data kosong (tanpa crash)

2. Jika token tidak ada:
   - bisa pakai dummy data report untuk mode lokal/dev

3. Jika session expired (401/403):
   - mengikuti mekanisme global auth-expired yang sudah ada

---

## Acceptance Criteria

1. Klik `Laporan > Lap. Stok` membuka halaman report stok
2. Layout mengikuti urutan final footer 3 baris
3. Tidak ada tombol NEW/EDIT/DELETE
4. Search + Warehouse + Category filter bekerja
5. Pagination bekerja (`|<`, `<`, `>`, `>|`) dan info page benar
6. `Total Row` mengambil dari response API (`pagination.total`)
7. Tombol Print, Refresh, Exit berfungsi
8. Lint dan build lolos

---

## Test Checklist

1. Open `Lap. Stok` dari toolbar laporan
2. Uji search keyword (hasil list berubah)
3. Uji filter warehouse/category
4. Uji pagination next/prev/first/last
5. Verifikasi `Page X of Y` dan `Total Row` sinkron API
6. Uji refresh mempertahankan filter aktif
7. Uji print membuka print dialog
8. Uji exit kembali ke dashboard canvas default
