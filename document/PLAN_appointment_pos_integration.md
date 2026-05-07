# PLAN: Appointment POS Integration

## Overview
Tahap ini fokus pada integrasi `Appointment` dengan `POS` setelah integrasi data pasien stabil. Scope plan diperluas agar `Appointment` dapat menyimpan relasi ke invoice melalui field `sales_id`, lalu membuka `POS` dengan context clinic yang aman, tanpa mengganggu logic business type `retail`.

---

## Scope
- Tambah field `sales_id` pada model `Appointment`
- Tambah migration / schema update backend untuk kolom `sales_id`
- Tambah aksi `Pembayaran ke POS` dari `Appointment`
- Gunakan label aksi `Bayar` pada appointment clinic
- Buka `POS` dengan membawa `customer_id` dan `appointment_id`
- POS dibuka dengan cart kosong jika belum ada draft appointment
- Tambah selected patient di POS
- Siapkan `single POS + clinic mode/context`
- Pastikan retail tetap berjalan dengan flow existing
- Siapkan arah item POS dari `product` dan `treatment`
- Pastikan harga item tidak bisa diedit manual
- Link hasil checkout sale kembali ke `appointment.sales_id`
- Autosave draft cart POS ke local storage per appointment
- Restore draft POS saat appointment yang sama dibuka lagi
- Hapus draft local yang terkait setelah transaksi final tersimpan di database

---

## Confirmed Decisions
- `Appointment` perlu menyimpan `sales_id`
- Perubahan mencakup frontend dan backend
- Masuk ke POS dari appointment membawa `customer_id` dan `appointment_id`
- CTA di appointment menggunakan label `Bayar`
- Close POS dari flow clinic appointment harus kembali ke appointment
- Draft POS clinic disimpan sementara di local storage per appointment
- Draft lokal dihapus saat transaksi final tersimpan di database
- Cart POS kosong hanya jika belum ada draft appointment
- Harga item tidak bisa diedit manual di POS
- `single POS + clinic mode/context`
- Logic retail tidak boleh terganggu

---

## Current Condition
- `POS` berada di `src/components/POS/POS.jsx`
- `App.jsx` membuka POS lewat `view === 'pos'`
- POS saat ini product-centric
- Checkout payload saat ini masih berbasis `product_id`
- Retail menggunakan POS yang sama, sehingga perubahan harus optional dan guarded
- Model backend `Appointment` saat ini belum memiliki field `sales_id`
- API appointment frontend saat ini belum mengirim atau membaca relasi sale
- Flow close POS saat ini masih dekat dengan flow logout / close drawer
- Belum ada mekanisme autosave draft POS per appointment di local storage

---

## Target UX
- User memilih appointment
- User klik `Bayar`
- POS terbuka dengan label pasien aktif dan sumber dari appointment
- POS memulihkan draft jika appointment yang sama pernah ditutup sebelum checkout
- Jika belum ada draft, cart tetap kosong
- User bisa tambah item dari product, dan untuk clinic juga dari treatment
- Harga item mengikuti master dan tidak bisa diubah manual
- Jika POS ditutup dari flow clinic, draft disimpan lalu user kembali ke appointment
- Setelah checkout berhasil, sale terhubung ke appointment
- Setelah transaksi final tersimpan di database, draft local untuk appointment itu dihapus
- Appointment menampilkan bahwa invoice sudah terhubung
- Retail tetap melihat flow POS normal tanpa elemen clinic tambahan

---

## Visual Design Sketch

```text
+----------------------------------------------------------------------------------+
| POS                                                                              |
|----------------------------------------------------------------------------------|
| Pasien Aktif : Andi Wijaya                                                       |
| Sumber       : Appointment APT-0001                                              |
| Status       : Belum ada invoice                                                 |
| Draft        : Tersimpan otomatis per appointment                                |
|----------------------------------------------------------------------------------|
| Cari item: bisa product, dan khusus clinic bisa treatment                        |
|----------------------------------------------------------------------------------|
| Cart: kosong / restore draft appointment                                         |
|----------------------------------------------------------------------------------|
| Catatan: harga item mengikuti master, tidak bisa diedit manual                   |
+----------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------+
| Appointment                                                                      |
|----------------------------------------------------------------------------------|
| Pasien : Andi Wijaya              Status : Completed                             |
| Treatment : Facial Glow           Therapist : dr. Sinta                          |
| Invoice : Belum dibuat            [Bayar]                                        |
+----------------------------------------------------------------------------------+
```

## Technical Implementation

### Files To Update

#### Frontend
- `src/App.jsx`
- `src/components/POS/POS.jsx`
- `src/components/POS/POS.css`
- `src/components/ToolbarItem/transaksi/Appointment.jsx`
- `src/features/transaksi/appointment/appointment.api.js`
- `src/features/transaksi/sales/sales.api.js`

