# TODO: Appointment POS Integration

## Status Legend
- [V] Completed
- [X] Pending
- [O] In Progress

---

## TASK 1 - Documentation
- [V] Konfirmasi scope tahap 2 fokus ke integrasi POS
- [V] Konfirmasi scope diperluas dengan `sales_id` pada appointment
- [V] Konfirmasi CTA clinic appointment menggunakan label `Bayar`
- [V] Konfirmasi close POS clinic kembali ke appointment
- [V] Konfirmasi autosave draft menggunakan storage lokal per appointment
- [V] Konfirmasi draft local dihapus setelah transaksi final tersimpan di database
- [V] Update `document/PLAN_appointment_pos_integration.md`
- [V] Update `document/TODO_appointment_pos_integration.md`

---

## TASK 2 - Analysis
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

## TASK 3 - Backend Appointment Sales Link
- [V] Tambah field `sales_id` pada model `Appointment`
- [V] Tambah migration / ensure column `sales_id` di database backend
- [V] Tambah relation sale di model appointment bila dibutuhkan
- [V] Pastikan repository appointment membaca dan menyimpan `sales_id`
- [V] Tambah service untuk link sale ke appointment
- [V] Update request / response appointment agar mendukung `sales_id`
- [V] Tambah endpoint update / link sale sesuai pola backend existing

---

## TASK 4 - Frontend Navigation And POS Context
- [V] Tambah tombol `Bayar` di appointment
- [V] Tambah payload `posContext` di `App.jsx`
- [V] Pastikan POS bisa dibuka dari dashboard flow dengan context opsional
- [V] Tambah flag `clinic mode/context` di POS
- [V] Kirim `customer_id`, `appointment_id`, dan `customerName` ke POS context
- [V] Kirim `returnTo: 'appointment'` ke POS context clinic
- [V] Pastikan close POS clinic mengembalikan user ke appointment

---

## TASK 5 - POS Patient Context
- [V] Tambah selected customer state di POS
- [V] Baca `customerId` dari `posContext`
- [V] Tampilkan pasien aktif di header POS
- [V] Tampilkan sumber appointment di header POS
- [V] Restore draft appointment jika tersedia
- [V] Pastikan cart kosong saat open from appointment jika belum ada draft

---

## TASK 6 - POS Draft Autosave
- [V] Tambah helper draft local storage per appointment
- [V] Tentukan key draft per `appointmentId`
- [V] Simpan data draft minimal saja
- [V] Autosave draft saat close POS clinic
- [V] Restore draft saat POS dibuka lagi dari appointment yang sama
- [V] Hapus draft saat checkout sukses dan transaksi final tersimpan di database
- [V] Hapus draft jika appointment sudah punya `sales_id`
- [V] Tambah cleanup draft expired berdasarkan `updatedAt`
- [V] Tambah batas jumlah draft dan hapus draft tertua jika melewati limit
- [V] Tambah notifikasi jika local storage gagal menyimpan draft

---

## TASK 7 - POS Item Source
- [V] Pertahankan retail mode hanya search product
- [V] Tambah clinic mode untuk search product + treatment
- [V] Tambah pemetaan item generic product/treatment untuk checkout sale
- [V] Pastikan treatment search tidak muncul di retail

---

## TASK 8 - Pricing Rule
- [V] Audit path edit harga manual di POS
- [V] Nonaktifkan edit manual harga item untuk clinic context
- [V] Pastikan harga hanya berasal dari master / promo / tier otomatis
- [V] Pastikan perubahan pricing tidak merusak retail flow existing

---

## TASK 9 - Checkout And Invoice Linking
- [V] Pastikan checkout POS dapat membawa `customer_id`
- [V] Pastikan checkout POS dapat membawa `appointment_id` bila backend sale mendukung
- [V] Tambah flow update `appointment.sales_id` setelah `createSale` sukses
- [V] Hapus draft local appointment setelah transaksi final sukses di database
- [V] Refresh data appointment setelah invoice berhasil terhubung
- [V] Tampilkan status invoice sudah terhubung pada appointment
- [V] Tentukan guard agar appointment dengan invoice existing tidak membuat invoice ganda secara tidak sengaja

---

## TASK 10 - Cash Drawer Strategy
- [V] Pastikan clinic tetap memakai cash drawer existing
- [V] Pastikan open drawer tetap wajib sebelum checkout appointment
- [V] Pastikan close POS clinic tidak memanggil close drawer
- [V] Pastikan flow close drawer retail / logout tetap normal

---

