# TODO: Appoinment Calendar Dashboard

## Status Legend
- ✅ Completed
- ❌ Pending
- 🔄 In Progress

---

## Analysis & Preparation
- [✅] Identifikasi komponen appointment existing di `src/components/ToolbarItem/transaksi/Appointment.jsx`
- [✅] Cek integrasi tool `appointment` di `DashboardCanvas.jsx`
- [✅] Cek API frontend `appointment.api.js`
- [✅] Cek backend filter `date_from` dan `date_to`
- [✅] Konfirmasi kebutuhan UX: kalender menjadi toggle di halaman `Appointment` yang sama
- [✅] Konfirmasi kebutuhan header: tambahkan icon kalender di `master-header`
- [✅] Konfirmasi UX filter `Date` disabled saat `Calendar View` dengan tooltip dan helper text
- [✅] Konfirmasi cell kalender tanpa preview item, hanya count dan indikator status

---

## Documentation Tasks
- [✅] Buat `document/PLAN_appoinment_calendar.md`
- [✅] Buat `document/TODO_appoinment_calendar.md`

---

## Frontend Implementation Tasks

### Appointment View Mode
- [❌] Tambah state `viewMode` di `Appointment.jsx`
- [❌] Set default mode ke `list`
- [❌] Tambah icon toggle `view_list` dan `calendar_month` di `master-header`
- [❌] Tambah handler untuk switch mode list/calendar
- [❌] Disable filter `Date` saat mode `calendar`
- [❌] Tambah tooltip pada filter `Date`: `Date mengikuti bulan kalender`
- [❌] Tambah helper text kecil saat mode `calendar`

### Calendar State & Helpers
- [❌] Tambah state `calendarMonth`
- [❌] Tambah state `selectedCalendarDate`
- [❌] Tambah helper untuk hitung awal dan akhir bulan aktif
- [❌] Tambah helper untuk generate grid tanggal bulanan
- [❌] Tambah helper untuk group appointment per `booking_date`

### Calendar Data Fetching
- [❌] Tambah fetch khusus calendar berdasarkan bulan aktif
- [❌] Gunakan `date_from` dan `date_to` untuk range bulan
- [❌] Set `limit` besar agar semua appointment di bulan aktif termuat
- [❌] Pisahkan loading state calendar dari loading state list bila diperlukan

### Calendar UI
- [❌] Render navigation bulan sebelumnya dan berikutnya
- [❌] Render nama bulan dan tahun aktif
- [❌] Render header hari `Su Mo Tu We Th Fr Sa`
- [❌] Render cell kalender 7 kolom
- [❌] Tampilkan nomor tanggal pada setiap cell
- [❌] Tampilkan jumlah appointment per tanggal
- [❌] Tampilkan indikator warna berdasarkan status
- [❌] Highlight tanggal aktif yang dipilih
- [❌] Pastikan cell tidak menampilkan preview item appointment agar tidak penuh

### Appointment Detail Panel
- [❌] Tampilkan daftar appointment untuk tanggal terpilih
- [❌] Tampilkan field minimal: jam, patient, treatment, therapist, status
- [❌] Tampilkan empty state bila tidak ada appointment pada tanggal terpilih

### Existing List Protection
- [❌] Pastikan tabel existing tetap tampil normal saat mode `list`
- [❌] Pastikan CRUD existing tidak terganggu
- [❌] Pastikan sorting existing tidak terganggu
- [❌] Pastikan pagination existing tidak terganggu

### Styling
- [❌] Tambah class CSS spesifik untuk calendar appointment
- [❌] Rapikan spacing header agar icon toggle tidak bertabrakan dengan filter
- [❌] Buat layout calendar + detail panel yang rapi di desktop
- [❌] Tambah responsive behavior untuk mobile/tablet
- [❌] Buat style disabled yang jelas untuk filter `Date`
- [❌] Buat style tooltip/helper text untuk mode kalender

---

## Manual Testing Tasks
- [❌] Buka halaman `Appointment`
- [❌] Verifikasi icon toggle tampil di header
- [❌] Verifikasi default view adalah `List`
- [❌] Klik icon kalender dan verifikasi view berubah ke `Calendar`
- [❌] Verifikasi filter `Date` disabled saat mode `Calendar`
- [❌] Verifikasi tooltip `Date mengikuti bulan kalender`
- [❌] Verifikasi helper text `Date mengikuti bulan kalender`
- [❌] Verifikasi data appointment tampil pada tanggal yang sesuai
- [❌] Klik tanggal dengan appointment dan cek panel detail
- [❌] Klik tanggal kosong dan cek empty state
- [❌] Uji navigasi bulan sebelumnya/berikutnya
- [❌] Uji filter status saat mode kalender
- [❌] Uji kembali mode `List` setelah pindah dari `Calendar`

---

## Verification Tasks
- [❌] Jalankan `npm run lint`
- [❌] Jalankan `npm run build`
- [❌] Pastikan tidak ada error runtime pada halaman `Appointment`

---

## Risiko & Mitigasi
- [❌] Risiko pagination API membuat data kalender tidak lengkap
  Mitigasi: gunakan fetch khusus kalender dengan `limit` besar pada range bulan aktif

- [❌] Risiko tampilan kalender terlalu padat saat appointment banyak
  Mitigasi: jangan tampilkan preview item di cell, gunakan count dan indikator status saja

- [❌] Risiko state list bercampur dengan state calendar
  Mitigasi: pisahkan state `viewMode`, `calendarMonth`, dan `selectedCalendarDate`

- [❌] Risiko header terlalu penuh
  Mitigasi: gunakan icon-only toggle yang ringkas

- [❌] Risiko user bingung karena filter `Date` nonaktif saat mode kalender
  Mitigasi: tampilkan tooltip dan helper text `Date mengikuti bulan kalender`

---

## Progress Summary

| Category | Total | Completed | Pending | Progress |
|----------|-------|-----------|---------|----------|
| Analysis | 8 | 8 | 0 | 100% |
| Documentation | 2 | 2 | 0 | 100% |
| View Mode | 7 | 0 | 7 | 0% |
| Calendar Helpers | 5 | 0 | 5 | 0% |
| Calendar Fetching | 4 | 0 | 4 | 0% |
| Calendar UI | 8 | 0 | 8 | 0% |
| Detail Panel | 3 | 0 | 3 | 0% |
| Existing List Safety | 4 | 0 | 4 | 0% |
| Styling | 6 | 0 | 6 | 0% |
| Manual Testing | 13 | 0 | 13 | 0% |
| Verification | 3 | 0 | 3 | 0% |
| **Total** | **63** | **10** | **53** | **16%** |

---

**Created:** 2026-05-05  
**Last Updated:** 2026-05-05  
**Overall Progress:** 16%
