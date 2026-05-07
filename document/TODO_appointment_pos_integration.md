# TODO: Appointment POS Integration

## Status Legend
- [V] Completed
- [X] Pending
- [O] In Progress

---

## Documentation
- [V] Konfirmasi scope tahap 2 fokus ke integrasi POS
- [V] Konfirmasi scope diperluas dengan `sales_id` pada appointment
- [V] Konfirmasi CTA clinic appointment menggunakan label `Bayar`
- [V] Konfirmasi close POS clinic kembali ke appointment
- [V] Konfirmasi autosave draft menggunakan storage lokal per appointment
- [V] Konfirmasi draft local dihapus setelah transaksi final tersimpan di database
- [V] Update `document/PLAN_appointment_pos_integration.md`
- [V] Update `document/TODO_appointment_pos_integration.md`

---

## Analysis
- [V] Audit `src/components/POS/POS.jsx`
- [V] Audit `src/features/transaksi/sales/sales.api.js`
- [V] Audit `src/features/transaksi/appointment/appointment.api.js`
- [V] Audit `src/App.jsx`
- [V] Audit model backend `appointment`
- [V] Konfirmasi `single POS + clinic mode/context`
- [V] Konfirmasi POS dari appointment perlu membawa `customer_id` dan `appointment_id`
- [V] Konfirmasi cart kosong hanya jika belum ada draft
- [V] Konfirmasi harga item tidak editable
- [V] Konfirmasi retail tidak boleh terganggu
- [V] Konfirmasi perubahan mencakup frontend dan backend
- [V] Konfirmasi cash drawer clinic tetap menggunakan drawer existing
- [V] Konfirmasi close POS clinic tidak boleh close drawer

---

## Backend Appointment Tasks
- [X] Tambah field `sales_id` pada model `Appointment`
- [X] Tambah migration / ensure column `sales_id` di database backend
- [X] Tambah relation sale di model appointment bila dibutuhkan
- [X] Pastikan repository appointment membaca dan menyimpan `sales_id`
- [X] Tambah service untuk link sale ke appointment
- [X] Update request / response appointment agar mendukung `sales_id`
- [X] Tambah endpoint update / link sale sesuai pola backend existing

---

## Frontend Navigation & Context Tasks
- [X] Tambah tombol `Bayar` di appointment
- [X] Tambah payload `posContext` di `App.jsx`
- [X] Pastikan POS bisa dibuka dari dashboard flow dengan context opsional
- [X] Tambah flag `clinic mode/context` di POS
- [X] Kirim `customer_id`, `appointment_id`, dan `customerName` ke POS context
- [X] Kirim `returnTo: 'appointment'` ke POS context clinic
- [X] Pastikan close POS clinic mengembalikan user ke appointment

---

## POS Patient Tasks
- [X] Tambah selected customer state di POS
- [X] Baca `customerId` dari `posContext`
- [X] Tampilkan pasien aktif di header POS
- [X] Tampilkan sumber appointment di header POS
- [X] Restore draft appointment jika tersedia
- [X] Pastikan cart kosong saat open from appointment jika belum ada draft

---

## POS Draft Autosave Tasks
- [X] Tambah helper draft local storage per appointment
- [X] Tentukan key draft per `appointmentId`
- [X] Simpan data draft minimal saja
- [X] Autosave draft saat close POS clinic
- [X] Restore draft saat POS dibuka lagi dari appointment yang sama
- [X] Hapus draft saat checkout sukses dan transaksi final tersimpan di database
- [X] Hapus draft jika appointment sudah punya `sales_id`
- [X] Tambah cleanup draft expired berdasarkan `updatedAt`
- [X] Tambah batas jumlah draft dan hapus draft tertua jika melewati limit
- [X] Tambah notifikasi jika local storage gagal menyimpan draft

---

## POS Item Source Tasks
- [X] Pertahankan retail mode hanya search product
- [X] Tambah clinic mode untuk search product + treatment
- [X] Tambah pemetaan item generic product/treatment untuk checkout sale
- [X] Pastikan treatment search tidak muncul di retail

---

