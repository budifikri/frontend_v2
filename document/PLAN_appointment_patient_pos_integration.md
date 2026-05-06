# PLAN: Appointment Patient POS Integration

## Overview
Implementasi penguatan halaman `Appointment` agar menjadi pusat operasional clinic dengan 2 integrasi utama:
- integrasi appointment dengan data pasien
- integrasi appointment dengan POS

Tujuan utamanya adalah agar user dapat memulai proses pencarian pasien, pembuatan appointment, dan pembukaan POS dari satu area kerja yang sama tanpa mengubah flow dasar aplikasi secara berlebihan.

---

## Scope
- Ubah `Appointment` menjadi lebih patient-centric
- Tambah pencarian pasien yang lebih advance dan mudah dipahami
- Tambah shortcut aksi `Tambah Pasien` dan `Edit Data Pasien`
- Hubungkan `Appointment` ke data pasien existing di modul `Customer`
- Tambah aksi `Pembayaran ke POS` dari halaman `Appointment`
- Buka `POS` dengan context `customer_id` dari appointment
- POS dibuka dengan cart kosong
- Harga item di POS tidak bisa diedit manual
- Siapkan struktur sale agar bisa menjual `product` dan `treatment`

---

## Current Condition

### Appointment Existing
- File utama: `src/components/ToolbarItem/transaksi/Appointment.jsx`
- Appointment sudah punya:
  - list view
  - calendar view
  - filter search umum
  - filter status dan tanggal
  - CRUD appointment
- Pemilihan pasien masih memakai `select` biasa di form appointment
- Search existing masih generik, belum patient-centric

### Patient Existing
- File utama: `src/components/ToolbarItem/master/Customer.jsx`
- Untuk business type `clinic`, `Customer` sudah diposisikan sebagai data pasien
- API existing tersedia di `src/features/master/customer/customer.api.js`
- Search customer sudah ada, tetapi di appointment belum dipakai sebagai pengalaman pencarian pasien yang baik

### POS Existing
- File utama: `src/components/POS/POS.jsx`
- POS saat ini masih product-centric
- Checkout payload existing hanya mengirim item berbasis `product_id`
- POS belum terlihat memiliki selected customer/patient yang eksplisit
- POS dibuka sebagai layar `view === 'pos'` di `src/App.jsx`

---

## Confirmed Decisions
- Saat user masuk ke POS dari appointment, hanya `customer_id` yang dibawa
- Cart POS tetap kosong
- Harga item di POS tidak boleh diubah manual oleh user
- Sale ke depan harus mampu memuat:
  - `product` sebagai item stockable
  - `treatment` sebagai item service

---

## Target UX

### Appointment as Operational Hub
- Header appointment fokus ke pencarian pasien dan quick actions
- User dapat:
  - cari pasien berdasarkan nama / no RM / NIK / HP
  - tambah pasien dari halaman appointment
  - edit data pasien dari halaman appointment
  - buka POS untuk pasien yang sedang dipilih
- Detail pasien tampil jelas di panel terpisah
- Jadwal appointment harian tetap terlihat sebagai konteks kerja

### POS Integration Behavior
- Tombol `Pembayaran ke POS` aktif jika pasien sudah dipilih
- POS terbuka dengan pasien aktif sudah terisi
- Cart tetap kosong
- User menginput item transaksi langsung di POS
- Harga item mengikuti master dan rule otomatis, tanpa edit manual

---

## Visual Design Sketch

```text
+----------------------------------------------------------------------------------+
| Appointment Workspace                                                            |
|----------------------------------------------------------------------------------|
| [Cari Nama / No RM / NIK / HP....................] [Filter] [Tambah Pasien]     |
| [Status] [Dokter] [Tanggal]                                                      |
|----------------------------------------------------------------------------------|
| HASIL PASIEN                             | DETAIL PASIEN                         |
|------------------------------------------|---------------------------------------|
| Andi Wijaya                              | Pasien Terpilih                       |
| RM-00123 | 0812xxxx                      | Nama : Andi Wijaya                    |
| Aktif                                    | No RM: RM-00123                       |
|                                          | HP   : 0812xxxx                       |
| Siti Rahma                               |---------------------------------------|
| RM-00124 | 0821xxxx                      | [Buat Appointment]                    |
| Aktif                                    | [Edit Data Pasien]                    |
|                                          | [Pembayaran ke POS]                   |
|----------------------------------------------------------------------------------|
| KALENDER / LIST APPOINTMENT                                                   |
+----------------------------------------------------------------------------------+
```

### POS After Open From Appointment

```text
+----------------------------------------------------------------------------------+
| POS                                                                              |
|----------------------------------------------------------------------------------|
| Pasien Aktif : Andi Wijaya                                                       |
| Sumber       : Appointment                                                       |
|----------------------------------------------------------------------------------|
| Cart: kosong                                                                     |
| Cari dan input product / treatment                                               |
|----------------------------------------------------------------------------------|
| Catatan: harga item otomatis dari master dan tidak bisa diedit manual            |
+----------------------------------------------------------------------------------+
```

## Technical Implementation

### Task 1: Integrasi Appointment Dengan Data Pasien

#### Frontend Goals
- Ganti pengalaman pilih pasien di appointment dari `select` menjadi patient search workflow
- Tambah panel pasien terpilih
- Tambah quick action ke data pasien
- Pastikan create/edit appointment tetap bisa berjalan normal

#### Candidate Changes
- `src/components/ToolbarItem/transaksi/Appointment.jsx`
  - tambah state pasien terpilih
  - tambah state hasil pencarian pasien
  - tambah input search pasien yang lebih spesifik
  - tambah panel hasil pencarian pasien
  - tambah panel detail pasien
  - ubah form appointment agar memakai pasien terpilih, bukan hanya dropdown
