# Visual Design: Form Backup 2-Column Layout

## Layout Plan
```
┌─────────────────────────────────────────────────────────────┐
│                    HEADER (unchanged)                        │
├─────────────────────────────────────────────────────────────┤
│   [Backup] [Restore] [Hapus Data]                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐ ┌───────────────────────────────┐  │
│  │                     │ │                               │  │
│  │    LEFT COLUMN      │ │      RIGHT COLUMN             │  │
│  │                     │ │                               │  │
│  │  (Hero Card)        │ │  (Daftar Backup Table)        │  │
│  │                     │ │  (dengan Schedule button)    │  │
│  │                     │ │                               │  │
│  └─────────────────────┘ └───────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│   FOOTER (unchanged)                                       │
└─────────────────────────────────────────────────────────────┘
```

## Detail per Tab

### Backup Tab (2 Column) - SAMA SEPERTI SEBELUMNYA
```
┌───────────────────────────────┬───────────────────────────────┐
│  ┌───────────────────────┐   │  ┌───────────────────────┐   │
│  │   📦 HERO CARD      │   │  │   📋 DAFTAR BACKUP   │   │
│  │   Buat Database     │   │  │   ├─ backup_001.sql  │   │
│  │   [Buat Backup]   │   │  │   ├─ backup_002.sql  │   │
│  └───────────────────────┘   │  │   └─ ...            │   │
│                              │  │   [Schedule button] │   │
│                              │  └───────────────────────┘   │
│                              │  (info: Auto backup...)  │   │
└───────────────────────────────┴───────────────────────────────┘
```
CATATAN: Schedule card JANGAN dibuat form baru - tetap di dalam daftar backup seperti sebelumnya

### Restore Tab (2 Column) - SAMA SEPERTI SEBELUMNYA
```
┌───────────────────────────────┬───────────────────────────────┐
│  ┌───────────────────────┐   │  ┌───────────────────────┐   │
│  │   ⚠️ PERINGATAN      │   │  │   📄 DETAIL FILE     │   │
│  │   Restore akan...    │   │  │   Ukuran: 2.5MB      │   │
│  │   list...            │   │  │   Tanggal: 17 Apr    │   │
│  └───────────────────────┘   │  │   Tables: 21         │   │
│                              │  │   Rows: ~5000        │   │
│  ┌───────────────────────┐   │  └───────────────────────┘   │
│  │   📁 FILE SELECT      │   │                            │
│  │   [Pilih File ▼]     │   │                            │
│  │   ☐ Konfirmasi      │   │                            │
│  │   [Restore]         │   │                            │
│  └───────────────────────┘   │                            │
└───────────────────────────────┴───────────────────────────────┘
```

### Delete Tab (2 Column) - SAMA SEPERTI SEBELUMNYA
```
┌───────────────────────────────┬───────────────────────────────┐
│  ┌───────────────────────┐   │  ┌───────────────────────┐   │
│  │   ⚠️ PERINGATAN      │   │  │   📊 PREVIEW DATA   │   │
│  │   Hapus permanen...   │   │  │   ├─ users: 150    │   │
│  │   checkbox         │   │  │   ├─ products: 500  │   │
│  └───────────────────────┘   │  │   Total: 5150     │   │
│                              │  └───────────────────────┘   │
│  ┌───────────────────────┐   │                            │
│  │   🎯 SCOPE         │   │                            │
│  │   ○ Semua Data     │   │                            │
│  │   ○ Data Master   │   │                            │
│  │   ○ Transaksi    │   │                            │
│  │   [Hapus Data]   │   │                            │
│  └───────────────────────┘   │                            │
└───────────────────────────────┴───────────────────────────────┘
```

---

## Technical Implementation

### CSS (BackupRestore.css)
```css
.backup-content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.backup-left-column,
.backup-right-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 900px) {
  .backup-content-grid {
    grid-template-columns: 1fr;
  }
}
```

### JSX Structure
Setiap tab dibungkus dengan:
- `backup-content-grid` (container)
- `backup-left-column` (kiri)
- `backup-right-column` (kanan)

TIDAK ADA form baru - semua content sama seperti sebelumnya.

---

## Status
- [x] Backup Tab - 2 Column Layout
- [x] Restore Tab - 2 Column Layout
- [x] Delete Tab - 2 Column Layout