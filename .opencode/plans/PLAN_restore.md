# PLAN: Restore Database (Per Company)

## Overview
Fitur restore database **per company** dari file `.sql` backup. Restore hanya mempengaruhi data company tertentu, tidak mengganggu company lain.

## Tech Stack
- **Backend**: Go + Fiber + PostgreSQL
- **Frontend**: React + Vite
- **Restore Method**: `psql` for executing backup file
- **Safety**: Auto-backup sebelum restore, confirmation required

---

## Key Differences from Full Restore

| Aspect | Full Restore | Per-Company Restore |
|--------|--------------|---------------------|
| Scope | All companies | Single company only |
| Data loss | All data | Company data only |
| Impact | System-wide | Company isolated |
| Recovery | Emergency only | Regular operation |

---

## Backend Implementation

### 1. New Endpoint

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/restore/validate` | Validate backup file | Company admin |
| POST | `/api/restore` | Restore from backup | Company admin |
| GET | `/api/restore/progress` | SSE progress stream | Company admin |

### 2. Files to Modify

```
go_backend/
├── internal/
│   ├── handlers/
│   │   └── backup_handler.go        # MODIFY - Add restore handlers
│   ├── services/
│   │   └── backup_service.go        # MODIFY - Add restore logic
│   └── repository/
│       └── backup_repository.go      # MODIFY - Add restore methods
├── cmd/server/
│   └── main.go                       # MODIFY - Register restore routes
└── .env                              # MODIFY - Add config
```

### 3. Restore Service Logic

```go
// internal/services/backup_service.go (additions)

type RestoreRequest struct {
    CompanyID  uuid.UUID `json:"company_id"`
    Filename   string    `json:"filename" validate:"required"`
    Confirm    bool      `json:"confirm"`  // Must be true
}

type RestoreResult struct {
    Status         string            `json:"status"`
    CompanyID      uuid.UUID         `json:"company_id"`
    TablesCleared  int               `json:"tables_cleared"`
    RowsRestored   int64             `json:"rows_restored"`
    Duration       time.Duration     `json:"duration"`
    SafetyBackup   string            `json:"safety_backup"`  // Filename of auto-backup
}

type RestoreProgress struct {
    Stage    string  `json:"stage"`  // "preparing", "clearing", "restoring", "finalizing"
    Progress float64 `json:"progress"`  // 0-100
    Message  string  `json:"message"`
    Table    string  `json:"table,omitempty"`
}

// ValidateBackup:
// 1. Check file exists in {backupDir}/{companyCode}/
// 2. Check file size < max limit (500MB)
// 3. Parse header to verify company_id match
// 4. Count estimated tables
// 5. Return validation result

// RestoreBackupPerCompany:
// 1. Verify confirm flag is true
// 2. Get company_id from JWT (not from request - security)
// 3. Create SAFETY BACKUP of current company data
// 4. Log restore start
// 5. For each table in backup:
//    a. Parse table name from COPY statement
//    b. Clear existing data for this company only
//    c. Import new data
//    d. Update progress via SSE
// 6. Run VACUUM ANALYZE
// 7. Log restore success
// 8. Return summary
```

### 4. Per-Company Restore Strategy

```sql
-- For per-company restore, we use DELETE with company_id filter
-- instead of DROP TABLE

-- Example restore sequence:
BEGIN;

-- Clear existing data for specific company
DELETE FROM sale_items WHERE sale_id IN (
    SELECT id FROM sales WHERE company_id = '550e8400-e29b-41d4-a716-446655440000'
);
DELETE FROM sales WHERE company_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM sale_payments WHERE sale_id IN (
    SELECT id FROM sales WHERE company_id = '550e8400-e29b-41d4-a716-446655440000'
);
-- ... continue for all tables

-- Import new data (from backup COPY statements)
COPY users (id, company_id, email, name, ...) FROM stdin;
...

