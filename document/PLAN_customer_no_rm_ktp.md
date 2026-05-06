# Plan: Penambahan NO RM dan KTP di Customer

## Overview
Menambahkan dua field baru pada master customer:

1. `no_rm` untuk nomor rekam medik
2. `no_nik` untuk nomor identitas penduduk

Aturan final yang disepakati:
- `no_rm` diinput manual
- `no_rm` hanya tampil untuk business type `clinic`
- label tampilan `no_rm` adalah `NO RM`
- `no_nik` berlaku untuk semua business type
- label tampilan `no_nik` adalah `KTP`
- `KTP` tampil di list utama
- list pasien clinic tidak menampilkan `CODE`

## Scope

### Backend
- tambah field baru di model customer
- update request create dan update customer
- update repository select agar field baru ikut terbaca
- update handler mapping payload
- validasi format `KTP` dan error duplicate yang jelas

### Frontend
- tambah field di form customer
- tampilkan `NO RM` hanya saat `isClinic === true`
- tampilkan `KTP` di list utama semua business type
- hilangkan `CODE` dari list pasien clinic
- tambah `NO RM` dan `KTP` ke import/export Excel
- update print list customer

## Existing Structure Summary

### Frontend
File utama:
- `src/components/ToolbarItem/master/Customer.jsx`

Poin penting:
- `DEFAULT_FORM` menyimpan state form customer
- `getTableColumns(isClinic)` mengatur kolom list customer
- `getExcelColumns(isClinic)` mengatur export/import Excel
- `handleSave()` membentuk payload create/update
- `handleEdit()`, next/prev record memetakan item ke form

### Backend
File utama:
- `go_backend/internal/models/sales.go`
- `go_backend/internal/repository/customer_repository.go`
- `go_backend/internal/types/request/customer_request.go`
- `go_backend/internal/handlers/customer_handler.go`
- `go_backend/internal/services/customer_service.go`

Poin penting:
- model `Customer` adalah source schema untuk AutoMigrate
- repository customer menentukan field apa saja yang dibaca dari tabel
- request create/update customer perlu diperluas
- service perlu menerjemahkan duplicate key menjadi pesan bisnis yang jelas

## Target Data Model

| Field | Type | Scope | Required | Unique |
|---|---|---|---|---|
| `no_rm` | varchar(50) | clinic only | no | ya |
| `no_nik` | varchar(16) | all business types | no | ya |

Catatan:
- kedua field nullable
- `KTP` divalidasi sebagai string 16 digit agar leading zero tidak hilang

## Backend Design

### 1. Update Model Customer
File:
- `go_backend/internal/models/sales.go`

Tambah field:
- `NoRM`
- `NoNIK`

### 2. Update Repository Row
File:
- `go_backend/internal/repository/customer_repository.go`

Tambah field nullable:
- `NoRM *string`
- `NoNIK *string`

Lalu update select clause agar field baru ikut masuk ke response list dan detail.

### 3. Update Request Type
File:
- `go_backend/internal/types/request/customer_request.go`

Tambah pada create:
- `NoRM string`
- `NoNIK string`

Tambah pada update:
- `NoRM *string`
- `NoNIK *string`

### 4. Update Handler
File:
- `go_backend/internal/handlers/customer_handler.go`

Perubahan:
- map `no_rm` ke payload create/update
- map `no_nik` ke payload create/update
- validasi `no_nik` jika diisi harus 16 digit angka
- trim value string sebelum simpan

### 5. Update Service
File:
- `go_backend/internal/services/customer_service.go`

Perubahan:
- translate duplicate key error `no_nik` menjadi `KTP sudah digunakan customer lain`
- translate duplicate key error `no_rm` menjadi `NO RM sudah digunakan customer lain`

## Frontend Design

### 6. Update Form State
File:
- `src/components/ToolbarItem/master/Customer.jsx`

Tambah ke `DEFAULT_FORM`:
- `no_rm: ''`
- `no_nik: ''`

