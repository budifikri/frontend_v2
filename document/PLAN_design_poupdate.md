# Plan: Apply Design ke Purchase Order (Pembelian)

## Overview
- **Target Page**: `src/components/ToolbarItem/transaksi/PurchaseDetail.jsx`
- **Style File**: `src/components/ToolbarItem/transaksi/PurchaseDetail.css`
- **Design Reference**: `document/dashboard/po_design.html`

## Scope
- Focus ke content area Purchase Order (table items + sidebar)
- Skip: toolbar/header baru (bagian atas page)

---

## 1. Load Font Manrope

**File**: `index.html`
- Tambahkan link Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
```

**Alternatif**: Gunakan font sistem yang ada (Trebuchet MS/Segoe UI)

---

## 2. Layout Structure (JSX)

### Target: 2-Column Layout

```
┌─────────────────────────────────────┬──────────────────┐
│ MAIN TABLE AREA                      │ SIDEBAR          │
│ (flex-1)                         │ (w-[380px])      │
│                                 │                 │
│ ┌─────────────────────────────┐   │ PURCHASE ORDER    │
│ │ Table: Products    │   │ Status: DRAFT  │
│ │ No | Produk ... │   │               │
│ └─────────────────────────────┘   │ No. PO: xxx    │
│                                 │ Supplier: xxx   │
│                                 │ Tanggal: xxx   │
│                                 │ Gudang: xxx    │
│                                 │ ────────────  │
│                                 │ Subtotal ...  │
│                                 │              │
│                                 │ GRAND TOTAL   │
└─────────────────────────────────────┴──────────────────┘
```

### Current Structure (to change):
- Single column layout
- Items di main area
- Summary di bottom dengan footer

### Target JSX Structure:
```jsx
<div className="po-layout-container">
  <div className="po-main-content">
    {/* Table section */}
  </div>
  <aside className="po-sidebar">
    {/* Sidebar summary */}
  </aside>
</div>
```

---

## 3. Color Palette

| Element | Current | Target (from design) |
|---------|---------|----------------|
| Primary | `#0ea5e9` | `#004A7C` |
| Primary Hover | `#0284c7` | `#005c9a` |
| Primary Variant (Footer) | `#1e293b` | `#003358` |
| Surface/BG | `#f8fafc` | `#f7f9fb` |
| Surface Container | `#f1f5f9` | `#eceef0` |
| Text Primary | `#0f172a` | `#191c1e` |
| Text Secondary | `#64748b` | `#545f72` |
| Border | `#e2e8f0` | `#c1c7d0` |

---

## 4. Component Specifications

### 4.1 Header Section (dari JSX)
- Title: "PURCHASE ORDER" - 24px, 800 weight, Primary color
- Status display: Label (10px, uppercase, gray-400) + Value (14px, bold, primary)

### 4.2 Info Grid (Sidebar)
```css
.po-meta-info {
  display: grid;
  grid-template-columns: repeat(1, 1fr);  /* stack vertikal */
  gap: 16px;
}

.po-meta-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;  /* → #c1c7d0 (gray-400) */
}

.po-meta-value {
  font-size: 14px;
  font-weight: 600;
  color: #191c1e;
}
```

### 4.3 Table Styling
| Element | Current | Target |
|--------|---------|-------|
| Table BG | #fff | #fff |
| Header BG | #f1f5f9 | #f7f9fb (slate-50) |
| Header Text | 12px, 600, #64748b | 10px, 700, gray-400 |
| Row Selected BG | #f0f9ff | #f0f9ff |
| Selected Border | 3px #0ea5e9 | 4px #004A7C |
| Qty Badge BG | #0ea5e9 | #004A7C (primary) |
| Qty Badge | h-24px | h-8 (32px) |

### 4.4 Sidebar Summary Section
```css
.po-summary-section {
  background: #fff;  /* white bg */
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -4px 10px rgba(0,0,0,0.02);
  padding: 24px;
}

.po-summary-total {
  font-size: 36px;  /* text-4xl */
  font-weight: 800;
  color: #004A7C;
}
```

### 4.5 Footer Search Bar
```css
.po-footer-input {
  background: #003358;  /* primary-variant (bukan #1e293b) */
}
```

### 4.6 Action Buttons
| Button | Current | Target |
|--------|---------|-------|
| KELUAR | bg #f1f5f9 | bg white, text primary |
| CETAK | bg #f1f5f9 | bg #5c7285 |
| SIMPAN | bg #0ea5e9 | bg #004A7C + gradient |
| All buttons | rounded-8px | rounded-lg |

---

## 5. File Changes Required

### Priority 1: CSS (PurchaseDetail.css)
1. Update color variables/values
2. Add layout styles (2-column)
3. Component styling adjustments

### Priority 2: JSX (PurchaseDetail.jsx)
1. Restructure layout untuk 2-column
2. Update sidebar section
3. Adjust footer position

---

## 6. Implementation Order

### Step 1: Load Font (Optional)
- `index.html` - Add Manrope font link

### Step 2: CSS Update
- `PurchaseDetail.css` - Full style overhaul

### Step 3: JSX Restructure
- `PurchaseDetail.jsx` - 2-column layout

### Step 4: Verify
- `npm run lint`
- `npm run build`

---

## 7. Notes

- Font family bisa menggunakan `'Manrope', 'Trebuchet MS', sans-serif`
- Maintain existing functionality (search, quick commands, popups)
- Keep Material Icons (tidak ada perubahan)
- Responsive behavior tetap sama

---

## Design Reference (from po_design.html)

```html
<!-- Color config -->
<primary: #004A7C>
<primary-variant: #003358>
<secondary: #545f72>
<surface: #f7f9fb>
<on-surface: #191c1e>
<surface-container: #eceef0>
<outline-variant: #c1c7d0>

<!-- Sidebar structure -->
<aside class="w-[380px] flex flex-col bg-slate-50 overflow-y-auto">
  <div class="p-6 border-b border-dashed border-gray-200">
    <h1 class="text-2xl font-extrabold text-primary tracking-tight mb-1">PURCHASE ORDER</h1>
    <div class="flex items-center gap-1">
      <span class="text-[10px] uppercase font-bold tracking-wider text-gray-400">Status :</span>
      <span class="text-sm font-extrabold text-primary">DRAFT</span>
    </div>
  </div>
  <!-- Info items -->
  <div class="p-6 flex flex-col gap-6 flex-1">
    <div><label>No. PO</label><p>{value}</p></div>
    <div><label>Supplier:</label><p>{value}</p></div>
    <div><label>Tanggal</label><p>{value}</p></div>
    <div><label>Gudang</label><p>{value}</p></div>
  </div>
  <!-- Summary -->
  <div class="p-6 bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
    <div class="subtotal">Subtotal (Items: 2 , Total Qty: 2) Rp 1.200</div>
    <h2>GRAND TOTAL</h2>
    <span class="text-4xl font-extrabold text-primary">Rp 1.200</span>
  </div>
</aside>
```

---

## Status: Waiting for Approval

Belum di-apply. Mohon review sebelum implementasi.