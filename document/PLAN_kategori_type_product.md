# PLAN: Penambahan Tipe Product pada Category

## Overview
Menambahkan `product_type` pada master `category` dengan 3 nilai valid:
- `stockable`
- `service`
- `consumable`

Aturan bisnis final:
- `product_type` disimpan di `category`
- product mengikuti `product_type` dari category yang dipilih
- `service`:
  - tanpa stok
  - tab `Adjust Stock` disembunyikan
  - field `Reorder` disembunyikan
  - field `Cost` disembunyikan
  - `cost_price` disimpan sebagai `0`
- `consumable`:
  - stok aktif seperti `stockable`
  - tidak dijual
  - field `Harga Jual` disembunyikan
  - `retail_price` disimpan sebagai `0`

## Tujuan
1. Menambah atribut `product_type` pada category end-to-end.
2. Menyesuaikan UI category untuk memilih tipe product.
3. Menyesuaikan form product agar perilakunya berubah berdasarkan category terpilih.
4. Menjaga kompatibilitas data lama dengan fallback `stockable`.

## Sketsa Visual

### Form Category
```text
+--------------------------------------+
| Kode         [CAT001              ]  |
| Nama         [Jasa Servis         ]  |
| Tipe Product [service           v ]  |
| Deskripsi    [....................]  |
| Parent ID    [....................]  |
+--------------------------------------+
```

### Form Product - Service
```text
+--------------------------------------+
| SKU          [PRD-001             ]  |
| Barcode      [....................]  |
| Nama         [Servis AC           ]  |
| Deskripsi    [....................]  |
| Category     [Jasa Servis        v]  |
| Unit         [PCS               v ]  |
| Harga Jual   [150000             ]   |
| Tax Rate     [11                 ]   |
+--------------------------------------+
| Cost         hidden                  |
| Reorder      hidden                  |
| Adjust Stock hidden                  |
```

### Form Product - Consumable
```text
+--------------------------------------+
| SKU          [PRD-002             ]  |
| Barcode      [....................]  |
| Nama         [Plastik Packing     ]  |
| Deskripsi    [....................]  |
| Category     [Consumable         v]  |
| Unit         [PCS               v ]  |
| Cost         [0 / readonly]         |
| Tax Rate     [0                  ]   |
| Reorder      [10                 ]   |
+--------------------------------------+
| Harga Jual   hidden                  |
| Adjust Stock visible                 |
```

## Technical Implementation

### 1. Backend Category
File terkait:
- `D:\Project\pos_retail\go_backend\internal\models\product.go`
- `D:\Project\pos_retail\go_backend\internal\types\request\category_request.go`
- `D:\Project\pos_retail\go_backend\internal\services\product_service.go`
- `D:\Project\pos_retail\go_backend\internal\handlers\product_handler.go`

Perubahan:
- Tambah field `ProductType string` pada model `Category`.
- Gunakan default `stockable` untuk data baru dan fallback data lama.
- Tambah validasi nilai `product_type` agar hanya menerima:
  - `stockable`
  - `service`
  - `consumable`
- Tambah `product_type` pada request create/update category.
- Pastikan response list/get category mengembalikan `product_type`.

Catatan:
- Backend menggunakan `AutoMigrate`, jadi penambahan field pada model akan ikut termigrasi.
- Tetap perlu fallback aman untuk row lama yang `NULL` atau kosong.

### 2. Frontend Category
File terkait:
- `src/components/ToolbarItem/master/Category.jsx`
- `src/features/master/category/category.api.js`

Perubahan:
- Tambah `product_type` di `DEFAULT_FORM`.
- Tambah dropdown `Tipe Product` pada form category.
- Tambah `product_type` ke payload create/update.
- Tambah kolom `TYPE` pada tabel category.
- Tambah kolom `product_type` pada import/export Excel category.

