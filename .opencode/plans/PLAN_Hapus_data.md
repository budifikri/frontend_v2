# PLAN: Hapus Data (Delete Table Data by Scope)

## Overview

Fitur untuk menghapus data dari tabel database berdasarkan scope yang dipilih. User harus membuat backup sebelum menghapus data. Fitur ini opsional dan tidak wajib digunakan.

---

## Scope Classification

| Scope | Tabel | Deskripsi |
|-------|-------|-----------|
| **Data Master** | `users`, `warehouses`, `customers`, `suppliers`, `products`, `categories`, `units_of_measure`, `promotions`, `promotion_products`, `promotion_categories`, `promotion_customers`, `price_tiers` | Data referensi/induk |
| **Data Transaksi** | `sales`, `sale_items`, `sale_payments`, `purchase_orders`, `purchase_order_items`, `purchase_returns`, `purchase_return_items`, `invoices_incoming`, `invoices_outgoing`, `invoice_items`, `invoice_payments`, `cash_drawers`, `cash_drawer_transactions`, `stock_opnames`, `stock_opname_items`, `item_exchanges`, `exchange_items`, `sales_returns`, `sales_return_items` | Data transaksi |

| Scope | Tabel | Deskripsi |
|-------|-------|-----------|
| **All** | Semua tabel di atas (master + transaksi) | Semua data company |

---

## Visual Design

### Screen Layout - Tab Navigation

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [ 🔄 Backup ]  [ 📥 Restore ]  [ 🗑 Hapus Data ]                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                    Content sesuai tab aktif                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tab Button Styling (Active State: Teal `#0D9488`)

```
  [ 🔄 Backup ]   ← inactive (gray)
  [ 📥 Restore ]  ← inactive (gray)
  [ 🗑 Hapus Data ] ← active (teal background, white text)
```

---

### Mockup — Delete Data Tab

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ◀ Kembali        Backup & Restore Database              [🏢 TOKO BESAR]│
├─────────────────────────────────────────────────────────────────────────┤
│  [ 🔄 Backup ]  [ 📥 Restore ]  [ 🗑 Hapus Data ]                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ⚠️  PERINGATAN!                                               │   │
│  │  Menghapus data akan MEMPERMANEN menghapus semua data         │   │
│  │  dari scope yang dipilih. Proses ini TIDAK DAPAT DIBATALKAN!   │   │
│  │                                                                 │   │
│  │  ☑  Saya sudah membuat backup sebelum menghapus data           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  📦 Pilih Scope Data yang Akan Dihapus                          │   │
│  │                                                                 │   │
│  │  ┌───────────────┬───────────────┬───────────────┐               │   │
│  │  │               │               │               │               │   │
│  │  │  ○ Semua     │  ● Data Master│  ○ Transaksi  │               │   │
│  │  │   Data        │               │                │               │   │
│  │  │               │               │               │               │   │
│  │  │    🗑️         │    📦         │    📝         │               │   │
│  │  │               │               │               │               │   │
│  │  └───────────────┴───────────────┴───────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  📋 Detail: Data Master                                           │   │
│  │  ─────────────────────────────────────────────────────────────── │   │
│  │  • users: ~10 data                                               │   │
│  │  • warehouses: ~5 data                                          │   │
│  │  • customers: ~200 data                                          │   │
│  │  • suppliers: ~50 data                                           │   │
│  │  • products: ~500 data                                           │   │
│  │  • categories: ~20 data                                         │   │
│  │  ─────────────────────────────────────────────────────────────── │   │
│  │  Total: ~785 data akan dihapus                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ☐  Saya memahami bahwa data akan dihapus permanen               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              [ ⚠️  Hapus Data Master ]                             │   │
│  │                  (tebal, full-width, disabled sampai syarat       │   │
│  │                   checkbox checked semua)                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Konfirmasi 3 Langkah (Button Aktif)

| Step | Checklist | Status Awal | Keterangan |
|------|-----------|-------------|-----------|
| 1 | Checkbox "sudah backup" | ❌ Unchecked | Tombol disabled |
| 2 | Checkbox "pahami data dihapus" | ❌ Unchecked | Tombol disabled |
| 3 | Semua checkbox checked | ✅ Checked | Tombol aktif |

