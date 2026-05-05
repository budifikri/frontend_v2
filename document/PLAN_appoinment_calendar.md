# PLAN: Appoinment Calendar Dashboard

## Overview
Implementasi dashboard kalender pada halaman `Appointment` untuk memudahkan monitoring jadwal clinic tanpa membuat menu baru. Fitur ini tetap berada di tool `Appointment` yang sudah ada, dengan tambahan toggle icon kalender pada `master-header` untuk berpindah antara mode `List` dan `Calendar`.

---

## Scope
- Tambah icon kalender pada header `Appointment`
- Tambah mode tampilan `Calendar` di halaman `Appointment`
- Pertahankan mode `List` existing
- Tampilkan kalender bulanan untuk monitoring appointment
- Tampilkan detail appointment berdasarkan tanggal yang dipilih
- Gunakan filter date preset yang sudah disamakan dengan pola `Purchase`

---

## Current Condition

### Frontend Existing
- **File utama:** `src/components/ToolbarItem/transaksi/Appointment.jsx`
- `Appointment` sudah punya:
  - tabel list appointment
  - filter search
  - filter status
  - form create/update/delete
  - pagination dan sorting
- Tool sudah terhubung ke dashboard melalui:
  - `src/components/Dashboard/DashboardCanvas.jsx`
  - `src/data/toolbarItems.js`

### API Existing
- **Frontend API:** `src/features/transaksi/appointment/appointment.api.js`
- **Endpoint:** `/api/appointments`
- Filter yang sudah tersedia:
  - `date_from`
  - `date_to`
  - `status`
  - `therapist_id`
  - `patient_id`

### Backend Existing
- **Handler:** `go_backend/internal/handlers/appointment_handler.go`
- **Repository:** `go_backend/internal/repository/appointment_repository.go`
- Backend sudah mendukung filtering range tanggal berdasarkan `booking_date`

---

## Target UX

### Header Behavior
- Tambahkan icon toggle view di area `master-header`
- Icon yang digunakan:
  - `view_list`
  - `calendar_month`
- Default mode: `List`
- User dapat berpindah cepat antara tampilan tabel dan kalender
- Saat mode `Calendar` aktif, filter `Date` dalam keadaan disabled
- Tambahkan tooltip dan helper text: `Date mengikuti bulan kalender`

### Calendar Behavior
- Kalender menggunakan tampilan bulanan
- Setiap kotak tanggal menampilkan:
  - nomor tanggal
  - jumlah appointment
  - indikator warna status
- Klik tanggal akan menampilkan detail appointment pada panel samping atau panel bawah
- Navigasi bulan tersedia untuk pindah bulan sebelumnya/berikutnya

### List Behavior
- Tabel existing tetap dipertahankan
- Filter date preset existing tetap dipakai untuk list
- Tidak mengubah alur CRUD appointment yang sekarang

---

## Visual Design Sketch

```text
+----------------------------------------------------------------------------------+
| Appointment                                             [view_list] [calendar]  |
| [ Search........ ] [ Date v ] [ Status v ]                                  |
|                    Date mengikuti bulan kalender                              |
+----------------------------------------------------------------------------------+

Mode Calendar
+---------------------------------------------+----------------------------------+
| < Mei 2026 >                                | Appointment Tanggal Terpilih      |
| Su  Mo  Tu  We  Th  Fr  Sa                  | 06/05/2026                        |
|              1   2   3                      | 08:00  Ani - Facial               |
|  4   5  [6]  7   8   9  10                 | 10:00  Budi - Therapy             |
|        5 appt   ● ● ●                       | 13:00  Citra - Consultation       |
| 11  12  13  14  15  16  17                 |                                    |
| 18  19  20  21  22  23  24                 | Status badge / warna              |
| 25  26  27  28  29  30  31                 | scheduled / confirmed / complete  |
+---------------------------------------------+----------------------------------+

Mode List
+----------------------------------------------------------------------------------+
| tabel appointment existing                                                       |
+----------------------------------------------------------------------------------+
```

## Technical Implementation

### 1. Component State
Tambahan state di `Appointment.jsx`:
- `viewMode` untuk `list | calendar`
- `calendarMonth` untuk bulan aktif kalender
- `selectedCalendarDate` untuk tanggal yang dipilih
- `calendarData` jika data kalender perlu dipisahkan dari data list
- `isCalendarLoading` bila fetch kalender dipisahkan