## Pricing Rule Tasks
- [X] Audit path edit harga manual di POS
- [X] Nonaktifkan edit manual harga item untuk clinic context
- [X] Pastikan harga hanya berasal dari master / promo / tier otomatis
- [X] Pastikan perubahan pricing tidak merusak retail flow existing

---

## Checkout & Invoice Linking Tasks
- [X] Pastikan checkout POS dapat membawa `customer_id`
- [X] Pastikan checkout POS dapat membawa `appointment_id` bila backend sale mendukung
- [X] Tambah flow update `appointment.sales_id` setelah `createSale` sukses
- [X] Hapus draft local appointment setelah transaksi final sukses di database
- [X] Refresh data appointment setelah invoice berhasil terhubung
- [X] Tampilkan status invoice sudah terhubung pada appointment
- [X] Tentukan guard agar appointment dengan invoice existing tidak membuat invoice ganda secara tidak sengaja

---

## Cash Drawer Strategy Tasks
- [X] Pastikan clinic tetap memakai cash drawer existing
- [X] Pastikan open drawer tetap wajib sebelum checkout appointment
- [X] Pastikan close POS clinic tidak memanggil close drawer
- [X] Pastikan flow close drawer retail / logout tetap normal

---

## Retail Safety Tasks
- [X] Verifikasi retail POS tetap normal tanpa `posContext`
- [X] Verifikasi retail checkout tetap normal
- [X] Verifikasi retail cash drawer tetap normal
- [X] Verifikasi retail print tetap normal
- [X] Verifikasi retail promo/tier product tetap normal
- [X] Verifikasi shortcut keyboard retail tetap normal

---

## Manual Testing
- [X] Uji buka POS dari appointment
- [X] Uji pasien aktif tampil benar
- [X] Uji cart kosong saat POS dibuka jika belum ada draft
- [X] Uji close POS clinic menyimpan draft ke local storage
- [X] Uji buka ulang POS dari appointment yang sama memulihkan draft
- [X] Uji clinic dapat mencari treatment di POS
- [X] Uji harga item tidak editable pada context appointment
- [X] Uji checkout dari appointment berhasil membuat sale
- [X] Uji `sales_id` appointment terisi setelah checkout
- [X] Uji draft local dihapus setelah checkout sukses
- [X] Uji draft local dibersihkan jika appointment sudah punya invoice
- [X] Uji close POS clinic kembali ke appointment
- [X] Uji close POS clinic tidak menutup cash drawer
- [X] Uji checkout appointment gagal jika drawer belum open
- [X] Uji appointment dengan invoice existing menampilkan status yang benar
- [X] Uji retail login ke POS normal
- [X] Uji retail search product normal

---

## Verification
- [X] Jalankan frontend `npm run lint`
- [X] Jalankan frontend `npm run build`
- [X] Jalankan backend `go test ./...`
- [X] Pastikan tidak ada error runtime pada POS clinic mode
- [X] Pastikan tidak ada regression pada retail POS
- [X] Pastikan contract response appointment tetap konsisten setelah tambah `sales_id`
- [X] Pastikan cleanup draft local berjalan sesuai limit dan expiry

---

## Progress Summary

| Category | Total | Completed | Pending | Progress |
|----------|-------|-----------|---------|----------|
| Documentation | 8 | 8 | 0 | 100% |
| Analysis | 13 | 13 | 0 | 100% |
| Backend Appointment | 7 | 0 | 7 | 0% |
| Frontend Navigation & Context | 7 | 0 | 7 | 0% |
| POS Patient | 5 | 0 | 5 | 0% |
| POS Draft Autosave | 10 | 0 | 10 | 0% |
| POS Item Source | 4 | 0 | 4 | 0% |
| Pricing Rule | 4 | 0 | 4 | 0% |
| Checkout & Invoice Linking | 7 | 0 | 7 | 0% |
| Cash Drawer Strategy | 4 | 0 | 4 | 0% |
| Retail Safety | 6 | 0 | 6 | 0% |
| Manual Testing | 15 | 0 | 15 | 0% |
| Verification | 7 | 0 | 7 | 0% |
| **Total** | **97** | **21** | **76** | **22%** |

---

**Created:** 2026-05-06  
**Last Updated:** 2026-05-07  
**Overall Progress:** 22%