#### Backend
- `D:\Project\pos_retail\go_backend\internal\models\appointment.go`
- `D:\Project\pos_retail\go_backend\internal\database\database.go`
- `D:\Project\pos_retail\go_backend\internal\repository\appointment_repository.go`
- `D:\Project\pos_retail\go_backend\internal\services\appointment_service.go`
- handler / request file appointment terkait endpoint update atau link sale

### Backend Changes

#### 1. Appointment Model
Tambahkan field nullable:

```go
SalesID *uuid.UUID `gorm:"type:uuid;index" json:"sales_id"`
```

Jika diperlukan relation:

```go
Sale *Sale `gorm:"foreignKey:SalesID;references:ID" json:"sale,omitempty"`
```

#### 2. Database / Migration
- Tambah ensure column `sales_id` pada tabel `appointments`
- Jika pola project menggunakan helper migration incremental, ikuti pola yang sudah ada
- Tambahkan foreign key ke tabel `sales` bila aman dengan struktur backend saat ini

#### 3. Repository & Service
- Pastikan create / get / update appointment membaca `sales_id`
- Tambah method untuk update relasi `sales_id` setelah sale berhasil dibuat
- Jika response appointment dipakai frontend, sertakan `sales_id`

#### 4. Endpoint Strategy
Opsi implementasi minimal yang disarankan:
- tetap gunakan `PUT /api/appointments/:id` untuk update `sales_id`

Alternatif bila ingin lebih eksplisit:
- tambah endpoint khusus `POST /api/appointments/:id/link-sale`

Preferensi implementasi: pilih diff terkecil yang paling sesuai dengan pola backend yang sudah ada.

### Frontend Changes

#### 1. POS Context
Tambahkan payload/context opsional:

```js
{
  source: 'appointment',
  businessType: 'clinic',
  customerId: 'CUS001',
  appointmentId: 'APT001',
  customerName: 'Andi Wijaya',
  returnTo: 'appointment'
}
```

#### 2. App-Level Navigation
- `App.jsx` menyimpan `posContext`
- Jika POS dibuka tanpa context, flow retail tetap normal
- Jika POS dibuka dengan context appointment, aktifkan clinic context
- Jika `businessType === 'clinic'` dan `source === 'appointment'`, close POS harus kembali ke tool `appointment`
- Jangan ubah flow logout / cashier retail existing

#### 3. Appointment Action
- Tambah tombol `Bayar` pada appointment yang relevan
- Tombol minimal membaca `patient_id`, `patient_name`, dan `id`
- Jika `sales_id` sudah ada, tampilkan status invoice terhubung dan cegah create invoice ganda sesuai kebutuhan UX

#### 4. POS Selected Patient
- Tambah state `selectedCustomer`
- Baca `customerId` dari `posContext`
- Tampilkan pasien aktif di header POS
- Tampilkan sumber appointment
- Restore draft appointment jika tersedia
- Jika tidak ada draft, cart tetap kosong saat dibuka dari appointment

#### 5. POS Draft Autosave
- Simpan draft POS clinic ke local storage per `appointmentId`
- Key draft harus spesifik per appointment, misalnya `pos_appointment_draft_<appointmentId>`
- Draft hanya menyimpan data minimal:
  - `appointmentId`
  - `customerId`
  - `customerName`
  - `items`
  - `paymentMethod`
  - `transferAccount`
  - `updatedAt`
- Saat POS clinic ditutup, draft disimpan lalu user kembali ke appointment
- Saat POS dibuka lagi dari appointment yang sama, draft dipulihkan otomatis
- Saat checkout sukses dan transaksi final tersimpan di database, draft local harus dihapus
- Jika appointment sudah punya `sales_id`, draft local untuk appointment itu jangan dipulihkan dan harus dibersihkan
- Tambahkan mitigasi storage lokal:
  - batasi jumlah draft
  - hapus draft tertua jika melewati batas
  - hapus draft expired berdasarkan `updatedAt`
  - tampilkan notifikasi jika local storage gagal menyimpan draft

#### 6. Item Search Strategy
- Retail mode: search `product` saja
- Clinic mode: search `product + treatment`
- Treatment search hanya aktif untuk clinic
- Mapping item sale perlu disiapkan agar checkout bisa membedakan `product` vs `treatment`

#### 7. Pricing Rule
- Harga item tidak bisa diedit manual
- Harga hanya boleh datang dari:
  - master product
  - master treatment
  - promo/tier otomatis jika ada
- Jika retail saat ini masih memiliki jalur edit harga, batasi perubahan ini agar hanya aktif pada context clinic bila perlu

#### 8. Checkout & Link Sale
- Saat checkout dari context appointment, sertakan `customer_id`
- Jika backend sale sudah mendukung, sertakan `appointment_id` juga
- Setelah `createSale` berhasil, simpan id sale ke `appointment.sales_id`
- Setelah transaksi final tersimpan di database dan link invoice berhasil, hapus draft local appointment yang terkait
- Refresh data appointment agar status invoice langsung terlihat

