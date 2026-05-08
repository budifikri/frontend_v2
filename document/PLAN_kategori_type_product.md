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
4. Filter laporan stock (exclude service & consumable).
5. Filter POS/penjualan (exclude consumable, unlock service).
6. Verifikasi lint/build frontend dan backend.

---

# PHASE 2: Filter Berdasarkan Tipe Product (Laporan Stock & POS)

## Overview
Menerapkan aturan bisnis untuk tipe product `service` dan `consumable`:

| Tipe | Laporan Stock | Penjualan (POS) | Stock Lock |
|------|---------------|-----------------|------------|
| **Stockable** | Muncul | Muncul | Terkunci (cek stock) |
| **Service** | Tidak muncul | Muncul | Tidak terkunci |
| **Consumable** | Tidak muncul | Tidak muncul | - |

## Sketsa Visual

### Laporan Stock - Hanya Stockable
```text
+----------------------------------------------------------+
| Laporan Stock                                            |
+----------------------------------------------------------+
| Search: [____]  Warehouse: [Semua v]  Category: [Semua v]|
| Stock: [Available ▼]                                     |
+----------------------------------------------------------+
| No | SKU    | Nama      | Category  | Qty  | Gudang     |
|----|--------|-----------|-----------|------|------------|
| 1  | PRD001 | Mouse     | Aksesoris | 50   | Utama      |
| 2  | PRD002 | Keyboard  | Aksesoris | 30   | Utama      |
+----------------------------------------------------------+
| Hanya produk stockable yang ditampilkan                  |
| Produk service & consumable TIDAK muncul                 |
+----------------------------------------------------------+
```

### POS - Catalog (Tanpa Consumable)
```text
+----------------------------------------------------------+
|  POS - Kasir                                             |
+----------------------------------------------------------+
| Search: [servis              ]                           |
+----------------------------------------------------------+
| [Servis AC        ] [Ganti Oli        ] [Cuci Motor   ]  |
|  Rp 150.000          Rp 80.000          Rp 25.000        |
|  [service]           [service]          [service]         |
+----------------------------------------------------------+
| Produk consumable TIDAK muncul di catalog                |
| Produk service muncul tanpa stock lock                   |
+----------------------------------------------------------+
```

### POS - Cart dengan Service (Unlock Stock)
```text
+----------------------------------------------------------+
| Keranjang                                    Total: 230K |
+----------------------------------------------------------+
| Item              | Qty | Harga    | Subtotal             |
|-------------------|-----|----------|----------------------|
| Servis AC         |  1  | 150.000  | 150.000  [service]   |
| Mouse Wireless    |  1  |  80.000  |  80.000  [stockable] |
+----------------------------------------------------------+
| Note: Service item tidak dicek stock-nya                  |
| Stockable tetap dicek stock seperti biasa                |
+----------------------------------------------------------+
```

## Technical Implementation

### 1. Laporan Stock - LapStock.jsx
**File:** `src/components/ToolbarItem/laporan/stok/LapStock.jsx`

**Perubahan:**
- Tambah filter otomatis exclude `service` dan `consumable`
- Default filter: hanya tampilkan `stockable`
- Jika backend API belum support filter `product_type`, lakukan filter di frontend setelah data diterima

```javascript
const items = (result.items || []).filter(item => {
  const productType = item?.category?.product_type || 'stockable'
  return productType === 'stockable'
})
```

### 2. Stock Card Modal
**File:** `src/components/ToolbarItem/laporan/stok/StockCardModal.jsx`

**Perubahan:**
- Tidak ada perubahan langsung - modal hanya dipanggil dari LapStock
- Otomatis terfilter karena hanya produk stockable yang tampil di tabel

### 3. POS - Product Search & Catalog
**File:** `src/components/POS/POS.jsx`

**Perubahan:**
- Fungsi `searchCatalog()`: filter `consumable` dari hasil pencarian
- Produk `service` tetap muncul di catalog

```javascript
const searchCatalog = useCallback(async (keyword) => {
  const result = await listProducts(auth.token, { search: keyword, limit: 50 })
  return (result.items || []).filter(item => {
    const catType = normalizeProductType(item?.category?.product_type)
    return catType !== 'consumable'
  }).map(mapProductSearchResult)
}, [auth.token])
```

### 4. POS - Cart & Checkout
**File:** `src/components/POS/POS.jsx`

**Perubahan:**
- Fungsi `addToCart()`: cek tipe produk
- `service`: skip validasi stock
- `stockable`: tetap validasi stock seperti biasa

```javascript
const addToCart = (product) => {
  const catType = normalizeProductType(product?.category?.product_type)
  if (catType === 'stockable' && product.stock <= 0) {
    // show error: stock habis
    return
  }
  // service: langsung tambah ke cart tanpa cek stock
}
```

### 5. Helper Function
**File:** `src/utils/normalizeProductType.js` (atau di file yang sudah ada)

**Perubahan:**
- Pastikan helper `normalizeProductType()` tersedia untuk digunakan di POS dan LapStock
- Sudah ada di `Category.jsx` dan `Product.jsx`, perlu diekstrak ke shared utility

### 6. API Layer Updates (opsional)
**File:** `src/features/master/product/product.api.js`

**Perubahan opsional:**
- Tambah parameter `product_type` atau `exclude_type` ke `listProducts` untuk efisiensi server-side filtering

```javascript
if (params.product_type) qs.set('product_type', params.product_type)
if (params.exclude_type) qs.set('exclude_type', params.exclude_type)
```

## Planned File Changes
1. `src/components/ToolbarItem/laporan/stok/LapStock.jsx` - filter stockable only
2. `src/components/POS/POS.jsx` - filter consumable, unlock service
3. `src/utils/productType.js` - ekstrak normalizeProductType ke shared utility (opsional)
4. `src/features/master/product/product.api.js` - optional: tambah parameter filter

## Validation Checklist
1. Laporan stock hanya menampilkan produk `stockable`
2. Produk `service` tidak muncul di laporan stock
3. Produk `consumable` tidak muncul di laporan stock
4. POS catalog tidak menampilkan produk `consumable`
5. Produk `service` muncul di POS catalog
6. Produk `service` bisa ditambahkan ke cart tanpa validasi stock
7. Produk `stockable` tetap validasi stock di POS
8. Produk `consumable` tidak bisa ditambahkan ke cart
9. `npm run lint` frontend lulus
10. `npm run build` frontend lulus

## Risiko & Mitigasi

### Risiko 1: Backend belum support filter product_type di API
Mitigasi:
- Lakukan filtering di frontend setelah data diterima
- Performa masih acceptable untuk dataset < 1000 items

### Risiko 2: Produk existing tanpa category atau category tanpa product_type
Mitigasi:
- Default ke `stockable` jika product_type tidak terdeteksi
- Gunakan fallback: `item?.category?.product_type || 'stockable'`

### Risiko 3: Service item bisa dijual melebihi kapasitas
Mitigasi:
- Tidak ada limit stock untuk service, tapi bisa tambahkan validasi lain (misal: jadwal, availability)
- Untuk sekarang: service tidak ada batasan quantity