### 7. Update Table Columns
File:
- `Customer.jsx`

Aturan:
- clinic: `NO`, `NAME`, `NO RM`, `KTP`, `EMAIL`, `PHONE`, `TIER`, `ALERGI`, `STATUS`
- non-clinic: `NO`, `CODE`, `NAME`, `KTP`, `EMAIL`, `PHONE`, `TIER`, `STATUS`

### 8. Update Excel Columns
File:
- `Customer.jsx`

Perubahan:
- tambah `NO RM` untuk clinic
- tambah `KTP` untuk semua business type

### 9. Update Form UI
File:
- `Customer.jsx`

Perubahan UI:
- tambah input `NO RM` hanya saat clinic
- tambah input `KTP` untuk semua business type
- validasi `KTP` 16 digit di frontend sebelum save

## Sketsa Visual

### Form Pasien Clinic
```text
┌─────────────────────────────────────────────────────────────┐
│ Customer / Pasien                                           │
├─────────────────────────────────────────────────────────────┤
│ Nama         [ Andi Wijaya                     ]            │
│ NO RM        [ RM-000123                       ]            │
│ KTP          [ 3276xxxxxxxxxxxx                ]            │
│ Email        [ andi@email.com                  ]            │
│ Phone        [ 0812xxxxxxx                     ]            │
│ Alergi       [ Seafood                         ]            │
│ Address      [ Jl. Merdeka ...                 ]            │
│ City         [ Jakarta                         ]            │
│ Tier         [ GOLD v ]                                      │
└─────────────────────────────────────────────────────────────┘
```

### Form Customer Non-Clinic
```text
┌─────────────────────────────────────────────────────────────┐
│ Customer                                                    │
├─────────────────────────────────────────────────────────────┤
│ Nama         [ Andi Wijaya                     ]            │
│ KTP          [ 3276xxxxxxxxxxxx                ]            │
│ Email        [ andi@email.com                  ]            │
│ Phone        [ 0812xxxxxxx                     ]            │
│ Address      [ Jl. Merdeka ...                 ]            │
│ City         [ Jakarta                         ]            │
│ Tier         [ GOLD v ]                                      │
└─────────────────────────────────────────────────────────────┘
```

### List Pasien Clinic
```text
┌────────────────────────────────────────────────────────────────────────────┐
│ NO | NAME         | NO RM    | KTP              | EMAIL      | PHONE      │
├────────────────────────────────────────────────────────────────────────────┤
│ 1  | Andi Wijaya  | RM-0001  | 3276xxxxxxxxxxxx | andi@...   | 08123...   │
└────────────────────────────────────────────────────────────────────────────┘
```

## Technical Implementation

### Backend Files
- `go_backend/internal/models/sales.go`
- `go_backend/internal/repository/customer_repository.go`
- `go_backend/internal/types/request/customer_request.go`
- `go_backend/internal/handlers/customer_handler.go`
- `go_backend/internal/services/customer_service.go`

### Frontend Files
- `src/components/ToolbarItem/master/Customer.jsx`

## Risks & Mitigations

| Risiko | Mitigasi |
|---|---|
| `KTP` duplicate saat create/update/import | tambah unique index dan translate duplicate error menjadi pesan jelas |
| `NO RM` duplicate pada pasien clinic | tambah unique index dan translate duplicate error |
| nilai `KTP` kehilangan leading zero | simpan sebagai string dan validasi regex 16 digit |
| list pasien clinic masih menampilkan `CODE` | buat render tabel clinic kondisional penuh |
| data lama belum punya `NO RM` dan `KTP` | field nullable, data lama tetap valid |
| template Excel tidak sinkron dengan import | update `getExcelColumns`, export, dan generate template bersamaan |

## Rollout
1. simpan plan dan todo
2. update backend model, request, repository, service, handler
3. update frontend form, table, print, Excel
4. test manual create/edit clinic dan non-clinic
5. run lint/build frontend dan build backend
