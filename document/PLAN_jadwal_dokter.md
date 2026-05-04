# PLAN: Implementasi Jadwal Dokter

## 📋 RENCANA IMPLEMENTASI JADWAL DOKTER

### A. BACKEND (GoFiber + GORM + PostgreSQL)

#### 1. Model JadwalDokter
**File**: `D:\Project\pos_retail\go_backend\internal\models\clinic.go` (buat baru)

```go
type JadwalDokter struct {
    ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    DokterID   uuid.UUID `gorm:"type:uuid;notNull;index" json:"dokter_id"`
    CompanyID  uuid.UUID `gorm:"type:uuid;notNull;index" json:"company_id"`
    Hari       string    `gorm:"type:varchar(20);notNull" json:"hari"`
    JamMulai   string    `gorm:"type:time;notNull" json:"jam_mulai"`
    JamSelesai string    `gorm:"type:time;notNull" json:"jam_selesai"`
    IsActive   bool      `gorm:"column:is_active;notNull;default:true" json:"is_active"`
    CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
    UpdatedAt  time.Time `gorm:"autoUpdateTime" json:"updated_at"`

    Dokter     *Dokter   `gorm:"foreignKey:DokterID;references:ID" json:"dokter,omitempty"`
}

func (j *JadwalDokter) BeforeCreate(tx *gorm.DB) error {
    if j.ID == uuid.Nil {
        j.ID = uuid.New()
    }
    return nil
}

func (JadwalDokter) TableName() string {
    return "jadwal_dokter"
}
```

#### 2. Repository Layer
**File**: `D:\Project\pos_retail\go_backend\internal\repository\jadwal_dokter_repository.go`

Methods:
- `CreateJadwalDokter(data map[string]interface{}) (*JadwalDokterRow, error)`
- `FindJadwalDokters(filters map[string]interface{}, limit, offset int, companyID uuid.UUID) ([]JadwalDokterRow, int64, error)`
- `FindJadwalDokterByID(id string, companyID uuid.UUID) (*JadwalDokterRow, error)`
- `UpdateJadwalDokter(id string, updates map[string]interface{}, companyID uuid.UUID) error`
- `DeleteJadwalDokter(id string, companyID uuid.UUID) error`

#### 3. Service Layer
**File**: `D:\Project\pos_retail\go_backend\internal\services\jadwal_dokter_service.go`

Methods:
- `CreateJadwalDokter(input map[string]interface{}, companyID string) response.ApiResponse`
- `GetJadwalDokters(filters map[string]interface{}, limit, offset int, companyID string) response.PaginatedResponse`
- `GetJadwalDokterByID(id string, companyID string) response.ApiResponse`
- `UpdateJadwalDokter(id string, updates map[string]interface{}, companyID string) response.ApiResponse`
- `DeleteJadwalDokter(id string, companyID string) response.ApiResponse`

#### 4. Handler Layer
**File**: `D:\Project\pos_retail\go_backend\internal\handlers\jadwal_dokter_handler.go`

Methods:
- `CreateJadwalDokter(c *fiber.Ctx) error`
- `GetJadwalDokters(c *fiber.Ctx) error`
- `GetJadwalDokter(c *fiber.Ctx) error`
- `UpdateJadwalDokter(c *fiber.Ctx) error`
- `DeleteJadwalDokter(c *fiber.Ctx) error`

#### 5. Request DTOs
**File**: `D:\Project\pos_retail\go_backend\internal\types\request\jadwal_dokter_request.go`

```go
type CreateJadwalDokterRequest struct {
    DokterID   string `json:"dokter_id" validate:"required"`
    Hari       string `json:"hari" validate:"required"`
    JamMulai   string `json:"jam_mulai" validate:"required"`
    JamSelesai string `json:"jam_selesai" validate:"required"`
}

type UpdateJadwalDokterRequest struct {
    DokterID   *string `json:"dokter_id"`
    Hari       *string `json:"hari"`
    JamMulai   *string `json:"jam_mulai"`
    JamSelesai *string `json:"jam_selesai"`
}
```

#### 6. Route Registration
**File**: `D:\Project\pos_retail\go_backend\cmd\server\main.go`

