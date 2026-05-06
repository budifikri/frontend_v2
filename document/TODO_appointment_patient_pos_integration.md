# TODO: Appointment Patient POS Integration

## Status Legend
- ✅ Completed
- ❌ Pending
- 🔄 In Progress

---

## Documentation Tasks
- [✅] Konfirmasi kebutuhan utama dengan user
- [✅] Ringkas scope menjadi 2 task utama
- [✅] Buat `document/PLAN_appointment_patient_pos_integration.md`
- [✅] Buat `document/TODO_appointment_patient_pos_integration.md`

---

## Task 1: Integrasi Appointment Dengan Data Pasien

### Analysis
- [✅] Audit `Appointment.jsx`
- [✅] Audit `Customer.jsx`
- [✅] Audit `customer.api.js`
- [✅] Konfirmasi kebutuhan patient-centric appointment

### UI & UX
- [❌] Tambah area search pasien yang lebih jelas di header appointment
- [❌] Tambah dukungan keyword nama / no RM / NIK / HP
- [❌] Tampilkan hasil pencarian pasien dalam daftar/panel
- [❌] Tambah state pasien terpilih di appointment
- [❌] Tampilkan panel detail pasien terpilih
- [❌] Tambah tombol `Tambah Pasien`
- [❌] Tambah tombol `Edit Data Pasien`
- [❌] Pastikan form appointment memakai pasien terpilih dengan jelas

### Logic & Data
- [❌] Hubungkan search appointment ke API pasien existing
- [❌] Evaluasi apakah perlu query helper tambahan di `customer.api.js`
- [❌] Pastikan patient selection sinkron dengan form appointment
- [❌] Pastikan flow create/edit/delete appointment existing tidak rusak
- [❌] Pastikan calendar/list existing tetap usable

### Navigation
- [❌] Tambah mekanisme buka modul pasien dari appointment
- [❌] Tentukan payload/context saat pindah ke data pasien
- [❌] Pastikan ada alur kembali yang jelas ke appointment

### Manual Testing Task 1
- [❌] Uji search pasien dengan nama
- [❌] Uji search pasien dengan no RM
- [❌] Uji search pasien dengan NIK
- [❌] Uji search pasien dengan HP
- [❌] Uji pilih pasien dari hasil pencarian
- [❌] Uji panel detail pasien
- [❌] Uji tombol `Tambah Pasien`
- [❌] Uji tombol `Edit Data Pasien`
- [❌] Uji create appointment setelah pasien dipilih

---

## Task 2: Integrasi Appointment Dengan POS

### Analysis
- [✅] Audit `POS.jsx`
- [✅] Audit `sales.api.js`
- [✅] Konfirmasi bahwa POS dibuka hanya membawa `customer_id`
- [✅] Konfirmasi cart harus kosong saat POS dibuka dari appointment
- [✅] Konfirmasi harga item tidak bisa diedit di POS

### Navigation & Context
- [❌] Tambah tombol `Pembayaran ke POS` di appointment
- [❌] Tambah payload navigation `{ source: 'appointment', customerId }`
- [❌] Tambah state payload POS di `App.jsx`
- [❌] Pastikan POS bisa dibuka dari dashboard flow

### POS State
- [❌] Tambah selected customer/patient state di POS
- [❌] Baca payload customer saat POS dibuka dari appointment
- [❌] Tampilkan pasien aktif di header POS
- [❌] Pastikan cart tetap kosong saat open from appointment
- [❌] Tambah opsi ganti/lepas pasien bila diperlukan

### POS Pricing Rules
- [❌] Audit semua path edit manual harga di POS
- [❌] Nonaktifkan edit manual harga item
- [❌] Pastikan harga hanya berasal dari master / promo / tier

### Sale Payload Direction
- [❌] Tambah dukungan `customer_id` pada payload sale frontend
- [❌] Evaluasi kebutuhan dukungan `appointment_id` untuk fase berikutnya
- [❌] Siapkan arah sale item generic untuk `product` dan `treatment`

### Manual Testing Task 2
- [❌] Uji buka POS dari appointment
- [❌] Verifikasi pasien aktif sesuai customer yang dipilih
- [❌] Verifikasi cart kosong saat POS terbuka
- [❌] Tambah item manual di POS dan cek harga tidak editable
- [❌] Uji checkout dengan customer terpilih

---

## Verification Tasks
- [❌] Jalankan `npm run lint`
- [❌] Jalankan `npm run build`
- [❌] Pastikan tidak ada error runtime pada appointment flow
- [❌] Pastikan tidak ada error runtime pada POS flow

---

## Risiko & Mitigasi
- [❌] Risiko UI appointment terlalu kompleks
  Mitigasi: buat layout 3 area yang jelas dan tidak menumpuk semua aksi di form

- [❌] Risiko search pasien berat jika data besar
  Mitigasi: gunakan API pasien, bukan filter frontend-only

- [❌] Risiko POS sulit menerima context dari dashboard
  Mitigasi: simpan navigation payload terpusat di `App.jsx`

- [❌] Risiko asumsi item POS masih selalu product
  Mitigasi: lakukan perubahan minimum dulu pada selected customer, lalu lanjut ke sale item generic bertahap

- [❌] Risiko user salah paham bahwa klik pembayaran akan auto isi cart
  Mitigasi: tampilkan penanda visual bahwa POS dibuka dengan pasien aktif dan cart kosong

---

## Progress Summary

| Category | Total | Completed | Pending | Progress |
|----------|-------|-----------|---------|----------|
| Documentation | 4 | 4 | 0 | 100% |
| Task 1 Analysis | 4 | 4 | 0 | 100% |
| Task 1 UI & UX | 8 | 0 | 8 | 0% |
| Task 1 Logic & Data | 5 | 0 | 5 | 0% |
| Task 1 Navigation | 3 | 0 | 3 | 0% |
| Task 1 Testing | 9 | 0 | 9 | 0% |
| Task 2 Analysis | 5 | 5 | 0 | 100% |
| Task 2 Navigation & Context | 4 | 0 | 4 | 0% |
| Task 2 POS State | 5 | 0 | 5 | 0% |
| Task 2 Pricing Rules | 3 | 0 | 3 | 0% |
| Task 2 Sale Direction | 3 | 0 | 3 | 0% |
| Task 2 Testing | 5 | 0 | 5 | 0% |
| Verification | 4 | 0 | 4 | 0% |
| **Total** | **62** | **13** | **49** | **21%** |

---

**Created:** 2026-05-06  
**Last Updated:** 2026-05-06  
**Overall Progress:** 21%
