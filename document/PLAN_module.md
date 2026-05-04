# Plan: Business Type dan Module Package

## Overview
Sistem module akan dibagi menjadi dua sumber data:

1. Database menyimpan konfigurasi bisnis company.
2. Frontend JSON menyimpan struktur menu dan tampilan toolbar.

Database tidak mengatur susunan menu. Database hanya menentukan:
- company memiliki `business_type` apa
- company memiliki `module package` aktif apa saja

Frontend tetap memakai `src/data/menuItems.js` dan `src/data/toolbarItems.js` sebagai source of truth untuk:
- label menu
- icon
- grouping menu
- urutan tampil
- popup submenu

## Final Architecture

### Database

```text
business_type
  -> module_package
  -> company_modules
```

### Frontend

```text
toolbarItems.js
  -> item.filter.businessType
  -> item.filter.moduleCodes
```

## Business Rules

1. Setiap company hanya memiliki satu `business_type`.
2. `business_type` dipilih saat create company.
3. `business_type` bersifat fixed setelah company dibuat.
4. Satu company dapat memiliki banyak `module package` aktif.
5. `module package` harus sesuai dengan `business_type` company.
6. Menu yang tidak lolos filter `businessType` dan `moduleCodes` harus disembunyikan.
7. Menu tidak perlu diatur dari database.
8. Jika ada module baru, cukup tambahkan master module di backend dan mapping item di JSON frontend.

## Database Changes

### 1. Update Table `companies`

Tambahkan field:

| Field | Type | Description |
|-------|------|-------------|
| business_type | varchar(50) | Kode business type company |

Contoh nilai:
- `retail`
- `clinic`

### 2. New Table `business_types`

Master jenis bisnis.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| code | varchar(50) unique | Kode business type |
| name | varchar(100) | Nama business type |
| description | text | Deskripsi |
| is_active | boolean | Status aktif |
| is_default | boolean | Default bawaan sistem |
| is_system | boolean | Data bawaan sistem |
| sort_order | int | Urutan |
| created_at | timestamp | Waktu create |
| updated_at | timestamp | Waktu update |

Default seed:
- `retail`
- `clinic`

### 3. New Table `module_packages`

Master package module per business type.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| business_type | varchar(50) | Kode business type pemilik module |
| code | varchar(100) unique | Kode module package |
| name | varchar(100) | Nama module |
| description | text | Deskripsi module |
| is_active | boolean | Status aktif |
| is_default | boolean | Default untuk business type terkait |
| is_system | boolean | Bawaan sistem |
| sort_order | int | Urutan |
| created_at | timestamp | Waktu create |
| updated_at | timestamp | Waktu update |

Default seed:
- `retail_basic`
- `retail_advanced`
- `clinic_core`
- `clinic_advanced`

Contoh custom seed di masa depan:
- `custom_membership`
- `custom_finance`
- `custom_booking`

### 4. New Table `company_modules`

Status module aktif per company.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| company_id | uuid | FK ke companies |
| module_code | varchar(100) | Kode module package |
| is_active | boolean | Status aktif |
| activated_at | timestamp | Waktu aktivasi |
| activated_by | uuid nullable | User yang mengaktifkan |
| created_at | timestamp | Waktu create |
| updated_at | timestamp | Waktu update |

Unique key:
- `(company_id, module_code)`

## Default Module Strategy

Saat create company:

### Retail
- aktifkan `retail_basic`
- siapkan `retail_advanced` dalam kondisi nonaktif atau aktif sesuai kebijakan awal

### Clinic
- aktifkan `clinic_core`
- siapkan `clinic_advanced` dalam kondisi nonaktif atau aktif sesuai kebijakan awal

Rekomendasi implementasi:
- insert semua module package yang relevan untuk business type tersebut ke `company_modules`
- gunakan `is_active` untuk toggle status

## Company Data for Frontend

Frontend cukup menerima data seperti ini:

```json
{
  "id": "cmp_001",
  "name": "Toko ABC",
  "business_type": "retail",
  "modules": [
    "retail_basic",
    "retail_advanced"
  ]
}
```

Contoh clinic:

```json
{
  "id": "cmp_002",
  "name": "Klinik Cantik",
  "business_type": "clinic",
  "modules": [
    "clinic_core"
  ]
}
```

