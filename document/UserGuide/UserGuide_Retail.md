# User Guide Retail - POSXPRESS

## Cover

**Produk**: POSXPRESS  
**Tipe Business**: Retail  
**Jenis Dokumen**: User Guide Client  
**Bahasa**: Indonesia  
**Audiens**: Admin, Manager, Cashier, Staff  
**Status Dokumen**: Draft Siap Review  
**Lokasi File**: `document/UserGuide/UserGuide_Retail.md`

### Ringkasan Dokumen

Dokumen ini berisi panduan penggunaan aplikasi POSXPRESS untuk tipe business retail. Isi dokumen mencakup setup awal, master data, operasional POS, transaksi lanjutan, laporan, pengaturan sistem, troubleshooting, dan referensi shortcut keyboard.

### Catatan Distribusi

- Ganti seluruh placeholder screenshot sebelum dokumen dibagikan ke client.
- Sesuaikan istilah bisnis dengan kebiasaan operasional client bila diperlukan.
- Gunakan data dummy atau data demo saat membuat screenshot final.

## Dokumen

- Nama dokumen: `UserGuide_Retail.md`
- Tipe bisnis: Retail
- Target pengguna: Admin, Manager, Cashier, Staff
- Format: Panduan operasional dasar dan lanjutan

## Informasi Dokumen

- Produk: POSXPRESS
- Business type: Retail
- Bahasa: Indonesia
- Audiens: Client, admin outlet, manager, kasir, dan staff operasional
- Status: Draft siap review

## Cara Menggunakan Dokumen

1. Baca bagian `Pendahuluan` dan `Navigasi Menu` terlebih dahulu.
2. Untuk kebutuhan setup awal, mulai dari bagian `Pengaturan Company` sampai `Manajemen Paket`.
3. Untuk kebutuhan operasional kasir, fokus pada bagian `Layar Kasir POS` sampai `Cash In, Cash Out, dan Tutup Drawer`.
4. Untuk kebutuhan monitoring, gunakan bagian `Laporan` dan `Pengaturan`.
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
10. Manajemen Customer
11. Manajemen Supplier
12. Manajemen Paket
13. Layar Kasir POS
14. Pencarian Produk
15. Input Transaksi
16. Metode Pembayaran
17. Cetak Nota atau Struk
18. Pending dan Cetak Ulang Nota
19. Cash In, Cash Out, dan Tutup Drawer
20. Order Pembelian
21. Penerimaan Barang
22. Retur Pembelian
23. Stock Opname
24. Promotion
25. Laporan Penjualan
26. Laporan Pembelian
27. Laporan Stock
28. Laporan Cash Drawer
29. Laporan Laba Rugi
30. Laporan Pengeluaran
31. Manajemen User
32. Pengaturan Printer
33. Pengaturan Tema
34. Backup dan Restore
35. Integrasi Telegram
36. Pengaturan Modul
37. Shortcut Keyboard
38. Tips dan Trick
39. Troubleshooting
40. FAQ

## 1. Pendahuluan

POSXPRESS Retail adalah aplikasi point of sale untuk operasional toko retail, minimarket, supermarket, dan usaha sejenis. Aplikasi ini membantu proses transaksi kasir, pengelolaan master data, pembelian, stok, laporan, dan pengaturan sistem dalam satu platform.

### Tujuan penggunaan

- Mempercepat transaksi penjualan di kasir.
- Menjaga akurasi data stok dan pembelian.
- Memudahkan pemantauan penjualan dan kondisi usaha.
- Menyediakan kontrol akses untuk beberapa jenis pengguna.

### Role pengguna

| Role | Fungsi utama |
| --- | --- |
| Admin | Mengatur master data, laporan, user, setting, dan monitoring penuh |
| Manager | Mengakses data operasional dan laporan sesuai hak akses |
| Cashier | Menjalankan transaksi penjualan di POS |
| Staff | Menjalankan pekerjaan operasional sesuai akses yang diberikan |