- `src/features/master/customer/customer.api.js`
  - evaluasi apakah perlu helper query tambahan untuk search field-spesifik
- `src/components/ToolbarItem/master/Customer.jsx`
  - tidak perlu perubahan besar bila cukup dipakai sebagai tujuan navigasi/edit

#### Interaction Plan
1. User cari pasien dari header appointment
2. Hasil pasien tampil sebagai daftar yang mudah discan
3. User pilih pasien
4. Detail pasien tampil di panel kanan
5. User bisa:
   - buat appointment baru untuk pasien itu
   - edit data pasien
   - buka POS

#### Minimal Navigation Requirement
- Tambah callback atau mekanisme context sederhana untuk membuka tool lain dari appointment
- Navigasi minimal yang dibutuhkan:
  - `Appointment -> Customer`
  - `Appointment -> POS`

### Task 2: Integrasi Appointment Dengan POS

#### Frontend Goals
- Tambah tombol `Pembayaran ke POS` di appointment
- POS menerima selected patient context
- POS menampilkan pasien aktif saat dibuka dari appointment
- Cart tetap kosong
- Harga item tidak bisa diedit manual

#### Candidate Changes
- `src/App.jsx`
  - tambah state navigation/context payload untuk POS
  - izinkan pembukaan POS dari dashboard flow, bukan hanya role cashier
- `src/components/Dashboard/DashboardCanvas.jsx`
  - jika perlu, tambah dukungan open tool / payload
- `src/components/ToolbarItem/transaksi/Appointment.jsx`
  - kirim payload `{ source: 'appointment', customerId }`
- `src/components/POS/POS.jsx`
  - tambah state selected customer
  - baca payload customer dari pembukaan POS
  - tampilkan pasien aktif di header transaksi
  - pastikan cart tetap kosong saat open dari appointment
  - matikan edit manual harga jika masih ada flow yang mengizinkan

#### Sale Model Direction
Walaupun cart dari appointment kosong, model transaksi ke depan tetap perlu mendukung item campuran:
- `product` untuk stockable goods
- `treatment` untuk service

Struktur target item sale:

```json
{
  "item_type": "product",
  "product_id": "PROD001",
  "quantity": 1,
  "unit_price": 100000,
  "cost_price": 75000
}
```

```json
{
  "item_type": "treatment",
  "treatment_id": "TRT001",
  "quantity": 1,
  "unit_price": 150000,
  "cost_price": 0
}
```

Header sale target:

```json
{
  "customer_id": "CUS001",
  "appointment_id": "APT001",
  "warehouse_id": "WH001",
  "cash_drawer_id": "CD001",
  "items": [],
  "payments": []
}
```

---

## Files To Update

### High Priority
- `src/components/ToolbarItem/transaksi/Appointment.jsx`
- `src/App.jsx`
- `src/components/POS/POS.jsx`

### Possible Supporting Files
- `src/components/Dashboard/DashboardCanvas.jsx`
- `src/features/master/customer/customer.api.js`
- `src/features/transaksi/sales/sales.api.js`
- receipt/detail sale files jika sale model berubah

---

## Implementation Order
1. Rapikan requirement state dan payload lintas layar
2. Implement task 1: appointment dengan data pasien
3. Verifikasi UX pencarian, pilih pasien, tambah/edit pasien
4. Implement task 2: appointment ke POS dengan `customer_id`
5. Tambah selected customer di POS
6. Verifikasi cart tetap kosong saat masuk dari appointment
7. Audit dan kunci harga agar tidak editable manual
8. Jalankan lint dan build

---

## Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Appointment menjadi terlalu padat | Pecah layout menjadi area search, detail pasien, dan jadwal |
| Search pasien lambat untuk data besar | Gunakan API search backend, hindari filter frontend-only |
| Navigasi antar tool sulit karena app belum pakai router formal | Tambah navigation payload terpusat di `App.jsx` |
| POS existing terlalu product-centric | Tambah selected customer dulu sebagai perubahan minimum, refactor sale item generic bertahap |
| User mengira tombol pembayaran otomatis mengisi cart | Tampilkan label jelas bahwa POS dibuka dengan pasien aktif dan cart kosong |
| Harga item masih bisa berubah dari path lain | Audit semua entry point perubahan harga dan kunci hanya dari master / promo / tier rule |

---

## Acceptance Criteria
- User bisa mencari pasien dari halaman `Appointment` dengan UX yang lebih jelas
- User bisa memilih pasien dan melihat detail ringkasnya di halaman `Appointment`
- User bisa masuk ke data pasien dari halaman `Appointment`
- User bisa membuka POS dari `Appointment`
- POS terbuka dengan `customer_id` pasien aktif
- Cart POS tetap kosong saat dibuka dari appointment
- Harga item di POS tidak bisa diedit manual
- Flow existing appointment list/calendar tetap usable

---

## Verification Plan
- Uji search pasien dari halaman `Appointment`
- Uji pilih pasien dan tampilkan detail pasien
- Uji tombol `Tambah Pasien`
- Uji tombol `Edit Data Pasien`
- Uji tombol `Pembayaran ke POS`
- Verifikasi POS membuka pasien yang benar
- Verifikasi cart POS kosong
- Verifikasi harga item tidak bisa diedit manual
- Jalankan:
  - `npm run lint`
  - `npm run build`

---

## Next Steps
1. Implement task 1 lebih dulu: integrasi appointment dengan data pasien
2. Setelah stabil, lanjut task 2: integrasi appointment dengan POS
3. Jika backend sudah siap, lanjutkan penyesuaian sale model generic untuk product dan treatment

---

**Created:** 2026-05-06  
**Last Updated:** 2026-05-06