#### 9. Cash Drawer Strategy
- Gunakan cash drawer existing yang sama dengan retail
- Open drawer tetap wajib sebelum checkout
- Close POS dari flow clinic appointment tidak boleh menutup cash drawer
- Close drawer tetap flow terpisah level kasir / shift
- Semua behavior tambahan di-guard hanya untuk:

```js
businessType === 'clinic' && posContext?.source === 'appointment'
```

---

## Retail Safety Strategy
- Jangan buat `POS_clinic`
- Gunakan satu `POS` dengan clinic context yang opsional
- Semua fitur clinic harus dibungkus guard:
  - `businessType === 'clinic'`
  - atau `posContext?.source === 'appointment'`
- Default retail behavior harus tetap sama:
  - search product
  - cart
  - checkout
  - cash drawer
  - print
  - promo/tier product
  - keyboard shortcut existing

---

## Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Perubahan POS mengganggu retail | Jadikan `posContext` opsional dan guard fitur clinic dengan business type |
| `sales_id` tidak sinkron setelah checkout | Update appointment hanya setelah `createSale` sukses dan tampilkan error bila link gagal |
| Local storage penuh karena draft menumpuk | Simpan data draft minimal, batasi jumlah draft, hapus draft tertua dan draft expired |
| Draft local tetap muncul setelah invoice selesai | Hapus draft saat transaksi final sukses dan saat appointment sudah punya `sales_id` |
| Close POS clinic tidak kembali ke appointment | Gunakan `returnTo: 'appointment'` dan handler exit khusus clinic context |
| Close POS clinic tidak sengaja menutup cash drawer | Pisahkan handler close POS dan close drawer, guard hanya untuk clinic appointment flow |
| POS masih terlalu product-centric | Tambah selected customer dulu, lalu perluas item model secara minimal |
| User bingung kenapa cart muncul lagi | Tampilkan info bahwa draft appointment dipulihkan dari local storage |
| Treatment search membingungkan retail | Aktifkan treatment search hanya untuk clinic |
| Foreign key `sales_id` memicu masalah migration | Ikuti pola migration existing dan cek constraint sebelum alter table |

---

## Acceptance Criteria
- Model `Appointment` memiliki field `sales_id`
- Backend bisa menyimpan dan mengembalikan `sales_id` appointment
- User bisa membuka POS dari appointment
- POS menerima `customer_id` dan `appointment_id`
- POS menampilkan pasien aktif yang benar
- Tombol aksi appointment clinic menggunakan label `Bayar`
- Close POS dari appointment clinic kembali ke appointment
- Cart POS kosong saat dibuka dari appointment jika belum ada draft
- Draft POS clinic tersimpan di local storage per appointment saat POS ditutup
- Draft POS clinic dipulihkan saat appointment yang sama dibuka lagi
- Checkout sale dari appointment bisa menautkan `sales_id` kembali ke appointment
- Draft local appointment dihapus setelah transaksi final tersimpan di database
- Appointment yang sudah punya invoice menampilkan status invoice terhubung
- Retail flow POS existing tetap tidak berubah
- Close POS clinic tidak menutup cash drawer
- Checkout appointment tetap mensyaratkan cash drawer sudah open
- Harga item tidak bisa diedit manual
- Treatment search hanya aktif untuk clinic

---

## Verification Plan
- Uji migration / startup backend untuk kolom `sales_id`
- Uji list dan detail appointment mengandung `sales_id`
- Uji buka POS dari appointment
- Uji pasien aktif tampil benar
- Uji cart kosong jika belum ada draft
- Uji close POS clinic menyimpan draft ke local storage
- Uji buka ulang POS dari appointment yang sama memulihkan draft
- Uji checkout dari appointment menghasilkan sale
- Uji `appointment.sales_id` terisi setelah checkout berhasil
- Uji draft local dihapus setelah checkout sukses
- Uji draft local dibersihkan jika appointment sudah punya `sales_id`
- Uji close POS clinic kembali ke appointment tanpa menutup cash drawer
- Uji checkout appointment tetap blocked jika cash drawer belum open
- Uji appointment yang sudah terhubung invoice tidak menawarkan flow duplikat yang salah
- Uji retail login tetap melihat POS normal
- Uji retail search product tetap normal
- Uji clinic search treatment hanya aktif untuk clinic
- Uji harga item tidak editable
- Jalankan:
  - frontend: `npm run lint`
  - frontend: `npm run build`
  - backend: `go test ./...`

---

## Dependency Note
Plan ini dikerjakan setelah tahap `Appointment Patient Integration` stabil. Karena scope sekarang menyentuh backend sale-linking, implementasi perlu memastikan contract sale dan appointment tetap konsisten.

---

**Created:** 2026-05-06  
**Last Updated:** 2026-05-07
