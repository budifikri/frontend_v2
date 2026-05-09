# User Guide Clinic - POSXPRESS

## Cover

**Produk**: POSXPRESS  
**Tipe Business**: Clinic  
**Jenis Dokumen**: User Guide Client  
**Bahasa**: Indonesia  
**Audiens**: Admin, Manager, Cashier, Staff, Dokter, Resepsionis  
**Status Dokumen**: Draft Siap Review  
**Lokasi File**: `document/UserGuide/UserGuide_Clinic.md`

### Ringkasan Dokumen

Dokumen ini berisi panduan penggunaan aplikasi POSXPRESS untuk tipe business clinic. Isi dokumen mencakup setup awal, data pasien, dokter, jadwal dokter, treatment, appointment, operasional POS, laporan, pengaturan sistem, troubleshooting, dan referensi shortcut keyboard.

### Catatan Distribusi

- Ganti seluruh placeholder screenshot sebelum dokumen dibagikan ke client.
- Pastikan tidak ada informasi medis sensitif pada screenshot final.
- Gunakan data dummy untuk pasien, dokter, dan appointment.

## Dokumen

- Nama dokumen: `UserGuide_Clinic.md`
- Tipe bisnis: Clinic
- Target pengguna: Admin, Manager, Cashier, Staff, Dokter, Resepsionis
- Format: Panduan operasional dasar dan lanjutan

## Informasi Dokumen

- Produk: POSXPRESS
- Business type: Clinic
- Bahasa: Indonesia
- Audiens: Client, admin klinik, manager, resepsionis, kasir, staff, dan dokter
- Status: Draft siap review

## Cara Menggunakan Dokumen

1. Baca bagian `Pendahuluan` dan `Navigasi Menu` untuk memahami struktur aplikasi.
2. Untuk persiapan implementasi, kerjakan bagian setup dan master data terlebih dahulu.
3. Untuk operasional harian klinik, fokus pada bagian `Appointment`, `POS`, dan `Pembayaran`.
4. Untuk monitoring, gunakan bagian `Laporan`, `Pengaturan`, dan `Backup`.
5. Ganti seluruh placeholder screenshot dengan hasil screenshot aplikasi final sebelum dokumen dibagikan ke client.

## Daftar Isi

1. Pendahuluan
2. Login dan Logout
3. Overview Dashboard
4. Navigasi Menu
5. Pengaturan Company
6. Manajemen Warehouse
7. Manajemen Satuan
8. Manajemen Kategori
9. Manajemen Produk
10. Manajemen Treatment
11. Manajemen Pasien
12. Manajemen Supplier
13. Manajemen Dokter
14. Manajemen Jadwal Dokter
15. Manajemen Paket
16. Layar Kasir POS
17. Pencarian Produk dan Treatment
18. Input Transaksi
19. Metode Pembayaran
20. Cetak Nota atau Struk
21. Pending dan Cetak Ulang Nota
22. Cash In, Cash Out, dan Tutup Drawer
23. Order Pembelian
24. Penerimaan Barang
25. Retur Pembelian
26. Stock Opname
27. Appointment
28. Laporan Penjualan
29. Laporan Pembelian
30. Laporan Stock
31. Laporan Cash Drawer
32. Laporan Laba Rugi
33. Laporan Pengeluaran
34. Laporan Appointment
35. Manajemen User
36. Pengaturan Hak Akses dan Modul
37. Pengaturan Printer
38. Pengaturan Tema
39. Backup dan Restore
40. Integrasi Telegram
41. Shortcut Keyboard
42. Tips dan Trick
43. Troubleshooting
44. FAQ

## 1. Pendahuluan

POSXPRESS Clinic adalah aplikasi operasional klinik yang menggabungkan fungsi administrasi pasien, appointment, transaksi produk dan treatment, pembelian, stok, laporan, dan pengaturan sistem.

### Tujuan penggunaan

- Menata alur pendaftaran dan appointment pasien.
- Mencatat transaksi produk, treatment, dan pembayaran.
- Mendukung pengelolaan dokter, jadwal dokter, dan histori pasien.
- Mempermudah kontrol stok dan laporan klinik.

### Role pengguna

