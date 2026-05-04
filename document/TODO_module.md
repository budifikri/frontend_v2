# TODO Business Type dan Module Package

## Tasks

### Backend - Database

#### 1. Update Table Companies
- [ ] Tambah field `business_type` di model `Company`
- [ ] Pastikan data lama mendapat default `retail`
- [ ] Buat rule bahwa `business_type` tidak bisa diubah sembarangan setelah create

#### 2. Create Master Business Types
- [ ] Buat model `BusinessType`
- [ ] Tambahkan ke AutoMigrate
- [ ] Seed `retail`
- [ ] Seed `clinic`
- [ ] Buat endpoint list business types
- [ ] Buat endpoint create business type
- [ ] Buat endpoint update business type

#### 3. Create Master Module Packages
- [ ] Buat model `ModulePackage`
- [ ] Tambahkan ke AutoMigrate
- [ ] Seed `retail_basic`
- [ ] Seed `retail_advanced`
- [ ] Seed `clinic_core`
- [ ] Seed `clinic_advanced`
- [ ] Siapkan pola custom module seperti `custom_membership`
- [ ] Buat endpoint list module packages
- [ ] Buat endpoint create module package
- [ ] Buat endpoint update module package

#### 4. Create Company Modules
- [ ] Buat model `CompanyModule`
- [ ] Tambahkan ke AutoMigrate
- [ ] Tambah unique key `(company_id, module_code)`
- [ ] Simpan `is_active`, `activated_at`, `activated_by`

### Backend - API dan Service

#### 5. Update Company Request dan Handler
- [ ] Tambah field `business_type` di request create company
- [ ] Validasi `business_type` hanya dari master yang aktif
- [ ] Update `company_handler.go` untuk parse field baru
- [ ] Tentukan apakah update company boleh mengubah `business_type` atau ditolak penuh

#### 6. Update Company Service
- [ ] Simpan `business_type` saat create company
- [ ] Saat create company, insert module default ke `company_modules`
- [ ] Pastikan module default sesuai business type company

#### 7. Create Module Package API
- [ ] Buat endpoint `GET /api/me/modules`
- [ ] Buat endpoint `GET /api/companies/:id/modules`
- [ ] Buat endpoint `PATCH /api/companies/:id/modules/:code/toggle`
- [ ] Tolak toggle module yang tidak sesuai business type
- [ ] Kembalikan response sederhana: `business_type` + `modules[]`

### Frontend - State dan Data

#### 8. Update Auth dan Context
- [ ] Tambah `companyId` di `src/shared/auth.jsx`
- [ ] Tambah `businessType` di `src/shared/auth.jsx`
- [ ] Tambah `modules` di state auth atau context terpisah
- [ ] Buat `src/shared/ModuleContext.jsx`
- [ ] Wrap provider di `src/App.jsx`

#### 9. Update Company Form
- [ ] Update `src/features/master/company/company.api.js` untuk kirim `business_type`
- [ ] Tambah pilihan `Jenis Bisnis` di UI company form
- [ ] Saat edit company, jadikan `Jenis Bisnis` readonly/disabled
- [ ] Tambah helper text bahwa jenis bisnis tidak bisa diubah

#### 10. Create Business Type Master UI
- [ ] Buat API frontend untuk business types
- [ ] Buat `BusinessTypeSetting.jsx`
- [ ] Buat list page business type
- [ ] Buat form add/edit business type
- [ ] Tambahkan menu `Business Type` di toolbar settings
- [ ] Tambahkan validasi code unique dan snake_case

#### 11. Create Module Package Master UI
- [ ] Buat API frontend untuk module packages
- [ ] Buat `ModulePackageSetting.jsx`
- [ ] Buat list page module package
- [ ] Buat form add/edit module package
- [ ] Tambahkan filter business type pada list module package
- [ ] Tambahkan menu `Module Package` di toolbar settings
- [ ] Tambahkan validasi code unique dan business type wajib

### Frontend - Menu Filtering

#### 12. Update Toolbar Metadata
- [ ] Tambah `filter.businessType` pada item yang perlu dibatasi
- [ ] Tambah `filter.moduleCodes` pada item toolbar
- [ ] Tambah `filter.moduleCodes` pada popup subitems
- [ ] Pastikan format module code sama dengan backend

#### 13. Create Filter Helper
- [ ] Buat helper `isItemVisible(item, companyConfig)`
- [ ] Buat helper untuk filter popup subitems
- [ ] Sembunyikan parent popup jika semua subitems tidak visible

#### 14. Update Toolbar dan Canvas
- [ ] Update `DashboardToolbar.jsx` agar memakai filter helper
- [ ] Pastikan divider tidak tampil berantakan setelah filter
- [ ] Tambahkan guard di `DashboardCanvas.jsx` untuk tool yang sudah tidak boleh diakses

### Frontend - Module Settings

#### 15. Create Module Settings UI
- [ ] Buat `src/features/setting/module/module.api.js`
- [ ] Buat `src/features/setting/module/ModuleSettings.jsx`
- [ ] Buat CSS untuk daftar module package dan toggle
- [ ] Tambahkan menu `module` di toolbar settings jika memang dibutuhkan oleh admin

### Verification

#### 16. Test Scenario
- [ ] Create company retail
- [ ] Create company clinic
- [ ] Tambah business type baru dari UI
- [ ] Tambah module package baru dari UI
- [ ] Login retail basic dan cek hanya menu basic yang tampil
- [ ] Aktifkan `retail_advanced` dan cek menu advanced muncul
- [ ] Nonaktifkan `retail_advanced` dan cek menu advanced hilang
- [ ] Login clinic core dan cek filter berjalan sesuai business type
- [ ] Cek popup parent tidak muncul kosong
- [ ] Cek custom module yang belum dimapping tidak merusak UI

#### 17. Quality Check
- [ ] Run `npm run lint`
- [ ] Run `npm run build`
- [ ] Jika backend berubah, jalankan test/build backend yang relevan

## Status Legend
- [ ] = Pending
- [x] = Completed
- [~] = In Progress

## Notes
- Menu tetap dari JSON frontend, bukan dari database.
- Database hanya mengatur `business_type` dan module package aktif per company.
- `moduleCodes` yang dipakai frontend harus sama persis dengan kode module package di backend.
- Custom module bisa ditambah tanpa mengubah struktur inti database.
- Business type dan module package baru perlu mapping frontend jika ingin muncul sebagai menu/tool.
