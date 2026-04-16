# PLAN: Backup Database (Per Company)

## Overview
Fitur backup database **per company** menggunakan `pg_dump` untuk menghasilkan file `.sql`. Admin company hanya bisa backup company-nya sendiri.

## Tech Stack
- **Backend**: Go + Fiber + PostgreSQL
- **Frontend**: React + Vite
- **Backup Method**: `pg_dump` with custom SQL dump per company
- **Multi-tenancy**: Soft multi-tenancy via `company_id` filtering

---

## Database Structure Analysis

### Tables WITH `company_id` (Company-specific):
| Table | Notes |
|-------|-------|
| `companies` | Base company info |
| `users` | Company users |
| `warehouses` | Company warehouses |
| `products` | Products (nullable company_id) |
| `categories` | Categories (nullable company_id) |
| `units_of_measure` | Units (nullable company_id) |
| `customers` | Company customers |
| `suppliers` | Company suppliers |
| `sales`, `sale_items`, `sale_payments` | Sales transactions |
| `purchase_orders`, `purchase_order_items` | Purchase orders |
| `invoices_incoming`, `invoices_outgoing` | Invoices |
| `cash_drawers`, `cash_drawer_transactions` | Cash management |
| `stock_opnames` | Stock opnames |
| `promotions` | Promotions (nullable company_id) |
| `price_tiers` | Price tiers |

### Tables WITHOUT `company_id` (Filtered via relationships):
| Table | Filtered via |
|-------|--------------|
| `inventory` | `warehouse.company_id` |
| `stock_movements` | `warehouse.company_id` |
| `stock_transfers` | `warehouse.company_id` |

---

## Backend Implementation

### 1. New Endpoint

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/backup` | Create backup for current company | Company admin |
| GET | `/api/backup/list` | List backup files (company filter) | Company admin |
| GET | `/api/backup/download/:filename` | Download backup file | Company admin |
| DELETE | `/api/backup/:filename` | Delete backup file | Company admin |
| POST | `/api/backup/schedule` | Set schedule for company | Company admin |
| GET | `/api/backup/schedule` | Get company schedule | Company admin |

### 2. Files to Create/Modify

```
go_backend/
├── internal/
│   ├── handlers/
│   │   └── backup_handler.go        # NEW - HTTP handlers
│   ├── services/
│   │   └── backup_service.go        # NEW - Backup logic per company
│   ├── models/
│   │   └── backup.go                 # NEW - Backup log model
│   ├── repository/
│   │   └── backup_repository.go      # NEW - Data access layer
│   └── config/
│       └── config.go                 # MODIFY - Add backup config
├── cmd/server/
│   └── main.go                       # MODIFY - Register routes
└── .env                              # MODIFY - Add BACKUP_PATH
```

### 3. Backup Log Model

```go
// internal/models/backup.go
type BackupLog struct {
    ID            uint      `gorm:"primaryKey" json:"id"`
    CompanyID     uuid.UUID `gorm:"type:uuid;not null" json:"company_id"`
    Filename      string    `gorm:"size:255;not null" json:"filename"`
    FilePath      string    `gorm:"size:500;not null" json:"file_path"`
    FileSize      int64     `gorm:"not null" json:"file_size"`
    Status        string    `gorm:"size:50;default:'completed'" json:"status"` // pending, completed, failed
    ErrorMessage  string    `gorm:"type:text" json:"error_message,omitempty"`
    CreatedBy     string    `gorm:"size:100" json:"created_by"`
    CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
    IsAuto        bool      `gorm:"default:false" json:"is_auto"`
    TableCount    int       `gorm:"default:0" json:"table_count"`
    RowCount      int64     `gorm:"default:0" json:"row_count"`
}

