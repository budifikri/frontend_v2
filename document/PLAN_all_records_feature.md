# PLAN: All Records Feature (Standard)

## Tujuan
Menjadikan fitur **checkbox "All Records"** sebagai standard di seluruh menu data master dan data transaksi.

Fitur ini memungkinkan user untuk:
1. Melihat seluruh record sesuai filter tanpa pagination
2. Pagination otomatis hide saat "All Records" aktif
3. UX yang konsisten di seluruh aplikasi

---

## Scope Menu

### 1. Data Master (Master Data)
| No | Menu | File Target | Status |
|----|------|-------------|--------|
| 1 | Warehouse | `src/components/ToolbarItem/master/warehouse/LapWarehouse.jsx` | Pending |
| 2 | Unit | `src/components/ToolbarItem/master/unit/LapUnit.jsx` | Pending |
| 3 | Kategori | `src/components/ToolbarItem/master/category/LapCategory.jsx` | Pending |
| 4 | Product | `src/components/ToolbarItem/master/product/LapProduct.jsx` | Pending |
| 5 | Customer | `src/components/ToolbarItem/master/customer/LapCustomer.jsx` | Pending |
| 6 | Supplier | `src/components/ToolbarItem/master/supplier/LapSupplier.jsx` | Pending |

### 2. Data Transaksi (Transaction Data)
| No | Menu | File Target | Status |
|----|------|-------------|--------|
| 1 | Pembelian (Purchase) | `src/components/ToolbarItem/transaksi/Purchase.jsx` | Pending |
| 2 | Stock Receive | `src/components/ToolbarItem/transaksi/StockReceive.jsx` | Pending |
| 3 | Retur Pembelian | `src/components/ToolbarItem/transaksi/PurchaseReturn.jsx` | Pending |
| 4 | Stock Opname | `src/components/ToolbarItem/laporan/stock-opname/StockOpname.jsx` | Pending |
| 5 | Promotion | `src/components/ToolbarItem/master/promotion/LapPromotion.jsx` | Pending |

---

## Technical Design

### State Management
Setiap komponen perlu menambahkan state:
```javascript
const [isAllRecords, setIsAllRecords] = useState(false)
```

### Pagination Hook Modification
```javascript
const pager = useMasterPagination({
  initialLimit: isAllRecords ? 10000 : 10, // Dynamic limit
  total: pagination.total,
  hasMore: pagination.hasMore
})
```

### Checkbox Handler
```javascript
const handleToggleAllRecords = () => {
  const newValue = !isAllRecords
  setIsAllRecords(newValue)
  setOffset(0)
  // Refetch dengan limit baru
  setTimeout(() => fetchData(), 0)
}
```

### Footer Layout (Standard)
```
┌──────────────────────────────────────────────────────────────┐
│ [Print] [Refresh] [Exit]                                     │
├──────────────────────────────────────────────────────────────┤
│ ☐ All Records | Total Row: 37                                │
│ [|<] [<] Page 1 of 4 [>] [>||]  ← Hidden jika checked      │
└──────────────────────────────────────────────────────────────┘
```

---

## CSS Classes (Reusable)

### Checkbox All Records
```css
.checkbox-all-records {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.checkbox-all-records input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #0d9488;
}

.checkbox-all-records span {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}
```

### Footer Divider
```css
.footer-divider {
  margin: 0 8px;
  color: #cbd5e1;
  font-weight: 300;
}
```

## Backend Requirements

Untuk data master dengan banyak record (ribuan), perlu memastikan:
1. Endpoint API support limit besar (10000)
2. Query tetap performant dengan index yang tepat
3. Response time masih acceptable (< 3 detik untuk 10k records)

### Endpoint Checklist
- [ ] `/api/warehouses` - Support large limit
- [ ] `/api/units` - Support large limit
- [ ] `/api/categories` - Support large limit
- [ ] `/api/products` - Support large limit + eager loading optimization
- [ ] `/api/customers` - Support large limit
- [ ] `/api/suppliers` - Support large limit
- [ ] `/api/purchases` - Support large limit
- [ ] `/api/stock-receives` - Support large limit
- [ ] `/api/purchase-returns` - Support large limit
- [ ] `/api/stock-opnames` - Support large limit
- [ ] `/api/promotions` - Support large limit

---

## Implementation Steps

### Phase 1: Core CSS & Hooks
1. Pastikan CSS classes tersedia di `App.css`
2. Pastikan `useMasterPagination` support dynamic limit

### Phase 2: Master Data Menu (6 menus)
1. Warehouse
2. Unit
3. Kategori
4. Product
5. Customer
6. Supplier

### Phase 3: Transaction Menu (5 menus)
1. Pembelian
2. Stock Receive
3. Retur Pembelian
4. Stock Opname
5. Promotion

### Phase 4: Testing & Optimization
1. Load testing untuk 10k records
2. Responsiveness di mobile
3. UX validation

---

## Acceptance Criteria

### Functional
- [ ] Checkbox "All Records" tampil di footer setiap menu
- [ ] Saat checked, pagination hide dan semua record tampil
- [ ] Saat unchecked, pagination muncul dengan limit 10

### Performance
- [ ] Load 1000 records < 1 detik
- [ ] Load 10000 records < 3 detik
- [ ] Scroll tetap smooth dengan banyak data

### UX
- [ ] Layout tetap rapi di desktop dan mobile
- [ ] Checkbox responsive dan accessible

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance issue dengan 10k+ records | High | Implement virtual scrolling atau pagination virtual |
| Memory leak dengan banyak data | Medium | Cleanup state saat unmount, lazy loading |
| Backend timeout | High | Implement streaming atau chunked response |
| Mobile UX jelek | Medium | Responsive design, sticky header/footer |

---

## Notes

- Fitur ini sudah diimplementasi di `LapPenjualan` sebagai reference
- Copy pattern yang sama untuk konsistensi
- Tooltip: tidak dijadikan standar global. Yang sudah ada tetap dipertahankan, yang belum ada tidak ditambahkan.
- Backend Go sudah support limit besar, tapi perlu test performa
- Untuk Product (bisa ribuan item), pertimbangkan virtual scrolling