## TASK 11 - Retail Safety
- [X] Verifikasi retail POS tetap normal tanpa `posContext`
- [X] Verifikasi retail checkout tetap normal
- [X] Verifikasi retail cash drawer tetap normal
- [X] Verifikasi retail print tetap normal
- [X] Verifikasi retail promo/tier product tetap normal
- [X] Verifikasi shortcut keyboard retail tetap normal

---

## TASK 12 - Manual Testing
- [V] Uji buka POS dari appointment
- [V] Uji pasien aktif tampil benar
- [V] Uji cart kosong saat POS dibuka jika belum ada draft
- [V] Uji close POS clinic menyimpan draft ke local storage
- [V] Uji buka ulang POS dari appointment yang sama memulihkan draft
- [V] Uji clinic dapat mencari treatment di POS
- [X] Uji harga item tidak editable pada context appointment
- [V] Uji checkout dari appointment berhasil membuat sale
- [V] Uji `sales_id` appointment terisi setelah checkout
- [V] Uji draft local dihapus setelah checkout sukses
- [X] Uji draft local dibersihkan jika appointment sudah punya invoice
- [V] Uji close POS clinic kembali ke appointment
- [V] Uji close POS clinic tidak menutup cash drawer
- [V] Uji checkout appointment gagal jika drawer belum open
- [V] Uji appointment dengan invoice existing menampilkan status yang benar
- [X] Uji retail login ke POS normal
- [X] Uji retail search product normal

---

## TASK 13 - Verification
- [V] Jalankan frontend `npm run lint`
- [V] Jalankan frontend `npm run build`
- [V] Jalankan backend `go test ./...`
- [V] Pastikan tidak ada error runtime pada POS clinic mode
- [X] Pastikan tidak ada regression pada retail POS
- [V] Pastikan contract response appointment tetap konsisten setelah tambah `sales_id`
- [X] Pastikan cleanup draft local berjalan sesuai limit dan expiry

## TASK 14 - Invoice Status Mapping
- [V] Appointment response menyertakan `sale.status` dan `sale.sale_number`
- [V] Mapping `sales_id ada + sale DONE -> DONE`
- [V] Mapping `sales_id ada + sale DRAFT/PENDING -> DRAFT`
- [V] Mapping `sales_id kosong + local draft ada -> DRAFT`
- [V] Mapping `sales_id kosong + local draft tidak ada -> NONE`
- [V] Tampilkan `No Nota` jika tersedia dari sale database
- [V] Terapkan mapping ke table/list appointment
- [V] Terapkan mapping ke calendar detail appointment

---

## TASK 15 - Invoice Action Preview
- [V] Tampilkan icon `Cetak Nota` untuk invoice status `DONE`
- [V] Buka preview nota penjualan, bukan detail/list penjualan
- [V] Preview nota mengambil data sale dari `sales_id`
- [V] Tambah tombol `Cetak` di preview nota
- [V] Gunakan layout receipt yang sama untuk proses cetak nota

---

## Progress Summary

| Task | Total | Completed | Pending | Progress |
|------|-------|-----------|---------|----------|
| TASK 1 - Documentation | 8 | 8 | 0 | 100% |
| TASK 2 - Analysis | 13 | 13 | 0 | 100% |
| TASK 3 - Backend Appointment Sales Link | 7 | 7 | 0 | 100% |
| TASK 4 - Frontend Navigation And POS Context | 7 | 7 | 0 | 100% |
| TASK 5 - POS Patient Context | 6 | 6 | 0 | 100% |
| TASK 6 - POS Draft Autosave | 10 | 10 | 0 | 100% |
| TASK 7 - POS Item Source | 4 | 4 | 0 | 100% |
| TASK 8 - Pricing Rule | 4 | 4 | 0 | 100% |
| TASK 9 - Checkout And Invoice Linking | 7 | 7 | 0 | 100% |
| TASK 10 - Cash Drawer Strategy | 4 | 4 | 0 | 100% |
| TASK 11 - Retail Safety | 6 | 0 | 6 | 0% |
| TASK 12 - Manual Testing | 17 | 12 | 5 | 71% |
| TASK 13 - Verification | 7 | 5 | 2 | 71% |
| TASK 14 - Invoice Status Mapping | 8 | 8 | 0 | 100% |
| TASK 15 - Invoice Action Preview | 5 | 5 | 0 | 100% |
| **Total** | **113** | **100** | **13** | **88%** |

---

**Created:** 2026-05-06  
**Last Updated:** 2026-05-07  
**Overall Progress:** 88%
