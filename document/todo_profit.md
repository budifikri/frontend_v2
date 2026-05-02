# TODO Profit Laporan Penjualan

- [x] Tambah field `TotalProfit` pada struct list sales di `go_backend/internal/repository/sales_repository.go`.
- [x] Tambah field `TotalProfit`, `DoneRows`, `CancelledRows`, `RefundedRows`, `PendingRows` pada summary sales.
- [x] Buat subquery agregasi base profit dari `sale_items` per `sale_id`.
- [x] Terapkan aturan profit per status pada query list sales.
- [x] Terapkan aturan profit per status pada query summary sales.
- [x] Tambah breakdown count status pada response summary sales.
- [x] Update `go_backend/internal/services/sales_service.go` agar expose `total_profit` dan count status.
- [x] Update `src/components/ToolbarItem/laporan/penjualan/LapPenjualan.jsx` untuk menambah kolom `PROFIT`.
- [x] Tambah sorting untuk nilai profit pada tabel laporan penjualan.
- [x] Tampilkan `sale.total_profit` pada setiap row dalam format rupiah.
- [x] Perluas parsing state summary di frontend untuk `totalProfit`, `doneRows`, `cancelledRows`, `refundedRows`, `pendingRows`.
- [x] Ubah summary bawah agar mengikuti desain footer Purchase Order.
- [x] Reuse atau tambahkan CSS minimal di `src/App.css` untuk summary footer laporan penjualan.
- [ ] Validasi manual untuk status `DONE`, `CANCELLED`, `REFUNDED`, `PENDING`.
- [ ] Validasi manual filter + pagination + summary seluruh hasil filter.
- [x] Jalankan `npm run lint`.
- [x] Jalankan `npm run build`.

## Progress Notes

- `go test ./...` di backend berhasil.
- `npm run lint` berhasil, dengan warning lama yang sudah ada di file lain dan tidak terkait perubahan profit ini.
- `npm run build` berhasil.