COMMIT;
```

### 5. Safety Features

```go
// Restore protection layers
const (
    MaxRestoreFileSize    = 500 * 1024 * 1024  // 500MB
    RestoreTimeout        = 30 * time.Minute   // 30 min
    RequireExplicitConfirm = true               // Checkbox required
    AutoBackupBeforeRestore = true             // Always backup first
)

// Safety backup naming
// Before restore, create: {company_code}_safety_{timestamp}.sql
// This allows rollback if restore fails
```

### 6. SSE Progress Streaming

```go
// GET /api/restore/progress
// Server-Sent Events for real-time progress

// Client connects once
// Server sends events:
event: progress
data: {"stage":"preparing","progress":5,"message":"Preparing restore..."}

event: progress
data: {"stage":"clearing","progress":20,"message":"Clearing existing data","table":"sales"}

event: progress
data: {"stage":"restoring","progress":60,"message":"Importing data","table":"sales"}

event: progress
data: {"stage":"finalizing","progress":95,"message":"Running VACUUM..."}

event: complete
data: {"status":"success","rows_restored":15420,"duration":"2m30s"}
```

---

## Frontend Implementation

### 1. API Service (additions)

```javascript
// src/features/setting/backup.api.js (additions)
export async function validateBackup(token, filename) {
  return apiFetch(`/api/restore/validate?filename=${encodeURIComponent(filename)}`, { token })
}

export async function restoreBackup(token, filename) {
  return apiFetch('/api/restore', {
    method: 'POST',
    token,
    body: { filename, confirm: true }
  })
}

export function connectRestoreProgress(token) {
  // Return EventSource for SSE
  return new EventSource(`/api/restore/progress?token=${token}`)
}
```

---

## Visual Component Design (Frontend)

### Design System Reference

| Element | Pattern |
|---------|---------|
| **Icons** | Material Icons Round: `<span className="material-icons-round">icon</span>` |
| **Primary Button** | `.master-btn-save-primary` (teal: `#0D9488`) |
| **Danger Button** | Custom `.restore-btn-danger` (orange: `#f97316`) |
| **Cancel Button** | `.master-btn-cancel-secondary` (red: `#dc2626`) |
| **Card** | `.master-form-card` (border: 2px solid var(--frame-color)) |
| **Input** | `.receipt-text-input` |
| **Select** | `.master-filter-select` |
| **Checkbox** | Custom styled with `.checkbox-custom` |
| **Progress Bar** | Custom `.restore-progress-bar` |

### Color Palette

| Usage | Color | Hex |
|-------|-------|-----|
| Primary | Teal | `#0D9488` |
| Danger/Restore | Orange | `#f97316` |
| Warning | Amber | `#fb923c` |
| Success | Green | `#16a34a` |
| Info | Blue | `#2563eb` |
| Background | Light | `#f8fafc` |

---

## RESTORE TAB - Visual Form Design

