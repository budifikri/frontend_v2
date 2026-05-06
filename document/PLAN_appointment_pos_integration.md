# PLAN: Appointment POS Integration

## Overview
Tahap ini fokus pada integrasi `Appointment` dengan `POS` setelah integrasi data pasien stabil. Tujuan tahap ini adalah membuka POS dari appointment dengan context clinic yang aman, tanpa mengganggu logic business type `retail`.

---

## Scope
- Tambah aksi `Pembayaran ke POS` dari `Appointment`
- Buka `POS` dengan membawa `customer_id`
- POS dibuka dengan cart kosong
- Tambah selected patient di POS
- Siapkan `single POS + clinic mode/context`
- Pastikan retail tetap berjalan dengan flow existing
- Siapkan arah item POS dari `product` dan `treatment`
- Pastikan harga item tidak bisa diedit manual

---

## Confirmed Decisions
- Masuk ke POS dari appointment hanya membawa `customer_id`
- Cart POS tetap kosong
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

---

## Target UX
- User memilih pasien dari appointment
- User klik `Pembayaran ke POS`
- POS terbuka dengan label pasien aktif
- Cart tetap kosong
- User bisa tambah item dari product, dan untuk clinic juga dari treatment
- Retail tetap melihat flow POS normal tanpa elemen clinic tambahan

---

## Visual Design Sketch

```text
+----------------------------------------------------------------------------------+
| POS                                                                              |
|----------------------------------------------------------------------------------|
| Pasien Aktif : Andi Wijaya                                                       |
| Sumber       : Appointment                                                       |
|----------------------------------------------------------------------------------|
| Cari item: bisa product, dan khusus clinic bisa treatment                        |
|----------------------------------------------------------------------------------|
| Cart: kosong                                                                     |
|----------------------------------------------------------------------------------|
| Catatan: harga item mengikuti master, tidak bisa diedit manual                   |
+----------------------------------------------------------------------------------+
```

## Technical Implementation

### Files To Update
- `src/App.jsx`
- `src/components/POS/POS.jsx`
- `src/components/ToolbarItem/transaksi/Appointment.jsx`
- `src/features/transaksi/sales/sales.api.js`
- opsional: receipt/detail sale file bila sale item generic sudah dikerjakan

### Frontend Changes

#### 1. POS Context
Tambahkan payload/context opsional:

```js
{
  source: 'appointment',
  businessType: 'clinic',
  customerId: 'CUS001'
}
```

#### 2. App-Level Navigation
- `App.jsx` menyimpan `posContext`
- Jika POS dibuka tanpa context, flow retail tetap normal
- Jika POS dibuka dengan context appointment, aktifkan mode clinic-context

#### 3. POS Selected Patient
- Tambah state `selectedCustomer`
- Baca `customerId` dari `posContext`
- Tampilkan pasien aktif di header POS
- Cart tetap kosong saat dibuka dari appointment

#### 4. Item Search Strategy
- Retail mode: search `product` saja
- Clinic mode: search `product + treatment`
- Treatment search hanya aktif untuk clinic

#### 5. Pricing Rule
- Harga item tidak bisa diedit manual
- Harga hanya boleh datang dari:
  - master product
  - master treatment
  - promo/tier otomatis jika ada

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

---

## Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Perubahan POS mengganggu retail | Jadikan `posContext` opsional dan guard fitur clinic dengan business type |
| POS masih terlalu product-centric | Tambah selected customer dulu, lalu perluas item model bertahap |
| User mengira cart akan otomatis terisi | Tampilkan label jelas bahwa POS dibuka dengan pasien aktif dan cart kosong |
| Treatment search membingungkan retail | Aktifkan treatment search hanya untuk clinic |

---

## Acceptance Criteria
- User bisa membuka POS dari appointment
- POS menerima `customer_id`
- POS menampilkan pasien aktif yang benar
- Cart POS tetap kosong saat dibuka dari appointment
- Retail flow POS existing tetap tidak berubah
- Harga item tidak bisa diedit manual
- Treatment search hanya aktif untuk clinic

---

## Verification Plan
- Uji buka POS dari appointment
- Uji pasien aktif tampil benar
- Uji cart kosong
- Uji retail login tetap melihat POS normal
- Uji retail search product tetap normal
- Uji harga item tidak editable
- Jalankan:
  - `npm run lint`
  - `npm run build`

---

## Dependency Note
Plan ini dikerjakan setelah tahap `Appointment Patient Integration` stabil.

---

**Created:** 2026-05-06  
**Last Updated:** 2026-05-06
