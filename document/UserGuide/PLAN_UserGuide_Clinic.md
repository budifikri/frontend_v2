# PLAN: User Guide Clinic - POSXPRESS

## Overview
Dokumentasi panduan pengguna untuk aplikasi POSXPRESS dengan tipe bisnis **Clinic** (Klinik kesehatan, praktik dokter, медицинский центр).

## Target Audience
- Admin
- Manager
- Cashier (Kasir)
- Staff
- Dokter
- Resepsionis

## Bahasa
Bahasa Indonesia formal dengan instruksi langsung ("Klik tombol Simpan").

## Output File
`D:\Project\pos_retail\frontend_v2\document\UserGuide\UserGuide_Clinic.md`

## Struktur Dokumen

### BAGIAN 1: PENDAHULUAN
1. Pendahuluan
2. Login & Logout
3. Overview Dashboard
4. Menu Navigation

### BAGIAN 2: SETUP AWAL (Admin)
5. Pengaturan Company
6. Manajemen Warehouse
7. Manajemen Satuan
8. Manajemen Kategori

### BAGIAN 3: MASTER DATA
9. Manajemen Produk
10. Manajemen Treatment
11. Manajemen Pasien
12. Manajemen Supplier
13. Manajemen Dokter
14. Manajemen Paket

### BAGIAN 4: TRANSAKSI POS
15. Layar Kasir POS
16. Pencarian Produk & Treatment
17. Input Transaksi
18. Metode Pembayaran
19. Cetak Nota/Struk
20. Pending & Cetak Ulang Nota
21. Cash In/Out & Tutup Drawer

### BAGIAN 5: TRANSAKSI LANJUTAN
22. Order Pembelian
23. Penerimaan Barang (Stock Receive)
24. Retur Pembelian
25. Stock Opname
26. Appointment (Jadwal Pasien)

### BAGIAN 6: LAPORAN
27. Laporan Penjualan
28. Laporan Pembelian
29. Laporan Stock
30. Laporan Cash Drawer
31. Laporan Laba Rugi
32. Laporan Pengeluaran
33. Laporan Appointment

### BAGIAN 7: PENGATURAN (Admin)
34. Manajemen User
35. Manajemen Hak Akses Dokter
36. Pengaturan Printer
37. Pengaturan Tema
38. Backup & Restore
39. Integrasi Telegram
40. Pengaturan Modul

### BAGIAN 8: REFERENSI
41. Shortcut Keyboard
42. Tips & Trick
43. Troubleshooting
44. FAQ

## Feature Checklist (Clinic)

### Master Data
- [x] Produk (SKU, barcode, harga, price tier, gambar)
- [x] Treatment (jasa medis, paket tindakan)
- [x] Kategori
- [x] Pasien (No. RM, NIK, alergi, golongan darah)
- [x] Supplier
- [x] Dokter (SIP, spesialisasi)
- [x] Paket (paket tindakan/kONSULTASI)
- [x] Warehouse
- [x] Satuan

### Transaksi
- [x] POS Cashier (produk + treatment)
- [x] Order Pembelian
- [x] Stock Receive
- [x] Retur Pembelian
- [x] Stock Opname
- [x] Appointment (jadwal pasien dengan dokter)

### Laporan
- [x] Penjualan
- [x] Pembelian
- [x] Stock
- [x] Cash Drawer
- [x] Laba Rugi
- [x] Pengeluaran
- [x] Appointment (jadwal & statistik)

### Pengaturan
- [x] User Management
- [x] Hak Akses per Dokter
- [x] Printer Setup
- [x] Theme
- [x] Backup/Restore
- [x] Telegram Integration
- [x] Module Settings (clinic_core, clinic_advanced)

## Status
- [ ] DRAFT
- [ ] IN_PROGRESS
- [ ] COMPLETED