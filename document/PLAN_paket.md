# PLAN PAKET - Master Menu

## 📋 RENCANA IMPLEMENTASI FITUR PAKET

### Informasi Penting
Dari eksplorasi ditemukan:
- **Frontend**: Menggunakan pola state-based routing (tanpa React Router), dengan template master-detail (`useMasterDetail.js`, `MasterDetailTable.jsx`)
- **Backend**: Menggunakan Fiber + GORM, pola layered architecture (Handlers → Services → Repository)
- **Database**: Semua model existing menggunakan **UUID** sebagai primary key, sedangkan schema awal menggunakan **INT AUTO_INCREMENT**

---

## 🎯 RENCANA PERUBAHAN

### 1. DATABASE SCHEMA (PostgreSQL + UUID)

```sql
-- Tabel Paket (Header)
CREATE TABLE paket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kodepaket VARCHAR(50) UNIQUE NOT NULL,
  nm_paket VARCHAR(150) NOT NULL,
  deskripsi TEXT,
  harga_paket DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Detail Paket (Child)
CREATE TABLE detail_paket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_paket UUID NOT NULL REFERENCES paket(id) ON DELETE CASCADE,
  id_produk UUID NOT NULL REFERENCES produk(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(id_paket, id_produk)
);

-- Indexes
CREATE INDEX idx_detail_paket_id_produk ON detail_paket(id_produk);
```

---

### 2. BACKEND (Go) - `D:\Project\pos_retail\go_backend\`

#### A. Model (`internal/models/paket.go`)
```go
type Paket struct {
    ID         uuid.UUID     `gorm:"type:uuid;primaryKey" json:"id"`
    KodePaket   string        `gorm:"size:50;unique;not null" json:"kodepaket"`
    NmPaket     string        `gorm:"size:150;not null" json:"nm_paket"`
    Deskripsi   string        `gorm:"type:text" json:"deskripsi"`
    HargaPaket  float64       `gorm:"type:decimal(12,2);default:0" json:"harga_paket"`
    IsActive    bool          `gorm:"default:true" json:"is_active"`
    CreatedAt   time.Time     `json:"created_at"`
    UpdatedAt   time.Time     `json:"updated_at"`
    Details     []DetailPaket `gorm:"foreignKey:IDPaket;constraint:OnDelete:CASCADE" json:"details,omitempty"`
}

type DetailPaket struct {
    ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
    IDPaket   uuid.UUID `gorm:"type:uuid;not null;index" json:"id_paket"`
    IDProduk  uuid.UUID `gorm:"type:uuid;not null;index" json:"id_produk"`
    CreatedAt time.Time  `json:"created_at"`
    UpdatedAt time.Time  `json:"updated_at"`
    Produk    Product    `gorm:"foreignKey:IDProduk" json:"produk,omitempty"`
}
```

#### B. Repository (`internal/repository/paket_repository.go`)
- `FindAll(search, limit, offset) ([]Paket, int64, error)`
- `FindByID(id) (*Paket, error)` - include preload Details.Produk
- `Create(paket *Paket) error`
- `Update(paket *Paket) error`
- `Delete(id) error`
- `CalculateTotalHarga(idPaket uuid.UUID) (float64, error)` - sum harga produk

#### C. Service (`internal/services/paket_service.go`)
- `CreatePaket(input CreatePaketInput) (response.ApiResponse)`
  - Insert paket header
  - Insert detail_paket items
  - **Auto-calculate**: Query sum harga produk → update harga_paket
  - Gunakan `db.Transaction()`
- `UpdatePaket(id, input) (response.ApiResponse)`
  - Update header
  - Replace details (delete old + insert new)
  - **Auto-calculate** harga_paket
- `GetPaket(id) (response.ApiResponse)` - with details + produk info
- `ListPaket(search, limit, offset) (response.ApiResponse)`

#### D. Handler (`internal/handlers/paket_handler.go`)
- `GetPakets(c *fiber.Ctx)` - list dengan pagination
- `GetPaket(c *fiber.Ctx)` - detail by ID
- `CreatePaket(c *fiber.Ctx)` - create dengan items
- `UpdatePaket(c *fiber.Ctx)` - update dengan items
- `DeletePaket(c *fiber.Ctx)` - soft delete

#### E. Routes (`cmd/server/main.go`)
```go
paket := protected.Group("/paket")
paket.Get("/", paketHandler.GetPakets)
paket.Get("/:id", paketHandler.GetPaket)
paket.Post("/", paketHandler.CreatePaket)
paket.Put("/:id", paketHandler.UpdatePaket)
paket.Delete("/:id", paketHandler.DeletePaket)
```

