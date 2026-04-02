# Plan: Setting Nota Jual

## Tujuan
Menyediakan menu pengaturan nota jual agar kasir dapat memilih ukuran kertas, tata letak, dan melihat preview sebelum digunakan saat cetak.

## Role

0. Akses form setting cetak nota jual
   - Entry point dari tombol `Setting` di sidebar Menu POS (shortcut `F11`)
   - Saat tombol `Setting` ditekan, tampilkan popup/halaman `Setting Nota Jual`

1. Pilihan format ukuran kertas
   - Opsi: `58mm` dan `80mm`
   - Nilai tersimpan sebagai default global (per user/per device, mengikuti kebutuhan sistem)

2. Pilihan format tata letak
   - Menyediakan 3 template layout nota, contoh:
     - `Layout A - Simple`
     - `Layout B - Detail Pajak`
     - `Layout C - Brand + Footer`
   - Masing-masing template mendefinisikan struktur:
     - Header (logo/nama toko/alamat)
     - Body item
     - Tax rows
     - Payment breakdown
     - Footer

3. Preview
   - Menampilkan preview nota berdasarkan kombinasi ukuran kertas + layout terpilih
   - Preview berubah real-time saat opsi diganti

## Ruang Lingkup Implementasi

### 1) Data Model Setting
Objek setting nota (contoh):

```json
{
  "paper_size": "58mm",
  "layout_type": "layout_a",
  "show_logo": true,
  "show_footer": true
}
```

Minimal field wajib:
- `paper_size`: `58mm | 80mm`
- `layout_type`: `layout_a | layout_b | layout_c`

### 2) Penyimpanan Setting
Sumber awal: `localStorage` (cepat dan tidak blocking backend).

Key rekomendasi:
- `pos_receipt_settings`

Alur:
- Load saat POS dibuka
- Simpan saat user klik tombol `Simpan`
- Fallback ke default jika belum ada data

### 3) UI Setting Nota Jual
Tambahkan halaman/popup pengaturan berisi:
- Trigger buka dari tombol `Setting` di Menu POS (`F11`)
- Section `Ukuran Kertas`
  - Radio button: 58mm / 80mm
- Section `Tata Letak`
  - Card/radio 3 pilihan layout
- Section `Preview`
  - Panel simulasi nota (scrollable)
- Tombol aksi
  - `Simpan`
  - `Reset Default`

### 4) Engine Template Nota
Pisahkan renderer template berdasarkan `layout_type`.

Contoh fungsi:
- `renderReceiptLayoutA(data, settings)`
- `renderReceiptLayoutB(data, settings)`
- `renderReceiptLayoutC(data, settings)`

Setiap renderer menghasilkan HTML string/React fragment untuk:
- Header/logo
- Daftar item
- Tax rows
- Payment breakdown
- Footer

### 5) Aturan Lebar Kertas
Gunakan class CSS berbasis ukuran:
- `.receipt-preview.paper-58`
- `.receipt-preview.paper-80`

Contoh mapping:
- 58mm: lebar preview sekitar `220px`
- 80mm: lebar preview sekitar `300px`

### 6) Integrasi ke Fitur Cetak
Saat cetak nota:
1. Ambil setting aktif
2. Pilih renderer sesuai `layout_type`
3. Apply width sesuai `paper_size`
4. Trigger print

### 7) Integrasi Tombol Setting POS
- Tombol sidebar `Setting` pada POS diarahkan untuk membuka form `Setting Nota Jual`.
- Jika nanti ada setting POS lain, gunakan tab di popup yang sama, dengan tab default: `Nota Jual`.

## Struktur File yang Disarankan

1. `src/features/setting/receiptSetting.storage.js`
   - fungsi load/save/reset setting localStorage

2. `src/components/POS/ReceiptLayouts.jsx`
   - kumpulan renderer layout A/B/C

3. `src/components/POS/ReceiptPreview.jsx`
   - komponen preview reusable

4. `src/components/POS/POS.jsx`
   - integrasi setting ke alur cetak

5. `src/components/POS/POS.css`
   - style preview, opsi layout, ukuran kertas

## Acceptance Criteria

1. User bisa memilih ukuran kertas 58mm/80mm dan tersimpan.
2. User bisa memilih 1 dari 3 layout dan tersimpan.
3. Preview tampil dan update langsung saat opsi berubah.
4. Hasil cetak mengikuti setting yang dipilih.
5. Jika setting kosong/rusak, sistem kembali ke default tanpa crash.

## Catatan Teknis

- Tahap awal dapat full frontend (localStorage).
- Jika nanti butuh sinkron antar device, setting bisa dipindah ke endpoint backend (dengan skema yang sama).
- Pastikan font/icon yang dipakai untuk cetak tetap offline-compatible.
