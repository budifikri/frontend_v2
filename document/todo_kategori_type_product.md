# TODO: Kategori Type Product

## Status: PENDING

## Progress Checklist

### Phase 1: Category & Product Type
- [x] Task 1: Backend model category + product_type
- [x] Task 2: Backend validasi product_type
- [x] Task 3: Backend request category update
- [x] Task 4: Backend handler & service category
- [x] Task 5: Backend response category
- [x] Task 6: Backend validasi product cost_price=0 & retail_price=0
- [x] Task 7: Frontend Category.jsx DEFAULT_FORM
- [x] Task 8: Frontend dropdown Tipe Product
- [x] Task 9: Frontend kolom TYPE tabel category
- [x] Task 10: Frontend import/export Excel category
- [x] Task 11: Frontend lookup category di product
- [x] Task 12: Frontend resolver category di Product.jsx
- [x] Task 13: Frontend flag UI (isServiceCategory, isConsumableCategory, isStockManagedCategory)
- [x] Task 14: Frontend hide Cost, Reorder, Adjust Stock untuk service
- [x] Task 15: Frontend hide Harga Jual untuk consumable
- [x] Task 16: Frontend auto-update nilai saat category berubah
- [x] Task 17: Frontend payload save product
- [ ] Task 18: Test create/update category 3 tipe
- [ ] Task 19: Test create/update product 3 tipe
- [x] Task 20: npm run lint
- [x] Task 21: npm run build
- [x] Task 22: Build/test backend

### Phase 2: Filter Laporan Stock & POS
- [x] Task 23: Ekstrak normalizeProductType() ke shared utility
- [x] Task 24: LapStock.jsx filter exclude service & consumable
- [x] Task 25: POS.jsx searchCatalog() filter consumable
- [x] Task 26: POS.jsx addToCart() skip stock untuk service
- [x] Task 27: POS badge/indicator tipe produk (opsional)
- [ ] Task 28: Test laporan stock hanya stockable
- [ ] Task 29: Test POS consumable tidak muncul
- [ ] Task 30: Test POS service tanpa stock lock
- [ ] Task 31: Test POS stockable tetap validasi stock
- [x] Task 32: npm run lint
- [x] Task 33: npm run build

### Summary
- **Phase 1**: 20/22 completed
- **Phase 2**: 7/11 completed
- **Total**: 27/33 completed
- **Status**: PENDING

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Tambah field `product_type` pada model backend `Category` dengan default `stockable` | PENDING |
| 2 | Tambah validasi nilai `product_type` di backend category: `stockable`, `service`, `consumable` | PENDING |
| 3 | Update request create/update category agar menerima `product_type` | PENDING |
| 4 | Update handler dan service category agar memproses `product_type` | PENDING |
| 5 | Pastikan response list/get category mengembalikan `product_type` | PENDING |
| 6 | Review dan sesuaikan validasi backend product agar `cost_price = 0` dan `retail_price = 0` valid sesuai rule | PENDING |
| 7 | Tambah `product_type` ke `DEFAULT_FORM` dan payload di `Category.jsx` | PENDING |
| 8 | Tambah dropdown `Tipe Product` pada form category | PENDING |
| 9 | Tambah kolom `TYPE` pada tabel category | PENDING |
| 10 | Tambah kolom `product_type` pada import/export/template Excel category | PENDING |
| 11 | Pastikan lookup category di product membawa `product_type` | PENDING |
| 12 | Tambah helper resolver category terpilih di `Product.jsx` | PENDING |
| 13 | Implementasikan flag UI `isServiceCategory`, `isConsumableCategory`, `isStockManagedCategory` | PENDING |
| 14 | Sembunyikan `Cost`, `Reorder`, dan tab `Adjust Stock` untuk category `service` | PENDING |
| 15 | Sembunyikan `Harga Jual` untuk category `consumable` | PENDING |
| 16 | Saat category berubah, paksa nilai otomatis: `service => cost_price=0, reorder_point=0`, `consumable => retail_price=0` | PENDING |
| 17 | Pastikan payload save product mengikuti rule tipe category | PENDING |
| 18 | Uji create/update category untuk 3 tipe | PENDING |
| 19 | Uji create/update product untuk `stockable`, `service`, dan `consumable` | PENDING |
| 20 | Jalankan `npm run lint` | PENDING |
| 21 | Jalankan `npm run build` | PENDING |
| 22 | Jalankan build/test backend yang relevan | PENDING |

## Catatan Implementasi
- `service` menyimpan `cost_price` sebagai `0` dan tidak memakai alur stok.
- `consumable` menyimpan `retail_price` sebagai `0` dan tetap memakai alur stok.
- Data lama category tanpa `product_type` harus fallback ke `stockable`.

## Outcome yang Diharapkan
1. Admin bisa memilih tipe product pada master category.
2. Form product otomatis berubah sesuai tipe category.
3. Rule `service` dan `consumable` tervalidasi sampai backend.
4. Data existing tetap aman dan tidak rusak.

---

## PHASE 2: Filter Laporan Stock & POS

### Aturan Bisnis
| Tipe | Laporan Stock | Penjualan (POS) | Stock Lock |
|------|---------------|-----------------|------------|
| **Stockable** | Muncul | Muncul | Terkunci (cek stock) |
| **Service** | Tidak muncul | Muncul | Tidak terkunci |
| **Consumable** | Tidak muncul | Tidak muncul | - |

### Tasks Phase 2

| # | Task | Status |
|---|------|--------|
| 23 | Ekstrak `normalizeProductType()` ke shared utility (`src/utils/productType.js`) | PENDING |
| 24 | Update `LapStock.jsx`: filter otomatis exclude `service` dan `consumable` | PENDING |
| 25 | Update `POS.jsx` `searchCatalog()`: filter `consumable` dari hasil pencarian | PENDING |
| 26 | Update `POS.jsx` `addToCart()`: skip validasi stock untuk produk `service` | PENDING |
| 27 | Tambah badge/indicator tipe produk di POS catalog (opsional) | PENDING |
| 28 | Uji laporan stock: hanya `stockable` yang muncul | PENDING |
| 29 | Uji POS: `consumable` tidak muncul di catalog | PENDING |
| 30 | Uji POS: `service` muncul di catalog tanpa stock lock | PENDING |
| 31 | Uji POS: `stockable` tetap validasi stock | PENDING |
| 32 | Jalankan `npm run lint` | PENDING |
| 33 | Jalankan `npm run build` | PENDING |

### File yang Akan Dimodifikasi
1. `src/components/ToolbarItem/laporan/stok/LapStock.jsx`
2. `src/components/POS/POS.jsx`
3. `src/utils/productType.js` (new, optional)
4. `src/features/master/product/product.api.js` (optional)

### Catatan Implementasi Phase 2
- Filter di frontend dilakukan setelah data diterima dari API
- Fallback ke `stockable` jika `product_type` tidak terdeteksi
- Service item di POS tidak membatasi quantity
- Consumable item tidak bisa ditambahkan ke cart sama sekali

---