#### F. AutoMigrate (`internal/database/database.go`)
Tambah `&models.Paket{}`, `&models.DetailPaket{}` ke AutoMigrate

---

### 3. FRONTEND (React) - `D:\Project\pos_retail\frontend_v2\`

#### A. API Layer (`src/features/master/paket/paket.api.js`)
```javascript
export async function listPaket(token, params = {})
export async function getPaket(token, id)
export async function createPaket(token, input) // input = { kodepaket, nm_paket, deskripsi, items: [{id_produk}] }
export async function updatePaket(token, id, input)
export async function deletePaket(token, id)
```
**Note**: `harga_paket` tidak dikirim dari frontend, dihitung otomatis di backend.

#### B. Component (`src/components/ToolbarItem/master/Paket.jsx`)
Mengadaptasi pola dari `Product.jsx` + tab untuk detail:
- **Header Form**: Kode Paket, Nama Paket, Deskripsi, Status Aktif (toggle)
- **Tabs**: General | Detail Produk
- **Harga Total**: Display-only, auto-calculated dari backend
- **Detail Table**: Pilih produk dari popup/search, tampilkan nama produk + harga satuan
- **Footer**: New, Edit, Delete, Save, Cancel (pakai `FooterMaster` & `FooterFormMaster`)

#### C. Update Config Files
1. **`src/data/toolbarItems.js`**:
   ```javascript
   { key: 'paket', label: 'Paket', mark: 'P', tone: 'purple', filter: { searchFields: ['kodepaket', 'nm_paket'] } }
   ```

2. **`src/components/Dashboard/DashboardCanvas.jsx`**:
   - Import `Paket` component
   - Tambah conditional rendering untuk `activeTool === 'paket'`

3. **`src/App.jsx`**:
   - Tambah `'paket'` ke `IMPLEMENTED_TOOLS`

---

### 4. LOGIKA AUTO-CALCULATE HARGA PAKET

**Di Go Service (`paket_service.go`):**
```go
func (s *PaketService) calculateAndUpdateHarga(tx *gorm.DB, paketID uuid.UUID) error {
    var total float64
    err := tx.Raw(`
        SELECT COALESCE(SUM(p.harga_jual), 0) 
        FROM detail_paket dp 
        JOIN produk p ON dp.id_produk = p.id 
        WHERE dp.id_paket = ?
    `, paketID).Scan(&total).Error
    
    if err != nil {
        return err
    }
    
    return tx.Model(&models.Paket{}).Where("id = ?", paketID).Update("harga_paket", total).Error
}
```
Dipanggil setiap kali `CreatePaket` atau `UpdatePaket` selesai memproses details.

---

### 5. SKETSA VISUAL DESIGN

#### Main List View (Same as before)
```
┌─────────────────────────────────────────────────────────────┐
│  ▌ Daftar Paket                                               │
│  ──────────────────────────────────────────────────────── │
│  🔍 [Search keyword...]           Status: [Active ▼]            │
│                                                                  │
│  ──────────────────────────────────────────────────────── │
│  NO │ KODE     │ NAMA PAKET      │ HARGA       │ STATUS         │
│  ──────────────────────────────────────────────────────── │
│   1 │ PKT001   │ Paket Hemat     │ Rp 50.000  │ [✓ Active]    │
│   2 │ PKT002   │ Paket Promo     │ Rp 75.000  │ [✓ Active]    │
│  ──────────────────────────────────────────────────────── │
│                                                                  │
│  [+ New] [F2 Edit] [Del] [Print] [Export] [Import] [Exit]     │
└─────────────────────────────────────────────────────────────┘
```

#### NEW Form View - LEFT-RIGHT SPLIT (Like Purchase)

