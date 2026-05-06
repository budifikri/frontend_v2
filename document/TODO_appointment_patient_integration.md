# TODO: Appointment Patient Integration

## Status Legend
- ✅ Completed
- ❌ Pending
- 🔄 In Progress

---

## Documentation
- [✅] Konfirmasi scope tahap 1 fokus ke integrasi data pasien
- [✅] Revisi design: pencarian pasien dipindah ke form `Isi Data Appointment`
- [✅] Buat `document/PLAN_appointment_patient_integration.md`
- [✅] Buat `document/TODO_appointment_patient_integration.md`

---

## Analysis
- [✅] Audit `src/components/ToolbarItem/transaksi/Appointment.jsx`
- [✅] Audit `src/components/ToolbarItem/master/Customer.jsx`
- [✅] Audit `src/features/master/customer/customer.api.js`
- [✅] Konfirmasi bahwa appointment hanya aktif untuk `clinic`
- [✅] Konfirmasi perubahan tahap ini tidak boleh mengganggu retail

---

## UI & UX Tasks
- [✅] Tambah search pasien yang jelas di dalam form `Isi Data Appointment`
- [✅] Tambah placeholder `Cari nama / no RM / NIK / HP`
- [✅] Tampilkan hasil pasien dalam daftar inline di form
- [✅] Tambah state pasien terpilih
- [✅] Tampilkan ringkasan pasien terpilih di form
- [✅] Tambah tombol `Tambah Pasien`
- [✅] Tambah tombol `Edit Data Pasien`
- [✅] Tambah tombol `Filter` pada area pencarian pasien di form

---

## Logic & Data Tasks
- [✅] Hubungkan pencarian pasien ke `listCustomers`
- [✅] Sinkronkan `selectedPatient` dengan `form.patient_id`
- [✅] Pastikan pasien terpilih tetap konsisten saat form dibuka/ditutup
- [✅] Pastikan hasil pencarian inline tidak membuat form terlalu panjang
- [✅] Pastikan create/update/delete appointment existing tidak rusak
- [✅] Pastikan list/calendar appointment existing tetap usable

---

## Navigation Tasks
- [✅] Tambah mekanisme buka data pasien dari appointment
- [✅] Tentukan payload/context jika edit pasien dibuka dari appointment
- [✅] Pastikan alur kembali ke appointment tetap jelas

---

## Retail Safety Tasks
- [✅] Pastikan UI baru hanya berada di form appointment pada tool `Appointment`
- [✅] Pastikan tidak ada perubahan perilaku pada mode `Customer` retail
- [✅] Pastikan tidak ada perubahan pada flow POS retail di tahap ini

---

## Manual Testing
- [❌] Uji buka form `Isi Data Appointment`
- [❌] Uji search pasien dengan nama
- [❌] Uji search pasien dengan no RM
- [❌] Uji search pasien dengan NIK
- [❌] Uji search pasien dengan HP
- [❌] Uji pilih pasien dari hasil pencarian inline
- [❌] Uji ringkasan pasien tampil sesuai
- [❌] Uji tombol `Tambah Pasien`
- [❌] Uji tombol `Edit Data Pasien`
- [❌] Uji create appointment dari pasien terpilih

---

## Verification
- [✅] Jalankan `npm run lint`
- [✅] Jalankan `npm run build`
- [❌] Pastikan tidak ada error runtime pada halaman appointment

---

## Progress Summary

| Category | Total | Completed | Pending | Progress |
|----------|-------|-----------|---------|----------|
| Documentation | 4 | 4 | 0 | 100% |
| Analysis | 5 | 5 | 0 | 100% |
| UI & UX | 8 | 8 | 0 | 100% |
| Logic & Data | 6 | 6 | 0 | 100% |
| Navigation | 3 | 3 | 0 | 100% |
| Retail Safety | 3 | 3 | 0 | 100% |
| Manual Testing | 10 | 0 | 10 | 0% |
| Verification | 3 | 2 | 1 | 67% |
| **Total** | **42** | **31** | **11** | **74%** |

---

**Created:** 2026-05-06  
**Last Updated:** 2026-05-06  
**Overall Progress:** 74%