### Modul utama

- Master
- Transaksi
- Laporan
- Setting
- Help

### Alur kerja singkat retail

1. Login ke aplikasi.
2. Admin menyiapkan data company, warehouse, satuan, kategori, produk, customer, dan supplier.
3. Kasir membuka cash drawer dan menjalankan transaksi penjualan.
4. Tim operasional mengelola pembelian, penerimaan barang, retur, dan stock opname.
5. Admin atau manager meninjau laporan dan menjalankan backup berkala.

`[Placeholder Screenshot: Halaman utama aplikasi POSXPRESS Retail]`

## 2. Login dan Logout

### Tujuan

Fitur login digunakan untuk mengidentifikasi pengguna dan menampilkan akses sesuai role.

### Langkah login

1. Jalankan aplikasi POSXPRESS.
2. Pada halaman login, masukkan username.
3. Masukkan password.
4. Klik tombol `Login`.
5. Tunggu sampai sistem memverifikasi akun.

### Hasil login berdasarkan role

- Admin, Manager, dan Staff akan masuk ke Dashboard.
- Cashier dapat diarahkan langsung ke layar POS, tergantung konfigurasi aplikasi.

### Logout

1. Buka menu toolbar yang sedang aktif.
2. Klik item `Logout`.
3. Tunggu sampai aplikasi kembali ke halaman login.

### Catatan penting

- Jika token login sudah tidak berlaku, sistem dapat meminta login ulang.
- Pastikan akun yang digunakan sesuai divisi kerja untuk menghindari kesalahan input data.

`[Placeholder Screenshot: Form login]`

## 3. Overview Dashboard

Dashboard adalah halaman utama untuk pengguna non-kasir setelah login.

### Struktur dashboard

- Header: Menampilkan identitas aplikasi atau company.
- Menu bar: Menampilkan menu `Master`, `Transaksi`, `Laporan`, `Setting`, dan `Help`.
- Toolbar: Menampilkan daftar tool sesuai menu yang dipilih.
- Canvas: Area kerja utama tempat form, tabel, dan laporan ditampilkan.
- Footer: Menampilkan informasi pengguna dan status sistem.

### Fungsi dashboard

- Memudahkan perpindahan antar modul.
- Menampilkan fitur sesuai business type dan module package.
- Menjaga konsistensi alur kerja antar pengguna.

`[Placeholder Screenshot: Dashboard admin retail]`

## 4. Navigasi Menu

### Menu Master

Digunakan untuk pengelolaan data dasar:

- Warehouse
- Unit
- Kategori
- Product
- Customer
- Supplier
- Paket

### Menu Transaksi

Digunakan untuk operasional harian:

- Penjualan
- Promotion
- Order Pembelian
- Stock Receive
- Retur Pembelian
- Stock Opname

### Menu Laporan

Digunakan untuk pemantauan bisnis:

- Detail Penjualan
- Lap. Cash Drawer
- Lap. Harga Grosir
- Detil Pembelian
- Lap. Stok
- Laporan Laba Rugi
- Laporan Pengeluaran

### Menu Setting

Digunakan untuk pengaturan sistem:

- Theme
- User
- Company
- Business Type
- Module Package
- Report Settings
- Backup and Restore
- Telegram

### Menu Help

Digunakan untuk informasi aplikasi, misalnya `About`.

`[Placeholder Screenshot: Menu bar dan toolbar retail]`

## 5. Pengaturan Company

Menu `Company` digunakan untuk mengelola identitas perusahaan yang tampil pada sistem dan dokumen laporan.

### Data yang dapat diatur

- Kode company
- Nama company
- Email
- Telepon
- Website
- Alamat
- Tax ID atau NPWP
- Business license
- Business type
- Module package

### Langkah pengaturan

1. Buka menu `Setting`.
2. Klik `Company`.
3. Klik tombol edit jika form masih dalam mode baca.
4. Isi atau perbarui data perusahaan.
5. Klik tombol `Simpan`.