## Frontend Filtering Strategy

Tambahkan metadata filter di `toolbarItems.js`:

```javascript
{
  key: 'product',
  label: 'Product',
  mark: 'P',
  tone: 'indigo',
  filter: {
    businessType: ['retail', 'clinic'],
    moduleCodes: ['retail_basic', 'clinic_core'],
  },
}
```

Contoh advanced retail:

```javascript
{
  key: 'promotion',
  label: 'Promotion',
  mark: 'M',
  tone: 'purple',
  filter: {
    businessType: ['retail'],
    moduleCodes: ['retail_advanced'],
  },
}
```

## Filtering Rules

Sebuah item tampil jika:

1. `businessType` item mengandung `company.business_type`
2. `moduleCodes` item memiliki minimal satu nilai yang ada di `company.modules`

Pseudocode:

```javascript
function isItemVisible(item, companyConfig) {
  if (!item.filter) return true

  const businessTypeMatch =
    !item.filter.businessType ||
    item.filter.businessType.includes(companyConfig.business_type)

  const moduleCodeMatch =
    !item.filter.moduleCodes ||
    item.filter.moduleCodes.some((code) => companyConfig.modules.includes(code))

  return businessTypeMatch && moduleCodeMatch
}
```

Untuk popup submenu:
- filter subitems dulu
- parent popup hanya tampil jika masih punya subitem yang visible

## Default Mapping Based on Existing Menu

### `retail_basic`
- `warehouse`
- `satuan`
- `categori`
- `product`
- `customer`
- `supplier`
- `beli`
- `receive`
- `retur`
- `opname`
- `lapjual`
- `lapbeli`
- `lapstok`
- `lapcashdrawer`
- `theme`
- `user`
- `company`
- `report_setting`
- `backup`
- `telegram`

### `retail_advanced`
- `promotion`
- `laphargagrosir`

### `clinic_core`
Versi awal mengikuti menu existing:
- `warehouse`
- `satuan`
- `categori`
- `product`
- `customer`
- `supplier`
- `beli`
- `receive`
- `retur`
- `lapjual`
- `lapbeli`
- `lapstok`

### `clinic_advanced`
Versi awal:
- `promotion`
- `laphargagrosir`

Catatan:
- saat fitur clinic khusus dibuat, mapping clinic dapat dipisah lebih spesifik
- custom modules cukup ditambahkan di backend dan dihubungkan ke item JSON yang relevan

## API Design

### Company
- `GET /api/companies/current`
- `POST /api/companies`
- `PUT /api/companies/:id`

Payload create perlu mendukung `business_type`.

Contoh:

```json
{
  "code": "CMP001",
  "nama": "Toko Sukses",
  "email": "owner@toko.com",
  "business_type": "retail",
  "is_active": true
}
```

### Module Package
- `GET /api/me/modules`
- `GET /api/companies/:id/modules`
- `PATCH /api/companies/:id/modules/:code/toggle`

Contoh response:

```json
{
  "business_type": "retail",
  "modules": [
    "retail_basic",
    "retail_advanced"
  ]
}
```

## Frontend Design

### 1. Company Form

```text
┌──────────────────────────────────────────────┐
│ Company                                      │
├──────────────────────────────────────────────┤
│ Code            [ CMP001                  ]  │
│ Nama Company    [ Toko Sukses            ]  │
│ Email           [ owner@toko.com         ]  │
│ Jenis Bisnis    [ Retail v               ]  │
│                                              │
│ Keterangan:                                   │
│ - Retail: POS, purchase, inventory           │
│ - Klinik: registrasi pasien, produk, jasa    │
│                                              │
│ [ Simpan ] [ Batal ]                         │
└──────────────────────────────────────────────┘
```

Aturan UI:
- field `Jenis Bisnis` muncul saat create
- saat edit, field readonly atau disabled
- tampilkan helper text bahwa jenis bisnis tidak bisa diubah

### 2. Business Type Master

Tujuan:
- menambah master `business_type`
- mengubah nama dan deskripsi business type
- mengaktifkan atau menonaktifkan business type

Sketsa list page:

