# PLAN: Fitur Master Dokter (Clinic)

## Overview
Penambahan fitur **Dokter** untuk business type **Clinic** dengan package `clinic_core`. Fitur ini mencakup backend (Go + PostgreSQL/GORM) dan frontend (React).

---

## BACKEND (Go - PostgreSQL dengan GORM)

### 1. Model `Dokter`
**File**: `go_backend/internal/models/dokter.go`

- Convert SQL MySQL → GORM model (UUID primary key, bukan AUTO_INCREMENT)
- Field:
  - `id` (UUID, primary key, default: `gen_random_uuid()`)
  - `company_id` (UUID, foreign key ke companies, untuk multi-tenant isolation)
  - `nama` (VARCHAR 100, NOT NULL)
  - `jenis_kelamin` (ENUM 'L', 'P', NOT NULL)
  - `tempat_lahir` (VARCHAR 100, NOT NULL)
  - `tanggal_lahir` (DATE, NOT NULL)
  - `alamat` (TEXT, NOT NULL)
  - `no_telp` (VARCHAR 30, NOT NULL)
  - `email` (VARCHAR 100, NOT NULL)
  - `tipe` (ENUM 'Dokter', 'Beautician', NOT NULL)
  - `active` (BOOLEAN, default: true)
  - `created_at` (TIMESTAMP, autoCreateTime)
  - `updated_at` (TIMESTAMP, autoUpdateTime)
- Method: `BeforeCreate()` untuk generate UUID, `TableName()` return "dokters"

### 2. Migration
**File**: `go_backend/cmd/server/main.go`

- Tambahkan `&models.Dokter{}` ke dalam `database.AutoMigrate()`

### 3. Repository
**File**: `go_backend/internal/repository/dokter_repository.go`

- Interface/struct `DokterRepository`
- Methods:
  - `Create(dokter *models.Dokter) error`
  - `GetByID(id, companyID string) (*models.Dokter, error)`
  - `GetAll(companyID string, filters map[string]interface{}, limit, offset int) ([]models.Dokter, int64, error)`
  - `Update(dokter *models.Dokter) error`
  - `Delete(id, companyID string) error`
  - `CheckDependencies(id, companyID string) (bool, error)` - cek jika dokter sudah digunakan di transaksi

### 4. Service
**File**: `go_backend/internal/services/dokter_service.go`

- Struct `DokterService` dengan dependency ke `DokterRepository`
- Methods:
  - `CreateDokter(input CreateDokterRequest, companyID string) response.ApiResponse`
  - `GetDokters(companyID string, filters map[string]interface{}, limit, offset int) response.PaginatedResponse`
  - `GetDokterByID(id, companyID string) response.ApiResponse`
  - `UpdateDokter(id string, input UpdateDokterRequest, companyID string) response.ApiResponse`
  - `DeleteDokter(id, companyID string) response.ApiResponse`
- Validasi input, business logic, audit log

### 5. Request Types
**File**: `go_backend/internal/types/request/dokter_request.go`

- `CreateDokterRequest`
- `UpdateDokterRequest`

### 6. Handler
**File**: `go_backend/internal/handlers/dokter_handler.go`

- Struct `DokterHandler`
- Methods:
  - `GetDokters(c *fiber.Ctx) error` - List dengan filter & pagination
  - `GetDokter(c *fiber.Ctx) error` - Get by ID
  - `CreateDokter(c *fiber.Ctx) error` - Create baru
  - `UpdateDokter(c *fiber.Ctx) error` - Update
  - `DeleteDokter(c *fiber.Ctx) error` - Delete (dengan cek dependensi)

### 7. Routes
**File**: `go_backend/cmd/server/main.go`

- Daftarkan route group `/api/dokters` dengan middleware auth:
  - `GET /api/dokters` → `dokterHandler.GetDokters`
  - `GET /api/dokters/:id` → `dokterHandler.GetDokter`
  - `POST /api/dokters` → `dokterHandler.CreateDokter`
  - `PUT /api/dokters/:id` → `dokterHandler.UpdateDokter`
  - `DELETE /api/dokters/:id` → `dokterHandler.DeleteDokter`

