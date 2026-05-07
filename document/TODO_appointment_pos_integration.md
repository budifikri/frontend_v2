# TODO: Appointment POS Integration

## Status Legend
- ✅ Completed
- ❌ Pending
- 🔄 In Progress

---

## Documentation
- [✅] Konfirmasi scope tahap 2 fokus ke integrasi POS
- [✅] Konfirmasi scope diperluas dengan `sales_id` pada appointment
- [✅] Update `document/PLAN_appointment_pos_integration.md`
- [✅] Update `document/TODO_appointment_pos_integration.md`

---

## Analysis
- [✅] Audit `src/components/POS/POS.jsx`
- [✅] Audit `src/features/transaksi/sales/sales.api.js`
- [✅] Audit `src/features/transaksi/appointment/appointment.api.js`
- [✅] Audit `src/App.jsx`
- [✅] Audit model backend `appointment`
- [✅] Konfirmasi `single POS + clinic mode/context`
- [✅] Konfirmasi POS dari appointment perlu membawa `customer_id` dan `appointment_id`
- [✅] Konfirmasi cart tetap kosong
- [✅] Konfirmasi harga item tidak editable
- [✅] Konfirmasi retail tidak boleh terganggu
- [✅] Konfirmasi perubahan mencakup frontend dan backend

---

## Backend Appointment Tasks
- [❌] Tambah field `sales_id` pada model `Appointment`
- [❌] Tambah migration / ensure column `sales_id` di database backend
- [❌] Tambah relation sale di model appointment bila dibutuhkan
- [❌] Pastikan repository appointment membaca dan menyimpan `sales_id`
- [❌] Tambah service untuk link sale ke appointment
- [❌] Update request / response appointment agar mendukung `sales_id`
- [❌] Tambah endpoint update / link sale sesuai pola backend existing

---

## Frontend Navigation & Context Tasks
- [❌] Tambah tombol `Pembayaran ke POS` di appointment
- [❌] Tambah payload `posContext` di `App.jsx`
- [❌] Pastikan POS bisa dibuka dari dashboard flow dengan context opsional
- [❌] Tambah flag `clinic mode/context` di POS
- [❌] Kirim `customer_id`, `appointment_id`, dan `customerName` ke POS context

---

## POS Patient Tasks
- [❌] Tambah selected customer state di POS
- [❌] Baca `customerId` dari `posContext`
- [❌] Tampilkan pasien aktif di header POS
- [❌] Tampilkan sumber appointment di header POS
- [❌] Pastikan cart kosong saat open from appointment

---

## POS Item Source Tasks
- [❌] Pertahankan retail mode hanya search product
- [❌] Tambah clinic mode untuk search product + treatment
- [❌] Tambah pemetaan item generic product/treatment untuk checkout sale
- [❌] Pastikan treatment search tidak muncul di retail

---

## Pricing Rule Tasks
- [❌] Audit path edit harga manual di POS
- [❌] Nonaktifkan edit manual harga item untuk clinic context
- [❌] Pastikan harga hanya berasal dari master / promo / tier otomatis
- [❌] Pastikan perubahan pricing tidak merusak retail flow existing

---

## Checkout & Invoice Linking Tasks
- [❌] Pastikan checkout POS dapat membawa `customer_id`
- [❌] Pastikan checkout POS dapat membawa `appointment_id` bila backend sale mendukung
- [❌] Tambah flow update `appointment.sales_id` setelah `createSale` sukses
- [❌] Refresh data appointment setelah invoice berhasil terhubung
- [❌] Tampilkan status invoice sudah terhubung pada appointment
- [❌] Tentukan guard agar appointment dengan invoice existing tidak membuat invoice ganda secara tidak sengaja

---

## Retail Safety Tasks
- [❌] Verifikasi retail POS tetap normal tanpa `posContext`
- [❌] Verifikasi retail checkout tetap normal
- [❌] Verifikasi retail cash drawer tetap normal
- [❌] Verifikasi retail print tetap normal
- [❌] Verifikasi retail promo/tier product tetap normal
- [❌] Verifikasi shortcut keyboard retail tetap normal

---

## Manual Testing
- [❌] Uji buka POS dari appointment
- [❌] Uji pasien aktif tampil benar
- [❌] Uji cart kosong saat POS dibuka
- [❌] Uji clinic dapat mencari treatment di POS
- [❌] Uji harga item tidak editable pada context appointment
- [❌] Uji checkout dari appointment berhasil membuat sale
- [❌] Uji `sales_id` appointment terisi setelah checkout
- [❌] Uji appointment dengan invoice existing menampilkan status yang benar
- [❌] Uji retail login ke POS normal
- [❌] Uji retail search product normal

---

## Verification
- [❌] Jalankan frontend `npm run lint`
- [❌] Jalankan frontend `npm run build`
- [❌] Jalankan backend `go test ./...`
- [❌] Pastikan tidak ada error runtime pada POS clinic mode
- [❌] Pastikan tidak ada regression pada retail POS
- [❌] Pastikan contract response appointment tetap konsisten setelah tambah `sales_id`

---

## Progress Summary

| Category | Total | Completed | Pending | Progress |
|----------|-------|-----------|---------|----------|
| Documentation | 4 | 4 | 0 | 100% |
| Analysis | 11 | 11 | 0 | 100% |
| Backend Appointment | 7 | 0 | 7 | 0% |
| Frontend Navigation & Context | 5 | 0 | 5 | 0% |
| POS Patient | 5 | 0 | 5 | 0% |
| POS Item Source | 4 | 0 | 4 | 0% |
| Pricing Rule | 4 | 0 | 4 | 0% |
| Checkout & Invoice Linking | 6 | 0 | 6 | 0% |
| Retail Safety | 6 | 0 | 6 | 0% |
| Manual Testing | 10 | 0 | 10 | 0% |
| Verification | 6 | 0 | 6 | 0% |
| **Total** | **68** | **15** | **53** | **22%** |

---

**Created:** 2026-05-06  
**Last Updated:** 2026-05-07  
**Overall Progress:** 22%