| Role | Fungsi utama |
| --- | --- |
| Admin | Setup sistem, user, data master, dan pengawasan penuh |
| Manager | Monitoring operasional, laporan, dan kontrol aktivitas |
| Cashier | Menangani pembayaran dan transaksi POS |
| Staff | Menangani kegiatan operasional sesuai akses |
| Dokter | Menggunakan data sesuai proses layanan klinik |
| Resepsionis | Menangani pendaftaran pasien dan appointment |

### Modul utama clinic

- Master: warehouse, unit, kategori, produk, pasien, supplier, dokter, jadwal dokter, paket, treatment
- Transaksi: penjualan, pembelian, inventory, appointment
- Laporan: penjualan, pembelian, stok, cash drawer, laba rugi, pengeluaran
- Setting: theme, user, company, business type, module package, report settings, backup, telegram

### Alur kerja singkat clinic

1. Admin menyiapkan data company, dokter, jadwal dokter, treatment, pasien, dan produk.
2. Resepsionis membuat appointment pasien.
3. Pasien datang sesuai jadwal.
4. Transaksi treatment atau produk diproses melalui POS.
5. Kasir menerima pembayaran dan mencetak nota.
6. Admin atau manager memantau laporan serta backup data.

`[Placeholder Screenshot: Halaman utama aplikasi POSXPRESS Clinic]`

## 2. Login dan Logout

### Langkah login

1. Jalankan aplikasi POSXPRESS.
2. Masukkan username.
3. Masukkan password.
4. Klik tombol `Login`.
5. Tunggu validasi akun dari sistem.

### Hasil login

- Admin, Manager, dan Staff akan masuk ke Dashboard.
- Cashier dapat diarahkan ke POS.
- Pengguna klinik lain bekerja sesuai hak akses yang diberikan admin.

### Logout

1. Buka toolbar aktif.
2. Klik `Logout`.
3. Pastikan aplikasi kembali ke halaman login.

`[Placeholder Screenshot: Form login clinic]`

## 3. Overview Dashboard

Dashboard clinic memiliki struktur yang sama dengan retail, tetapi menampilkan tool clinic sesuai business type dan modul aktif.

### Struktur dashboard

- Header
- Menu bar
- Toolbar
- Canvas area kerja
- Footer informasi user

### Perbedaan utama clinic

- Terdapat `Dokter`, `Jadwal Dokter`, `Treatment`, dan `Appointment`.
- Data pasien dapat terhubung ke histori appointment.

`[Placeholder Screenshot: Dashboard clinic]`

## 4. Navigasi Menu

### Menu Master

- Warehouse
- Unit
- Kategori
- Product
- Customer atau Pasien
- Supplier
- Dokter
- Jadwal Dokter
- Paket
- Treatment

### Menu Transaksi

- Penjualan
- Promotion jika modul advanced aktif
- Order Pembelian
- Stock Receive
- Retur Pembelian
- Stock Opname
- Appointment

### Menu Laporan

- Detail Penjualan
- Lap. Cash Drawer
- Detil Pembelian
- Lap. Stok
- Laporan Laba Rugi
- Laporan Pengeluaran

### Menu Setting

- Theme
- User
- Company
- Business Type
- Module Package
- Report Settings
- Backup and Restore
- Telegram

`[Placeholder Screenshot: Navigasi menu clinic]`

## 5. Pengaturan Company

Data company di clinic dipakai untuk identitas klinik pada sistem dan laporan.

### Data yang dapat diisi

- Kode company
- Nama klinik
- Email
- Telepon
- Website
- Alamat
- Tax ID
- Business license
- Business type
- Module package

### Langkah pengaturan

1. Buka menu `Setting`.
2. Klik `Company`.
3. Klik edit.
4. Lengkapi seluruh data klinik.
5. Klik tombol `Simpan`.

`[Placeholder Screenshot: Form company clinic]`

## 6. Manajemen Warehouse

Warehouse digunakan untuk pengelolaan stok barang klinik seperti obat, bahan habis pakai, dan perlengkapan pendukung.

### Langkah

1. Buka `Master`.
2. Klik `Warehouse`.
3. Tambahkan data warehouse.
4. Atur warehouse default jika diperlukan.
5. Simpan data.

`[Placeholder Screenshot: Daftar warehouse clinic]`

## 7. Manajemen Satuan

Satuan digunakan untuk mendefinisikan unit barang seperti `pcs`, `box`, `botol`, `ampul`, dan `tube`.

### Langkah

1. Buka `Master`.
2. Klik `Unit`.
3. Tambah satuan baru.
4. Klik tombol `Simpan`.