---

## FRONTEND (React)

### 1. API Layer
**File**: `frontend_v2/src/features/master/dokter/dokter.api.js`

- `listDokters(token, params)` - GET /api/dokters dengan search, limit, offset
- `createDokter(token, input)` - POST /api/dokters
- `updateDokter(token, id, input)` - PUT /api/dokters/:id
- `deleteDokter(token, id)` - DELETE /api/dokters/:id

### 2. Component
**File**: `frontend_v2/src/components/ToolbarItem/master/Dokter.jsx`

- State: `data`, `pagination`, `isLoading`, `form`, `selectedId`, `showForm`, `isNewMode`, `searchKeyword`
- Form Fields:
  - Nama (text)
  - Jenis Kelamin (select: L/P)
  - Tempat Lahir (text)
  - Tanggal Lahir (date)
  - Alamat (textarea)
  - No Telp (text)
  - Email (email)
  - Tipe (select: Dokter/Beautician)
  - Active (checkbox)
- Table Columns: ID, Nama, Tipe, Gender, No Telp, Email, Status
- Keyboard Shortcuts: F2 (Edit), Delete, +/F1 (New), Escape (Exit)
- Hooks: `useMasterPagination`, `useMasterTableSort`, `useMasterTableKeyboardNav`

### 3. Menu Item
**File**: `frontend_v2/src/data/toolbarItems.js`

- Tambah item di array `master`:
```javascript
{
  key: 'dokter',
  label: 'Dokter',
  mark: 'D',
  tone: 'cyan',
  filter: { businessType: ['clinic'], moduleCodes: ['clinic_core'] }
}
```

### 4. Canvas Rendering
**File**: `frontend_v2/src/components/Dashboard/DashboardCanvas.jsx`

- Tambah kondisi:
```javascript
if (activeTool === 'dokter') {
  return (
    <div className="dashboard-canvas">
      <Dokter onExit={onExit} />
    </div>
  )
}
```

---

## SKETSA UI (Dokter.jsx)

```
+------------------------------------------------------------------+
|  DOKTER                                    [+ New] [Search: ___] |
+------------------------------------------------------------------+
| ID | Nama        | Tipe      | Gender | No Telp      | Status   |
|----|-------------|-----------|--------|--------------|-----------|
| 1  | Dr. Budi    | Dokter    | L      | 0812-xxx     | Active   |
| 2  | Sari        | Beautician| P      | 0813-xxx     | Active   |
+------------------------------------------------------------------+
| Form:                                                            |
| Nama: [___________]  Tipe: [Dokter ▼]  Gender: [L ▼]           |
| Tempat Lahir: [___________]  Tgl Lahir: [____-__-__]            |
| Alamat: [________________________]                               |
| No Telp: [___________]  Email: [___________]                    |
| Active: [✓]                                                     |
| [Save] [Cancel]                                                  |
+------------------------------------------------------------------+
```

---

## RISIKO & MITIGASI

| Risiko | Mitigasi |
|--------|-----------|
| SQL MySQL vs PostgreSQL | Gunakan GORM model, biarkan AutoMigrate yang handle |
| Multi-tenant isolation | Pastikan semua query filter `company_id` |
| Menu muncul di business type lain | Sudah difilter `businessType: ['clinic']` |
| Tipe enum (Dokter/Beautician) | Gunakan GORM `type:enum` atau `check` constraint |
| CompanyID di setiap query | Pastikan token/session mengambil companyID yang benar |
| Validasi email & no telp | Gunakan validation di request struct dan di frontend |

---

## TESTING

### Backend
- `go test ./internal/services/ -run TestDokter`
- Manual API test dengan curl/Postman

### Frontend
- `npm run test` (jika ada test untuk component)
- Manual testing di browser dengan business type clinic

---

## DEPLOYMENT CHECKLIST
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Database migration tested (AutoMigrate)
- [ ] API endpoints tested
- [ ] Frontend menu appears only for clinic business type
- [ ] CRUD operations work end-to-end