### Dampak data company

- Muncul pada laporan.
- Menjadi acuan business type dan module package aktif.
- Dapat dipakai pada header dokumen cetak.

`[Placeholder Screenshot: Form company setting]`

## 6. Manajemen Warehouse

Warehouse digunakan untuk mendefinisikan gudang atau lokasi penyimpanan barang.

### Fungsi warehouse

- Menjadi lokasi stok utama.
- Dipakai pada transaksi pembelian dan inventory.
- Mempermudah kontrol stok per lokasi.

### Langkah membuat warehouse

1. Buka menu `Master`.
2. Klik `Warehouse`.
3. Klik tombol tambah data.
4. Isi nama warehouse dan data lain yang tersedia.
5. Jika diperlukan, tandai sebagai warehouse default.
6. Klik tombol `Simpan`.

### Operasi lain

- Klik data untuk melihat detail.
- Klik edit untuk memperbarui data.
- Ubah status aktif atau nonaktif bila fitur tersedia.

`[Placeholder Screenshot: Daftar warehouse]`

## 7. Manajemen Satuan

Satuan atau unit digunakan untuk mendefinisikan bentuk penjualan atau penyimpanan barang seperti `pcs`, `box`, `kg`, atau `liter`.

### Langkah membuat satuan

1. Buka menu `Master`.
2. Klik `Unit`.
3. Klik tombol tambah.
4. Isi nama atau kode satuan.
5. Klik tombol `Simpan`.

### Praktik yang disarankan

- Gunakan nama satuan yang konsisten.
- Hindari duplikasi satuan dengan penulisan berbeda.

`[Placeholder Screenshot: Daftar satuan]`

## 8. Manajemen Kategori

Kategori membantu pengelompokan produk agar pencarian, laporan, dan tampilan POS menjadi lebih mudah.

### Langkah membuat kategori

1. Buka menu `Master`.
2. Klik `Kategori`.
3. Klik tombol tambah.
4. Isi nama kategori.
5. Atur status aktif jika tersedia.
6. Klik tombol `Simpan`.

### Manfaat kategori

- Memudahkan filter produk.
- Menyederhanakan laporan stok dan penjualan.
- Membantu penataan produk di POS.

`[Placeholder Screenshot: Daftar kategori]`

## 9. Manajemen Produk

Produk adalah data utama pada bisnis retail. Pastikan data produk lengkap sebelum transaksi dimulai.

### Data produk yang umum digunakan

- SKU
- Barcode
- Nama produk
- Kategori
- Unit
- Cost price
- Retail price
- Tax rate atau PPN
- Reorder point
- Status aktif
- Tipe produk
- Price tier grosir

### Tipe produk

- Stockable: barang yang mempengaruhi stok.
- Service: jasa, tidak memerlukan stok fisik.
- Consumable: item tertentu yang dapat memiliki perlakuan harga khusus.

### Langkah membuat produk

1. Buka menu `Master`.
2. Klik `Product`.
3. Klik tombol tambah.
4. Isi `SKU`.
5. Isi `Barcode` jika tersedia.
6. Isi `Nama Produk`.
7. Pilih `Kategori`.
8. Pilih `Unit`.
9. Isi `Cost Price`.
10. Isi `Retail Price`.
11. Isi `PPN` jika digunakan.
12. Isi `Reorder Point`.
13. Tentukan `Tipe Produk`.
14. Atur `Grosir 1`, `Grosir 2`, dan `Grosir 3` bila diperlukan.
15. Klik tombol `Simpan`.

### Aturan grosir yang perlu diperhatikan

- Kuantitas minimum grosir harus lebih dari 1.
- Nilai kuantitas grosir berikutnya harus lebih besar dari tier sebelumnya.
- Harga grosir harus lebih kecil dari harga retail atau tier sebelumnya.

### Pencarian dan filter

Produk dapat dicari berdasarkan:

- Nama
- SKU
- Barcode
- Status

### Import produk

