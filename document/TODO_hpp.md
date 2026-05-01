# TODO HPP

## Phase 1: Business Rules & Data Model
- [x] Tambah field `is_opening` pada model `StockOpname` di `go_backend/internal/models/inventory.go` dengan default `false`.
- [x] Pastikan migrasi backend menambahkan kolom `is_opening` ke tabel `stock_opnames`.
- [x] Tambah field `cost_price` pada `StockOpnameItemRequest` di `go_backend/internal/types/request/inventory_request.go`.
- [x] Tambah field `cost_price` pada `StockOpnameUpdateItemRequest` di `go_backend/internal/types/request/inventory_request.go`.
- [x] Tambah field `is_opening` pada `StockOpnameRequest` di `go_backend/internal/types/request/inventory_request.go`.
- [x] Tambah field `is_opening` pada `StockOpnameUpdateRequest` di `go_backend/internal/types/request/inventory_request.go`.

## Phase 2: Backend Stock Opname Opening
- [x] Update `go_backend/internal/handlers/inventory_handler.go` agar meneruskan `is_opening` dan `cost_price` ke service create stock opname.
- [x] Update `go_backend/internal/handlers/inventory_handler.go` agar meneruskan `is_opening` dan `cost_price` ke service update stock opname.
- [x] Update `go_backend/internal/services/inventory_service.go` CreateStockOpname agar menyimpan `stock_opname_items.cost_price` dari payload saat mode opening.
- [x] Update `go_backend/internal/services/inventory_service.go` UpdateStockOpname agar mempertahankan `stock_opname_items.cost_price` dari payload.
- [x] Tambahkan validasi: jika `is_opening = true`, semua item wajib punya `cost_price > 0`.
- [x] Tambahkan validasi: jika `is_opening = true`, produk tidak boleh sudah pernah punya opening stock approved global.
- [x] Tambahkan guard: produk yang sudah pernah opening tetap boleh dipakai di stock opname biasa.
- [x] Saat post stock opname biasa, jangan ubah `products.cost_price`.
- [x] Saat post stock opname opening, set `products.cost_price = stock_opname_items.cost_price`.
- [x] Pastikan finalisasi opening tetap membuat `stock_movement` bertipe `OPNAME`.

## Phase 3: Backend Moving Average Purchase
- [x] Update `go_backend/internal/services/purchase_service.go` agar `ReceivePurchaseOrder` menghitung moving average ke `products.cost_price`.
- [x] Hitung stok existing secara global dengan `SUM(inventory.quantity)` untuk `product_id` yang diterima.
- [x] Gunakan rumus moving average: `(current_stock * current_cost_price + qty_received * unit_price) / (current_stock + qty_received)`.
- [x] Jika stok existing `<= 0`, set `products.cost_price` langsung ke `purchase_order_items.unit_price`.
- [x] Pastikan hanya `qtyToAdd` yang memengaruhi moving average agar partial receive tidak dobel hitung.
- [x] Jalankan update average cost dalam transaction yang sama dengan update inventory receive.

## Phase 4: Frontend Stock Opname Opening
- [x] Update `frontend_v2/src/features/master/stock-opname/stockOpname.api.js` agar normalize header membawa `is_opening`.
- [x] Update `frontend_v2/src/features/master/stock-opname/stockOpname.api.js` agar payload create/update mengirim `is_opening`.
- [x] Update `frontend_v2/src/components/ToolbarItem/transaksi/StockOpnameDetail.jsx` untuk menambahkan toggle `Opening Stock`.
- [x] Saat mode opening aktif, wajibkan `cost_price > 0` untuk semua item.
- [x] Saat mode opening aktif, blok produk yang sudah pernah opening global.
- [x] Saat mode biasa, produk yang sudah pernah opening tetap bisa dipilih.
- [x] Tampilkan indikator visual yang jelas bahwa dokumen adalah `Opening Stock`.

## Phase 5: Verification
- [ ] Uji opening stock pertama untuk produk baru: qty masuk, `product.cost_price` ter-set dari opening cost.
- [ ] Uji opening stock kedua untuk produk yang sama: approval ditolak.
- [ ] Uji stock opname biasa untuk produk yang sudah pernah opening: stok berubah, HPP tidak berubah.
- [ ] Uji receive PO setelah opening: `products.cost_price` berubah sesuai moving average.
- [ ] Uji partial receive PO: average cost hanya berubah berdasarkan qty tambahan.
- [x] Jalankan validasi kualitas frontend: `npm run lint` dan `npm run build`.
- [x] Jalankan validasi backend: `go test ./...` dan/atau `go build ./...` di `go_backend`.

## Phase 6: History HPP Product
- [x] Tambah endpoint backend `GET /api/products/:id/hpp-trace` tanpa model baru, berbasis query existing table.
- [x] Gabungkan event `OPENING_STOCK` dari `stock_opnames` + `stock_opname_items` dan `PURCHASE_RECEIVE` dari `purchase_orders` + `purchase_order_items`.
- [x] Gunakan `qty_receive` sebagai basis perubahan HPP untuk event purchase receive.
- [x] Hitung running HPP dengan query recursive agar setiap event memiliki nilai HPP hasil akhir setelah event diproses.
- [x] Pastikan `product.cost_price` readonly dan tidak bisa diubah manual dari form product.
- [x] Tambahkan icon `History Hpp` di samping field `cost_price` pada form/detail product.
- [x] Tambahkan modal `History Hpp` di product detail.
- [x] Tampilkan tabel modal dengan kolom: `Tanggal`, `Event`, `Referensi`, `Qty`, `Unit Cost`, `HPP`, `Warehouse`, `Notes`.
- [x] Pastikan kolom `HPP` menampilkan running HPP sesudah event, tanpa menampilkan `HPP Sebelum`.
- [x] Tambahkan helper frontend `getProductHppTrace` di API product.
- [ ] Uji produk dengan opening stock saja: histori 1 event dan HPP sesuai opening.
- [ ] Uji produk dengan opening stock + purchase receive: HPP berjalan sesuai moving average.

## Catatan Implementasi
- Opening stock hanya boleh sekali per produk secara global.
- Produk yang sudah pernah opening harus diblok hanya di mode opening, bukan di stock opname biasa.
- `products.cost_price` menjadi current HPP aktif.
- `products.cost_price` bersifat readonly dan dibentuk hanya dari opening stock dan purchase receive.
- Histori HPP opening disimpan di `stock_opname_items.cost_price`.
- Histori HPP penjualan tetap disimpan di `sale_items.cost_price`.
- Tracing `History Hpp` menggunakan query existing data, tanpa tabel/model baru.

## Risiko & Mitigasi
- Risiko: opening stock kedua lolos dari draft lama atau request paralel.
- Mitigasi: validasi ulang saat approve opening di backend, bukan hanya di UI.

- Risiko: stock opname biasa ikut mengubah HPP product.
- Mitigasi: guard eksplisit `if is_opening` sebelum update `products.cost_price`.

- Risiko: moving average global bias jika stok dihitung per gudang.
- Mitigasi: gunakan total stok global semua warehouse untuk `product_id`.

- Risiko: opening dilakukan pada produk yang sudah punya stok hasil transaksi lain.
- Mitigasi: pertimbangkan validasi tambahan bahwa opening idealnya hanya untuk produk dengan histori opening belum ada.
