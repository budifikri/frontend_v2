# TODO HPP

## Phase 1: Business Rules & Data Model
- [ ] Tambah field `is_opening` pada model `StockOpname` di `go_backend/internal/models/inventory.go` dengan default `false`.
- [ ] Pastikan migrasi backend menambahkan kolom `is_opening` ke tabel `stock_opnames`.
- [ ] Tambah field `cost_price` pada `StockOpnameItemRequest` di `go_backend/internal/types/request/inventory_request.go`.
- [ ] Tambah field `cost_price` pada `StockOpnameUpdateItemRequest` di `go_backend/internal/types/request/inventory_request.go`.
- [ ] Tambah field `is_opening` pada `StockOpnameRequest` di `go_backend/internal/types/request/inventory_request.go`.
- [ ] Tambah field `is_opening` pada `StockOpnameUpdateRequest` di `go_backend/internal/types/request/inventory_request.go`.

## Phase 2: Backend Stock Opname Opening
- [ ] Update `go_backend/internal/handlers/inventory_handler.go` agar meneruskan `is_opening` dan `cost_price` ke service create stock opname.
- [ ] Update `go_backend/internal/handlers/inventory_handler.go` agar meneruskan `is_opening` dan `cost_price` ke service update stock opname.
- [ ] Update `go_backend/internal/services/inventory_service.go` CreateStockOpname agar menyimpan `stock_opname_items.cost_price` dari payload saat mode opening.
- [ ] Update `go_backend/internal/services/inventory_service.go` UpdateStockOpname agar mempertahankan `stock_opname_items.cost_price` dari payload.
- [ ] Tambahkan validasi: jika `is_opening = true`, semua item wajib punya `cost_price > 0`.
- [ ] Tambahkan validasi: jika `is_opening = true`, produk tidak boleh sudah pernah punya opening stock approved global.
- [ ] Tambahkan guard: produk yang sudah pernah opening tetap boleh dipakai di stock opname biasa.
- [ ] Saat approve stock opname biasa, jangan ubah `products.cost_price`.
- [ ] Saat approve stock opname opening, set `products.cost_price = stock_opname_items.cost_price`.
- [ ] Pastikan approval opening tetap membuat `stock_movement` bertipe `OPNAME`.

## Phase 3: Backend Moving Average Purchase
- [ ] Update `go_backend/internal/services/purchase_service.go` agar `ReceivePurchaseOrder` menghitung moving average ke `products.cost_price`.
- [ ] Hitung stok existing secara global dengan `SUM(inventory.quantity)` untuk `product_id` yang diterima.
- [ ] Gunakan rumus moving average: `(current_stock * current_cost_price + qty_received * unit_price) / (current_stock + qty_received)`.
- [ ] Jika stok existing `<= 0`, set `products.cost_price` langsung ke `purchase_order_items.unit_price`.
- [ ] Pastikan hanya `qtyToAdd` yang memengaruhi moving average agar partial receive tidak dobel hitung.
- [ ] Jalankan update average cost dalam transaction yang sama dengan update inventory receive.

## Phase 4: Frontend Stock Opname Opening
- [ ] Update `frontend_v2/src/features/master/stock-opname/stockOpname.api.js` agar normalize header membawa `is_opening`.
- [ ] Update `frontend_v2/src/features/master/stock-opname/stockOpname.api.js` agar payload create/update mengirim `is_opening`.
- [ ] Update `frontend_v2/src/components/ToolbarItem/transaksi/StockOpnameDetail.jsx` untuk menambahkan toggle `Opening Stock`.
- [ ] Saat mode opening aktif, wajibkan `cost_price > 0` untuk semua item.
- [ ] Saat mode opening aktif, blok produk yang sudah pernah opening global.
- [ ] Saat mode biasa, produk yang sudah pernah opening tetap bisa dipilih.
- [ ] Tampilkan indikator visual yang jelas bahwa dokumen adalah `Opening Stock`.

## Phase 5: Verification
- [ ] Uji opening stock pertama untuk produk baru: qty masuk, `product.cost_price` ter-set dari opening cost.
- [ ] Uji opening stock kedua untuk produk yang sama: approval ditolak.
- [ ] Uji stock opname biasa untuk produk yang sudah pernah opening: stok berubah, HPP tidak berubah.
- [ ] Uji receive PO setelah opening: `products.cost_price` berubah sesuai moving average.
- [ ] Uji partial receive PO: average cost hanya berubah berdasarkan qty tambahan.
- [ ] Jalankan validasi kualitas frontend: `npm run lint` dan `npm run build`.
- [ ] Jalankan validasi backend: `go test ./...` dan/atau `go build ./...` di `go_backend`.

## Catatan Implementasi
- Opening stock hanya boleh sekali per produk secara global.
- Produk yang sudah pernah opening harus diblok hanya di mode opening, bukan di stock opname biasa.
- `products.cost_price` menjadi current HPP aktif.
- Histori HPP opening disimpan di `stock_opname_items.cost_price`.
- Histori HPP penjualan tetap disimpan di `sale_items.cost_price`.

## Risiko & Mitigasi
- Risiko: opening stock kedua lolos dari draft lama atau request paralel.
- Mitigasi: validasi ulang saat approve opening di backend, bukan hanya di UI.

- Risiko: stock opname biasa ikut mengubah HPP product.
- Mitigasi: guard eksplisit `if is_opening` sebelum update `products.cost_price`.

- Risiko: moving average global bias jika stok dihitung per gudang.
- Mitigasi: gunakan total stok global semua warehouse untuk `product_id`.

- Risiko: opening dilakukan pada produk yang sudah punya stok hasil transaksi lain.
- Mitigasi: pertimbangkan validasi tambahan bahwa opening idealnya hanya untuk produk dengan histori opening belum ada.