`[Placeholder Screenshot: Daftar satuan clinic]`

## 8. Manajemen Kategori

Kategori digunakan untuk mengelompokkan produk klinik atau item penunjang operasional.

### Contoh kategori

- Obat
- Alat kesehatan
- Bahan habis pakai
- Suplemen
- Skincare

`[Placeholder Screenshot: Daftar kategori clinic]`

## 9. Manajemen Produk

Produk clinic mencakup barang yang dijual atau digunakan pada layanan klinik.

### Field penting

- SKU
- Barcode
- Nama produk
- Kategori
- Unit
- Cost price
- Retail price
- Tax rate
- Reorder point
- Tipe produk
- Price tier jika digunakan

### Langkah input

1. Buka `Master`.
2. Klik `Product`.
3. Tambah produk baru.
4. Isi seluruh field wajib.
5. Simpan data.

### Catatan

- Gunakan tipe `Stockable` untuk barang yang mempengaruhi stok.
- Gunakan data harga yang akurat agar laporan profit lebih tepat.

`[Placeholder Screenshot: Form produk clinic]`

## 10. Manajemen Treatment

Treatment adalah layanan klinik yang dapat dijual melalui sistem.

### Contoh treatment

- Konsultasi dokter
- Facial
- Massage
- Tindakan ringan
- Paket perawatan

### Informasi yang umumnya diisi

- Kode treatment
- Nama treatment
- Kategori
- Harga jual
- Status aktif

### Langkah membuat treatment

1. Buka menu `Master`.
2. Klik `Treatment`.
3. Klik tombol tambah.
4. Isi data treatment.
5. Klik tombol `Simpan`.

`[Placeholder Screenshot: Daftar treatment]`

## 11. Manajemen Pasien

Pada business type clinic, menu `Customer` berfungsi sebagai data pasien.

### Data pasien yang umum digunakan

- Nama pasien
- No. RM
- NIK
- Email
- Telepon
- Alamat
- Alergi
- Golongan darah
- Status aktif

### Langkah membuat pasien

1. Buka menu `Master`.
2. Klik `Customer`.
3. Klik tombol tambah.
4. Isi identitas pasien.
5. Isi informasi medis dasar yang tersedia.
6. Klik tombol `Simpan`.

### Fitur tambahan pasien

- Riwayat appointment pasien.
- Filter status dan histori kunjungan.

`[Placeholder Screenshot: Form pasien]`

`[Placeholder Screenshot: History appointment pasien]`

## 12. Manajemen Supplier

Supplier di clinic digunakan untuk pengadaan produk, obat, dan bahan penunjang.

### Langkah

1. Buka `Master`.
2. Klik `Supplier`.
3. Tambah data supplier.
4. Simpan data.

`[Placeholder Screenshot: Daftar supplier clinic]`

## 13. Manajemen Dokter

Menu `Dokter` digunakan untuk mendata tenaga dokter yang berpraktik.

### Data dokter yang umum diisi

- Nama dokter
- Spesialisasi
- Nomor SIP atau izin praktik
- Kontak
- Status aktif

### Langkah membuat data dokter

1. Buka menu `Master`.
2. Klik `Dokter`.
3. Klik tombol tambah.
4. Isi data dokter.
5. Klik tombol `Simpan`.

### Manfaat

- Menghubungkan dokter dengan jadwal dan appointment.
- Menyederhanakan penjadwalan klinik.

`[Placeholder Screenshot: Daftar dokter]`

## 14. Manajemen Jadwal Dokter

Menu `Jadwal Dokter` digunakan untuk mengatur waktu praktik dokter.

### Informasi yang umum diatur

- Dokter
- Hari praktik
- Jam mulai
- Jam selesai
- Status aktif

### Langkah membuat jadwal dokter

1. Buka `Master`.
2. Klik `Jadwal Dokter`.
3. Tambah jadwal baru.
4. Pilih dokter.
5. Isi hari dan jam praktik.
6. Simpan data.

### Manfaat

- Mengurangi bentrok jadwal.
- Menjadi referensi saat membuat appointment.

`[Placeholder Screenshot: Daftar jadwal dokter]`

## 15. Manajemen Paket

Paket pada clinic dapat digunakan untuk bundling treatment, konsultasi, atau item penunjang.

### Contoh paket

- Paket konsultasi dan obat
- Paket treatment mingguan
- Paket perawatan kulit