### 3. Frontend Product
File terkait:
- `src/components/ToolbarItem/master/Product.jsx`
- `src/features/master/category/category.api.js`

Perubahan utama:
- Pastikan lookup category mengandung `product_type`.
- Buat resolver category terpilih berdasarkan `form.category_id`.
- Buat flag UI:
  - `isServiceCategory`
  - `isConsumableCategory`
  - `isStockManagedCategory`
- Atur tampilan form:
  - `service`: sembunyikan `Cost`, `Reorder`, tab `Adjust Stock`
  - `consumable`: sembunyikan `Harga Jual`
  - `stockable`: tampilkan field normal
- Saat category berubah:
  - `service` => paksa `cost_price = 0`, `reorder_point = 0`
  - `consumable` => paksa `retail_price = 0`

### 4. Validasi Save Product
File terkait:
- `src/components/ToolbarItem/master/Product.jsx`
- `D:\Project\pos_retail\go_backend\internal\types\request\product_request.go`
- `D:\Project\pos_retail\go_backend\internal\services\product_service.go`
- `D:\Project\pos_retail\go_backend\internal\handlers\product_handler.go`

Perubahan:
- Pastikan create/update product bisa menerima `cost_price = 0` dan `retail_price = 0` sesuai tipe category.
- `service` wajib kirim `cost_price: 0`.
- `consumable` wajib kirim `retail_price: 0`.
- Review validator backend yang saat ini masih ketat untuk field harga.

### 5. Backward Compatibility
- Data category lama tanpa `product_type` dibaca sebagai `stockable`.
- Product lama tetap bisa ditampilkan tanpa migrasi destruktif.
- UI hanya enforce aturan baru saat create/update ke depan.

## Planned File Changes
1. `D:\Project\pos_retail\go_backend\internal\models\product.go`
2. `D:\Project\pos_retail\go_backend\internal\types\request\category_request.go`
3. `D:\Project\pos_retail\go_backend\internal\types\request\product_request.go`
4. `D:\Project\pos_retail\go_backend\internal\services\product_service.go`
5. `D:\Project\pos_retail\go_backend\internal\handlers\product_handler.go`
6. `src/features/master/category/category.api.js`
7. `src/components/ToolbarItem/master/Category.jsx`
8. `src/components/ToolbarItem/master/Product.jsx`

## Validation Checklist
1. Create category dengan `stockable`, `service`, `consumable` berhasil.
2. Update category dan ubah `product_type` berhasil.
3. List/get category mengembalikan `product_type`.
4. Form category menampilkan dropdown `Tipe Product`.
5. Tabel category menampilkan kolom tipe.
6. Product dengan category `service` menyembunyikan `Cost`, `Reorder`, dan tab `Adjust Stock`.
7. Product dengan category `consumable` menyembunyikan `Harga Jual`.
8. Save product `service` mengirim `cost_price = 0`.
9. Save product `consumable` mengirim `retail_price = 0`.
10. `npm run lint` frontend lulus.
11. `npm run build` frontend lulus.
12. Build/test backend lulus setelah validasi request diperbarui.

## Risiko & Mitigasi

### Risiko 1: Data lama belum punya `product_type`
Mitigasi:
- Default/fallback ke `stockable` di backend dan frontend.

### Risiko 2: Validasi backend product menolak nilai `0`
Mitigasi:
- Sesuaikan validator dan logic service agar `0` valid untuk kasus `service` dan `consumable`.

### Risiko 3: Import/export category belum sinkron
Mitigasi:
- Tambahkan kolom `product_type` di template, export, dan import category.

### Risiko 4: Product existing tidak sesuai rule tipe category baru
Mitigasi:
- UI enforce hanya pada proses edit/create baru.
- Hindari migrasi destruktif terhadap data existing.

## Urutan Implementasi Disarankan
1. Backend category dan validasi product.
2. Frontend category.
3. Frontend product.
4. Verifikasi lint/build frontend dan backend.
