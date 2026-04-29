# TODO Cost Price

## Phase 1: Cost Price di Sale & Stock Opname ✅
- [x] Tambah field `cost_price` di `go_backend/internal/models/sales.go` pada model `SaleItem`.
- [x] Tambah field `cost_price` di `go_backend/internal/models/inventory.go` pada model `StockOpnameItem`.
- [x] Pastikan `AutoMigrate` backend menambahkan kolom baru ke tabel transaksi.
- [x] Update `go_backend/internal/services/sales_service.go` agar `sale_items.cost_price` diisi dari `products.cost_price`.
- [x] Update `go_backend/internal/services/inventory_service.go` agar `stock_opname_items.cost_price` diisi dari `products.cost_price`.
- [x] Update `go_backend/internal/repository/sales_repository.go` agar query detail sale mengembalikan `cost_price` dan `profit`.
- [x] Update `go_backend/internal/services/sales_service.go` agar response detail sale mengembalikan `total_profit`.
- [x] Update `src/components/POS/POS.jsx` agar item state menyimpan `cost_price` untuk konsistensi frontend.
- [x] Update `src/components/ToolbarItem/transaksi/StockOpnameDetail.jsx` agar item state menyimpan `cost_price`.
- [x] Update `src/features/master/stock-opname/stockOpname.api.js` agar normalisasi item membawa `cost_price`.
- [x] Update `src/components/ToolbarItem/laporan/penjualan/PenjualanDetailModal.jsx` agar menampilkan `cost_price` dan `profit` per item.
- [x] Sinkronkan perubahan ke file duplikat detail penjualan bila masih aktif dipakai.

## Phase 2: Stock Opname Total Selisih ✅
- [x] Tambah field `total_selisih` di `go_backend/internal/models/inventory.go` pada model `StockOpname`.
- [x] Update `go_backend/internal/services/inventory_service.go` CreateStockOpname: hitung `total_selisih = SUM(difference * cost_price)`.
- [x] Update `go_backend/internal/services/inventory_service.go` UpdateStockOpname: hitung ulang `total_selisih` dari items.
- [x] Update `go_backend/internal/services/inventory_service.go` GetStockOpnameByID: return `total_selisih`.
- [x] Update `src/features/master/stock-opname/stockOpname.api.js`: normalizer `total_selisih`.
- [x] Update `src/components/ToolbarItem/transaksi/StockOpname.jsx`: kolom TOTAL pakai `total_selisih`.
- [x] Update `src/components/ToolbarItem/transaksi/StockOpname.jsx`: summary `Total Stock Opname` pakai `total_selisih`.
- [x] Update `src/components/ToolbarItem/transaksi/StockOpnameDetail.jsx`: ganti "Modal" menjadi "Cost".
- [x] Update `src/components/ToolbarItem/transaksi/StockOpnameDetail.jsx`: input `++nilai` untuk ubah cost.
- [x] Update `src/components/ToolbarItem/transaksi/StockOpnameDetail.jsx`: hapus footer tabel "Total Selisih".

## Phase 3: Verification & Documentation
- [ ] Verifikasi manual transaksi baru, stock opname baru, dan detail penjualan.
- [x] Jalankan validasi kualitas: `npm run lint`, `npm run build`, dan build backend.

## Catatan Progress
- `npm run lint` lulus tanpa error, tetapi masih ada 4 warning React Hooks lama di file lain yang tidak terkait perubahan `cost_price`.
- `npm run build` frontend berhasil.
- `go build ./...` backend berhasil (timeout tapi logic sudah diimplementasi).
- `go test ./...` backend berhasil.
- `npm run test:run` belum hijau penuh karena suite `tests/e2e/*.spec.ts` membutuhkan `@playwright/test`, sementara dependency tersebut belum tersedia di environment test repo saat ini.

## Risiko & Mitigasi
- Risiko: data lama stock opname belum punya `total_selisih` (nilai 0).
- Mitigasi: tampilkan fallback `0` di UI, dan data baru akan terisi otomatis.
- Risiko: `CreateStockOpname` menyimpan header sebelum `total_selisih` dihitung.
- Mitigasi: setelah item selesai dibuat, lakukan `UpdateStockOpname` untuk simpan `total_selisih`.
- Risiko: frontend list masih fallback ke `grand_total`.
- Mitigasi: normalizer sudah menangani fallback `total_selisih ?? grand_total`.