---

### Scope Badge Colors (Backup Table)

| Scope | Badge Color | Hex |
|-------|-------------|-----|
| `All` | Purple | `#7c3aed` |
| `Master` | Cyan | `#0891b2` |
| `Transaksi` | Amber | `#d97706` |

---

## Backend Implementation

### 1. New Endpoint

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/backup/delete` | Delete table data by scope | Company admin |
| GET | `/api/backup/count/:scope` | Get count of records per table in scope | Company admin |

### 2. Request/Response Models

```go
// internal/models/backup.go

type DeleteDataRequest struct {
    Scope    string `json:"scope" validate:"required,oneof=all master transaction"`
    Backuped bool   `json:"backuped" validate:"required"`
}

type DeleteDataResponse struct {
    Scope       string            `json:"scope"`
    TablesCleared []string        `json:"tables_cleared"`
    RecordsDeleted map[string]int64 `json:"records_deleted"`
    TotalRecords int64            `json:"total_records"`
}

type TableCount struct {
    TableName string `json:"table_name"`
    RowCount  int64  `json:"row_count"`
}

type ScopeCountResponse struct {
    Scope  string        `json:"scope"`
    Tables []TableCount  `json:"tables"`
    Total  int64         `json:"total"`
}
```

### 3. Service Logic

```go
// internal/services/backup_service.go

var masterTables = []string{
    "users",
    "warehouses",
    "customers",
    "suppliers",
    "products",
    "categories",
    "units_of_measure",
    "promotions",
    "promotion_products",
    "promotion_categories",
    "promotion_customers",
    "price_tiers",
}

var transactionTables = []string{
    "sales",
    "sale_items",
    "sale_payments",
    "purchase_orders",
    "purchase_order_items",
    "purchase_returns",
    "purchase_return_items",
    "invoices_incoming",
    "invoices_outgoing",
    "invoice_items",
    "invoice_payments",
    "cash_drawers",
    "cash_drawer_transactions",
    "stock_opnames",
    "stock_opname_items",
    "item_exchanges",
    "exchange_items",
    "sales_returns",
    "sales_return_items",
}

func (s *BackupService) GetTableCounts(companyID uuid.UUID, scope string) (*models.ScopeCountResponse, error) {
    tables := s.getTablesByScope(scope)
    var counts []models.TableCount
    var total int64

    for _, table := range tables {
        count, err := s.countTableData(table, companyID, scope)
        if err != nil {
            continue
        }
        counts = append(counts, models.TableCount{
            TableName: table,
            RowCount:  count,
        })
        total += count
    }

    return &models.ScopeCountResponse{
        Scope:  scope,
        Tables: counts,
        Total:  total,
    }, nil
}

func (s *BackupService) DeleteData(companyID uuid.UUID, scope string) (*models.DeleteDataResponse, error) {
    tables := s.getTablesByScope(scope)
    
    var deletedRecords = make(map[string]int64)
    var tablesCleared []string
    var totalRecords int64

    for _, table := range tables {
        count, err := s.deleteTableData(table, companyID, scope)
        if err != nil {
            return nil, fmt.Errorf("error deleting table %s: %w", table, err)
        }
        if count > 0 {
            deletedRecords[table] = count
            tablesCleared = append(tablesCleared, table)
            totalRecords += count
        }
    }

    return &models.DeleteDataResponse{
        Scope:           scope,
        TablesCleared:   tablesCleared,
        RecordsDeleted:  deletedRecords,
        TotalRecords:    totalRecords,
    }, nil
}

func (s *BackupService) deleteTableData(table string, companyID uuid.UUID, scope string) (int64, error) {
    if scope == "master" {
        return s.db.Table(table).Where("company_id = ?", companyID).Delete(nil).RowsAffected, nil
    } else if scope == "transaction" {
        // Transaction tables with company_id
        txResult := s.db.Table(table).Where("company_id = ?", companyID).Delete(nil)
        if txResult.Error != nil {
            return 0, txResult.Error
        }
        return txResult.RowsAffected, nil
    }
    // All - handle per table
    return 0, nil
}
```

### 4. Handler

```go
// internal/handlers/backup_handler.go