### Langkah

1. Buka `Master`.
2. Klik `Paket`.
3. Tambahkan nama paket.
4. Pilih item atau treatment yang termasuk.
5. Tentukan harga paket.
6. Simpan data.

`[Placeholder Screenshot: Form paket clinic]`

## 16. Layar Kasir POS

POS pada clinic digunakan untuk transaksi penjualan produk, treatment, atau transaksi lanjutan dari appointment.

### Komponen utama

- Kolom pencarian produk atau treatment
- Cart transaksi
- Identitas pasien jika terkait appointment
- Metode pembayaran
- Area cetak nota

### Persiapan penggunaan

1. Pastikan kasir login.
2. Pastikan cash drawer dibuka.
3. Pastikan data pasien, treatment, dan produk sudah tersedia.

`[Placeholder Screenshot: POS clinic]`

## 17. Pencarian Produk dan Treatment

### Cara mencari

- Scan barcode produk.
- Ketik nama produk.
- Ketik nama treatment.
- Gunakan format `?keyword` untuk daftar hasil yang lebih luas.

### Contoh penggunaan

- Ketik `facial` untuk treatment facial.
- Ketik barcode obat untuk memilih item produk.

`[Placeholder Screenshot: Pencarian produk dan treatment]`

## 18. Input Transaksi

### Langkah transaksi umum

1. Pilih pasien jika diperlukan.
2. Cari produk atau treatment.
3. Tambahkan item ke cart.
4. Ubah kuantitas bila diperlukan.
5. Periksa total transaksi.
6. Lanjutkan ke pembayaran.

### Jika transaksi berasal dari appointment

- Pastikan appointment yang dipilih sudah sesuai pasien, dokter, dan treatment.
- Lanjutkan transaksi dari context appointment bila fitur tersebut tersedia.

`[Placeholder Screenshot: Cart transaksi clinic]`

## 19. Metode Pembayaran

Clinic mendukung metode pembayaran yang sama dengan retail:

- Cash
- QRIS
- Transfer

### Prosedur singkat

1. Pilih metode pembayaran.
2. Isi nominal atau referensi yang dibutuhkan.
3. Klik tombol `Bayar` atau tekan `F10`.
4. Cetak nota jika diperlukan.

`[Placeholder Screenshot: Pembayaran clinic]`

## 20. Cetak Nota atau Struk

Nota clinic dapat dipakai sebagai bukti pembayaran pasien.

### Isi nota yang umum

- Nama klinik
- Nomor nota
- Nama kasir
- Detail produk atau treatment
- Total pembayaran
- Metode pembayaran

### Langkah

1. Selesaikan pembayaran.
2. Pastikan printer aktif.
3. Cetak nota otomatis atau manual sesuai setting.

`[Placeholder Screenshot: Nota clinic]`

## 21. Pending dan Cetak Ulang Nota

### Pending transaksi

Digunakan saat transaksi pasien perlu ditahan sementara.

### Langkah

1. Masukkan item transaksi.
2. Tekan `F6` atau gunakan tombol pending.
3. Pilih transaksi pending saat ingin melanjutkan.

### Cetak ulang

1. Tekan `F7`.
2. Pilih nota.
3. Klik cetak ulang.

`[Placeholder Screenshot: Pending note clinic]`

## 22. Cash In, Cash Out, dan Tutup Drawer

Alur cash drawer clinic sama seperti retail.

### Shortcut penting

- `F8` untuk cash in
- `F9` untuk cash out
- `F10` untuk bayar
- `F11` untuk pengaturan nota

`[Placeholder Screenshot: Cash drawer clinic]`

## 23. Order Pembelian

Digunakan untuk pengadaan obat, alat, atau bahan klinik.

### Langkah

1. Buka `Transaksi`.
2. Klik `Pembelian` lalu `Order Pembelian`.
3. Pilih supplier.
4. Tambahkan item.
5. Simpan dokumen.

`[Placeholder Screenshot: Order pembelian clinic]`

## 24. Penerimaan Barang

Digunakan saat barang klinik diterima dari supplier.

### Langkah

1. Buka `Stock Receive`.
2. Pilih dokumen pembelian.
3. Verifikasi jumlah aktual.
4. Simpan penerimaan.

`[Placeholder Screenshot: Stock receive clinic]`

## 25. Retur Pembelian

Digunakan jika produk yang datang perlu dikembalikan.

