# PLAN Summary Jual

## Objective
- Menambahkan summary laporan penjualan di bawah master table (di atas master footer).
- Summary menampilkan data agregat seluruh record sesuai filter aktif (bukan per halaman):
  - `TOTAL ROWS`
  - `TOTAL PENJUALAN`

## Scope
- Backend (`go_backend`): tambah endpoint summary untuk sales.
- Frontend (`frontend_v2`): konsumsi endpoint summary dan tampilkan summary bar dengan style mirip Purchase Order.

## Backend Plan
1. Tambah method repository untuk hitung agregat sales berdasarkan filter:
   - `COUNT(*) as total_rows`
   - `COALESCE(SUM(total_amount), 0) as total_penjualan`
2. Refactor filter builder agar logic filter sama antara list sales dan summary sales.
3. Tambah service method `GetSalesSummary(filters)`.
4. Tambah handler endpoint baru `GET /api/sales/summary`.
5. Register route `sales.Get("/summary", salesHandler.GetSalesSummary)` sebelum route `/:id`.

## Frontend Plan
1. Tambah API function `getSalesSummary(params, token)`.
2. Tambah state summary pada `LapPenjualan`:
   - `summary.totalRows`
   - `summary.totalPenjualan`
3. Fetch summary saat:
   - filter berubah
   - tombol refresh
4. Render summary bar di bawah table:
   - `SUMMARY`
   - `TOTAL ROWS`
   - `TOTAL PENJUALAN`
5. Tambah CSS summary bar (visual style mengikuti Purchase Order summary).

## Response Contract (Draft)
```json
{
  "success": true,
  "data": {
    "total_rows": 37,
    "total_penjualan": 12500000
  }
}
```

## Validation
- Backend:
  - Uji endpoint `/api/sales/summary` dengan beberapa kombinasi filter.
  - Pastikan nilai agregat konsisten dengan query list sales untuk filter yang sama.
- Frontend:
  - Summary tetap sama saat pindah halaman pagination.
  - Summary berubah saat filter berubah.

## Notes
- Summary harus menghitung seluruh record sesuai filter, bukan hanya data page aktif (`limit/offset`).
- Design harus tetap konsisten dengan `master-content` report lain.
