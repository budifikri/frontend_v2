# Plan: Cetak Penjualan (POS)

## Tujuan
Menambahkan fitur cetak nota dari transaksi penjualan yang sudah selesai (`status = DONE`) dan hanya dari cash drawer yang sedang aktif (`OPEN`).

## Klarifikasi API
Tidak wajib endpoint khusus PDF jika sudah ada `GET /api/sales/{id}`.

Kita bisa pakai alur berikut:
1. Ambil detail sale via `GET /api/sales/{id}`
2. Render template nota di frontend dari response API
3. Generate PDF di frontend ( library PDF)


## Role / Behavior

1. Tombol sidebar `Cetak` + shortcut `F7`
   - Klik tombol atau tekan `F7` membuka popup daftar nota.

2. Popup list nota penjualan
   - Sumber data dari API list sales.
   - Filter wajib:
     - `status = DONE`
     - `cash_drawer_id = currentCashDrawer.id` (yang aktif/open)
   - Tampilkan minimal: nomor sale, tanggal, kasir, total.

3. Pilih nota -> generate PDF
   - Saat user pilih satu nota:
     - Ambil detail via `GET /api/sales/{id}`
     - Bentuk template nota
     - Generate PDF / print

## Rencana Implementasi

### Step 1 - State di POS
Tambahkan state baru di `src/components/POS/POS.jsx`:
- `showPrintPopup`
- `printNotes`
- `printSelectedIndex`
- `isLoadingPrintNotes`
- `isGeneratingPrint`

### Step 2 - API layer sales
Di `src/features/transaksi/sales/` tambahkan function (atau update file existing):
- `listSales(token, params)` untuk daftar nota
- `getSaleById(token, saleId)` untuk detail nota

Contoh query list:
- `status=DONE`
- `cash_drawer_id=<active_drawer_id>`
- `limit=10`
- optional: `sort=-created_at`

### Step 3 - Handler buka popup cetak
`handleShowPrintPopup`:
- Validasi ada `currentCashDrawer.id`
- Call `listSales(...)` dengan filter role di atas
- Simpan ke `printNotes`
- Buka popup

### Step 4 - Shortcut dan tombol
- Tombol sidebar `Cetak` pakai `onClick={handleShowPrintPopup}`
- Shortcut `F7` di global keydown buka popup yang sama

### Step 5 - Popup UI daftar nota
Komponen popup berisi:
- Header: "Daftar Nota Penjualan"
- List nota dan pagination jika lebih dari 10 item
- Keyboard:
  - ArrowUp/ArrowDown untuk navigasi
  - Enter untuk pilih/cetak
  - Escape untuk tutup
   

### Step 6 - Generate cetak dari detail sale
`handlePrintSale(saleId)`:
1. Call `getSaleById(token, saleId)`
2. Mapping response ke data template nota:
   - `sale_number`, `sale_date`, `cashier_name`, `warehouse_name`
   - `items[]` (`product_name`, `quantity`, `unit_price`, `discount_amount`)
   - `subtotal`, `tax_amount`, `total_amount`, `paid_amount`, `change_amount`
   - `payments[]` (method + amount)
3. Render ke print layout
4. Trigger print/PDF

Pilihan teknik output:
library PDF (mis. `jspdf` + `autotable`)

### Step 7 - Feedback user
Gunakan Toast:
- Gagal load list nota
- Tidak ada nota DONE untuk drawer aktif
- Gagal generate cetak
- Berhasil trigger cetak

### Step 8 - Validasi data
Pastikan handle kondisi:
- `currentCashDrawer` null
- list kosong
- detail sale kosong / item kosong
- error API

## Struktur Data Referensi (dari `GET /api/sales/{id}`)
Field penting yang dipakai:
- Header: `sale_number`, `created_at`, `cashier_name`, `warehouse_name`, `status`
- Item: `items[].product_name`, `items[].quantity`, `items[].unit_price`, `items[].discount_amount`
- Total: `subtotal`, `tax_amount`, `total_amount`, `paid_amount`, `change_amount`
- Payment: `payments[].payment_method`, `payments[].amount`

## File yang Diubah
1. `src/components/POS/POS.jsx`
   - state print
   - handler `handleShowPrintPopup`, `handlePrintSale`
   - shortcut `F7`
   - popup list nota

2. `src/components/POS/POS.css`
   - style popup cetak + list

3. `src/features/transaksi/sales/sales.api.js`
   - tambah function list sales + get sale detail

## Kriteria Selesai
- Klik tombol `Cetak` atau tekan `F7` membuka popup.
- Popup menampilkan hanya sale `DONE` milik cash drawer aktif.
- Pilih 1 nota memicu proses cetak (print/PDF) dari data `GET /api/sales/{id}`.
- Error handling dan toast berjalan normal.