### Langkah

1. Buka `Retur Pembelian`.
2. Tambahkan item yang akan diretur.
3. Isi alasan retur.
4. Simpan data.

`[Placeholder Screenshot: Retur pembelian clinic]`

## 26. Stock Opname

Digunakan untuk audit stok obat, alat, dan bahan klinik.

### Langkah

1. Buat sesi opname.
2. Hitung stok fisik.
3. Input jumlah aktual.
4. Simpan dan review selisih.

`[Placeholder Screenshot: Stock opname clinic]`

## 27. Appointment

Appointment adalah salah satu fitur inti clinic.

### Fungsi appointment

- Menjadwalkan kunjungan pasien.
- Menghubungkan pasien dengan dokter dan treatment.
- Menjadi dasar alur transaksi klinik.

### Data appointment yang umum digunakan

- Pasien
- Treatment
- Dokter
- Tanggal
- Jam mulai
- Jam selesai
- Status
- Catatan

### Status appointment yang umum ditemukan

- Scheduled
- Confirmed
- Completed
- Cancelled

### Langkah membuat appointment

1. Buka menu `Transaksi`.
2. Klik `Appointment`.
3. Klik tombol tambah.
4. Pilih pasien.
5. Pilih treatment.
6. Pilih dokter.
7. Tentukan tanggal dan jam.
8. Isi catatan jika diperlukan.
9. Klik tombol `Simpan`.

### Fitur pendukung appointment

- Tampilan list dan calendar.
- Filter status.
- Pencarian pasien.
- Tambah pasien langsung dari form appointment bila fitur tersedia.
- Melanjutkan transaksi ke POS saat appointment selesai diproses.

### Alur appointment ke POS

1. Buat appointment.
2. Pasien datang sesuai jadwal.
3. Buka data appointment.
4. Lanjutkan ke transaksi POS.
5. Selesaikan pembayaran.
6. Cetak nota.

`[Placeholder Screenshot: Form appointment]`

`[Placeholder Screenshot: Calendar appointment]`

## 28. Laporan Penjualan

Laporan penjualan clinic menampilkan transaksi produk dan treatment.

### Manfaat

- Melihat pendapatan per periode.
- Melihat aktivitas kasir.
- Meninjau metode pembayaran.

`[Placeholder Screenshot: Laporan penjualan clinic]`

## 29. Laporan Pembelian

Laporan ini digunakan untuk evaluasi pengadaan stok klinik.

`[Placeholder Screenshot: Laporan pembelian clinic]`

## 30. Laporan Stock

Laporan stock clinic penting untuk menjaga ketersediaan obat dan bahan.

### Fokus utama

- Barang minimum stok
- Stok per warehouse
- Barang yang perlu restock

`[Placeholder Screenshot: Laporan stock clinic]`

## 31. Laporan Cash Drawer

Digunakan untuk audit kas per shift.

`[Placeholder Screenshot: Laporan cash drawer clinic]`

## 32. Laporan Laba Rugi

Digunakan untuk meninjau performa keuangan klinik.

`[Placeholder Screenshot: Laporan laba rugi clinic]`

## 33. Laporan Pengeluaran

Digunakan untuk melihat biaya operasional klinik di luar penjualan.

`[Placeholder Screenshot: Laporan pengeluaran clinic]`

## 34. Laporan Appointment

Walaupun nama menu laporan khusus appointment dapat mengikuti implementasi yang tersedia, data appointment dapat tetap ditinjau dari modul appointment dan histori pasien.

### Informasi yang perlu dipantau

- Jumlah appointment per periode
- Status appointment
- Dokter dengan appointment terbanyak
- Pasien yang paling sering berkunjung

`[Placeholder Screenshot: Rekap appointment clinic]`

## 35. Manajemen User

User clinic dikelola dari menu `Setting > User`.

### Langkah

1. Tambahkan user baru.
2. Tentukan role.
3. Simpan data.
4. Lakukan reset password bila diperlukan.

### Saran pengelolaan

- Pisahkan akun resepsionis, kasir, dan admin.
- Berikan akses minimum sesuai kebutuhan kerja.

`[Placeholder Screenshot: Manajemen user clinic]`

## 36. Pengaturan Hak Akses dan Modul

Clinic menggunakan business type dan module package untuk menampilkan fitur.

### Contoh modul clinic

- `clinic_core`
- `clinic_advanced`