Jika fitur import tersedia pada toolbar, gunakan file template yang sesuai struktur sistem agar proses import berhasil.

`[Placeholder Screenshot: Form produk]`

`[Placeholder Screenshot: Tabel daftar produk]`

## 10. Manajemen Customer

Customer digunakan untuk mendata pelanggan retail, member, atau pelanggan tetap.

### Data customer yang umum digunakan

- Kode atau ID customer
- Nama customer
- Nomor telepon
- Email
- Alamat
- Status aktif

### Langkah membuat customer

1. Buka menu `Master`.
2. Klik `Customer`.
3. Klik tombol tambah.
4. Isi data customer.
5. Klik tombol `Simpan`.

### Manfaat customer

- Mencatat histori transaksi pelanggan.
- Mendukung pelayanan member.
- Membantu analisis penjualan per pelanggan.

`[Placeholder Screenshot: Daftar customer]`

## 11. Manajemen Supplier

Supplier digunakan sebagai referensi pada transaksi pembelian, penerimaan barang, dan retur pembelian.

### Data supplier yang umum digunakan

- Nama supplier
- Nomor telepon
- Email
- Alamat
- Status aktif

### Langkah membuat supplier

1. Buka menu `Master`.
2. Klik `Supplier`.
3. Klik tombol tambah.
4. Isi data supplier.
5. Klik tombol `Simpan`.

`[Placeholder Screenshot: Daftar supplier]`

## 12. Manajemen Paket

Paket digunakan untuk menjual beberapa item sebagai satu set penawaran.

### Contoh penggunaan

- Paket sembako.
- Paket promosi mingguan.
- Paket bundling produk tertentu.

### Langkah membuat paket

1. Buka menu `Master`.
2. Klik `Paket`.
3. Klik tombol tambah.
4. Isi nama paket.
5. Pilih item yang termasuk ke dalam paket.
6. Tentukan harga paket.
7. Simpan data.

`[Placeholder Screenshot: Form paket]`

## 13. Layar Kasir POS

Layar POS adalah pusat operasional transaksi penjualan.

### Area utama POS

- Input pencarian barang
- Daftar item transaksi
- Informasi subtotal dan total
- Pilihan metode pembayaran
- Area nominal bayar
- Tombol aksi transaksi

### Persiapan sebelum transaksi

1. Pastikan kasir sudah login.
2. Pastikan cash drawer sudah dibuka.
3. Pastikan printer aktif jika nota akan dicetak.
4. Pastikan produk sudah tersedia pada master data.

`[Placeholder Screenshot: Layar POS retail]`

## 14. Pencarian Produk

### Metode pencarian

- Scan barcode.
- Ketik nama produk.
- Ketik SKU.
- Ketik barcode manual.
- Gunakan format `?keyword` untuk memunculkan hasil pencarian lanjutan jika fitur popup tersedia.

### Contoh

- Ketik `8991234567001` untuk produk berdasarkan barcode.
- Ketik `biskuit` untuk pencarian nama.
- Ketik `?minuman` untuk membuka daftar hasil pencarian.

`[Placeholder Screenshot: Kolom pencarian produk]`

## 15. Input Transaksi

### Langkah transaksi dasar

1. Cari produk.
2. Tekan `Enter` atau klik item untuk menambah ke cart.
3. Ulangi sampai semua item masuk ke transaksi.
4. Periksa kuantitas, harga, dan diskon.
5. Lanjutkan ke pembayaran.

### Mengubah kuantitas

- Masukkan format `+jumlah` bila fitur ini aktif pada kolom input.
- Contoh: ketik `+3` untuk mengubah kuantitas item menjadi 3.

### Menghapus item

- Pilih item pada daftar transaksi.
- Gunakan tombol hapus atau aksi delete sesuai tampilan layar.

### Hal yang perlu diperiksa sebelum bayar

- Nama item sudah sesuai.
- Kuantitas sudah benar.
- Harga sudah benar.
- Customer sudah dipilih jika diperlukan.

