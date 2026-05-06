# PLAN: Appointment Patient Integration

## Overview
Tahap ini fokus pada integrasi halaman `Appointment` dengan data pasien terlebih dahulu, tanpa masuk ke perubahan POS. Tujuannya adalah menjadikan `Appointment` lebih patient-centric agar user bisa mencari, memilih, menambah, dan membuka data pasien dari satu workspace yang sama.

---

## Scope
- Ubah pengalaman pencarian pasien di `Appointment`
- Tambah panel hasil pencarian pasien
- Tambah panel detail pasien terpilih
- Hubungkan `Appointment` ke data pasien existing di modul `Customer`
- Tambah aksi `Tambah Pasien`
- Tambah aksi `Edit Data Pasien`
- Pastikan CRUD appointment existing tetap berjalan
- Jaga agar perubahan tidak mengganggu business type `retail`

---

## Current Condition

### Appointment Existing
- File utama: `src/components/ToolbarItem/transaksi/Appointment.jsx`
- Sudah memiliki:
  - list view
  - calendar view
  - CRUD appointment
  - filter search umum
  - filter status dan tanggal
- Pemilihan pasien masih memakai `select` biasa di form appointment

### Patient Existing
- File utama: `src/components/ToolbarItem/master/Customer.jsx`
- Untuk `clinic`, modul `Customer` berfungsi sebagai data pasien
- API existing tersedia di `src/features/master/customer/customer.api.js`
- Search customer sudah tersedia, tetapi belum dipakai sebagai workflow pencarian pasien di appointment

### Business Type Safety
- Menu `Appointment` hanya aktif untuk `clinic`
- Flow `retail` tidak menampilkan appointment
- Karena itu perubahan utama di tahap ini harus dibatasi pada tool `Appointment` dan tidak mengubah behavior `Customer` untuk retail

---

## Target UX
- User membuka `Appointment`
- User mencari pasien berdasarkan:
  - nama
  - no RM
  - NIK
  - HP
- Hasil pencarian tampil sebagai daftar yang mudah discan
- User memilih satu pasien
- Detail pasien tampil di panel kanan
- Dari panel itu user bisa:
  - buat appointment
  - edit data pasien
  - tambah pasien baru jika belum ada

---

## Visual Design Sketch

```text
+----------------------------------------------------------------------------------+
| Appointment Workspace                                                            |
|----------------------------------------------------------------------------------|
| [Cari Nama / No RM / NIK / HP....................] [Filter] [Tambah Pasien]     |
| [Status Appointment] [Dokter] [Tanggal]                                          |
|----------------------------------------------------------------------------------|
| HASIL PASIEN                             | DETAIL PASIEN                         |
|------------------------------------------|---------------------------------------|
| Andi Wijaya                              | Nama : Andi Wijaya                    |
| RM-00123 | 0812xxxx                      | No RM: RM-00123                       |
| Aktif                                    | HP   : 0812xxxx                       |
|                                          | Alergi: -                             |
| Siti Rahma                               |---------------------------------------|
| RM-00124 | 0821xxxx                      | [Buat Appointment]                    |
| Aktif                                    | [Edit Data Pasien]                    |
|                                          | [Refresh Data Pasien]                 |
|----------------------------------------------------------------------------------|
| KALENDER / LIST APPOINTMENT                                                    |
+----------------------------------------------------------------------------------+
```

## Technical Implementation

### Files To Update
- `src/components/ToolbarItem/transaksi/Appointment.jsx`
- `src/features/master/customer/customer.api.js`
- `src/App.jsx` hanya jika dibutuhkan untuk navigasi buka tool pasien
- `src/components/Dashboard/DashboardCanvas.jsx` hanya jika dibutuhkan untuk open tool flow

### Frontend Changes

#### 1. Patient Search State
Tambahkan state baru di `Appointment.jsx`:
- `patientSearchKeyword`
- `patientResults`
- `selectedPatient`
- `isPatientLoading`
- `patientSearchMode` bila diperlukan

#### 2. Patient Search UI
- Tambah search bar pasien yang lebih eksplisit di header appointment
- Gunakan placeholder yang jelas: `Cari nama / no RM / NIK / HP`
- Hasil pencarian tampil di panel daftar, bukan `select` panjang

#### 3. Patient Selection
- Saat user klik pasien dari hasil pencarian:
  - set `selectedPatient`
  - sinkronkan ke `form.patient_id`
  - tampilkan detail pasien di panel kanan

#### 4. Patient Actions
- Tambah tombol `Tambah Pasien`
- Tambah tombol `Edit Data Pasien`
- Jika user masuk ke form appointment baru, pasien terpilih tetap menjadi context utama

#### 5. Customer API Reuse
- Reuse `listCustomers(token, { search })`
- Jika perlu, tambahkan helper kecil untuk normalisasi hasil pencarian
- Hindari perubahan besar pada kontrak API bila belum perlu

---

## Interaction Flow
1. User buka `Appointment`
2. User cari pasien
3. Hasil pasien tampil di panel kiri
4. User pilih pasien
5. Detail pasien tampil di panel kanan
6. User klik `Buat Appointment` atau `Edit Data Pasien`

---

## Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| UI appointment terlalu padat | Pecah menjadi panel search, detail pasien, dan area jadwal |
| Search pasien berat jika data besar | Gunakan search via API, bukan filter frontend-only |
| Sinkronisasi pasien dengan form appointment membingungkan | Jadikan `selectedPatient` sebagai source utama untuk `patient_id` |
| Perubahan mengganggu retail | Batasi perubahan pada tool `Appointment` yang clinic-only |

---

## Acceptance Criteria
- User bisa mencari pasien dari halaman `Appointment`
- User bisa memilih pasien dan melihat detail ringkasnya
- User bisa menambah pasien dari konteks appointment
- User bisa membuka data pasien dari appointment
- Form appointment jelas memakai pasien yang sedang dipilih
- Flow existing list/calendar appointment tetap usable
- Retail tidak terdampak karena perubahan hanya aktif pada tool `Appointment`

---

## Verification Plan
- Uji search pasien dengan nama
- Uji search pasien dengan no RM
- Uji search pasien dengan NIK
- Uji search pasien dengan HP
- Uji pilih pasien
- Uji detail pasien tampil benar
- Uji create appointment dengan pasien terpilih
- Jalankan:
  - `npm run lint`
  - `npm run build`

---

## Next Steps
1. Implementasi task ini terlebih dahulu
2. Setelah stabil, baru lanjut ke integrasi appointment dengan POS

---

**Created:** 2026-05-06  
**Last Updated:** 2026-05-06