### Screen Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ◀ Kembali        Backup & Restore Database              [🏢 TOKO BESAR]│
├─────────────────────────────────────────────────────────────────────────┤
│  [ 🔄 Backup ]  [ 📥 Restore ]                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ⚠️                                                                 │   │
│  │  ┌───────┐                                                        │   │
│  │  │  ⚠️   │                                                        │   │
│  │  │ (56)  │                                                        │   │
│  │  └───────┘                                                        │   │
│  │                                                                 │   │
│  │  PERINGATAN!                                                     │   │
│  │                                                                 │   │
│  │  Restore akan <strong>menghapus SEMUA data company saat ini</strong>│   │
│  │  dan menggantinya dengan data dari file backup.                │   │
│  │                                                                 │   │
│  │  ✓ Data company lain TIDAK terpengaruh                        │   │
│  │  ✓ Backup otomatis akan dibuat sebelum restore                │   │
│  │  ✓ Proses restore tidak bisa dibatalkan                      │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  📁 Pilih File Backup                                          │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ [-- Pilih File Backup --                            ▼]  │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                 │   │
│  │  📋 Detail Backup                                              │   │
│  │  ┌─────────────────────┬─────────────────────┐               │   │
│  │  │ Ukuran File         │ Tanggal Dibuat       │               │   │
│  │  │ 12.5 MB             │ 16 Apr 2026, 10:30  │               │   │
│  │  ├─────────────────────┼─────────────────────┤               │   │
│  │  │ Estimasi Tables     │ Estimasi Rows        │               │   │
│  │  │ 18 tables           │ 15,420 rows          │               │   │
│  │  └─────────────────────┴─────────────────────┘               │   │
│  │                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ Company: ✓ TOKO BESAR                                   │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ ✓ File valid - siap di-restore                          │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ☑️ Saya mengerti dan ingin melanjutkan restore               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              ⚠️  Restore Database                               │   │
│  │                 (orange gradient button)                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Screen Layout - Progress

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  📥 Progress Restore                                            │   │
│  │                                                                 │   │
│  │  ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  60%   │   │
│  │                                                                 │   │
│  │  Memproses: Mengimpor data sales (1,234 rows)                  │   │
│  │                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ ✓ Membuat safety backup...                              │   │   │
│  │  │ ✓ Clearing: sales                                      │   │   │
│  │  │ ✓ Clearing: sale_items                                 │   │   │
│  │  │ → Restoring: sales                                     │   │   │
│  │  │ ○ Restoring: sale_items                                │   │   │
│  │  │ ○ Restoring: customers                                 │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Screen Layout - Confirm Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                          ┌─────────────────────────────────┐           │
│                          │  ⚠️ Konfirmasi Restore          │           │
│                          ├─────────────────────────────────┤           │
│                          │                                 │           │
│                          │  Anda akan melakukan restore    │           │
│                          │  dari file:                    │           │
│                          │                                 │           │
│                          │  ┌─────────────────────────┐   │           │
│                          │  │ toko_besar_20260416.. │   │           │
│                          │  └─────────────────────────┘   │           │
│                          │                                 │           │
│                          │  Pastikan Anda sudah memahami   │           │
│                          │  konsekuensinya.               │           │
│                          │                                 │           │
│                          ├─────────────────────────────────┤           │
│                          │  [ Batal ]  [ ⚠️ Restore ]    │           │
│                          └─────────────────────────────────┘           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component: RestoreTab.jsx