`[Placeholder Screenshot: Cart transaksi POS]`

## 16. Metode Pembayaran

POSXPRESS Retail mendukung beberapa metode pembayaran utama.

### Cash

1. Pilih metode `CASH`.
2. Masukkan nominal bayar.
3. Klik tombol bayar atau tekan `F10`.
4. Sistem menghitung kembalian otomatis jika nominal lebih besar dari total.

### QRIS

1. Pilih metode `QRIS`.
2. Pastikan pembayaran sudah diterima di sisi merchant.
3. Klik konfirmasi pembayaran.

### Transfer

1. Pilih metode `TRANSFER`.
2. Isi nomor referensi atau rekening jika diminta.
3. Klik konfirmasi pembayaran.

### Catatan

- Untuk metode `TRANSFER`, isi nomor referensi agar audit transaksi lebih mudah.
- Untuk `CASH`, nominal bayar tidak boleh kurang dari total transaksi.

`[Placeholder Screenshot: Panel pembayaran POS]`

## 17. Cetak Nota atau Struk

### Tujuan

Nota digunakan sebagai bukti transaksi untuk pelanggan dan arsip internal.

### Tipe printer yang didukung

- Thermal
- Dot matrix

### Ukuran kertas yang umum digunakan

- 58 mm
- 80 mm

### Langkah cetak nota

1. Selesaikan pembayaran.
2. Pastikan pengaturan printer sudah benar.
3. Jika auto print aktif, sistem mencetak otomatis.
4. Jika auto print nonaktif, klik tombol cetak pada transaksi selesai.

### Isi nota yang umum tampil

- Nama company
- Nomor nota
- Tanggal dan jam
- Nama kasir
- Detail item
- Total belanja
- Metode pembayaran
- Kembalian

`[Placeholder Screenshot: Contoh hasil cetak nota]`

## 18. Pending dan Cetak Ulang Nota

### Pending nota

Fitur pending digunakan untuk menyimpan transaksi sementara tanpa menyelesaikan pembayaran.

### Langkah menyimpan pending

1. Pastikan item transaksi sudah masuk ke cart.
2. Tekan `F6` atau gunakan tombol pending.
3. Sistem menyimpan transaksi ke daftar pending.

### Mengembalikan pending

1. Buka daftar pending.
2. Pilih transaksi yang akan dilanjutkan.
3. Klik restore atau tekan `Enter`.

### Cetak ulang nota

1. Tekan `F7` atau buka daftar transaksi cetak ulang.
2. Pilih nota yang akan dicetak ulang.
3. Klik cetak.

`[Placeholder Screenshot: Popup nota pending]`

`[Placeholder Screenshot: Popup cetak ulang nota]`

## 19. Cash In, Cash Out, dan Tutup Drawer

### Cash In

Digunakan saat ada penambahan uang kas di laci kasir.

Langkah:

1. Tekan `F8`.
2. Isi nominal.
3. Isi keterangan.
4. Klik konfirmasi.

### Cash Out

Digunakan saat ada pengeluaran uang kas dari laci kasir.

Langkah:

1. Tekan `F9`.
2. Isi nominal.
3. Isi alasan pengeluaran.
4. Klik konfirmasi.

### Tutup drawer

Digunakan pada akhir shift.

Langkah:

1. Pastikan semua transaksi selesai.
2. Buka form closing drawer.
3. Isi saldo fisik akhir jika diminta.
4. Periksa ringkasan cash in, cash out, dan penjualan.
5. Klik tombol konfirmasi tutup drawer.

`[Placeholder Screenshot: Form cash in]`

`[Placeholder Screenshot: Form cash out]`

`[Placeholder Screenshot: Form closing drawer]`

## 20. Order Pembelian

Order pembelian digunakan untuk membuat pesanan barang ke supplier.

### Langkah membuat order pembelian