### 2. Date Range Helper
- Buat helper range tanggal untuk kalender bulanan:
  - awal bulan aktif
  - akhir bulan aktif
- Tetap gunakan format `YYYY-MM-DD`

### 3. Data Fetching Strategy
- `List` mode:
  - tetap gunakan fetch existing dan pagination existing
- `Calendar` mode:
  - fetch appointment berdasarkan range bulan aktif
  - gunakan `date_from` dan `date_to`
  - gunakan `limit` yang cukup besar agar semua data bulan aktif termuat

### 4. Calendar Rendering
- Bangun grid 7 kolom untuk hari dalam seminggu
- Isi cell mengikuti posisi hari pertama dalam bulan
- Kelompokkan appointment per `booking_date`
- Render jumlah appointment per tanggal
- Render indikator warna status per tanggal
- Jangan tampilkan preview item appointment di dalam cell agar kalender tetap mudah dibaca

### 5. Selected Day Detail
- Setelah user klik tanggal, tampilkan daftar appointment pada tanggal tersebut
- Informasi minimal:
  - jam
  - nama patient
  - treatment
  - therapist
  - status

### 6. Styling
- Tambah class baru di CSS existing atau inline pattern yang konsisten
- Ikuti visual language existing `master-*`
- Pastikan layout tetap rapi di desktop dan mobile
- Saat mode `Calendar`, filter `Date` punya visual disabled yang jelas
- Tambahkan tooltip dan helper text kecil untuk menjelaskan bahwa range tanggal mengikuti bulan kalender

---

## Files To Update
- `src/components/ToolbarItem/transaksi/Appointment.jsx`
- `src/App.css` atau file style terkait jika class baru dibutuhkan

---

## Data Flow Plan
1. User membuka halaman `Appointment`
2. Default tampil mode `List`
3. User klik icon kalender
4. Component ubah `viewMode` ke `calendar`
5. System fetch data appointment untuk bulan aktif
6. Appointment dikelompokkan berdasarkan `booking_date`
7. User klik salah satu tanggal
8. Panel detail menampilkan appointment untuk tanggal tersebut

---

## Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Data kalender tidak lengkap karena pagination API | Saat mode kalender gunakan `limit` besar khusus untuk range bulan aktif |
| State list dan calendar saling mengganggu | Pisahkan state `viewMode`, `calendarMonth`, dan `selectedCalendarDate` dari state list |
| Header menjadi terlalu padat | Gunakan icon-only toggle yang ringkas di sisi kanan header |
| User bingung karena filter `Date` disabled saat mode kalender | Tambahkan tooltip dan helper text `Date mengikuti bulan kalender` |
| Cell kalender terlalu penuh jika jadwal padat | Jangan tampilkan preview item di cell, cukup count dan indikator status |
| Perubahan CSS memengaruhi layar lain | Pakai class baru yang spesifik untuk appointment calendar |

---

## Acceptance Criteria
- Halaman `Appointment` memiliki icon toggle list dan calendar di header
- Mode `List` existing tetap berjalan normal
- Mode `Calendar` menampilkan grid kalender bulanan
- Filter `Date` disabled saat mode `Calendar` dan menampilkan tooltip/helper text yang jelas
- Data appointment tampil sesuai tanggal `booking_date`
- Klik tanggal menampilkan detail appointment tanggal tersebut
- Filter status tetap berpengaruh pada data yang dimonitor
- Layout tetap usable pada desktop dan mobile

---

## Verification Plan
- Buka menu `Appointment`
- Pastikan header menampilkan icon toggle
- Uji perpindahan `List` ke `Calendar`
- Uji filter `Date` disabled saat mode kalender
- Uji tooltip dan helper text pada filter `Date`
- Uji navigasi bulan sebelumnya dan berikutnya
- Uji klik tanggal yang memiliki appointment
- Uji klik tanggal kosong
- Uji filter status saat mode kalender
- Jalankan:
  - `npm run lint`
  - `npm run build`

---

## Next Steps
1. Tambah state dan header toggle icon di `Appointment.jsx`
2. Tambah helper tanggal dan fetch data kalender
3. Render monthly calendar dashboard
4. Tambah panel detail appointment per tanggal
5. Rapikan styling responsive
6. Jalankan lint dan build

---

**Created:** 2026-05-05  
**Last Updated:** 2026-05-05  
**Status:** Planned