```jsx
// Inside BackupRestore.jsx

function RestoreTab({ backups, token, onToast }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [validation, setValidation] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [progress, setProgress] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const handleFileSelect = async (filename) => {
    setSelectedFile(filename)
    try {
      const result = await validateBackup(token, filename)
      setValidation(result)
    } catch (err) {
      onToast({ type: 'error', message: err.message })
      setValidation(null)
    }
  }

  const handleRestore = () => {
    if (!confirmed) return
    setShowConfirmModal(true)
  }

  const executeRestore = async () => {
    setShowConfirmModal(false)
    setRestoring(true)
    
    const eventSource = connectRestoreProgress(token)
    
    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setProgress(data)
    }
    
    eventSource.addEventListener('complete', (e) => {
      const result = JSON.parse(e.data)
      setRestoring(false)
      eventSource.close()
      if (result.status === 'success') {
        onToast({ type: 'success', message: `Restore berhasil! ${result.rows_restored} baris dikembalikan.` })
      } else {
        onToast({ type: 'error', message: result.error || 'Restore gagal' })
      }
    })
    
    eventSource.addEventListener('error', (e) => {
      setRestoring(false)
      eventSource.close()
      onToast({ type: 'error', message: 'Koneksi terputus' })
    })
    
    try {
      await restoreBackup(token, selectedFile)
    } catch (err) {
      setRestoring(false)
      eventSource.close()
      onToast({ type: 'error', message: err.message })
    }
  }

  const manualBackups = backups.filter(b => !b.is_auto)

  return (
    <div className="restore-tab-content">
      {/* Warning Card */}
      <div className="restore-warning-card master-form-card">
        <div className="restore-warning-icon">
          <span className="material-icons-round">warning</span>
        </div>
        <div className="restore-warning-content">
          <h3>Peringatan!</h3>
          <p>Restore akan <strong>menghapus SEMUA data company saat ini</strong> dan menggantinya dengan data dari file backup.</p>
          <ul className="restore-warning-list">
            <li>
              <span className="material-icons-round">check_circle</span>
              Data company lain TIDAK terpengaruh
            </li>
            <li>
              <span className="material-icons-round">check_circle</span>
              Backup otomatis akan dibuat sebelum restore
            </li>
            <li>
              <span className="material-icons-round">check_circle</span>
              Proses restore tidak bisa dibatalkan
            </li>
          </ul>
        </div>
      </div>

      {/* File Selector Card */}
      <div className="restore-file-card master-form-card">
        <h3>
          <span className="material-icons-round">folder_open</span>
          Pilih File Backup
        </h3>
        
        {manualBackups.length === 0 ? (
          <div className="restore-no-backups">
            <span className="material-icons-round">info</span>
            <p>Tidak ada backup yang tersedia. Buat backup terlebih dahulu.</p>
          </div>
        ) : (
          <div className="restore-file-select">
            <select
              className="master-filter-select"
              value={selectedFile || ''}
              onChange={(e) => handleFileSelect(e.target.value)}
              disabled={restoring}
            >
              <option value="">-- Pilih File Backup --</option>
              {manualBackups.map((backup) => (
                <option key={backup.id} value={backup.filename}>
                  {backup.filename}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Validation Result */}
        {validation && (
          <div className="restore-validation">
            <div className="validation-header">
              <span className="material-icons-round">description</span>
              Detail Backup
            </div>
            <div className="validation-grid">
              <div className="validation-item">
                <label>Ukuran File</label>
                <span>{formatFileSize(validation.file_size)}</span>
              </div>
              <div className="validation-item">
                <label>Tanggal Dibuat</label>
                <span>{formatDateTime(validation.created_at)}</span>
              </div>
              <div className="validation-item">
                <label>Estimasi Tables</label>
                <span>{validation.table_count} tables</span>
              </div>
              <div className="validation-item">
                <label>Estimasi Rows</label>
                <span>{formatNumber(validation.row_count)} rows</span>
              </div>
              <div className="validation-item full">
                <label>Company</label>
                <span className="validation-company">
                  <span className="material-icons-round">check_circle</span>
                  {validation.company_name}
                </span>
              </div>
            </div>
            <div className="validation-status success">
              <span className="material-icons-round">verified</span>
              File valid - siap di-restore
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Checkbox */}
      {selectedFile && validation && (
        <div className="restore-confirm-card master-form-card">
          <label className="checkbox-label restore-confirm-checkbox">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={restoring}
            />
            <span className="checkbox-custom"></span>
            <span>Saya mengerti dan ingin melanjutkan restore</span>
          </label>
        </div>
      )}

      {/* Progress Card */}
      {restoring && progress && (
        <div className="restore-progress-card master-form-card">
          <h3>
            <span className="material-icons-round spinning">sync</span>
            Progress Restore
          </h3>
          
          <div className="restore-progress-bar">
            <div 
              className="restore-progress-fill"
              style={{ width: `${progress.progress}%` }}
            ></div>
          </div>
          
          <div className="restore-progress-info">
            <span className="restore-progress-percent">{Math.round(progress.progress)}%</span>
            <span className="restore-progress-message">{progress.message}</span>
          </div>

          <div className="restore-log">
            <div className="restore-log-entry success">
              <span className="material-icons-round">check_circle</span>
              Membuat safety backup...
            </div>
            {progress.stage === 'clearing' && (
              <div className="restore-log-entry active">
                <span className="material-icons-round">arrow_forward</span>
                Clearing: {progress.table || 'tables'}
              </div>
            )}
            {progress.stage === 'restoring' && (
              <>
                <div className="restore-log-entry success">
                  <span className="material-icons-round">check_circle</span>
                  Clearing completed
                </div>
                <div className="restore-log-entry active">
                  <span className="material-icons-round">arrow_forward</span>
                  Restoring: {progress.table || 'data'}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Restore Button */}
      {selectedFile && validation && !restoring && (
        <button
          className="restore-btn-danger"
          onClick={handleRestore}
          disabled={!confirmed}
        >
          <span className="material-icons-round">restore</span>
          Restore Database
        </button>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="master-dialog-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="master-dialog restore-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header danger">
              <span className="material-icons-round">warning</span>
              Konfirmasi Restore
            </div>
            <div className="dialog-content">
              <p>Anda akan melakukan restore dari file:</p>
              <p className="confirm-filename">{selectedFile}</p>
              <p>Pastikan Anda sudah memahami konsekuensinya.</p>
            </div>
            <div className="dialog-footer">
              <button 
                className="master-btn-cancel-secondary" 
                onClick={() => setShowConfirmModal(false)}
              >
                Batal
              </button>
              <button className="restore-btn-danger" onClick={executeRestore}>
                <span className="material-icons-round">restore</span>
                Ya, Restore Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### CSS Additions for Restore (BackupRestore.css)

```css
/* Add to BackupRestore.css */

