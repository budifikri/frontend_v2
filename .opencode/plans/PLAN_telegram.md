# PLAN: Telegram Integration for Real-Time Transaction Notifications

## Overview
Add Telegram Bot integration to send real-time notifications **per company** for:
- Penjualan (Sales)
- Pembelian (Purchases)
- Stock Opname

## Tech Stack
- **Backend**: Go + Fiber + PostgreSQL
- **Frontend**: React + Vite
- **Telegram API**: Bot API with Markdown formatting

---

## Requirements
1. Send notification **per company** (company-specific Telegram chat)
2. Use **Markdown** format for messages
3. Test button verifies **both connection AND chat ID validity**

---

## Database - `plan_telegram` table

```sql
CREATE TABLE plan_telegram (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) UNIQUE,
  telegram_id VARCHAR(50) NOT NULL,
  api_key VARCHAR(255) NOT NULL,
  notify_penjualan BOOLEAN DEFAULT false,
  notify_pembelian BOOLEAN DEFAULT false,
  notify_stock_opname BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Backend Implementation

### 1. Files to Create

```
go_backend/
├── internal/
│   ├── handlers/
│   │   └── telegram_handler.go     # NEW - HTTP handlers
│   ├── services/
│   │   └── telegram_service.go  # NEW - Business logic + sending
│   ├── models/
│   │   └── telegram.go     # NEW - Model definition
│   ├── repository/
│   │   └── telegram_repository.go  # NEW - Data access
│   └── types/
│       └── request/
│           └── telegram_request.go  # NEW - Request DTOs
├── cmd/server/
│   └── main.go      # MODIFY - Register routes + AutoMigrate
```

### 2. API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/telegram` | Get config by company | Company admin |
| POST | `/api/telegram` | Save/Update config | Company admin |
| POST | `/api/telegram/test` | Test connection | Company admin |

### 3. Model - `internal/models/telegram.go`

```go
type TelegramConfig struct {
    ID               uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
    CompanyID         uuid.UUID `gorm:"type:uuid;uniqueIndex;notNull" json:"company_id"`
    TelegramID       string  `gorm:"column:telegram_id;type:varchar(50);notNull" json:"telegram_id"`
    APIKey          string  `gorm:"column:api_key;type:varchar(255);notNull" json:"api_key"`
    NotifyPenjualan     bool    `gorm:"column:notify_penjualan;default:false" json:"notify_penjualan"`
    NotifyPembelian     bool    `gorm:"column:notify_pembelian;default:false" json:"notify_pembelian"`
    NotifyStockOpname   bool    `gorm:"column:notify_stock_opname;default:false" json:"notify_stock_opname"`
    IsActive        bool    `gorm:"column:is_active;default:true" json:"is_active"`
    CreatedAt        time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
    UpdatedAt        time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (TelegramConfig) TableName() string {
    return "plan_telegram"
}
```

### 4. Request DTO - `internal/types/request/telegram_request.go`

```go
type CreateTelegramRequest struct {
    TelegramID     string `json:"telegram_id" validate:"required"`
    APIKey        string `json:"api_key" validate:"required"`
    NotifyPenjualan   bool  `json:"notify_penjualan"`
    NotifyPembelian   bool  `json:"notify_pembelian"`
    NotifyStockOpname bool  `json:"notify_stock_opname"`
    IsActive      bool  `json:"is_active"`
}

type TestTelegramRequest struct {
    TelegramID string `json:"telegram_id" validate:"required"`
    APIKey    string `json:"api_key" validate:"required"`
}
```

### 5. Service - `internal/services/telegram_service.go`

