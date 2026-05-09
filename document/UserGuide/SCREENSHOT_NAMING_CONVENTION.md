# Screenshot Naming Convention

Dokumen ini digunakan untuk menjaga nama file screenshot tetap rapi, konsisten, dan mudah dicocokkan dengan isi user guide.

## Format Nama File

Gunakan format berikut:

`[business]-[section]-[topic]-[no-urut].png`

## Contoh

- `retail-login-form-01.png`
- `retail-master-product-form-01.png`
- `retail-pos-payment-panel-01.png`
- `clinic-master-patient-form-01.png`
- `clinic-appointment-calendar-01.png`
- `clinic-setting-printer-01.png`

## Aturan Penamaan

- Gunakan huruf kecil semua.
- Gunakan tanda hubung `-` sebagai pemisah.
- Jangan gunakan spasi.
- Gunakan nomor urut dua digit di akhir nama file.
- Gunakan ekstensi yang konsisten, disarankan `.png`.

## Kode Business

- `retail`
- `clinic`

## Kode Section yang Disarankan

- `login`
- `dashboard`
- `master`
- `pos`
- `purchase`
- `inventory`
- `report`
- `setting`
- `appointment`

## Kode Topic yang Disarankan

- `form`
- `table`
- `detail`
- `popup`
- `filter`
- `payment`
- `receipt`
- `calendar`
- `history`

## Contoh Mapping ke User Guide

### Retail

- `retail-dashboard-main-01.png` untuk overview dashboard retail
- `retail-master-product-table-01.png` untuk daftar produk
- `retail-pos-cart-01.png` untuk cart transaksi POS
- `retail-report-sales-01.png` untuk laporan penjualan

### Clinic

- `clinic-master-doctor-table-01.png` untuk daftar dokter
- `clinic-master-patient-history-01.png` untuk history appointment pasien
- `clinic-appointment-form-01.png` untuk form appointment
- `clinic-pos-payment-01.png` untuk pembayaran clinic

## Saran Struktur Folder Screenshot

```text
document/UserGuide/assets/
├── retail/
│   ├── login/
│   ├── dashboard/
│   ├── master/
│   ├── pos/
│   ├── report/
│   └── setting/
└── clinic/
    ├── login/
    ├── dashboard/
    ├── master/
    ├── appointment/
    ├── pos/
    ├── report/
    └── setting/
```

## Catatan

- Jika satu topik membutuhkan lebih dari satu screenshot, naikkan nomor urut di akhir nama file.
- Jika ada screenshot mobile atau versi alternatif, tambahkan penanda tambahan sebelum nomor urut, misalnya `clinic-appointment-calendar-mobile-01.png`.