```text
┌────────────────────────────────────────────────────────────────────┐
│ Master Business Type                                               │
├────────────────────────────────────────────────────────────────────┤
│ [Tambah Business Type]   [Cari: ________________ ]                │
├────────────────────────────────────────────────────────────────────┤
│ Code        Nama                Status     Default   System        │
│ ----------------------------------------------------------------- │
│ retail      Retail              Active     Yes       Yes           │
│ clinic      Klinik Kecantikan   Active     Yes       Yes           │
│ apotek      Apotek              Active     No        No            │
│ ----------------------------------------------------------------- │
│ [Edit] [Nonaktifkan]                                               │
└────────────────────────────────────────────────────────────────────┘
```

Sketsa form add/edit:

```text
┌────────────────────────────────────────────────────────────────────┐
│ Tambah Business Type                                               │
├────────────────────────────────────────────────────────────────────┤
│ Code              [ retail_new                              ]      │
│ Nama              [ Retail Premium                          ]      │
│ Deskripsi         [ _________________________________       ]      │
│                   [ _________________________________       ]      │
│ Status            [ Active v ]                                     │
│ Default System    [ ] Data default                                 │
│ System Locked     [ ] Data system                                  │
│                                                                    │
│ Catatan:                                                           │
│ - Code harus unik                                                  │
│ - Code dipakai untuk filter module dan company                     │
│                                                                    │
│ [Simpan] [Batal]                                                   │
└────────────────────────────────────────────────────────────────────┘
```

Aturan UI:
- `code` wajib unik
- `code` hanya huruf kecil, angka, dan underscore
- data `is_system = true` dibatasi untuk edit dan delete
- business type nonaktif tidak muncul di pilihan create company baru

### 3. Module Package Master

Tujuan:
- menambah package module baru
- memilih package ini milik business type tertentu
- menandai package sebagai default atau optional

Sketsa list page:

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Master Module Package                                                     │
├────────────────────────────────────────────────────────────────────────────┤
│ [Tambah Module Package]   [Filter Business Type v]   [Cari: _________ ]  │
├────────────────────────────────────────────────────────────────────────────┤
│ Code               Nama                 Business Type   Default   Status  │
│ ------------------------------------------------------------------------ │
│ retail_basic       Retail Basic         retail          Yes       Active  │
│ retail_advanced    Retail Advanced      retail          No        Active  │
│ clinic_core        Clinic Core          clinic          Yes       Active  │
│ clinic_advanced    Clinic Advanced      clinic          No        Active  │
│ custom_finance     Finance Module       retail          No        Active  │
│ ------------------------------------------------------------------------ │
│ [Edit] [Nonaktifkan]                                                     │
└────────────────────────────────────────────────────────────────────────────┘
```

Sketsa form add/edit:

```text
┌────────────────────────────────────────────────────────────────────┐
│ Tambah Module Package                                              │
├────────────────────────────────────────────────────────────────────┤
│ Business Type     [ Retail v                                  ]   │
│ Code              [ retail_basic                              ]   │
│ Nama              [ Retail Basic                              ]   │
│ Deskripsi         [ _________________________________         ]   │
│                   [ _________________________________         ]   │
│ Default Module    [x] Aktif default saat company dibuat           │
│ System Module     [x] Data bawaan sistem                          │
│ Status            [ Active v ]                                    │
│                                                                    │
│ Contoh Code:                                                       │
│ - retail_basic                                                     │
│ - retail_advanced                                                  │
│ - clinic_core                                                      │
│ - custom_membership                                                │
│                                                                    │
│ [Simpan] [Batal]                                                   │
└────────────────────────────────────────────────────────────────────┘
```

Aturan UI:
- `business_type` wajib dipilih
- `code` wajib unik
- `is_default = true` berarti otomatis masuk ke company baru dengan business type terkait
- `is_system = true` dibatasi untuk edit dan delete

### 4. Module Settings

Sketsa visual:

```text
┌────────────────────────────────────────────────────────────────────┐
│ Module Management                                                  │
├────────────────────────────────────────────────────────────────────┤
│ Business Type: Retail                                              │
│                                                                    │
│ Default Modules                                                    │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ Retail Basic                             [Active]             │ │
│ │ Warehouse, Unit, Kategori, Product, Customer, Supplier       │ │
│ │ Purchase, Stock Receive, Retur, Stock Opname                 │ │
│ │ Lap Jual, Lap Beli, Lap Stok, Cash Drawer                    │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ Optional Modules                                                   │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ Retail Advanced                          [ ON / OFF ]         │ │
│ │ Promotion, Laporan Harga Grosir                              │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### 5. Penempatan Menu Setting

