# PLAN: Appointment Patient Integration

## Overview
Tahap ini fokus pada integrasi halaman `Appointment` dengan data pasien terlebih dahulu, tanpa masuk ke perubahan POS. Tujuannya adalah memperbaiki pengalaman pemilihan pasien di dalam form `Isi Data Appointment`, tanpa menambah section atau panel baru di halaman utama appointment.

---

## Scope
- Ubah pengalaman pencarian pasien di dalam form `Isi Data Appointment`
- Tambah area pencarian pasien inline di form appointment
- Tambah daftar hasil pencarian pasien di dalam form appointment
- Tambah ringkasan pasien terpilih di dalam form appointment
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
- User klik `Tambah` atau `Edit`
- Di dalam form `Isi Data Appointment`, user melihat area pasien:
  - `[Cari Nama / No RM / NIK / HP...] [Filter] [Tambah Pasien]`
- Hasil pencarian pasien tampil di dalam form yang sama
- User memilih satu pasien
- Form menampilkan ringkasan pasien terpilih
- User melanjutkan isi treatment, therapist, tanggal, dan jam
- Jika pasien belum ada, user bisa klik `Tambah Pasien`

---

## Visual Design Sketch

```text
+----------------------------------------------------------------------------------+
| Isi Data Appointment                                                             |
|----------------------------------------------------------------------------------|
| [Cari Nama / No RM / NIK / HP....................] [Filter] [Tambah Pasien]     |
|----------------------------------------------------------------------------------|
| Hasil Pencarian Pasien                                                           |
| Andi Wijaya        RM-00123     0812xxxx      [Pilih]                            |
| Siti Rahma         RM-00124     0821xxxx      [Pilih]                            |
|----------------------------------------------------------------------------------|
| Pasien Terpilih : Andi Wijaya                                                    |
| Treatment        : [..........................]                                  |
| Therapist        : [..........................]                                  |
| Tanggal          : [..........................]                                  |
| Jam Mulai        : [..........................]                                  |
| Jam Selesai      : [..........................]                                  |
| Notes            : [..........................]                                  |
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
- `showPatientSearchResults` bila diperlukan

#### 2. Patient Search UI
- Pindahkan pencarian pasien ke dalam form `Isi Data Appointment`
- Ganti field pasien dari `select` sederhana menjadi kombinasi:
  - search input
  - tombol `Filter`
  - tombol `Tambah Pasien`
- Hasil pencarian tampil inline di bawah area search
- Batasi hasil yang tampil agar form tidak terlalu tinggi

#### 3. Patient Selection
- Saat user klik pasien dari hasil pencarian:
  - set `selectedPatient`
  - sinkronkan ke `form.patient_id`
  - tampilkan ringkasan pasien terpilih di dalam form

#### 4. Patient Actions
- Tambah tombol `Tambah Pasien`
- Tambah tombol `Edit Data Pasien`
- Jika user masuk ke form appointment baru, pasien terpilih tetap menjadi context utama
- Jangan menambah panel baru di halaman utama `Appointment`

#### 5. Customer API Reuse
- Reuse `listCustomers(token, { search })`
- Jika perlu, tambahkan helper kecil untuk normalisasi hasil pencarian
- Hindari perubahan besar pada kontrak API bila belum perlu

---

## Interaction Flow
1. User buka `Appointment`
2. User klik `Tambah` atau `Edit` appointment
3. Form `Isi Data Appointment` terbuka
4. User cari pasien di area search form
5. Hasil pasien tampil di dalam form yang sama
6. User pilih pasien
7. Ringkasan pasien tampil di form
8. User melanjutkan pengisian appointment

---

## Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Form appointment terlalu padat | Batasi hasil pencarian pasien dan tampilkan ringkasan pasien secara ringkas |
| Search pasien berat jika data besar | Gunakan search via API, bukan filter frontend-only |
| Sinkronisasi pasien dengan form appointment membingungkan | Jadikan `selectedPatient` sebagai source utama untuk `patient_id` |
| Perubahan mengganggu retail | Batasi perubahan pada tool `Appointment` yang clinic-only |

---

## Acceptance Criteria
- User bisa mencari pasien dari dalam form `Isi Data Appointment`
- User bisa memilih pasien dan melihat ringkasan pasien terpilih di form
- User bisa menambah pasien dari konteks appointment
- User bisa membuka data pasien dari appointment
- Form appointment jelas memakai pasien yang sedang dipilih
- Flow existing list/calendar appointment tetap usable
- Retail tidak terdampak karena perubahan hanya aktif pada tool `Appointment`

---

## Verification Plan
- Uji buka form `Isi Data Appointment`
- Uji search pasien dengan nama
- Uji search pasien dengan no RM
- Uji search pasien dengan NIK
- Uji search pasien dengan HP
- Uji pilih pasien dari hasil pencarian inline
- Uji ringkasan pasien tampil benar di form
- Uji create appointment dengan pasien terpilih
- Jalankan:
  - `npm run lint`
  - `npm run build`

---

## Design Note
- Revisi design ini menggantikan pendekatan panel pasien di halaman utama appointment
- Pendekatan yang dipakai sekarang: patient search inline di form `Isi Data Appointment`
- Tujuannya agar UI tetap fokus, ringkas, dan tidak menambah layout baru pada halaman utama

---

## Next Steps
1. Implementasi task ini terlebih dahulu
2. Setelah stabil, baru lanjut ke integrasi appointment dengan POS

---

**Created:** 2026-05-06  
**Last Updated:** 2026-05-06
