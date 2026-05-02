# PLAN Profit Laporan Penjualan

## Objective
- Menambahkan kolom `PROFIT` pada tabel laporan penjualan.
- Menambahkan summary bawah dengan gaya visual seperti footer Purchase Order.
- Menetapkan aturan profit berdasarkan status transaksi:
  - `DONE` = profit normal
  - `CANCELLED` = `0`
  - `REFUNDED` = profit negatif
  - `PENDING` = `0`

## Scope
- Backend (`go_backend`): tambah perhitungan `total_profit` untuk list dan summary laporan penjualan.
- Frontend (`frontend_v2`): tampilkan kolom profit per transaksi dan summary footer profit.

## Visual Design Sketch
```text
+--------------------------------------------------------------------------------------------------+
| Laporan Penjualan                                                                                |
| [Tanggal] [Status] [Gudang]                                                                      |
+--------------------------------------------------------------------------------------------------+
| NO | NO. NOTA | TANGGAL | KONSUMEN | KASIR | GUDANG | TOTAL | PROFIT | STATUS                   |
|----|----------|---------|----------|-------|--------|-------|--------|--------------------------|
| 1  | PJ-001   | ...     | ...      | ...   | ...    | Rp... | Rp...  | DONE                     |
| 2  | PJ-002   | ...     | ...      | ...   | ...    | Rp... | Rp0    | CANCELLED                |
| 3  | PJ-003   | ...     | ...      | ...   | ...    | Rp... | -Rp... | REFUNDED                 |
+--------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------+
| Total Rows | Done | Cancelled | Refunded                                       Total Penjualan |
|     120    | 100  |     10    |     10                                                  Rp..... |
|                                                                              Total Profit Rp.... |
+--------------------------------------------------------------------------------------------------+
```

## Technical Implementation

### Backend Plan
1. Update `go_backend/internal/repository/sales_repository.go`.
2. Tambah field `TotalProfit` pada struct `SaleWithNames`.
3. Tambah field berikut pada struct `SalesSummary`:
   - `TotalProfit`
   - `DoneRows`
   - `CancelledRows`
   - `RefundedRows`
   - `PendingRows`
4. Buat subquery agregasi `sale_items` per `sale_id` untuk menghitung base profit:
   - `SUM(((unit_price - cost_price) * quantity) - discount_amount)`
5. Join subquery profit ke query list sales agar setiap row memiliki `total_profit`.
6. Terapkan aturan status di query list:
   - `DONE` -> profit normal
   - `CANCELLED` -> `0`
   - `REFUNDED` -> `-base_profit`
   - `PENDING` -> `0`
7. Update query summary sales agar mengembalikan:
   - `COUNT(*) as total_rows`
   - `SUM(total_amount) as total_penjualan`
   - `SUM(adjusted_profit) as total_profit`
   - count per status untuk `DONE`, `CANCELLED`, `REFUNDED`, `PENDING`
8. Update `go_backend/internal/services/sales_service.go` agar response summary mengirim semua field baru.

### Frontend Plan
1. Update `src/components/ToolbarItem/laporan/penjualan/LapPenjualan.jsx`.
2. Tambah kolom `PROFIT` pada `TABLE_COLUMNS`.
3. Tambah sorter `profit` di `useMasterTableSort.valueGetters`.
4. Render `sale.total_profit` per row dalam format rupiah.
5. Perluas state summary agar membaca:
   - `totalRows`
   - `totalPenjualan`
   - `totalProfit`
   - `doneRows`
   - `cancelledRows`
   - `refundedRows`
   - `pendingRows`
6. Ubah blok summary bawah agar mengikuti pola footer Purchase Order:
   - blok kiri: metrik status/count
   - blok kanan: `Total Penjualan` dan `Total Profit`
7. Reuse style Purchase Order di `src/App.css` sejauh memungkinkan agar diff minimal.
8. Tambah class khusus hanya jika perlu untuk spacing atau responsivitas laporan penjualan.

## Response Contract (Draft)
```json
{
  "success": true,
  "data": {
    "total_rows": 120,
    "total_penjualan": 12500000,
    "total_profit": 2350000,
    "done_rows": 100,
    "cancelled_rows": 10,
    "refunded_rows": 10,
    "pending_rows": 0
  }
}
```

## Validation
- Backend:
  - Uji list sales dan summary sales dengan kombinasi filter tanggal, status, dan gudang.
  - Pastikan `CANCELLED` menghasilkan `0`.
  - Pastikan `REFUNDED` menghasilkan profit negatif.
  - Pastikan total summary konsisten dengan akumulasi seluruh record hasil filter.
- Frontend:
  - Kolom `PROFIT` tampil dan bisa di-sort.
  - Summary bawah tidak berubah saat pindah halaman pagination untuk filter yang sama.
  - Design summary tetap rapi pada desktop dan mobile.

## Risks & Mitigation
- Risiko: query list menjadi berat jika join langsung ke `sale_items`.
  Mitigasi: gunakan subquery agregasi per `sale_id`, bukan join item mentah.
- Risiko: hasil profit berbeda antara list, summary, dan detail.
  Mitigasi: gunakan satu rumus base profit yang sama di semua perhitungan.
- Risiko: footer summary rusak saat layar sempit.
  Mitigasi: reuse pola responsive Purchase Order dan tambahkan wrapping seperlunya.

## Notes
- Summary harus dihitung dari seluruh record sesuai filter, bukan hanya halaman aktif.
- Implementasi sebaiknya fokus pada `src/components/ToolbarItem/laporan/penjualan/LapPenjualan.jsx` karena itu yang dipakai oleh `DashboardCanvas`.