1. Buka menu `Transaksi`.
2. Pilih `Pembelian`, lalu klik `Order Pembelian`.
3. Pilih supplier.
4. Pilih warehouse tujuan jika tersedia.
5. Tambahkan item barang.
6. Isi kuantitas dan harga beli jika diperlukan.
7. Simpan order pembelian.

### Tujuan order pembelian

- Menjadi dasar penerimaan barang.
- Memudahkan kontrol barang yang dipesan.
- Mengurangi kesalahan pembelian manual.

`[Placeholder Screenshot: Form order pembelian]`

## 21. Penerimaan Barang

Penerimaan barang atau `Stock Receive` digunakan saat barang dari supplier sudah datang.

### Langkah menerima barang

1. Buka menu `Stock Receive`.
2. Pilih dokumen pembelian terkait jika tersedia.
3. Periksa item yang datang.
4. Isi kuantitas aktual yang diterima.
5. Simpan penerimaan.

### Manfaat

- Menambah stok barang.
- Mencatat selisih antara barang dipesan dan barang diterima.

`[Placeholder Screenshot: Form stock receive]`

## 22. Retur Pembelian

Retur pembelian digunakan saat barang dari supplier harus dikembalikan.

### Kondisi umum retur

- Barang rusak.
- Barang salah kirim.
- Jumlah tidak sesuai.
- Kualitas barang tidak memenuhi standar.

### Langkah retur pembelian

1. Buka menu `Retur Pembelian`.
2. Pilih supplier atau dokumen terkait.
3. Tambahkan item yang akan diretur.
4. Isi jumlah retur.
5. Isi alasan retur.
6. Simpan data retur.

`[Placeholder Screenshot: Form retur pembelian]`

## 23. Stock Opname

Stock opname digunakan untuk mencocokkan stok fisik dengan stok sistem.

### Kapan stock opname dilakukan

- Harian untuk item tertentu.
- Mingguan atau bulanan.
- Saat audit internal.
- Saat ditemukan selisih stok.

### Langkah stock opname

1. Buka menu `Stock Opname`.
2. Buat sesi stock opname baru.
3. Pilih warehouse bila tersedia.
4. Hitung stok fisik barang.
5. Input jumlah aktual.
6. Simpan hasil opname.
7. Lakukan penyesuaian stok jika disetujui.

### Hasil yang perlu ditinjau

- Selisih lebih.
- Selisih kurang.
- Barang kosong.

`[Placeholder Screenshot: Form stock opname]`

## 24. Promotion

Promotion digunakan untuk mengatur diskon dan penawaran khusus pada produk tertentu.

### Jenis promosi yang umum

- Diskon persentase
- Diskon nominal tetap
- Buy X Get Y
- Flash sale

### Cakupan promosi

- Semua produk
- Berdasarkan kategori
- Berdasarkan produk tertentu

### Langkah membuat promosi

1. Buka menu `Transaksi`.
2. Klik `Promotion`.
3. Klik tombol tambah.
4. Pilih tipe promosi.
5. Tentukan produk atau kategori target.
6. Tentukan nilai promosi.
7. Atur periode promosi.
8. Simpan data.

`[Placeholder Screenshot: Form promotion]`

## 25. Laporan Penjualan

Laporan penjualan digunakan untuk memantau performa transaksi.

### Filter yang umum digunakan

- Tanggal
- Kasir
- Metode pembayaran
- Kata kunci

### Informasi yang biasanya ditampilkan

- Nomor transaksi
- Tanggal transaksi
- Kasir
- Total penjualan
- Metode pembayaran

`[Placeholder Screenshot: Laporan penjualan]`

## 26. Laporan Pembelian

Laporan pembelian digunakan untuk meninjau aktivitas order dan penerimaan barang.

### Fungsi utama

- Meninjau histori pembelian.
- Memeriksa supplier aktif.
- Membandingkan jumlah order dan receive.

`[Placeholder Screenshot: Laporan pembelian]`

## 27. Laporan Stock

Laporan stock digunakan untuk melihat posisi stok barang.

### Informasi yang biasanya tersedia

