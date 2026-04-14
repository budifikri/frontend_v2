# TODO Summary Jual

- [ ] Tambah method agregasi di `go_backend/internal/repository/sales_repository.go`.
- [ ] Refactor filter query agar dipakai bersama untuk list dan summary sales.
- [ ] Tambah `GetSalesSummary` di `go_backend/internal/services/sales_service.go`.
- [ ] Tambah handler `GetSalesSummary` di `go_backend/internal/handlers/sales_handler.go`.
- [ ] Register route `/api/sales/summary` di `go_backend/cmd/server/main.go` (sebelum `/:id`).
- [ ] Tambah API client `getSalesSummary` di `src/features/laporan/penjualan/penjualan.api.js`.
- [ ] Tambah state summary di `src/components/ToolbarItem/laporan/penjualan/LapPenjualan.jsx`.
- [ ] Tampilkan summary bar di bawah master table (sebelum master footer).
- [ ] Tambah CSS summary bar di `src/App.css`.
- [ ] Sinkronkan perubahan pada file duplikat bila masih dipakai (`src/features/laporan/penjualan/LapPenjualan.jsx`).
- [ ] Validasi manual: filter + pagination + summary all records.
- [ ] Jalankan cek kualitas: `npm run lint` dan build backend.