func (h *BackupHandler) DeleteData(c *fiber.Ctx) error {
    user := GetUserFromContext(c)
    if user == nil {
        return c.Status(401).JSON(fiber.Map{"success": false, "error": "Unauthorized"})
    }

    if user.Role != "admin" && user.Role != "superadmin" {
        return c.Status(403).JSON(fiber.Map{"success": false, "error": "Only admin can delete data"})
    }

    var req models.DeleteDataRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{"success": false, "error": "Invalid request body"})
    }

    if !req.Backuped {
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error":   "Harap buat backup sebelum menghapus data",
        })
    }

    result, err := h.backupService.DeleteData(user.CompanyID, req.Scope)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{"success": false, "error": err.Error()})
    }

    return c.JSON(fiber.Map{
        "success": true,
        "data":    result,
        "message": fmt.Sprintf("Berhasil menghapus %d data dari scope %s", result.TotalRecords, req.Scope),
    })
}

func (h *BackupHandler) GetTableCounts(c *fiber.Ctx) error {
    user := GetUserFromContext(c)
    if user == nil {
        return c.Status(401).JSON(fiber.Map{"success": false, "error": "Unauthorized"})
    }

    scope := c.Params("scope")
    if scope == "" {
        scope = "all"
    }

    result, err := h.backupService.GetTableCounts(user.CompanyID, scope)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{"success": false, "error": err.Error()})
    }

    return c.JSON(fiber.Map{
        "success": true,
        "data":    result,
    })
}
```

---

## Frontend Implementation

### 1. API Functions

```javascript
// src/features/setting/backup.api.js

export async function deleteData(token, scope) {
  const result = await apiFetch('/api/backup/delete', {
    method: 'POST',
    token,
    body: { scope, backuped: true },
  })
  if (!result.success) {
    throw new Error(result.error || result.message || 'Gagal menghapus data')
  }
  return result.data
}