- Nama produk
- Kategori
- Warehouse
- Stok tersedia
- Minimum stok

### Manfaat laporan stock

- Menentukan barang yang perlu dibeli ulang.
- Mengidentifikasi slow moving item.
- Membantu jadwal stock opname.

`[Placeholder Screenshot: Laporan stock]`

## 28. Laporan Cash Drawer

Laporan cash drawer digunakan untuk audit kas per shift.

### Informasi utama

- Kas awal
- Cash in
- Cash out
- Penjualan tunai
- Saldo akhir

`[Placeholder Screenshot: Laporan cash drawer]`

## 29. Laporan Laba Rugi

Laporan laba rugi digunakan untuk melihat pendapatan, biaya pokok, dan profit usaha.

### Manfaat

- Menilai kesehatan usaha.
- Membandingkan periode penjualan.
- Mengambil keputusan bisnis.

`[Placeholder Screenshot: Laporan laba rugi]`

## 30. Laporan Pengeluaran

Laporan pengeluaran digunakan untuk memonitor biaya operasional di luar transaksi pembelian stok.

### Contoh pengeluaran

- Biaya transportasi
- Biaya listrik
- Biaya kebersihan
- Biaya operasional kas kecil

`[Placeholder Screenshot: Laporan pengeluaran]`

## 31. Manajemen User

Menu `User` digunakan untuk mengelola akun pengguna aplikasi.

### Role yang tersedia

- Admin
- Manager
- Cashier
- Staff

### Langkah menambah user

1. Buka menu `Setting`.
2. Klik `User`.
3. Klik tombol tambah.
4. Isi username dan data pendukung.
5. Pilih role.
6. Simpan data.

### Praktik keamanan

- Gunakan password kuat.
- Hindari berbagi akun antar karyawan.
- Nonaktifkan user yang sudah tidak bekerja.

`[Placeholder Screenshot: Daftar user]`

## 32. Pengaturan Printer

Pengaturan printer digunakan untuk menyesuaikan hasil cetak nota.

### Parameter yang umum diatur

- Printer type
- Paper size
- Port atau printer name
- Font
- Auto print after payment

### Langkah pengaturan

1. Buka pengaturan printer atau pengaturan receipt jika tersedia.
2. Pilih tipe printer.
3. Pilih ukuran kertas.
4. Simpan konfigurasi.
5. Jalankan test print.

### Rekomendasi

- Gunakan 80 mm untuk struk yang lebih lega.
- Gunakan thermal untuk kasir dengan volume transaksi tinggi.

`[Placeholder Screenshot: Pengaturan printer]`

## 33. Pengaturan Tema

Menu `Theme` digunakan untuk mengubah tampilan visual aplikasi.

### Contoh pengaturan

- Wallpaper dashboard
- Warna title bar
- Nuansa tampilan umum

### Langkah

1. Buka menu `Setting`.
2. Klik `Theme`.
3. Pilih tema yang diinginkan.
4. Simpan perubahan.

`[Placeholder Screenshot: Pengaturan theme]`

## 34. Backup dan Restore

Backup dan restore digunakan untuk melindungi data usaha.

### Kapan backup dilakukan

- Setiap hari setelah operasional selesai.
- Sebelum update aplikasi.
- Sebelum migrasi perangkat.

### Langkah backup

1. Buka menu `Setting`.
2. Klik `Backup and Restore`.
3. Klik tombol `Backup`.
4. Pilih lokasi penyimpanan file.
5. Simpan file backup.

### Langkah restore

1. Buka menu yang sama.
2. Klik tombol `Restore`.
3. Pilih file backup yang valid.
4. Konfirmasi proses restore.

### Peringatan

- Pastikan file backup berasal dari sistem yang benar.
- Lakukan backup terbaru sebelum restore.

`[Placeholder Screenshot: Backup dan restore]`

## 35. Integrasi Telegram

Menu `Telegram` digunakan untuk konfigurasi notifikasi otomatis ke Telegram.