Rekomendasi penempatan menu di toolbar settings:

```text
[Theme] [User] [Company] [Business Type] [Module Package] [Report Settings] [Backup] [Telegram]
```

Alternatif:
- menu `Company` tetap untuk profile company aktif
- menu `Business Type` untuk master jenis bisnis
- menu `Module Package` untuk master package module
- menu `Module` untuk aktivasi module per company

## Technical Implementation

### Backend Files

| File | Changes |
|------|---------|
| `internal/models/company.go` | tambah field `business_type` |
| `internal/models/business_type.go` | model master business types |
| `internal/models/module_package.go` | model master module packages |
| `internal/models/company_module.go` | model module company |
| `internal/services/company_service.go` | simpan `business_type` saat create |
| `internal/handlers/company_handler.go` | parse `business_type` |
| `internal/types/request/...` | tambah field request `business_type` |
| `internal/services/module_service.go` | list module dan toggle module |
| `internal/handlers/module_handler.go` | endpoint module package |
| `cmd/server/main.go` | register route baru |

### Frontend Files

| File | Changes |
|------|---------|
| `src/shared/auth.jsx` | simpan `companyId`, `businessType`, dan modules company |
| `src/shared/ModuleContext.jsx` | helper `hasModule()` dan config company |
| `src/App.jsx` | wrap provider baru |
| `src/features/master/company/company.api.js` | kirim field `business_type` |
| `src/components/ToolbarItem/master/Company.jsx` | tambah pilihan `Jenis Bisnis` |
| `src/components/ToolbarItem/setting/BusinessTypeSetting.jsx` | master business type |
| `src/components/ToolbarItem/setting/ModulePackageSetting.jsx` | master module package |
| `src/data/toolbarItems.js` | tambah `filter.businessType` dan `filter.moduleCodes` |
| `src/components/Dashboard/DashboardToolbar.jsx` | filter toolbar item dan subitem |
| `src/components/Dashboard/DashboardCanvas.jsx` | guard tool jika perlu |
| `src/features/setting/module/module.api.js` | API list/toggle modules |
| `src/features/setting/module/ModuleSettings.jsx` | UI module management |

### Frontend State

State minimal untuk `BusinessTypeSetting`:
- `items`
- `search`
- `isLoading`
- `selectedItem`
- `form`
- `isEditing`

State minimal untuk `ModulePackageSetting`:
- `items`
- `businessTypeFilter`
- `search`
- `isLoading`
- `selectedItem`
- `form`
- `isEditing`

### Frontend Validation

Business Type:
- `code` required
- `name` required
- `code` format snake_case lowercase

Module Package:
- `business_type` required
- `code` required
- `name` required
- `code` harus konsisten dengan business type atau prefix custom yang disepakati

## Risks & Mitigations

| Risiko | Mitigasi |
|--------|----------|
| Code module backend tidak sinkron dengan frontend JSON | gunakan naming code yang sama persis |
| Popup parent tampil kosong | filter subitems dulu, lalu tampilkan parent hanya jika ada isi |
| Custom module aktif tapi belum ada item JSON | frontend abaikan dulu sampai mapping ditambahkan |
| Company berganti business type setelah berjalan | `business_type` dibuat fixed setelah create |
| Mapping clinic masih sama dengan retail di fase awal | pisahkan bertahap saat fitur clinic khusus mulai dibuat |
| Business type atau module package baru belum punya mapping menu | tampilkan catatan di UI bahwa master baru perlu mapping frontend |
| Data system bawaan terhapus atau berubah sembarangan | batasi edit/delete jika `is_system = true` |

## Suggested Rollout

1. Tambah `business_type` ke `companies`.
2. Buat tabel `business_types`.
3. Buat tabel `module_packages`.
4. Buat tabel `company_modules`.
5. Seed default business types dan module packages.
6. Update API company agar mengembalikan `business_type` dan modules.
7. Tambah filter metadata di `toolbarItems.js`.
8. Implement helper filter toolbar.
9. Tambah UI module settings.
10. Uji retail, clinic, dan custom module.