/* Restore Tab Content */
.restore-tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Warning Card */
.restore-warning-card {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: #fff7ed;
  border-color: #fb923c;
}

.restore-warning-icon {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffedd5;
  border-radius: 50%;
}

.restore-warning-icon .material-icons-round {
  font-size: 28px;
  color: #ea580c;
}

.restore-warning-content h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #9a3412;
}

.restore-warning-content p {
  margin: 0 0 12px;
  font-size: 14px;
  color: #7c2d12;
}

.restore-warning-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.restore-warning-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #9a3412;
}

.restore-warning-list .material-icons-round {
  font-size: 18px;
  color: #16a34a;
}

/* File Card */
.restore-file-card {
  padding: 20px;
}

.restore-file-card h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.restore-file-select select {
  width: 100%;
}

.restore-no-backups {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  background: #f8fafc;
  border-radius: 8px;
  text-align: center;
}

.restore-no-backups .material-icons-round {
  font-size: 40px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.restore-no-backups p {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

/* Validation */
.restore-validation {
  margin-top: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.validation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.validation-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.validation-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.validation-item.full {
  grid-column: span 2;
}

.validation-item label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
}

.validation-item span {
  font-size: 14px;
  color: #1e293b;
}

.validation-company {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #16a34a;
  font-weight: 500;
}

.validation-company .material-icons-round {
  font-size: 18px;
}

.validation-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.validation-status.success {
  background: #dcfce7;
  color: #16a34a;
}

.validation-status .material-icons-round {
  font-size: 18px;
}

/* Confirm Card */
.restore-confirm-card {
  padding: 20px;
  background: #fef2f2;
  border-color: #fca5a5;
}

.restore-confirm-checkbox {
  font-size: 15px;
  color: #991b1b;
}

/* Progress Card */
.restore-progress-card {
  padding: 20px;
}

.restore-progress-card h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.restore-progress-card h3 .material-icons-round {
  color: #0D9488;
}

.restore-progress-card h3 .material-icons-round.spinning {
  animation: spin 1s linear infinite;
}

.restore-progress-bar {
  height: 12px;
  background: #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.restore-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0D9488 0%, #14b8a6 100%);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.restore-progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.restore-progress-percent {
  font-size: 14px;
  font-weight: 600;
  color: #0D9488;
}

.restore-progress-message {
  font-size: 13px;
  color: #64748b;
}

/* Log */
.restore-log {
  padding: 12px;
  background: #1e293b;
  border-radius: 6px;
  max-height: 150px;
  overflow-y: auto;
}

.restore-log-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 12px;
  font-family: monospace;
  color: #94a3b8;
}

.restore-log-entry.success {
  color: #22c55e;
}

.restore-log-entry.active {
  color: #f97316;
}

.restore-log-entry .material-icons-round {
  font-size: 16px;
}

/* Restore Button */
.restore-btn-danger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);
}

.restore-btn-danger:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 8px rgba(249, 115, 22, 0.4);
}

