# TODO: Appointment POS Integration

## Status Legend
- ✅ Completed
- ❌ Pending
- 🔄 In Progress

---

## Documentation
- [✅] Konfirmasi scope tahap 2 fokus ke integrasi POS
- [✅] Buat `document/PLAN_appointment_pos_integration.md`
- [✅] Buat `document/TODO_appointment_pos_integration.md`

---

## Analysis
- [✅] Audit `src/components/POS/POS.jsx`
- [✅] Audit `src/features/transaksi/sales/sales.api.js`
- [✅] Konfirmasi `single POS + clinic mode/context`
- [✅] Konfirmasi POS dari appointment hanya membawa `customer_id`
- [✅] Konfirmasi cart tetap kosong
- [✅] Konfirmasi harga item tidak editable
- [✅] Konfirmasi retail tidak boleh terganggu

---

## Navigation & Context Tasks
- [❌] Tambah tombol `Pembayaran ke POS` di appointment
- [❌] Tambah payload `posContext` di `App.jsx`
- [❌] Pastikan POS bisa dibuka dari dashboard flow dengan context opsional
- [❌] Tambah flag `clinic mode/context` di POS

---

## POS Patient Tasks
- [❌] Tambah selected customer state di POS
- [❌] Baca `customerId` dari `posContext`
- [❌] Tampilkan pasien aktif di header POS
- [❌] Pastikan cart kosong saat open from appointment

---

## POS Item Source Tasks
- [❌] Pertahankan retail mode hanya search product
- [❌] Tambah clinic mode untuk search product + treatment
- [❌] Tambah pemetaan item generic product/treatment bila tahap ini sudah dikerjakan
- [❌] Pastikan treatment search tidak muncul di retail

---

## Pricing Rule Tasks
- [❌] Audit path edit harga manual di POS
- [❌] Nonaktifkan edit manual harga item
- [❌] Pastikan harga hanya berasal dari master / promo / tier otomatis

---

## Retail Safety Tasks
- [❌] Verifikasi retail POS tetap normal tanpa `posContext`
- [❌] Verifikasi retail checkout tetap normal
- [❌] Verifikasi retail cash drawer tetap normal
- [❌] Verifikasi retail print tetap normal
- [❌] Verifikasi retail promo/tier product tetap normal

---

## Manual Testing
- [❌] Uji buka POS dari appointment
- [❌] Uji pasien aktif tampil benar
- [❌] Uji cart kosong saat POS dibuka
- [❌] Uji retail login ke POS normal
- [❌] Uji retail search product normal
- [❌] Uji clinic search treatment hanya muncul untuk clinic
- [❌] Uji harga item tidak editable

---

## Verification
- [❌] Jalankan `npm run lint`
- [❌] Jalankan `npm run build`
- [❌] Pastikan tidak ada error runtime pada POS clinic mode
- [❌] Pastikan tidak ada regression pada retail POS

---

## Progress Summary

| Category | Total | Completed | Pending | Progress |
|----------|-------|-----------|---------|----------|
| Documentation | 3 | 3 | 0 | 100% |
| Analysis | 7 | 7 | 0 | 100% |
| Navigation & Context | 4 | 0 | 4 | 0% |
| POS Patient | 4 | 0 | 4 | 0% |
| POS Item Source | 4 | 0 | 4 | 0% |
| Pricing Rule | 3 | 0 | 3 | 0% |
| Retail Safety | 5 | 0 | 5 | 0% |
| Manual Testing | 7 | 0 | 7 | 0% |
| Verification | 4 | 0 | 4 | 0% |
| **Total** | **41** | **10** | **31** | **24%** |

---

**Created:** 2026-05-06  
**Last Updated:** 2026-05-06  
**Overall Progress:** 24%
