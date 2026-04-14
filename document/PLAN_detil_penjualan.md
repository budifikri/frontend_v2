# PLAN Detail Penjualan (Updated)

## Objective
- Perbaiki desain dan data pada `PenjualanDetailModal` agar informatif dan konsisten.
- Pastikan metadata header tampil, kolom tabel lengkap, dan footer menampilkan total transaksi.

## Problem Yang Diperbaiki
1. Header `No. Nota`, `Tanggal`, `Status` belum muncul.
2. Kolom `Satuan` belum muncul.
3. `Harga` harus menampilkan harga sebelum diskon (`original_price`).
4. Perlu kolom `Diskon` (`discount_amount`) di tabel.
5. Perlu nilai `Total` di footer tabel/modal.

## Root Cause
- Data detail penjualan dibaca sebagai `data.sale`, padahal payload detail endpoint dikirim flat object.
- Query backend sale items belum join ke tabel unit (`units_of_measure`), sehingga `unit_name` tidak tersedia.
- Tabel belum menampilkan field `original_price` dan `discount_amount`.

## Scope
- Frontend:
  - `src/components/ToolbarItem/laporan/penjualan/PenjualanDetailModal.jsx`
  - `src/features/laporan/penjualan/PenjualanDetailModal.jsx`
  - `src/App.css`
- Backend:
  - `../go_backend/internal/repository/sales_repository.go`

## Technical Plan
1. Ubah parsing sale detail:
   - `const sale = data?.sale || data || null`
2. Header metadata:
   - Tampilkan `No. Nota`, `Tanggal` (`sale_date` fallback `created_at`), `Status`.
3. Backend sale items:
   - Join `products` + `units_of_measure`.
   - Expose `unit_name` dari query `GetSaleItems`.
4. Tabel detail item:
   - Kolom final: `NO | PRODUK | QTY | SATUAN | HARGA | DISKON | SUBTOTAL`
   - `HARGA` pakai `original_price` (fallback nilai lain bila kosong)
   - `DISKON` pakai `discount_amount`
5. Footer:
   - Tampilkan `Total Item` + `Total`.
   - `Total` prioritas `sale.total_amount`, fallback penjumlahan subtotal item.

## Visual Design (Updated)

### Layout
```
┌────────────────────────────────────────────────────────────────────────────┐
│ [icon] Detail Penjualan     [NO. NOTA: ...] [TANGGAL: ...] [STATUS: ...] │
├────────────────────────────────────────────────────────────────────────────┤
│ NO | PRODUK | QTY | SATUAN | HARGA | DISKON | SUBTOTAL                   │
│ .. | ...... | ... | ...... | ..... | ...... | ........                   │
├────────────────────────────────────────────────────────────────────────────┤
│ [Print] [Exit]                     Total Item: xx   Total: Rp x.xxx.xxx   │
└────────────────────────────────────────────────────────────────────────────┘
```

### Style Direction
- Header metadata dalam chip ringan:
  - background `#eef2ff`, border `#dbeafe`, rounded `6px`
  - label uppercase kecil, value bold
- Angka (`QTY`, `HARGA`, `DISKON`, `SUBTOTAL`) rata kanan.
- Footer total menggunakan penekanan warna hijau (`#166534`) dan font bold.

### Responsive
- Metadata header wrap otomatis di layar sempit.
- Tabel tetap horizontal scroll.
- Footer informasi total tetap terbaca.

## TODO
- [x] Fix source sale detail agar header metadata muncul.
- [x] Tambah `unit_name` pada query backend `GetSaleItems`.
- [x] Tambah kolom `DISKON` di tabel detail.
- [x] Gunakan `original_price` untuk kolom `HARGA`.
- [x] Tambah `Total` di footer modal.
- [x] Update style footer total di `App.css`.
- [x] Sinkronkan perubahan ke file duplikat di folder `features`.
- [ ] Verifikasi manual di UI detail penjualan.

## Acceptance Criteria
- Header metadata tampil (`No. Nota`, `Tanggal`, `Status`).
- Satuan tampil dari `unit_name` backend.
- Harga menampilkan nilai `original_price`.
- Kolom diskon tampil dan bernilai benar.
- Footer menampilkan `Total Item` dan `Total` transaksi.
