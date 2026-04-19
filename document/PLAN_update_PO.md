# PLAN: Purchase Order POS-style Input

## Overview

Memodifikasi Purchase Order (PurchaseDetail.jsx) agar menggunakan input style seperti POS:
- Tampilan seperti nota penjualan (receipt) tanpa monitor display
- Footer input untuk search product dan handling transactions
- LocalStorage untuk menyimpan data sementara sebelum save ke backend

---

## Visual Design

### Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    RECEIPT HEADER                        │   │
│  │  [Logo]  NAMA TOKO / COMPANY                             │   │
│  │          Alamat Toko                                     │   │
│  │          Telp: 021-xxx-xxx                               │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  PURCHASE ORDER                                          │   │
│  │  No: PO-2026-0001        Tanggal: 19 Apr 2026           │   │
│  │  Supplier: PT. Sumber Jaya              Gudang: Utama    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ITEMS TABLE                                            │   │
│  │  ┌────┬────────────────────┬─────────┬─────────┬──────┐ │   │
│  │  │ Qty│ Nama Produk        │  Harga  │ Subtotal│ Act  │ │   │
│  │  ├────┼────────────────────┼─────────┼─────────┼──────┤ │   │
│  │  │ 5  │ Aqua Galon 19L     │ 15,000  │ 75,000  │ ✕    │ │   │
│  │  │ 10 │ Milo Sachet        │  5,000  │ 50,000  │ ✕    │ │   │
│  │  │ 3  │ Teh Pucuk Harum    │  4,500  │ 13,500  │ ✕    │ │   │
│  │  └────┴────────────────────┴─────────┴─────────┴──────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SUMMARY                                                │   │
│  │  Subtotal:                          Rp 138,500          │   │
│  │  PPN (11%):                         Rp  15,235          │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  GRAND TOTAL:                      Rp 153,735          │   │
│  │  Items: 3                               Qty: 18          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  FOOTER INPUT BAR                                       │   │
│  │  ┌──────────────────────────────────────────┐ ┌──────┐│   │
│  │  │ 🔍 Cari produk atau scan barcode...       │ │ BAYAR││   │
│  │  └──────────────────────────────────────────┘ └──────┘│   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Detail Component Specifications

#### 1. Receipt Header (Fixed Top)
```css
- Background: #fff (white)
- Border-bottom: 1px dashed #e2e8f0
- Padding: 12px 16px
- Font: 14px

Logo: 
- Size: 40x40px, rounded
- Background: #0ea5e9 (blue)
- Text: 2 letters, white, bold, 12px

Company Name:
- Font: bold, 16px, #1e293b
- Address: regular, 12px, #64748b
- Phone: regular, 12px, #64748b

PO Meta:
- PO Number: bold, #0f172a
- Date: regular, #64748b
- Supplier: with label "Supplier:"
- Warehouse: with label "Gudang:"
```

#### 2. Items Table
```css
- Max-height: calc(100vh - 350px) (scrollable)
- Header: sticky top
- Row height: 40px
- Alternating row: #f8fafc / #fff
- Hover: #f1f5f9

Columns:
- Qty: 60px, center
- Nama: flex (remainder)
- Harga: 100px, right
- Subtotal: 100px, right  
- Act: 40px, center (delete btn)

Item hover state:
- Background: #e0f2fe
- Show action: click to select row
```

#### 3. Selected Item Indicator
```css
- Border-left: 3px solid #0ea5e9
- Background: #f0f9ff
- Qty badge: show current qty
```

#### 4. Summary Section
```css
- Background: #f8fafc
- Border-top: 1px dashed #e2e8f0
- Padding: 16px

Subtotal:
- Label: #64748b
- Value: #0f172a, bold, 16px

PPN:
- Label: #64748b
- Value: #64748b, 14px

Grand Total:
- Label: bold, 16px, #0f172a
- Value: bold, 20px, #0f172a
- Background highlight: #fff7ed (orange tint)

Item Count:
- Small text, #94a3b8
```

#### 5. Footer Input Bar (Fixed Bottom)
```css
- Background: #1e293b (dark)
- Padding: 12px 16px
- Display: flex, gap: 12px
- Position: sticky bottom

Search Input:
- Flex: 1
- Background: #334155
- Border: 1px solid #475569
- Border-radius: 8px
- Padding: 12px 16px
- Color: #fff
- Placeholder: #94a3b8
- Focus: border #0ea5e9

Button Bayar:
- Background: #0ea5e9
- Color: white
- Padding: 12px 24px
- Border-radius: 8px
- Hover: #0284c7

Icons:
- Search icon: #94a3b8
- Barcode icon: #94a3b8
```

---

### Popup Designs

#### 1. Supplier Search Popup
```
┌─────────────────────────────────────────┐
│  ╳  CARI SUPPLIER                       │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │ 🔍 Ketik nama supplier...       │    │
│  └─────────────────────────────────┘    │
├─────────────────────────────────────────┤
│  No │ Nama Supplier      │ action      │
├─────┼────────────────────┼─────────────┤
│  1  │ PT. Sumber Jaya    │ [PILIH]     │
│  2  │ CV. Berkah Bersama  │ [PILIH]     │
│  3  │ Toko Maju Jaya     │ [PILIH]     │
└─────┴────────────────────┴─────────────┘
│  ↑↓ Navigasi  Enter: Pilih  Esc: Tutup  │
└─────────────────────────────────────────┘
```

