# PLAN Cost Price

## Objective
- Menyimpan snapshot `cost_price` pada `sale_items` dan `stock_opname_items`.
- Menghitung profit dari snapshot `sale_items.cost_price` agar profit historis tidak berubah saat `products.cost_price` diubah.
- Menampilkan profit pada detail penjualan.

## Requirement Yang Disepakati
1. `cost_price` disimpan otomatis oleh backend dari tabel `products`.
2. Profit ditampilkan di detail penjualan.
3. Data lama yang belum punya `cost_price` tidak menjadi acuan transaksi profit historis.
4. Frontend ikut membawa dan menampilkan `cost_price` untuk konsistensi, tetapi backend tetap menjadi source of truth.

## Scope
- Backend `go_backend`
  - `internal/models/sales.go`
  - `internal/models/inventory.go`
  - `internal/services/sales_service.go`
  - `internal/services/inventory_service.go`
  - `internal/repository/sales_repository.go`
- Frontend `frontend_v2`
  - `src/components/POS/POS.jsx`
  - `src/components/ToolbarItem/transaksi/StockOpnameDetail.jsx`
  - `src/features/master/stock-opname/stockOpname.api.js`
  - `src/components/ToolbarItem/laporan/penjualan/PenjualanDetailModal.jsx`
  - file duplikat detail penjualan bila masih dipakai

## Problem Yang Diselesaikan
1. `sale_items` belum menyimpan `cost_price`, sehingga profit bisa berubah jika harga modal produk berubah di masa depan.
2. `stock_opname_items` belum menyimpan snapshot `cost_price` untuk kebutuhan audit dan histori.
3. Detail penjualan belum menampilkan profit per item dan total profit.

## Root Cause
- Struktur model transaksi belum memiliki kolom `cost_price`.
- Saat transaksi dibuat, backend hanya menyimpan `unit_price`, `original_price`, dan `discount_amount`.
- UI detail penjualan belum membaca atau menampilkan nilai profit.

## Technical Plan
1. Tambah kolom `cost_price` pada model:
   - `models.SaleItem`
   - `models.StockOpnameItem`
2. Gunakan `AutoMigrate` backend untuk menambahkan kolom baru ke database.
3. Saat create sale:
   - backend membaca `product.CostPrice`
   - backend menyimpan nilainya ke `sale_items.cost_price`
4. Saat create stock opname:
   - backend membaca `product.CostPrice`
   - backend menyimpan nilainya ke `stock_opname_items.cost_price`
5. Query detail sale diperbarui agar mengembalikan:
   - `cost_price`
   - `profit`
6. Rumus profit item:
   - `profit = ((unit_price - cost_price) * quantity) - discount_amount`
7. Tambahkan `total_profit` pada response detail penjualan.
8. Frontend POS dan stock opname menyimpan `cost_price` di state item untuk konsistensi tampilan.
9. Detail penjualan menampilkan:
   - `cost_price` per item
   - `profit` per item
   - `total_profit`

## Technical Implementation
- Backend tetap override `cost_price` dari tabel `products`, walaupun frontend mengirim nilai.
- Frontend tidak menjadi sumber nilai modal untuk menghindari manipulasi atau data stale.
- Profit hanya dihitung dari snapshot `sale_items.cost_price`, bukan dari `products.cost_price` saat ini.
- Untuk data lama yang belum punya `cost_price`, perlu fallback yang jelas di level tampilan/report.

## Dampak Data
- Tabel `sale_items` bertambah kolom `cost_price`.
- Tabel `stock_opname_items` bertambah kolom `cost_price`.
- Data baru akan memiliki snapshot modal.
- Data lama kemungkinan bernilai `0` atau `NULL` tergantung hasil migrasi dan perlu diperlakukan sebagai histori lama.

## Testing Plan
1. Buat penjualan baru dan pastikan `sale_items.cost_price` terisi dari `products.cost_price`.
2. Ubah `products.cost_price`, lalu cek penjualan lama tetap memakai snapshot lama.
3. Buat stock opname baru dan pastikan `stock_opname_items.cost_price` terisi.
4. Buka detail penjualan dan validasi nilai profit per item serta total profit.
5. Jalankan lint/build frontend dan build backend.

## Risiko & Mitigasi
- Risiko: data lama belum punya `cost_price`, sehingga profit histori lama tidak akurat.
- Mitigasi: tampilkan fallback aman dan hitung profit akurat hanya untuk transaksi baru setelah perubahan ini.

- Risiko: frontend mengirim `cost_price` berbeda dari master produk.
- Mitigasi: backend selalu override dari `products.cost_price`.

- Risiko: query profit salah karena diskon atau formula tidak konsisten.
- Mitigasi: gunakan satu formula profit di backend detail sale dan verifikasi manual dengan sampel transaksi.

- Risiko: kolom baru belum muncul di DB target.
- Mitigasi: pastikan aplikasi backend menjalankan `AutoMigrate` dan lakukan validasi schema setelah startup.

## Acceptance Criteria
- `sale_items` memiliki `cost_price` dan terisi otomatis dari produk saat transaksi dibuat.
- `stock_opname_items` memiliki `cost_price` dan terisi otomatis dari produk saat stock opname dibuat.
- Detail penjualan menampilkan `cost_price`, `profit` per item, dan `total_profit`.
- Profit penjualan lama tidak berubah ketika `products.cost_price` diubah.
