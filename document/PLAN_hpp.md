# PLAN HPP

## Objective
- Menjadikan `products.cost_price` sebagai current HPP aktif berbasis moving average.
- Menyimpan histori HPP opening stock melalui `stock_opname_items.cost_price`.
- Memisahkan perilaku `Stock Opname` biasa dan `Stock Opname Opening`.

## Requirement Yang Disepakati
1. `Stock Opname` biasa tidak mengubah HPP product.
2. `Stock Opname Opening` boleh mengatur HPP awal product.
3. Opening stock hanya boleh sekali per produk secara global.
4. Produk yang sudah pernah opening tetap boleh dipakai pada stock opname biasa.
5. Setelah opening selesai, perubahan `products.cost_price` berikutnya hanya berasal dari `ReceivePurchaseOrder`.
6. Moving average cost disimpan menggunakan Opsi A, yaitu langsung di `products.cost_price`.

## Scope
- Backend `go_backend`
  - `internal/models/inventory.go`
  - `internal/types/request/inventory_request.go`
  - `internal/handlers/inventory_handler.go`
  - `internal/services/inventory_service.go`
  - `internal/services/purchase_service.go`
- Frontend `frontend_v2`
  - `src/features/master/stock-opname/stockOpname.api.js`
  - `src/components/ToolbarItem/transaksi/StockOpnameDetail.jsx`

## Problem Yang Diselesaikan
1. `products.cost_price` saat ini belum dihitung otomatis sebagai moving average saat receive PO.
2. Opening stock via stock opname belum punya mekanisme resmi untuk menetapkan HPP awal product.
3. Backend stock opname belum menerima `cost_price` item dari payload walaupun frontend sudah mengirimkannya.
4. Belum ada pembatasan agar opening stock hanya terjadi sekali per produk secara global.

## Root Cause
- Alur `ReceivePurchaseOrder` hanya menambah kuantitas inventory tanpa menghitung ulang `products.cost_price`.
- Alur stock opname saat approve hanya mengubah stok dan membuat movement, tanpa cabang khusus opening stock.
- Request backend stock opname belum membawa `is_opening` dan `cost_price` item.
- Belum ada validasi historis opening stock per produk.

## Visual Design
```text
Stock Opname Detail
+-------------------------------------------------------------+
| Warehouse: [Gudang Utama v]   Tanggal: [2026-05-01]         |
| [ ] Opening Stock                                           |
| Catatan: .................................................   |
+-------------------------------------------------------------+
| Cari Produk: [.................................] [Tambah]    |
+-------------------------------------------------------------+
| SKU      | Nama Produk       | Sys | Actual | Cost  | Selisih |
| PRD-001  | Kopi Arabika      |  0  |  100   | 8000  | 100     |
| PRD-002  | Gula Pasir        |  0  |   50   | 12000 | 50      |
+-------------------------------------------------------------+
| Info: Mode opening hanya untuk set stok awal dan HPP awal.  |
| Produk yang sudah pernah opening tidak bisa dipilih di sini |
+-------------------------------------------------------------+
```

## Technical Plan
1. Tambah field `is_opening` pada header `StockOpname`.
2. Terima `cost_price` item dari request create/update stock opname.
3. Simpan `stock_opname_items.cost_price` dari payload opening sebagai snapshot HPP awal.
4. Saat approve stock opname:
   - jika `is_opening = false`, update stok seperti biasa dan jangan ubah HPP product.
   - jika `is_opening = true`, validasi opening global lalu update `products.cost_price` dari item opening.
5. Tambahkan validasi backend agar produk yang sudah punya opening approved tidak bisa di-opening lagi.
6. Update UI stock opname untuk mendukung toggle `Opening Stock` dan blocking produk yang sudah pernah opening.
7. Update `ReceivePurchaseOrder` untuk menghitung moving average dan menyimpan hasilnya ke `products.cost_price`.