.restore-btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.restore-btn-danger .material-icons-round {
  font-size: 20px;
}

/* Confirm Dialog */
.restore-confirm-dialog {
  width: 420px;
}

.dialog-header.danger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: #fef2f2;
  border-bottom: 1px solid #fecaca;
  color: #991b1b;
}

.dialog-header.danger .material-icons-round {
  font-size: 24px;
  color: #dc2626;
}

.dialog-header.danger + .dialog-content {
  padding: 20px;
}

.dialog-header.danger + .dialog-content p {
  margin: 0 0 8px;
  font-size: 14px;
  color: #475569;
}

.confirm-filename {
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 6px;
  font-family: monospace;
  font-size: 13px;
  color: #1e293b;
  margin-bottom: 16px !important;
}

.restore-confirm-dialog .dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.restore-confirm-dialog .restore-btn-danger {
  width: auto;
}
```

---

## Restore Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                 PER-COMPANY RESTORE FLOW                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  User selects backup file                                     │
│         ↓                                                     │
│  [API] Validate backup file                                   │
│         ↓                                                     │
│  Verify backup belongs to same company                        │
│         ↓                                                     │
│  Show file details + warning                                  │
│         ↓                                                     │
│  User checks "I understand" checkbox                          │
│         ↓                                                     │
│  User clicks "Restore Database"                               │
│         ↓                                                     │
│  [Modal] Final confirmation                                   │
│         ↓                                                     │
│  [API] Create SAFETY BACKUP (auto)                           │
│         ↓                                                     │
│  [API] Start restore (SSE connected)                         │
│         ↓                                                     │
│  ┌─────────────────────────────────────────┐                 │
│  │ Stage 1: CLEAR (by company_id)          │                 │
│  │ DELETE FROM sales WHERE company_id=?    │                 │
│  │ DELETE FROM users WHERE company_id=?    │                 │
│  │ (Skip tables not in backup)             │                 │
│  └─────────────────────────────────────────┘                 │
│         ↓                                                     │
│  ┌─────────────────────────────────────────┐                 │
│  │ Stage 2: RESTORE                        │                 │
│  │ COPY sales FROM stdin...                │                 │
│  │ COPY users FROM stdin...                │                 │
│  └─────────────────────────────────────────┘                 │
│         ↓                                                     │
│  [SSE] Send progress updates                                  │
│         ↓                                                     │
│  Stage 3: FINALIZE (VACUUM ANALYZE)                          │
│         ↓                                                     │
│  Return success with safety backup name                      │
│         ↓                                                     │
│  Show success + offer to download safety backup              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Implementation Order

1. **Backend: Validate** - Validate backup file endpoint
2. **Backend: Safety backup** - Auto-backup before restore
3. **Backend: Restore handler** - Main restore logic
4. **Backend: SSE progress** - Real-time progress streaming
5. **Frontend: Restore tab** - UI with confirmation
6. **Frontend: Progress UI** - Show restore progress
7. **Integration test** - Test full restore flow

---

## Estimated Effort

| Item | Complexity | Notes |
|------|------------|-------|
| Validate endpoint | Low | File check + header parse |
| Safety backup | Low | Reuse backup logic |
| Per-company restore | High | DELETE by company_id, careful ordering |
| SSE progress | Medium | EventSource on frontend |
| Frontend progress | Medium | Real-time UI updates |

---

## Important Notes

1. **Isolation**: Per-company restore NEVER touches other companies' data
2. **Safety First**: Always auto-backup before restore (can be disabled in config)
3. **Verification**: Check backup file header to ensure company_id match
4. **Order Matters**: Delete child records before parent records (FK constraints)
5. **Transaction**: Wrap in transaction, rollback on any error
6. **Monitoring**: SSE allows long-running restore without timeout

---

## Dependencies

### Backend (Go)
```go
// Uses existing pgx driver for SQL execution
// No new external dependencies
```

### Frontend
```javascript
// Uses native EventSource API
// No new dependencies
```