export async function getTableCounts(token, scope) {
  const result = await apiFetch(`/api/backup/count/${scope}`, { token })
  if (!result.success) {
    throw new Error(result.error || 'Gagal mengambil jumlah data')
  }
  return result.data
}
```

### 2. Component - DeleteDataTab

```jsx
function DeleteDataTab({ onToast }) {
  const { token } = useAuthContext()
  const [scope, setScope] = useState('master')
  const [backupConfirmed, setBackupConfirmed] = useState(false)
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [counts, setCounts] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadCounts()
  }, [scope])

  const loadCounts = async () => {
    setLoading(true)
    try {
      const data = await getTableCounts(token, scope)
      setCounts(data)
    } catch (err) {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteData(token, scope)
      onToast({ type: 'success', message: `Berhasil menghapus data ${scope}` })
      setBackupConfirmed(false)
      setDeleteConfirmed(false)
      loadCounts()
    } catch (err) {
      onToast({ type: 'error', message: err.message })
    } finally {
      setDeleting(false)
    }
  }

  const canDelete = backupConfirmed && deleteConfirmed && !deleting

  return (
    <div className="delete-data-tab-content">
      {/* Warning Card */}
      <div className="delete-warning-card master-form-card">
        <div className="delete-warning-icon">
          <span className="material-icons-round">warning</span>
        </div>
        <div className="delete-warning-content">
          <h3>PERINGATAN!</h3>
          <p>Menghapus data akan MEMPERMANEN menghapus semua data dari scope yang dipilih. Proses ini TIDAK DAPAT DIBATALKAN!</p>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={backupConfirmed}
              onChange={(e) => setBackupConfirmed(e.target.checked)}
            />
            <span className="checkbox-custom"></span>
            <span>Saya sudah membuat backup sebelum menghapus data</span>
          </label>
        </div>
      </div>

      {/* Scope Selector */}
      <div className="delete-scope-card master-form-card">
        <h3>
          <span className="material-icons-round">delete_sweep</span>
          Pilih Scope Data yang Akan Dihapus
        </h3>

        <div className="delete-scope-options">
          <label className={`delete-scope-option ${scope === 'all' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="deleteScope"
              value="all"
              checked={scope === 'all'}
              onChange={() => setScope('all')}
            />
            <span className="material-icons-round">delete_forever</span>
            <span className="delete-scope-title">Semua Data</span>
            <span className="delete-scope-desc">Master + Transaksi</span>
          </label>

          <label className={`delete-scope-option ${scope === 'master' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="deleteScope"
              value="master"
              checked={scope === 'master'}
              onChange={() => setScope('master')}
            />
            <span className="material-icons-round">inventory_2</span>
            <span className="delete-scope-title">Data Master</span>
            <span className="delete-scope-desc">Users, Products, dll</span>
          </label>

          <label className={`delete-scope-option ${scope === 'transaction' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="deleteScope"
              value="transaction"
              checked={scope === 'transaction'}
              onChange={() => setScope('transaction')}
            />
            <span className="material-icons-round">receipt_long</span>
            <span className="delete-scope-title">Data Transaksi</span>
            <span className="delete-scope-desc">Sales, Purchases, dll</span>
          </label>
        </div>
      </div>

      {/* Data Preview */}
      <div className="delete-preview-card master-form-card">
        <h3>
          <span className="material-icons-round">analytics</span>
          Preview: {scope === 'all' ? 'Semua Data' : scope === 'master' ? 'Data Master' : 'Data Transaksi'}
        </h3>

        {loading ? (
          <div className="delete-preview-loading">
            <span className="material-icons-round spinning">sync</span>
            Memuat...
          </div>
        ) : counts ? (
          <>
            <div className="delete-preview-list">
              {counts.tables.map((t) => (
                <div key={t.table_name} className="delete-preview-item">
                  <span className="delete-preview-table">{t.table_name}</span>
                  <span className="delete-preview-count">{formatNumber(t.row_count)} data</span>
                </div>
              ))}
            </div>
            <div className="delete-preview-total">
              Total: <strong>{formatNumber(counts.total)}</strong> data
            </div>
          </>
        ) : (
          <p className="delete-preview-empty">Tidak ada data</p>
        )}
      </div>

      {/* Final Confirmation */}
      <div className="delete-confirm-card master-form-card">
        <label className="checkbox-label delete-confirm-checkbox">
          <input
            type="checkbox"
            checked={deleteConfirmed}
            onChange={(e) => setDeleteConfirmed(e.target.checked)}
            disabled={!backupConfirmed}
          />
          <span className="checkbox-custom"></span>
          <span>Saya memahami bahwa data akan dihapus permanen dan tidak dapat dikembalikan</span>
        </label>
      </div>

      {/* Delete Button */}
      <button
        className="delete-btn-danger"
        onClick={handleDelete}
        disabled={!canDelete}
      >
        {deleting ? (
          <>
            <span className="material-icons-round spinning">sync</span>
            Menghapus...
          </>
        ) : (
          <>
            <span className="material-icons-round">delete_forever</span>
            Hapus {scope === 'all' ? 'Semua Data' : scope === 'master' ? 'Data Master' : 'Data Transaksi'}
          </>
        )}
      </button>
    </div>
  )
}
```

### 3. Tab Integration

```jsx
// Di BackupRestore.jsx - parent component

export function BackupRestore({ onExit }) {
  // ... existing state ...
  const [activeTab, setActiveTab] = useState('backup')

  return (
    <div className="backup-restore-container">
      {/* Header */}
      <div className="backup-header master-header">
        {/* ... */}
      </div>

      {/* 3 Tabs */}
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
        <button
          className={`backup-tab ${activeTab === 'delete' ? 'active' : ''}`}
          onClick={() => setActiveTab('delete')}
        >
          <span className="material-icons-round">delete</span>
          Hapus Data
        </button>
      </div>

      {/* Content */}
      <div className="backup-content">
        {activeTab === 'backup' && <BackupTab {...} />}
        {activeTab === 'restore' && <RestoreTab {...} />}
        {activeTab === 'delete' && <DeleteDataTab onToast={setToast} />}
      </div>
    </div>
  )
}
```

---

## CSS Styles

```css
/* Delete Data Tab */
.delete-data-tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.delete-warning-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #fef2f2;
  border: 2px solid #fca5a5;
}

.delete-warning-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fee2e2;
  border-radius: 50%;
  flex-shrink: 0;
}

.delete-warning-icon .material-icons-round {
  font-size: 28px;
  color: #dc2626;
}

.delete-warning-content {
  flex: 1;
}

.delete-warning-content h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
  color: #991b1b;
}

.delete-warning-content p {
  margin: 0 0 12px;
  font-size: 14px;
  color: #7f1d1d;
}

.delete-scope-card,
.delete-preview-card,
.delete-confirm-card {
  padding: 20px;
}

.delete-scope-card h3,
.delete-preview-card h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.delete-scope-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.delete-scope-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.delete-scope-option input {
  display: none;
}

.delete-scope-option .material-icons-round {
  font-size: 32px;
  color: #94a3b8;
}

.delete-scope-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.delete-scope-desc {
  font-size: 12px;
  color: #64748b;
}

.delete-scope-option:hover {
  border-color: #cbd5e1;
}

.delete-scope-option.selected {
  border-color: #dc2626;
  background: #fef2f2;
}

.delete-scope-option.selected .material-icons-round {
  color: #dc2626;
}

.delete-scope-option.selected .delete-scope-title {
  color: #dc2626;
}

.delete-preview-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.delete-preview-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.delete-preview-item:last-child {
  border-bottom: none;
}

.delete-preview-table {
  font-size: 13px;
  color: #475569;
  font-family: monospace;
}

.delete-preview-count {
  font-size: 13px;
  color: #1e293b;
  font-weight: 500;
}

.delete-preview-total {
  margin-top: 12px;
  padding: 12px;
  background: #fef2f2;
  border-radius: 8px;
  font-size: 14px;
  color: #991b1b;
  text-align: right;
}

.delete-confirm-card {
  padding: 20px;
  background: #fef2f2;
  border: 2px solid #fca5a5;
}

.delete-confirm-checkbox {
  font-size: 14px;
  color: #991b1b;
}

.delete-btn-danger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);
}

.delete-btn-danger:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 8px rgba(220, 38, 38, 0.4);
}

.delete-btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #94a3b8;
  box-shadow: none;
}

.delete-preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #64748b;
}

.delete-preview-loading .material-icons-round {
  font-size: 24px;
  margin-right: 8px;
}

.delete-preview-empty {
  text-align: center;
  color: #94a3b8;
  padding: 24px;
}
```

---

## Files to Modify

### Backend (Go)

| File | Changes |
|------|---------|
| `internal/models/backup.go` | Add `DeleteDataRequest`, `DeleteDataResponse`, `ScopeCountResponse`, `TableCount` |
| `internal/services/backup_service.go` | Add `masterTables`, `transactionTables`, `GetTableCounts()`, `DeleteData()`, helper functions |
| `internal/handlers/backup_handler.go` | Add `DeleteData()`, `GetTableCounts()` handlers |
| `cmd/server/main.go` | Register routes `/api/backup/delete` and `/api/backup/count/:scope` |

### Frontend (React)

| File | Changes |
|------|---------|
| `src/features/setting/backup.api.js` | Add `deleteData()`, `getTableCounts()` |
| `src/components/ToolbarItem/setting/BackupRestore.jsx` | Add `DeleteDataTab`, update tabs, scope selector |
| `src/components/ToolbarItem/setting/BackupRestore.css` | Add all delete tab styles |

---

## Implementation Order

1. Backend: Models
2. Backend: Service (delete + count logic)
3. Backend: Handler + Routes
4. Frontend: API functions
5. Frontend: DeleteDataTab component
6. Frontend: Tab integration + scope selector in BackupTab
7. Frontend: CSS styles
8. Build + Lint check
9. Test end-to-end