### Dampak modul

- Menentukan apakah fitur appointment tersedia.
- Menentukan apakah fitur lanjutan seperti promotion tampil.

`[Placeholder Screenshot: Module settings clinic]`

## 37. Pengaturan Printer

Pengaturan printer clinic digunakan untuk nota pasien dan dokumen cetak singkat.

### Parameter umum

- Thermal atau dot matrix
- 58 mm atau 80 mm
- Font
- Auto print

`[Placeholder Screenshot: Printer settings clinic]`

## 38. Pengaturan Tema

Digunakan untuk menyesuaikan tampilan aplikasi clinic.

`[Placeholder Screenshot: Theme clinic]`

## 39. Backup dan Restore

Backup clinic sangat penting karena menyimpan data operasional pasien dan transaksi.

### Rekomendasi

- Backup setiap hari.
- Simpan file backup di lokasi aman.
- Uji restore pada lingkungan aman bila diperlukan.

`[Placeholder Screenshot: Backup dan restore clinic]`

## 40. Integrasi Telegram

Digunakan untuk konfigurasi notifikasi ke Telegram.

### Contoh penggunaan

- Notifikasi internal operasional.
- Peringatan tertentu untuk admin.

`[Placeholder Screenshot: Telegram clinic]`

## 41. Shortcut Keyboard

### Shortcut toolbar

Mengikuti huruf tanda pada item menu, misalnya:

- `W` untuk Warehouse
- `U` untuk Unit
- `K` untuk Kategori
- `P` untuk Product atau Paket sesuai konteks
- `D` untuk Dokter
- `J` untuk Jadwal Dokter
- `T` untuk Treatment atau Theme sesuai menu aktif

### Shortcut POS

| Tombol | Fungsi |
| --- | --- |
| `Enter` | Konfirmasi input |
| `F6` | Pending transaksi |
| `F7` | Cetak ulang nota |
| `F8` | Cash In |
| `F9` | Cash Out |
| `F10` | Bayar |
| `F11` | Pengaturan nota |
| `Esc` | Menutup popup |

## 42. Tips dan Trick

1. Lengkapi data dokter dan jadwal dokter lebih dahulu.
2. Gunakan data pasien yang konsisten untuk memudahkan histori.
3. Buat appointment sejak awal agar alur resepsionis lebih rapi.
4. Simpan catatan penting pasien pada field yang tersedia.
5. Jalankan backup harian.
6. Audit cash drawer setiap pergantian shift.
7. Cek stok bahan klinik secara berkala.

## 43. Troubleshooting

### Appointment tidak bisa disimpan

- Periksa pasien sudah dipilih.
- Periksa treatment sudah dipilih.
- Periksa dokter dan jadwal.

### Pasien tidak muncul pada pencarian

- Pastikan data pasien sudah disimpan.
- Periksa filter pencarian.
- Pastikan status pasien aktif.

### Transaksi dari appointment tidak masuk ke POS

- Periksa status appointment.
- Periksa alur lanjut ke POS dilakukan dari data yang benar.
- Ulangi proses dari modul appointment.

### Printer tidak mencetak

- Periksa setting printer.
- Periksa ukuran kertas.
- Lakukan test print.

### Data stok tidak sesuai

- Periksa receive, retur, dan opname.
- Audit transaksi item klinik yang terkait.

## 44. FAQ

### Apakah clinic tetap memakai menu Customer?

Ya. Pada clinic, menu tersebut digunakan untuk data pasien.

### Apakah pasien bisa memiliki histori appointment?

Ya. Histori appointment dapat ditinjau dari data pasien bila fitur tersedia.

### Apakah appointment harus dihubungkan ke dokter?

Sangat disarankan agar alur klinik lebih tertib dan mudah dipantau.

### Apakah treatment bisa dijual langsung dari POS?

Ya, selama data treatment sudah tersedia dan modul yang diperlukan aktif.

### Apakah clinic tetap bisa menjual produk fisik?

Ya. Produk fisik dapat dikelola pada master produk dan dijual melalui POS.

### Apakah backup data clinic wajib dilakukan?

Ya, sangat disarankan dilakukan rutin karena data operasional klinik bersifat penting.

## Lampiran

Lihat file pendukung berikut di folder yang sama:

- `PLAN_UserGuide_Clinic.md`
- `SCREENSHOT_CHECKLIST_Clinic.md`
- `README.md`