## Technical Implementation
- `StockOpname` perlu field `IsOpening bool` dengan default `false`.
- `StockOpnameItemRequest` dan `StockOpnameUpdateItemRequest` perlu field `CostPrice float64`.
- `StockOpnameRequest` dan `StockOpnameUpdateRequest` perlu field `IsOpening bool`.
- Handler inventory harus meneruskan `is_opening` dan `cost_price` ke service.
- Service stock opname harus menggunakan `cost_price` dari payload untuk opening stock, bukan selalu override dari `products.cost_price`.
- Validasi opening global dilakukan saat approve untuk mencegah bypass dari draft lama atau request paralel.
- `ReceivePurchaseOrder` harus memakai total stok global lintas warehouse karena HPP disepakati global per produk.

## Business Rules
1. Opening stock hanya boleh sekali per produk secara global.
2. Produk yang sudah pernah opening tetap boleh dipakai di stock opname biasa.
3. `Stock Opname` biasa tidak mengubah `products.cost_price`.
4. `Stock Opname Opening` mengubah `products.cost_price` hanya saat approve.
5. Setelah opening, HPP aktif berubah hanya dari receive pembelian.
6. Stock opname adjustment setelah go-live tidak ikut mengubah HPP.

## Formula
### Opening Stock
- `products.cost_price = stock_opname_items.cost_price`

### Receive Purchase Order
- jika `current_global_stock <= 0`
  - `new_cost_price = purchase_unit_price`
- jika `current_global_stock > 0`
  - `new_cost_price = (current_global_stock * current_cost_price + qty_received * purchase_unit_price) / (current_global_stock + qty_received)`

## Query Validasi Utama
### Cek produk sudah pernah opening approved
```sql
SELECT 1
FROM stock_opname_items soi
JOIN stock_opnames so ON so.id = soi.opname_id
WHERE soi.product_id = ?
  AND so.is_opening = true
  AND LOWER(so.status) IN ('approved', 'approve', 'posted')
LIMIT 1;
```

### Hitung stok global untuk moving average
```sql
SELECT COALESCE(SUM(quantity), 0)
FROM inventories
WHERE product_id = ?;
```

## Dampak Data
- Tabel `stock_opnames` bertambah kolom `is_opening`.
- Tabel `stock_opname_items` tetap memakai kolom `cost_price` yang sudah ada.
- Tabel `products` tidak berubah skema, tetapi `cost_price` berubah fungsi menjadi current moving average HPP.
- Data opening stock akan punya histori qty dan HPP melalui dokumen stock opname.

## Testing Plan
1. Create draft `Stock Opname Opening` dengan `cost_price > 0` dan approve.
2. Verifikasi inventory bertambah sesuai `actual_quantity` dan `products.cost_price` ter-set dari opening item.
3. Coba approve opening kedua untuk produk yang sama dan pastikan ditolak.
4. Buat stock opname biasa untuk produk yang sama dan pastikan stok berubah tanpa mengubah HPP.
5. Lakukan receive PO setelah opening dan validasi rumus moving average.
6. Uji partial receive bertahap untuk memastikan hanya `qtyToAdd` yang memengaruhi average.
7. Jalankan lint/build frontend dan build/test backend.

## Risiko & Mitigasi
- Risiko: opening stock dilakukan dua kali melalui dokumen berbeda.
- Mitigasi: validasi backend saat approve dengan cek histori opening approved per produk.

- Risiko: user salah input `cost_price` opening dan langsung approve.
- Mitigasi: wajibkan `cost_price > 0`, tampilkan indikator mode opening yang jelas, dan lakukan review draft sebelum approve.

- Risiko: average cost global salah jika stok existing dihitung hanya dari warehouse penerima.
- Mitigasi: gunakan total stok global semua warehouse sebagai basis formula.

- Risiko: stock opname biasa ikut mengubah HPP karena logic bercampur.
- Mitigasi: pisahkan cabang logic `is_opening` di service approval stock opname.

## Acceptance Criteria
- `Stock Opname` biasa tidak mengubah `products.cost_price`.
- `Stock Opname Opening` dapat menetapkan HPP awal product dari `stock_opname_items.cost_price`.
- Produk yang sudah pernah opening tidak bisa di-opening lagi secara global.
- Produk yang sudah pernah opening tetap bisa ikut stock opname biasa.
- `ReceivePurchaseOrder` menghitung moving average ke `products.cost_price`.
- Histori HPP opening dan penjualan tetap tersimpan pada tabel transaksi masing-masing.