**Layout Inspiration**: Mengikuti pola `PurchaseDetail.jsx` dengan left-right split:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  📦 Isi Data Paket                                           │
│  ──────────────────────────────────────────────────────────────────── │
│  ┌──────────────────────────┐  ┌────────────────────┐          │
│  │ LEFT: Detail Produk      │  │ RIGHT: Header Paket  │          │
│  │                          │  │                    │          │
│  │ [🔍 Cari Produk...] [+]│  │ Kode: PKT001      │          │
│  │                          │  │ Nama: Paket Hemat │          │
│  │ NO │ KODE │ NAMA      │  │ Deskripsi: ...    │          │
│  │  1 │ PRD001│ Kopi...   │  │ Status: [✓ Active] │          │
│  │  2 │ PRD002│ Teh...    │  │                    │          │
│  │                          │  ├────────────────────┤          │
│  │ TOTAL: Rp 50.000     │  │ SUMMARY            │          │
│  └──────────────────────────┘  │ Total: Rp 50.000   │          │
│  [Save] [Cancel] [<<Prev] │  │ Jumlah Item: 2      │          │
│                            │  └────────────────────┘          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Key Changes from Tab-based to Split Layout:**
1. **Remove Tabs**: General & Detail Produk tabs akan dihapus
2. **Left Panel** (flex: 1): Menampilkan tabel detail produk (scrollable)
3. **Right Sidebar** (width: 380px): Form header + summary section
4. **Bottom Footer**: Search input + action buttons (save, cancel, prev, next)

#### CSS Classes to Use (from Purchase.css)
- `.po-layout-container` - flex row, min-height: 80vh
- `.po-main-content` - flex: 1, display flex col, overflow hidden
- `.po-items-wrapper` - flex: 1, overflow auto (scrollable table)
- `.po-footer-input` - padding, border-top, display flex
- `.po-sidebar` - width: 380px, border-left, display flex col
- `.po-header-section` - padding, display flex, align center
- `.po-form-panel` - flex: 1, overflow auto, padding
- `.po-summary-section` - padding, border-top, background
┌─────────────────────────────────────────────────────────────────────┐
│  ▌ Daftar Paket                                               │
│  ──────────────────────────────────────────────────────────────── │
│  🔍 [Search keyword...]           Status: [Active ▼]            │
│                                                                  │
│  ──────────────────────────────────────────────────────────────── │
│  NO │ KODE     │ NAMA PAKET      │ HARGA       │ STATUS         │
│  ──────────────────────────────────────────────────────────────── │
│   1 │ PKT001   │ Paket Hemat     │ Rp 50.000  │ [✓ Active]    │
│   2 │ PKT002   │ Paket Promo     │ Rp 75.000  │ [✓ Active]    │
│  ──────────────────────────────────────────────────────────────── │
│                                                                  │
│  [+ New] [F2 Edit] [Del] [Print] [Export] [Import] [Exit]     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Form View dengan Tabs
```
┌─────────────────────────────────────────────────────────────────────┐
│  📦 Isi Data Paket                    [General] [Detail Produk]  │
│  ──────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌─ HEADER PAKET ─────────────────────────────────────────────┐  │
│  │ Kode Paket*:  [PKT001        ]                             │  │
│  │ Nama Paket*:  [Paket Hemat                ]                 │  │
│  │ Deskripsi  :  [Promo paket hemat bulan ini ]              │  │
│  │ Status      :  [✓ Active]                                  │  │
│  │ Harga Total :  Rp 50.000 (read-only, auto-calculate)      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ DETAIL PRODUK DALAM PAKET ──────────────────────────────┐  │
│  │ 🔍 [Cari Produk...]  [+ Tambah]                          │  │
│  │ NO │ KODE    │ NAMA PRODUK    │ HARGA SATUAN │ AKSI       │  │
│  │  1 │ PRD001  │ Kopi Luwak     │ Rp 25.000   │ [🗑️ Hapus]│  │
│  │  2 │ PRD002  │ Teh Botol      │ Rp 15.000   │ [🗑️ Hapus]│  │
│  │ TOTAL HARGA: Rp 50.000                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [Save] [Cancel]  [<< Prev] [Next >>]                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 6. RISIKO & MITIGASI

| Risiko | Mitigasi |
|--------|----------|
| Harga produk berubah setelah paket dibuat | Info: harga_paket dihitung saat create/update, tidak auto-update jika harga produk berubah (kecuali diminta) |
| Detail paket duplicate | Unique constraint `(id_paket, id_produk)` di database |
| Race condition update | Gunakan `db.Transaction()` di Go service |
| Produk dihapus saat ada di paket | Foreign key `ON DELETE RESTRICT` di detail_paket |
| Frontend mengirim harga manual | Backend mengabaikan field harga_paket dari request, selalu hitung ulang |

---

### 7. KONFIRMASI USER

Berdasarkan jawaban user:
- ✅ **ID Format**: UUID (mengikuti pola existing backend)
- ✅ **Auto Harga**: Backend Calculate (harga dihitung otomatis di Go service)
- ✅ **Field Tambahan**: Kode Paket, Deskripsi, Status Aktif