type BackupSchedule struct {
    ID              uint      `gorm:"primaryKey" json:"id"`
    CompanyID       uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"company_id"`
    Enabled         bool      `gorm:"default:false" json:"enabled"`
    Schedule        string    `gorm:"size:100;default:'0 2 * * *'" json:"schedule"` // cron format
    RetentionDays   int       `gorm:"default:7" json:"retention_days"`
    LastBackupAt    time.Time `json:"last_backup_at,omitempty"`
    UpdatedAt       time.Time `json:"updated_at"`
}
```

### 4. Backup Service Logic

```go
// internal/services/backup_service.go
type BackupService struct {
    db           *gorm.DB
    backupDir    string
    pgDumpPath   string
    dbConfig     DatabaseConfig
}

type CreateBackupRequest struct {
    CompanyID   uuid.UUID
    UserID      string
    IsAuto      bool
}

type BackupResult struct {
    Filename    string
    FilePath    string
    FileSize    int64
    TableCount  int
    RowCount    int64
    Duration    time.Duration
}

// CreateBackupPerCompany:
// 1. Get company info
// 2. Generate filename: {company_code}_{timestamp}.sql
// 3. Build SQL dump with COPY statements for company-specific tables
// 4. Include shared data: products, categories, units, promotions (NULL or matching company_id)
// 5. Replace original INSERT statements with COPY for performance
// 6. Save file to {backupDir}/{company_code}/
// 7. Log to backup_logs with company_id
// 8. Return backup metadata
```

---

## Frontend Implementation

### 1. API Service

```javascript
// src/features/setting/backup.api.js
export async function createBackup(token) { /* POST /api/backup */ }
export async function listBackups(token) { /* GET /api/backup/list */ }
export async function deleteBackup(token, filename) { /* DELETE /api/backup/:filename */ }
export async function getSchedule(token) { /* GET /api/backup/schedule */ }
export async function updateSchedule(token, schedule) { /* POST /api/backup/schedule */ }
export function getDownloadUrl(filename) { /* Return download URL */ }
```

### 2. Component Structure

```
src/components/ToolbarItem/setting/
├── BackupRestore.jsx    # Main screen with tabs
├── BackupRestore.css    # Styles
└── BackupSchedule.jsx   # Schedule settings modal
```

---

## Visual Component Design (Frontend)

### Design System Reference

| Element | Pattern |
|---------|---------|
| **Icons** | Material Icons Round: `<span className="material-icons-round">icon</span>` |
| **Primary Button** | `.master-btn-save-primary` (teal: `#0D9488`) |
| **Secondary Button** | `.master-btn-secondary` (gray) |
| **Cancel Button** | `.master-btn-cancel-secondary` (red: `#dc2626`) |
| **Card** | `.master-form-card` (border: 2px solid var(--frame-color)) |
| **Input** | `.receipt-text-input` |
| **Select** | `.master-filter-select` |
| **Checkbox** | Custom styled with `.checkbox-custom` |
| **Modal** | `.master-dialog-overlay` + `.master-dialog` |

### Color Palette

| Usage | Color | Hex |
|-------|-------|-----|
| Primary/Success | Teal | `#0D9488` |
| Info | Blue | `#2563eb` |
| Warning | Orange | `#f97316` |
| Danger/Delete | Red | `#dc2626` |
| Muted/Disabled | Gray | `#64748b` |
| Background | Light | `#f8fafc` |
| Card Background | White | `#ffffff` |

---

## BACKUP TAB - Visual Form Design

### Screen Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ◀ Kembali        Backup & Restore Database              [🏢 TOKO BESAR]│
├─────────────────────────────────────────────────────────────────────────┤
│  [ 🔄 Backup ]  [ 📥 Restore ]                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │                    ┌──────────────────┐                         │   │
│  │                    │        🔄        │                         │   │
│  │                    │    (80x80)       │                         │   │
│  │                    └──────────────────┘                         │   │
│  │                                                                 │   │
│  │                     Backup Database                               │   │
│  │        Simpan data company ke file .sql untuk keamanan data      │   │
│  │                                                                 │   │
│  │              ┌─────────────────────────────┐                   │   │
│  │              │  💾  Buat Backup Sekarang   │                   │   │
│  │              │     (min-width: 200px)     │                   │   │
│  │              └─────────────────────────────┘                   │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  📁 Daftar Backup                               [⚙ Schedule]  │   │
│  ├───────────────┬──────────┬────────────┬────────┬───────────────┤   │
│  │ File         │ Ukuran   │ Tanggal    │ Tipe   │ Aksi         │   │
│  ├───────────────┼──────────┼────────────┼────────┼───────────────┤   │
│  │ 📄 toko_2026 │ 12.5 MB  │ 16 Apr 26  │ Manual │ [⬇] [🗑]    │   │
│  │ 📄 toko_2026 │ 11.8 MB  │ 15 Apr 26  │ Auto   │ [⬇] [🗑]    │   │
│  │ 📄 toko_2026 │ 10.2 MB  │ 14 Apr 26  │ Auto   │ [⬇] [🗑]    │   │
│  └───────────────┴──────────┴────────────┴────────┴───────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  🕐 Auto backup setiap hari 02:00 • Retensi 7 hari            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component: BackupRestore.jsx

```jsx
// src/components/ToolbarItem/setting/BackupRestore.jsx

import { useState, useEffect } from 'react'
import { createBackup, listBackups, deleteBackup, getSchedule, updateSchedule } from '../../../features/setting/backup.api'
import { Toast } from '../../Toast'
import './BackupRestore.css'

export function BackupRestore({ onExit }) {
  const { token, user } = useAuth()
  const [activeTab, setActiveTab] = useState('backup')
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [schedule, setSchedule] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    loadBackups()
    loadSchedule()
  }, [])

  const loadBackups = async () => {
    setLoading(true)
    try {
      const data = await listBackups(token)
      setBackups(data)
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    setCreating(true)
    try {
      await createBackup(token)
      setToast({ type: 'success', message: 'Backup berhasil dibuat!' })
      loadBackups()
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (filename) => {
    if (!confirm('Hapus backup ini?')) return
    try {
      await deleteBackup(token, filename)
      setToast({ type: 'success', message: 'Backup dihapus' })
      loadBackups()
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    }
  }

  const handleDownload = (filename) => {
    window.open(getDownloadUrl(filename), '_blank')
  }

  return (
    <div className="backup-restore-container">
      {/* Header */}
      <div className="master-header backup-header">
        <div className="backup-header-left">
          <button className="master-exit-btn" onClick={onExit}>
            <span className="material-icons-round">arrow_back</span>
          </button>
          <h2>Backup & Restore Database</h2>
        </div>
        <div className="company-badge">
          <span className="material-icons-round">business</span>
          {user?.company_name || 'Company'}
        </div>
      </div>

      {/* Tabs */}
      <div className="backup-tabs">
        <button
          className={`backup-tab ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          <span className="material-icons-round">backup</span>
          Backup
        </button>
        <button
          className={`backup-tab ${activeTab === 'restore' ? 'active' : ''}`}
          onClick={() => setActiveTab('restore')}
        >
          <span className="material-icons-round">restore</span>
          Restore
        </button>
      </div>

      {/* Content */}
      <div className="backup-content">
        {activeTab === 'backup' && (
          <BackupTab
            backups={backups}
            loading={loading}
            creating={creating}
            schedule={schedule}
            onCreate={handleCreateBackup}
            onDelete={handleDelete}
            onDownload={handleDownload}
            onOpenSchedule={() => setShowScheduleModal(true)}
          />
        )}
        {activeTab === 'restore' && (
          <RestoreTab
            backups={backups}
            token={token}
            onToast={setToast}
          />
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <BackupScheduleModal
          schedule={schedule}
          onSave={async (data) => {
            await updateSchedule(token, data)
            setSchedule(data)
            setShowScheduleModal(false)
            setToast({ type: 'success', message: 'Schedule disimpan' })
          }}
          onClose={() => setShowScheduleModal(false)}
        />
      )}

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

### Component: BackupTab.jsx

```jsx
// Inside BackupRestore.jsx or separate file

function BackupTab({ backups, loading, creating, schedule, onCreate, onDelete, onDownload, onOpenSchedule }) {
  return (
    <div className="backup-tab-content">
      {/* Hero Card - Create Backup */}
      <div className="backup-hero-card master-form-card">
        <div className="backup-hero-icon">
          <span className="material-icons-round">backup</span>
        </div>
        <h3>Backup Database</h3>
        <p>Simpan data company ke file .sql untuk keamanan data</p>
        
        <button
          className="master-btn-save-primary backup-create-btn"
          onClick={onCreate}
          disabled={creating}
        >
          {creating ? (
            <>
              <span className="material-icons-round spinning">sync</span>
              Membuat Backup...
            </>
          ) : (
            <>
              <span className="material-icons-round">save</span>
              Buat Backup Sekarang
            </>
          )}
        </button>
      </div>

      {/* Backup List Card */}
      <div className="backup-list-card master-form-card">
        <div className="backup-list-header">
          <h3>
            <span className="material-icons-round">folder</span>
            Daftar Backup
          </h3>
          <button className="backup-schedule-btn" onClick={onOpenSchedule}>
            <span className="material-icons-round">schedule</span>
            Schedule
            {schedule?.enabled && <span className="schedule-indicator active"></span>}
          </button>
        </div>

        {loading ? (
          <div className="backup-loading">
            <span className="material-icons-round spinning">sync</span>
            Memuat...
          </div>
        ) : backups.length === 0 ? (
          <div className="backup-empty">
            <span className="material-icons-round">folder_open</span>
            <p>Belum ada backup</p>
          </div>
        ) : (
          <div className="backup-table-wrapper">
            <table className="backup-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Ukuran</th>
                  <th>Tanggal</th>
                  <th>Tipe</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id}>
                    <td className="backup-filename">
                      <span className="material-icons-round">description</span>
                      {backup.filename}
                    </td>
                    <td className="backup-size">{formatFileSize(backup.file_size)}</td>
                    <td className="backup-date">{formatDate(backup.created_at)}</td>
                    <td className="backup-type">
                      <span className={`backup-type-badge ${backup.is_auto ? 'auto' : 'manual'}`}>
                        {backup.is_auto ? 'Auto' : 'Manual'}
                      </span>
                    </td>
                    <td className="backup-actions">
                      <button
                        className="backup-action-btn download"
                        onClick={() => onDownload(backup.filename)}
                        title="Download"
                      >
                        <span className="material-icons-round">download</span>
                      </button>
                      <button
                        className="backup-action-btn delete"
                        onClick={() => onDelete(backup.filename)}
                        title="Hapus"
                      >
                        <span className="material-icons-round">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Schedule Info Footer */}
        {schedule?.enabled && (
          <div className="backup-schedule-info">
            <span className="material-icons-round">schedule</span>
            <span>
              Auto backup setiap {formatSchedule(schedule.schedule)} • 
              Retensi {schedule.retention_days} hari
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
```

### Component: BackupScheduleModal.jsx

```jsx
// Inside BackupRestore.jsx

function BackupScheduleModal({ schedule, onSave, onClose }) {
  const [form, setForm] = useState({
    enabled: schedule?.enabled || false,
    schedule: schedule?.schedule || '0 2 * * *',
    retention_days: schedule?.retention_days || 7,
    frequency: getFrequency(schedule?.schedule || '0 2 * * *')
  })

  const handleSave = () => {
    const cronExpression = buildCronExpression(form)
    onSave({ ...form, schedule: cronExpression })
  }

  return (
    <div className="master-dialog-overlay" onClick={onClose}>
      <div className="master-dialog backup-schedule-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>
            <span className="material-icons-round">schedule</span>
            Schedule Backup
          </h3>
          <button className="dialog-close" onClick={onClose}>
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <div className="dialog-content">
          {/* Enable Toggle */}
          <div className="schedule-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              />
              <span className="checkbox-custom"></span>
              Aktifkan Auto Backup
            </label>
          </div>

          {/* Frequency */}
          <div className="schedule-field">
            <label>Frekuensi</label>
            <div className="frequency-options">
              <label className={`frequency-option ${form.frequency === 'daily' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="frequency"
                  value="daily"
                  checked={form.frequency === 'daily'}
                  onChange={() => setForm({ ...form, frequency: 'daily' })}
                />
                <span className="material-icons-round">today</span>
                Harian
              </label>
              <label className={`frequency-option ${form.frequency === 'weekly' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="frequency"
                  value="weekly"
                  checked={form.frequency === 'weekly'}
                  onChange={() => setForm({ ...form, frequency: 'weekly' })}
                />
                <span className="material-icons-round">date_range</span>
                Mingguan
              </label>
              <label className={`frequency-option ${form.frequency === 'custom' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="frequency"
                  value="custom"
                  checked={form.frequency === 'custom'}
                  onChange={() => setForm({ ...form, frequency: 'custom' })}
                />
                <span className="material-icons-round">settings</span>
                Custom
              </label>
            </div>
          </div>

          {/* Day & Time */}
          {form.frequency === 'weekly' && (
            <div className="schedule-row">
              <div className="schedule-field">
                <label>Hari</label>
                <select
                  className="master-filter-select"
                  value={form.day || '1'}
                  onChange={(e) => setForm({ ...form, day: e.target.value })}
                >
                  <option value="1">Senin</option>
                  <option value="2">Selasa</option>
                  <option value="3">Rabu</option>
                  <option value="4">Kamis</option>
                  <option value="5">Jumat</option>
                  <option value="6">Sabtu</option>
                  <option value="0">Minggu</option>
                </select>
              </div>
              <div className="schedule-field">
                <label>Jam</label>
                <select
                  className="master-filter-select"
                  value={form.hour || '2'}
                  onChange={(e) => setForm({ ...form, hour: e.target.value })}
                >
                  {[...Array(24)].map((_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {form.frequency === 'daily' && (
            <div className="schedule-field">
              <label>Jam</label>
              <select
                className="master-filter-select"
                value={form.hour || '2'}
                onChange={(e) => setForm({ ...form, hour: e.target.value })}
              >
                {[...Array(24)].map((_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Cron Preview */}
          <div className="cron-preview">
            <span className="material-icons-round">code</span>
            <code>{buildCronExpression(form)}</code>
          </div>

          {/* Retention */}
          <div className="schedule-field">
            <label>Retensi Backup</label>
            <select
              className="master-filter-select"
              value={form.retention_days}
              onChange={(e) => setForm({ ...form, retention_days: parseInt(e.target.value) })}
            >
              <option value="3">3 hari</option>
              <option value="7">7 hari</option>
              <option value="14">14 hari</option>
              <option value="30">30 hari</option>
            </select>
            <p className="field-hint">Backup older than this will be automatically deleted</p>
          </div>

          {/* Last Backup Info */}
          {schedule?.last_backup_at && (
            <div className="last-backup-info">
              <span className="material-icons-round">info</span>
              Backup terakhir: {formatDateTime(schedule.last_backup_at)}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="master-btn-cancel-secondary" onClick={onClose}>
            Batal
          </button>
          <button className="master-btn-save-primary" onClick={handleSave}>
            <span className="material-icons-round">save</span>
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}
```

### SCHEDULE BACKUP - Visual Form Design

#### Screen Layout - Schedule Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Schedule Backup                                              [×]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │  ☐ Aktifkan Auto Backup                                       │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  📅 Frekuensi                                                        │
│  ┌───────────────┬───────────────┬───────────────┐                   │
│  │   ○ Harian   │  ● Mingguan   │   ○ Custom    │                   │
│  │     📅       │     📆        │     ⚙️        │                   │
│  └───────────────┴───────────────┴───────────────┘                   │
│                                                                         │
│  ┌─────────────────────┬─────────────────────┐                         │
│  │ Hari               │ Jam                  │                         │
│  │ [Senin        ▼]  │ [02:00         ▼]  │                         │
│  └─────────────────────┴─────────────────────┘                         │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │  ⌨️  Cron: 0 2 * * 1                                       │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  🗑️ Retensi                                                        │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Simpan backup selama: [7 hari                         ▼]  │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ ℹ️ Backup terakhir: 16 Apr 2026, 02:00                       │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  [ Batal ]                              [ 💾 Simpan ]                 │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Modal Component Details

```
┌─────────────────────────────────────┐
│  ⚙️ Schedule Backup         [×]    │  ← Header
├─────────────────────────────────────┤
│  ☐ Aktifkan Auto Backup            │  ← Checkbox Toggle
│                                     │
│  📅 Frekuensi                       │  ← Label
│  ┌───────┬───────┬───────┐         │
│  │○Harian│●Minggu│○Custom│         │  ← Radio Options
│  │  📅   │  📆   │  ⚙️   │         │
│  └───────┴───────┴───────┘         │
│                                     │
│  ┌─────────┬─────────┐           │
│  │  Hari   │   Jam   │           │  ← Conditional Fields
│  │[Senin▼] │[02:00▼]│           │
│  └─────────┴─────────┘           │
│                                     │
│  ┌───────────────────────────┐     │
│  │  ⌨️  Cron: 0 2 * * 1   │     │  ← Cron Preview (dark bg)
│  └───────────────────────────┘     │
│                                     │
│  🗑️ Retensi                       │
│  ┌───────────────────────────┐     │
│  │ [7 hari             ▼]  │     │  ← Select dropdown
│  └───────────────────────────┘     │
│                                     │
│  ┌───────────────────────────┐     │
│  │ ℹ️ Backup terakhir: ...   │     │  ← Info box (light blue)
│  └───────────────────────────┘     │
│                                     │
├─────────────────────────────────────┤
│  [ Batal ]        [ 💾 Simpan ]    │  ← Footer
└─────────────────────────────────────┘
```

#### Component States

```
CHECKBOX TOGGLE:
┌────────────────────────────────┐
│ ☐ Aktifkan Auto Backup         │  ← Unchecked (default)
└────────────────────────────────┘
┌────────────────────────────────┐
│ ☑ Aktifkan Auto Backup         │  ← Checked (active)
└────────────────────────────────┘

RADIO OPTIONS:
┌───────────────┐
│ ○ Harian     │  ← Unselected (gray border)
│     📅        │
└───────────────┘
┌───────────────┐
│ ● Harian     │  ← Selected (teal border + bg)
│     📅        │
└───────────────┘

SELECT DROPDOWN:
┌────────────────────────────────┐
│ [7 hari                  ▼]    │  ← Default
└────────────────────────────────┘

CRON PREVIEW:
┌────────────────────────────────┐
│  ⌨️  0 2 * * 1               │  ← Dark background (#1e293b)
└────────────────────────────────┘  ← Green text (#22c55e)
```

#### Color Specifications

| Element | Color | Hex |
|---------|-------|-----|
| Modal Background | White | `#ffffff` |
| Modal Header Text | Dark | `#1e293b` |
| Close Button | Gray | `#64748b` |
| Checkbox Unchecked | Border | `#cbd5e1` |
| Checkbox Checked | Teal | `#0D9488` |
| Radio Unselected | Border | `#e2e8f0` |
| Radio Selected | Teal | `#0D9488` |
| Radio Selected BG | Light Teal | `#f0fdfa` |
| Cron Preview BG | Dark | `#1e293b` |
| Cron Text | Green | `#22c55e` |
| Info Box BG | Light Blue | `#f0f9ff` |
| Info Text | Blue | `#0369a1` |
| Button Cancel | Red | `#dc2626` |
| Button Save | Teal | `#0D9488` |

---

### CSS: BackupRestore.css

```css
/* src/components/ToolbarItem/setting/BackupRestore.css */

/* Container */
.backup-restore-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
}

/* Header */
.backup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
}

.backup-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.backup-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.company-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f1f5f9;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

.company-badge .material-icons-round {
  font-size: 16px;
  color: #2563eb;
}

/* Tabs */
.backup-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
}

.backup-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.backup-tab:hover {
  background: #f1f5f9;
  color: #475569;
}

.backup-tab.active {
  background: #0D9488;
  color: #fff;
}

.backup-tab .material-icons-round {
  font-size: 20px;
}

/* Content */
.backup-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

/* Hero Card */
.backup-hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  background: linear-gradient(135deg, #0D9488 0%, #0f766e 100%);
  border-radius: 12px;
  color: #fff;
  text-align: center;
  margin-bottom: 16px;
}

.backup-hero-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  margin-bottom: 16px;
}

.backup-hero-icon .material-icons-round {
  font-size: 40px;
  color: #fff;
}

.backup-hero-card h3 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
}

.backup-hero-card p {
  margin: 0 0 20px;
  font-size: 14px;
  opacity: 0.9;
}

.backup-create-btn {
  min-width: 200px;
}

.backup-create-btn .material-icons-round {
  margin-right: 8px;
}

/* List Card */
.backup-list-card {
  padding: 0;
  overflow: hidden;
}

.backup-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.backup-list-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.backup-schedule-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.backup-schedule-btn:hover {
  background: #f1f5f9;
  border-color: #0D9488;
  color: #0D9488;
}

.schedule-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.schedule-indicator.active {
  background: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2);
}

/* Table */
.backup-table-wrapper {
  overflow-x: auto;
}

.backup-table {
  width: 100%;
  border-collapse: collapse;
}

.backup-table th,
.backup-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.backup-table th {
  background: linear-gradient(180deg, #374151 0%, #1F2937 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.backup-table tbody tr:hover {
  background: #f8fafc;
}

.backup-filename {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: monospace;
  font-size: 13px;
  color: #1e293b;
}

.backup-filename .material-icons-round {
  font-size: 18px;
  color: #2563eb;
}

.backup-size {
  font-size: 13px;
  color: #64748b;
}

.backup-date {
  font-size: 13px;
  color: #475569;
}

.backup-type-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.backup-type-badge.auto {
  background: #dcfce7;
  color: #16a34a;
}

.backup-type-badge.manual {
  background: #dbeafe;
  color: #2563eb;
}

.backup-actions {
  display: flex;
  gap: 8px;
}

.backup-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.backup-action-btn .material-icons-round {
  font-size: 18px;
}

.backup-action-btn.download {
  color: #2563eb;
}

.backup-action-btn.download:hover {
  background: #dbeafe;
  border-color: #2563eb;
}

.backup-action-btn.delete {
  color: #dc2626;
}

.backup-action-btn.delete:hover {
  background: #fee2e2;
  border-color: #dc2626;
}

/* Empty & Loading States */
.backup-empty,
.backup-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #94a3b8;
}

.backup-empty .material-icons-round,
.backup-loading .material-icons-round {
  font-size: 48px;
  margin-bottom: 12px;
}

.backup-loading .material-icons-round.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Schedule Info Footer */
.backup-schedule-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f0fdf4;
  border-top: 1px solid #bbf7d0;
  font-size: 13px;
  color: #16a34a;
}

/* Modal Dialog */
.backup-schedule-dialog {
  width: 480px;
  max-width: 90vw;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.dialog-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.dialog-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
}

.dialog-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.dialog-content {
  padding: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

/* Form Fields */
.schedule-field {
  margin-bottom: 20px;
}

.schedule-field > label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
}

.schedule-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.checkbox-label input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #cbd5e1;
  border-radius: 4px;
  transition: all 0.2s;
}

.checkbox-label input:checked + .checkbox-custom {
  background: #0D9488;
  border-color: #0D9488;
}

.checkbox-label input:checked + .checkbox-custom::after {
  content: '✓';
  display: block;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  line-height: 16px;
}

/* Frequency Options */
.frequency-options {
  display: flex;
  gap: 12px;
}

.frequency-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.frequency-option input {
  display: none;
}

.frequency-option .material-icons-round {
  font-size: 24px;
  color: #94a3b8;
}

.frequency-option span:last-child {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

.frequency-option:hover {
  border-color: #cbd5e1;
}

.frequency-option.selected {
  border-color: #0D9488;
  background: #f0fdfa;
}

.frequency-option.selected .material-icons-round {
  color: #0D9488;
}

.frequency-option.selected span:last-child {
  color: #0D9488;
}

/* Cron Preview */
.cron-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #1e293b;
  border-radius: 6px;
  margin-bottom: 20px;
}

.cron-preview .material-icons-round {
  font-size: 18px;
  color: #94a3b8;
}

.cron-preview code {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #22c55e;
}

/* Field Hint */
.field-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
}

/* Last Backup Info */
.last-backup-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  font-size: 13px;
  color: #0369a1;
}

/* Button Spinning */
.spinning {
  animation: spin 1s linear infinite;
}
```

---

## Access Control

| Role | Access |
|------|--------|
| Superadmin | Can view all companies, backup/restore any |
| Company Admin | Can only backup/restore own company |
| Manager | Can view backups, cannot restore |
| Staff | Cannot access backup/restore |

### Implementation
```go
// In backup_handler.go
func CreateBackup(c *fiber.Ctx) error {
    user := middleware.GetUserFromContext(c)
    
    // Superadmin can specify company_id, otherwise use user's company
    companyID := user.CompanyID
    if user.IsSuperAdmin && c.Query("company_id") != "" {
        companyID = c.Query("company_id")
    }
    
    // Validate: non-superadmin cannot backup other companies
    if !user.IsSuperAdmin && user.CompanyID != companyID {
        return fiber.NewError(fiber.StatusForbidden, "Access denied")
    }
    
    // ... rest of logic
}
```

---

## Implementation Order

1. **Backend: Model** - Create backup models (backup_logs, backup_schedules)
2. **Backend: Repository** - Backup data access layer
3. **Backend: Service** - Core backup logic with company filtering
4. **Backend: Handler** - HTTP handlers with auth check
5. **Backend: Routes** - Register routes with middleware
6. **Frontend: API** - backup.api.js
7. **Frontend: Component** - BackupRestore.jsx + CSS
8. **Frontend: Activation** - Add to IMPLEMENTED_TOOLS
9. **Scheduled Backup** - Cron job per company
10. **Testing** - Full integration test

---

## Estimated Effort

| Item | Complexity | Notes |
|------|------------|-------|
| Backup service | High | Need proper SQL dump with company filtering |
| Repository layer | Medium | Handle per-company queries |
| Frontend component | Medium | Tabs + schedule modal |
| Per-company cron | High | Dynamic cron management per company |

---

## Dependencies

### Backend (Go)
```go
github.com/robfig/cron/v3  // Scheduled backup per company
```

### Frontend
- No new dependencies needed
- Uses existing patterns: apiFetch, Toast