#### 2. Product Search Popup
```
┌─────────────────────────────────────────┐
│  ╳  DAFTAR PRODUK                       │
├─────────────────────────────────────────┤
│  No │ Nama Produk      │ Satuan │ Harga │
├─────┼──────────────────┼────────┼───────┤
│  1  │ Aqua Galon 19L   │ Galon  │ 15000 │
│  2  │ Aqua Cup 250ml  │ Cup    │  3000 │
│  3  │ Aqua Refill 1L   │ Liter  │  5000 │
└─────┴──────────────────┴────────┴───────┘
│  ↑↓ Navigasi  Enter: Pilih  Esc: Tutup  │
└─────────────────────────────────────────┘
```

#### 3. Action Popup (Simpan/Batal)
```
┌─────────────────────────────────────────┐
│                                         │
│         ══ AKHIRI TRANSAKSI ══         │
│                                         │
│      Anda ingin menyimpan PO ini?      │
│                                         │
│   ┌───────────┐    ┌───────────┐       │
│   │  SIMPAN   │    │  BATAL    │       │
│   └───────────┘    └───────────┘       │
│                                         │
│   Enter: Simpan  Esc: Batal             │
└─────────────────────────────────────────┘
```

---

### Color Palette

```css
Primary Colors:
- #0ea5e9 (sky-500): Main action, selected items
- #0284c7 (sky-600): Hover states

Dark Theme (Footer):
- #1e293b (slate-800): Background
- #334155 (slate-700): Input background
- #475569 (slate-600): Border
- #94a3b8 (slate-400): Placeholder, icons

Light Theme:
- #f8fafc (slate-50): Table alternate rows
- #f1f5f9 (slate-100): Hover rows
- #e2e8f0 (slate-200): Borders

Text:
- #0f172a (slate-900): Primary text
- #64748b (slate-500): Secondary text
- #94a3b8 (slate-400): Muted text
```

---

## Input Logic

### Keyboard Shortcuts Reference

| Input | Action |
|-------|--------|
| `+[huruf]` (contoh: `+A`) | Popup search supplier → update header.supplier_id + supplier_name |
| `+[angka]` (contoh: `+5`) | Update qty item[selectedIndex] |
| `++[angka]` (contoh: `++15000`) | Update unit_price (cost) item[selectedIndex] |
| Teks + Enter | Search product (dengan cost_price, bukan retail_price) |
| Kosong + Enter | Popup: Simpan / Batal |
| `↑` / `↓` | Navigate items / popup |
| `Enter` | Select in popup |
| `Esc` | Close popup |
| `Delete` | Hapus item terpilih |

### Validasi
- Number validation untuk `+angka` dan `++angka`
- Tidak ada limit max untuk qty atau price

---

## Data Flow

### LocalStorage
- **Key**: `pos_pending_notes` (sama seperti POS)
- **Format**:
  ```js
  {
    po_data: { header, items },
    po_mode: true,
    timestamp: Date.now()
  }
  ```
- **Behavior**:
  - Save on change (setiap ada input/item change)
  - Load on mount (jika ada data, restore)
  - Clear on save to backend berhasil

### Edit Mode
- Fetch existing PO dari backend
- Populate state (sudah ada di kode sekarang)
- Enable editing sama seperti new PO

### Save to Backend
- POST untuk new PO
- PUT untuk edit PO
- Payload sudah ada di kode sekarang (line 243-348)

---

## Component Structure

### Files to Modify:
- `src/components/ToolbarItem/transaksi/PurchaseDetail.jsx`

### State Additions:
- `search` - input text di footer
- `searchInputRef` - ref untuk focus
- `selectedIndex` - index item terpilih
- `showSupplierPopup` - show/hide supplier popup
- `showProductPopup` - show/hide product popup  
- `showActionPopup` - show/hide action popup (Simpan/Batal)
- `supplierResults` - list supplier hasil search
- `productResults` - list product hasil search
- `popupSelectedIndex` - index navigasi di popup

### Header State Modification:
- Tambah `supplier_name` untuk display di nota

### Handler Functions to Add:
- `handleSearchChange` - update search state
- `handleSearchKeyDown` - main input logic
- `handleSelectSupplier` - set supplier di header
- `handleSelectProduct` - add item dengan qty=1
- `handleUpdateQty` - update qty item
- `handleUpdatePrice` - update cost price item
- `handleDeleteItem` - hapus item
- `handleSave` - save ke backend + clear localStorage
- `handleCancel` - cancel / clear localStorage

---

## API Notes

- Product search di PO sudah bisa mendapatkan `cost_price`
- Supplier search menggunakan endpoint `listSuppliers`
- Save menggunakan `createPurchase` / `updatePurchase` yang sudah ada

---

## Status

- [ ] Planning: Done
- [ ] Implementation: Pending
- [ ] Testing: Pending