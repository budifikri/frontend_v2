# TODO: Kategori Type Product

## Status: PENDING

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