```go
type TelegramService struct {
    db *gorm.DB
    telegramRepo *repository.TelegramRepository
}

func NewTelegramService(db *gorm.DB, telegramRepo *repository.TelegramRepository) *TelegramService {
    return &TelegramService{db: db, telegramRepo: telegramRepo}
}

// GetConfigByCompany returns telegram config for a company
func (s *TelegramService) GetConfigByCompany(companyID uuid.UUID) (*models.TelegramConfig, error)

// SaveConfig creates or updates telegram config
func (s *TelegramService) SaveConfig(companyID uuid.UUID, input request.CreateTelegramRequest) (*models.TelegramConfig, error)

// TestConnection tests bot API + validates chat ID
func (s *TelegramService) TestConnection(telegramID, apiKey string) error

// SendNotification sends message to Telegram
func (s *TelegramService) SendNotification(telegramID, apiKey, message string) error
```

### 6. Telegram Message Formats (Markdown)

**Penjualan:**
```
*PENJUALAN BARU*

Waktu: 2026-04-16 14:30:00
Total: Rp 1.500.000
Kasir: ADMIN
No: INV/2026/001
```

**Pembelian:**
```
*PEMBELIAN BARU*

Supplier: PT ABC
Tanggal: 2026-04-16
Total: Rp 2.000.000
No: PO/2026/001
```

**Stock Opname:**
```
*STOCK OPNAME SELESAI*

Warehouse: GUDANG UTAMA
Tanggal: 2026-04-16
Status: COMPLETE
Selisih: 5 item
```

---

### 7. Integration Hooks (Services to Modify)

#### `internal/services/sales_service.go`
After `CreateSale()` succeeds, add:

```go
// Send telegram notification for Penjualan
config, _ := telegramRepo.GetConfigByCompany(input.CompanyID)
if config != nil && config.IsActive && config.NotifyPenjualan {
    msg := formatPenjualanMessage(sale)
    telegramService.SendNotification(config.TelegramID, config.APIKey, msg)
}
```

#### `internal/services/purchase_service.go`
After status changes to "APPROVE":

```go
// Send telegram notification for Pembelian
config, _ := telegramRepo.GetConfigByCompany(companyID)
if config != nil && config.IsActive && config.NotifyPembelian {
    msg := formatPembelianMessage(po)
    telegramService.SendNotification(config.TelegramID, config.APIKey, msg)
}
```

#### `internal/services/inventory_service.go`
After StockOpname status changes to "COMPLETE":

```go
// Send telegram notification for Stock Opname
config, _ := telegramRepo.GetConfigByCompany(companyID)
if config != nil && config.IsActive && config.NotifyStockOpname {
    msg := formatStockOpnameMessage(opname)
    telegramService.SendNotification(config.TelegramID, config.APIKey, msg)
}
```

---

## Frontend Implementation

### 1. Files to Create

```
frontend_v2/src/
├── components/
│   └── ToolbarItem/
│       └── setting/
│           └── Telegram.jsx     # NEW - Settings form
└── features/
    └── setting/
        └── telegram.storage.js  # NEW - Local storage
```

### 2. Files to Modify

```
frontend_v2/src/
├── components/
│   └── Dashboard/
│       └── DashboardCanvas.jsx  # ADD - telegram route
```

### 3. Component: Telegram.jsx

```jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../features/auth/useAuth'
import { Toast } from '../../components/Toast'
import './Telegram.css'

export function Telegram({ onExit }) {
  const { token, user } = useAuth()
  const [form, setForm] = useState({
    telegram_id: '',
    api_key: '',
    notify_penjualan: false,
    notify_pembelian: false,
    notify_stock_opname: false,
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/telegram', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setForm(data)
      }
    } catch (err) {
      // Ignore - might not exist yet
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      setToast({ type: 'success', message: 'Konfigurasi disimpan' })
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ telegram_id: form.telegram_id, api_key: form.api_key })
      })
      setToast({ type: 'success', message: 'Koneksi berhasil!' })
    } catch (err) {
      setToast({ type: 'error', message: 'Koneksi gagal: ' + err.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="telegram-container">
      {/* Header */}
      <div className="master-header">
        <div className="telegram-header-left">
          <button className="master-exit-btn" onClick={onExit}>
            <span className="material-icons-round">arrow_back</span>
          </button>
          <h2>Connect to Telegram</h2>
        </div>
        <div className="company-badge">
          <span className="material-icons-round">business</span>
          {user?.company_name || 'Company'}
        </div>
      </div>

      {/* Form */}
      <div className="telegram-form master-form-card">
        <div className="form-field">
          <label>Telegram ID</label>
          <input
            type="text"
            className="receipt-text-input"
            value={form.telegram_id}
            onChange={(e) => setForm({ ...form, telegram_id: e.target.value })}
            placeholder="Contoh: 123456789"
          />
        </div>

        <div className="form-field">
          <label>API Key</label>
          <input
            type="password"
            className="receipt-text-input"
            value={form.api_key}
            onChange={(e) => setForm({ ...form, api_key: e.target.value })}
            placeholder="Bot Token"
          />
        </div>

        <div className="form-field checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.notify_penjualan}
              onChange={(e) => setForm({ ...form, notify_penjualan: e.target.checked })}
            />
            <span className="checkbox-custom"></span>
            Notify Penjualan
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.notify_pembelian}
              onChange={(e) => setForm({ ...form, notify_pembelian: e.target.checked })}
            />
            <span className="checkbox-custom"></span>
            Notify Pembelian
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.notify_stock_opname}
              onChange={(e) => setForm({ ...form, notify_stock_opname: e.target.checked })}
            />
            <span className="checkbox-custom"></span>
            Notify Stock Opname
          </label>
        </div>

        <div className="form-actions">
          <button
            className="master-btn-secondary"
            onClick={handleTest}
            disabled={testing || !form.telegram_id || !form.api_key}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            className="master-btn-save-primary"
            onClick={handleSave}
            disabled={loading || !form.telegram_id || !form.api_key}
          >
            {loading ? 'Saving...' : 'Simpan'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
```

### 4. Visual Form Design

```
+------------------------------------------------------------------+
|  < Kembali      Connect to Telegram                [🏢 TOKO BESAR] |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------------------------------------------------+  |
|  |                                                            |  |
|  |  Telegram ID:                                               |  |
|  |  [____________________________________________]            |  |
|  |                                                            |  |
|  |  API Key:                                                   |  |
|  |  [____________________________________________]            |  |
|  |                                                            |  |
|  |  +--------------------------------------------------------+ |  |
|  |  | [ ] Notify Penjualan                                    | |  |
|  |  | [ ] Notify Pembelian                                   | |  |
|  |  | [ ] Notify Stock Opname                                | |  |
|  |  +--------------------------------------------------------+ |  |
|  |                                                            |  |
|  |  [Test Connection]              [Simpan]                     |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

---

## Implementation Order

1. **Backend: Model** - Create telegram.go
2. **Backend: Repository** - Create telegram_repository.go
3. **Backend: Service** - Create telegram_service.go (with sending logic)
4. **Backend: Handler** - Create telegram_handler.go
5. **Backend: Routes** - Add routes in main.go + AutoMigrate
6. **Frontend: Component** - Create Telegram.jsx + storage
7. **Frontend: Route** - Add to DashboardCanvas
8. **Hooks** - Modify sales/purchase/inventory services
9. **Testing** - Test actual notifications

---

## Design System Reference

| Element | Pattern |
|---------|---------|
| **Icons** | Material Icons Round |
| **Primary Button** | `.master-btn-save-primary` (teal: #0D9488) |
| **Secondary Button** | `.master-btn-secondary` (gray) |
| **Card** | `.master-form-card` |
| **Input** | `.receipt-text-input` |
| **Checkbox** | Custom `.checkbox-label` + `.checkbox-custom` |

---

## Estimated Effort

| Item | Complexity | Notes |
|------|------------|-------|
| Telegram Service | Medium | Bot API integration |
| Repository | Low | Simple CRUD |
| Frontend | Low | Form with checkboxes |
| Hooks | Medium | Service modifications |

---

## Dependencies

### Backend (Go)
- No new external dependencies needed
- Uses `net/http` for Telegram Bot API calls

### Frontend
- No new dependencies
- Uses existing patterns: apiFetch, Toast