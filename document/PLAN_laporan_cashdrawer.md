# Rencana Implementasi Laporan Cash Drawer untuk Menu Admin

## Tujuan
Membangun fitur laporan cash drawer yang memungkinkan admin untuk memantau dan menganalisis aktivitas kas dalam sistem penjualan.

## Referensi API Endpoint Cash Drawer
Berdasarkan file `src/features/transaksi/cash-drawer/cashDrawer.api.js`, endpoint yang tersedia:

1. `getCurrentCashDrawer(token)` - Mendapatkan cash drawer yang sedang aktif
   - Endpoint: `GET /api/cash-drawers/current`
   
2. `getCashDrawerSummary(token, drawerId)` - Mendapatkan ringkasan cash drawer
   - Endpoint: `GET /api/cash-drawers/{drawerId}/summary`
   
3. `closeCashDrawer(token, drawerId, closingBalance, notes)` - Menutup cash drawer
   - Endpoint: `POST /api/cash-drawers/{drawerId}/close`
   
4. `cashInDrawer(token, drawerId, amount, reason)` - Menambahkan tunai ke cash drawer
   - Endpoint: `POST /api/cash-drawers/{drawerId}/cash-in`
   
5. `cashOutDrawer(token, drawerId, amount, reason)` - Mengambil tunai dari cash drawer
   - Endpoint: `POST /api/cash-drawers/{drawerId}/cash-out`
   
6. `openCashDrawer(token, input)` - Membuka cash drawer baru
   - Endpoint: `POST /api/cash-drawers/open`

## Struktur Fitur yang Diperlukan

### 1. Komponen Utama Laporan Cash Drawer
Membuat komponen baru di `src/features/laporan/cash-drawer/` dengan struktur:
- `cashDrawer.api.js` - Untuk memanggil endpoint API
- Komponent UI untuk menampilkan laporan (serupa dengan LapStock.jsx)

### 2. Komponen UI Laporan Cash Drawer
Komponen laporan cash drawer akan memiliki fitur-fitur berikut:

#### Tampilan Utama
- Header dengan judul "Laporan Cash Drawer"
- Filter tanggal (rentang tanggal)
- Filter status cash drawer (terbuka/tertutup)
- Tombol refresh
- Tombol cetak laporan
- Tombol keluar

#### Tabel Data Cash Drawer
Kolom tabel yang ditampilkan:
- No (nomor urut)
- Tanggal Pembukaan
- Tanggal Penutupan (jika sudah ditutup)
- Status (Terbuka/Ditutup)
- Saldo Awal
- Total Cash In
- Total Cash Out
- Saldo Akhir (theoretical)
- Saldo Aktual ( dari sistem )
- Selisih
- Kasir yang membuka
- Kasir yang menutup (jika sudah ditutup)
- Catatan

#### Detail Cash Drawer (Modal)
Ketika pengguna menekan baris dalam tabel, modal akan menampilkan detail lengkap:
- Informasi dasar cash drawer
- Ringkasan transaksi:
  - Total transaksi penjualan
  - Total pengembalian penjualan
  - Total pembelian
  - Total pengembalian pembelian
  - Total cash in manual
  - Total cash out manual
- Detail transaksi per tipe (dapat difilter)
- Catatan penutupan (jika ada)

### 3. Endpoint Baru yang Diperlukan
Berdasarkan analisis, endpoint yang mungkin diperlukan tetapi belum ada di API saat ini:

1. `getCashDrawers(token, params)` - Mendapatkan daftar cash drawer dengan filter
   - Endpoint yang diperkirakan: `GET /api/cash-drawers`
   - Parameter: date_from, date_to, status, limit, offset
   
2. `getCashDrawerTransactions(token, drawerId, params)` - Mendapatkan detail transaksi cash drawer
   - Endpoint yang diperkirakan: `GET /api/cash-drawers/{drawerId}/transactions`

### 4. Alur Implementasi

#### Tahap 1: Persiapan
- Membuat folder `src/features/laporan/cash-drawer`
- Membuat file `cashDrawer.api.js` dengan fungsi-fungsi untuk mengakses API
- Mendesain struktur data respons yang diharapkan dari backend

#### Tahap 2: Komponen UI
- Membuat komponen `LapCashDrawer.jsx` yang mengikuti pola serupa dengan `LapStock.jsx`
- Mengimplementasikan state management untuk filter, data, pagination, loading state, dan error handling
- Membuat komponen modal untuk menampilkan detail cash drawer

#### Tahap 3: Integrasi dan Testing
- Mengintegrasikan komponen ke menu admin
- Menulis teste unit untuk komponen dan API service
- Melakukan testing manual untuk memastikan semua fitur berfungsi sesuai ekspektasi

### 5. Komponen Pendukung yang diperlukan
Berdasarkan pola yang digunakan di komponen laporan lain, berikut komponen pendukung yang mungkin diperlukan:

#### Hooks Custom
- `useMasterTableSort` - Untuk pengurutan tabel (sudah ada)
- `useMasterPagination` - Untuk paginasi (sudah ada)

#### Komponen UI Bersama
- `MasterTableHeader` - Untuk header tabel dengan fitur sorting (sudah ada)
- Komponen input, select, button standar (harus sudah ada dari komponen lain)

#### Modal Komponen
- Akan perlu dibuat komponen modal khusus untuk menampilkan detail cash drawer (serupa dengan StockCardModal)

### 6. Detail Implementasi API Service

Dalam file `src/features/laporan/cash-drawer/cashDrawer.api.js`:

```javascript
import { apiFetch } from '../../../shared/http'

export async function getCashDrawers(token, params = {}) {
  const qs = new URLSearchParams()
  // Implementasi parameter filter: date_from, date_to, status, etc.
  // ...
  
  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const url = `/api/cash-drawers${queryString}`
  
  const raw = await apiFetch(url, { token })
  // Implementasi respons dan penanganan error
  // ...
  
  return {
    // Transformasi data sesuai kebutuhan UI
  }
}

export async function getCashDrawerSummary(token, drawerId) {
  // Menggunakan fungsi yang sudah ada dari cashDrawer.api.js saat ini
  const raw = await apiFetch(`/api/cash-drawers/${encodeURIComponent(drawerId)}/summary`, { token })
  return raw
}

// Fungsi lain untuk transaksi detail, export, dll jika diperlukan
```

### 7. Pertimbangan Keamanan dan Akses
- Hanya pengguna dengan role admin yang dapat mengakses fitur ini
- Validasi token pada setiap permintaan API
- Sanitasi input filter untuk mencegah injection
- Pembatasan akses berdasarkan cabang/gudang jika multi-cabang diimplementasikan

### 8. Estimasi Waktu Pengerjaan
- Persiapan dan struktur dasar: 4 jam
- Implementasi API service: 2 jam
- Pengembangan komponen UI utama: 6 jam
- Implementasi modal detail: 4 jam
- Integrasi dan testing: 4 jam
- **Total estimasi: 20 jam**

## Berikutnya Langkah
Ketika endpoint backend untuk daftar cash drawer dan transaksi detail tersedia, implementasi dapat dilanjutkan sesuai rencana di atas.

---
*Catatan: Rencana ini dibuat berdasarkan analisis struktur proyek yang tersedia dan mungkin perlu disesuaikan ketika detail API backend sebenarnya diketahui.*