Tambahkan route:
```go
jadwalDokter := protected.Group("/jadwal-dokter")
jadwalDokter.Post("/", jadwalDokterHandler.CreateJadwalDokter)
jadwalDokter.Get("/", jadwalDokterHandler.GetJadwalDokters)
jadwalDokter.Get("/:id", jadwalDokterHandler.GetJadwalDokter)
jadwalDokter.Put("/:id", jadwalDokterHandler.UpdateJadwalDokter)
jadwalDokter.Delete("/:id", jadwalDokterHandler.DeleteJadwalDokter)
```

#### 7. AutoMigrate
Update `database.AutoMigrate()` di `main.go` untuk menambahkan `&models.JadwalDokter{}`

---

### B. FRONTEND (React + Vite)

#### 1. Toolbar Item Configuration
**File**: `D:\Project\pos_retail\frontend_v2\src\data\toolbarItems.js`

Tambahkan setelah `supplier`:
```javascript
{ key: 'jadwal_dokter', label: 'Jadwal Dokter', mark: 'J', tone: 'teal', filter: { businessType: ['clinic'], moduleCodes: ['clinic_core'] } }
```

#### 2. API Functions
**File**: `D:\Project\pos_retail\frontend_v2\src\features\master\jadwal_dokter\jadwal_dokter.api.js`

Functions:
- `listJadwalDokter(token, params)`
- `createJadwalDokter(token, input)`
- `updateJadwalDokter(token, id, input)`
- `deleteJadwalDokter(token, id)`

#### 3. Component
**File**: `D:\Project\pos_retail\frontend_v2\src\components\ToolbarItem\master\JadwalDokter.jsx`

Fitur:
- Tabel dengan kolom: No, Dokter, Hari, Jam Mulai, Jam Selesai, Status, Aksi
- Form create/edit dengan dropdown dokter, hari (Senin-Minggu), time picker
- Search, pagination, status toggle
- Import/Export Excel
- Keyboard navigation (F1=New, F2=Edit, Delete, Escape=Exit)

#### 4. Register Component
**File**: `D:\Project\pos_retail\frontend_v2\src\components\Dashboard\DashboardCanvas.jsx`

Import dan tambahkan conditional rendering:
```javascript
if (activeTool === 'jadwal_dokter') {
  return <JadwalDokter onExit={onExit} />
}
```

#### 5. Update IMPLEMENTED_TOOLS
**File**: `D:\Project\pos_retail\frontend_v2\src\App.jsx`

Tambahkan `'jadwal_dokter'` ke `IMPLEMENTED_TOOLS`

---

## 🎨 SKETSA VISUAL DESIGN

```
+------------------------------------------------------------------+
|  Master > Jadwal Dokter                                [Search:]  |
+------------------------------------------------------------------+
| No | Dokter        | Hari    | Jam Mulai | Jam Selesai | Status  |
+----+---------------+---------+-----------+--------------+---------+
| 1  | Dr. Budi      | Senin   | 08:00     | 12:00       | ✅ Aktif|
| 2  | Dr. Ani       | Selasa  | 14:00     | 17:00       | ✅ Aktif|
+----+---------------+---------+-----------+--------------+---------+
|  < Prev   1 of 10   Next >                                 |
+------------------------------------------------------------------+
| [F1 New] [F2 Edit] [Del] [Print] [Import] [Export] [Exit] |
+------------------------------------------------------------------+

Form Create/Edit:
+----------------------------+
| Dokter: [Dr. Budi        ▼]|
| Hari:   [Senin          ▼]|
| Jam:    [08:00] - [12:00] |
| [Save] [Cancel]            |
+----------------------------+
```

---

## ## Technical Implementation

1. **Backend**: Menggunakan pola layered architecture (Handler → Service → Repository) yang sudah ada
2. **Frontend**: Mengikuti pola master data yang sudah ada (Customer/Supplier)
3. **Relasi**: JadwalDokter memiliki foreign key ke Dokter (asumsi tabel dokter sudah ada)
4. **Filter**: Hanya tampil untuk business_type `clinic` dan module `clinic_core`
5. **Time Handling**: Menggunakan string format "HH:MM" untuk jam_mulai dan jam_selesai

---

## ⚠️ RISIKO & MITIGASI

| Risiko | Mitigasi |
|--------|----------|
| Foreign key constraint error | Pastikan reference ke tabel `dokters` (sudah ada) dengan field `id` UUID |
| Time format tidak konsisten | Validasi format HH:MM di frontend dan backend |
| CompanyID filtering | Pastikan setiap query menyertakan filter companyID |
| Hari enum validation | Validasi hari (Senin-Minggu) di backend dan frontend |