### Kegunaan

- Notifikasi operasional.
- Informasi tertentu ke owner atau admin.

### Data yang biasanya dibutuhkan

- Bot token
- Chat ID atau tujuan pengiriman

### Langkah konfigurasi

1. Buka menu `Setting`.
2. Klik `Telegram`.
3. Isi token dan identitas tujuan notifikasi.
4. Simpan konfigurasi.
5. Jalankan test jika tersedia.

`[Placeholder Screenshot: Setting Telegram]`

## 36. Pengaturan Modul

Pengaturan modul digunakan untuk melihat modul bisnis yang aktif pada company.

### Contoh modul retail

- `retail_basic`
- `retail_advanced`

### Fungsi

- Menentukan fitur apa saja yang tampil.
- Menyesuaikan kemampuan sistem dengan paket bisnis.

`[Placeholder Screenshot: Module settings retail]`

## 37. Shortcut Keyboard

### Shortcut menu toolbar

Setiap menu memiliki huruf shortcut pada item toolbar, misalnya:

- `W` untuk Warehouse
- `U` untuk Unit
- `K` untuk Kategori
- `P` untuk Product
- `C` untuk Customer
- `S` untuk Supplier
- `T` untuk Theme

### Shortcut POS

| Tombol | Fungsi |
| --- | --- |
| `Enter` | Konfirmasi input atau pilih item |
| `F6` | Buka atau simpan pending note sesuai konteks |
| `F7` | Cetak ulang nota |
| `F8` | Cash In |
| `F9` | Cash Out |
| `F10` | Bayar |
| `F11` | Setting nota atau receipt |
| `Esc` | Menutup popup tertentu |

## 38. Tips dan Trick

1. Lengkapi master data sebelum hari operasional dimulai.
2. Gunakan barcode scanner untuk mempercepat transaksi.
3. Atur reorder point untuk produk cepat habis.
4. Gunakan customer untuk pelanggan tetap.
5. Jalankan backup rutin setiap hari.
6. Review laporan cash drawer pada setiap akhir shift.
7. Pisahkan hak akses kasir dan admin.

## 39. Troubleshooting

### Tidak bisa login

- Periksa username dan password.
- Pastikan koneksi ke backend tersedia.
- Hubungi admin jika akun dinonaktifkan.

### Produk tidak muncul di POS

- Periksa status produk aktif.
- Periksa kategori dan data produk sudah tersimpan.
- Periksa modul atau business type yang aktif.

### Printer tidak mencetak

- Periksa printer menyala.
- Periksa jenis printer dan ukuran kertas.
- Jalankan test print.

### Selisih kas drawer

- Periksa transaksi cash in dan cash out.
- Cocokkan uang fisik dengan laporan shift.
- Tinjau transaksi terakhir sebelum closing.

### Stock tidak sesuai

- Periksa transaksi receive dan retur.
- Jalankan stock opname.
- Tinjau input manual yang salah.

## 40. FAQ

### Apakah semua user bisa melihat semua menu?

Tidak. Akses menu mengikuti role user dan konfigurasi modul.

### Apakah kasir bisa langsung masuk ke POS?

Ya, alur ini dapat terjadi sesuai role dan implementasi aplikasi.

### Apakah produk bisa dijual tanpa barcode?

Bisa. Produk masih dapat dicari berdasarkan nama atau SKU.

### Apakah nota bisa dicetak ulang?

Bisa. Gunakan fitur cetak ulang nota.

### Apakah backup harus dilakukan setiap hari?

Sangat disarankan, terutama untuk toko dengan transaksi aktif setiap hari.

### Apakah promotion harus selalu aktif?

Tidak. Promotion dapat dibuat sesuai periode atau kebutuhan promosi usaha.

## Lampiran

Lihat file pendukung berikut di folder yang sama:

- `PLAN_UserGuide_Retail.md`
- `SCREENSHOT_CHECKLIST_Retail.md`
- `README.md`
