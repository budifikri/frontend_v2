# TODO: All Records Feature Implementation

## Phase 1: Core Infrastructure ✅
- [x] CSS classes untuk checkbox all records (`App.css`)
- [x] Reference implementation di `LapPenjualan.jsx`

## Phase 2: Master Data Menu

### 1. Warehouse
- [x] Tambah state `isAllRecords`
- [x] Update `useMasterPagination` dengan dynamic limit
- [x] Tambah handler `handleToggleAllRecords`
- [x] Update footer dengan checkbox "All Records"
- [x] Hide pagination saat All Records aktif
- [ ] Testing & validation

### 2. Unit
- [x] Tambah state `isAllRecords`
- [x] Update `useMasterPagination` dengan dynamic limit
- [x] Tambah handler `handleToggleAllRecords`
- [x] Update footer dengan checkbox "All Records"
- [x] Hide pagination saat All Records aktif
- [ ] Testing & validation

### 3. Kategori (Category)
- [x] Tambah state `isAllRecords`
- [x] Update `useMasterPagination` dengan dynamic limit
- [x] Tambah handler `handleToggleAllRecords`
- [x] Update footer dengan checkbox "All Records"
- [x] Hide pagination saat All Records aktif
- [ ] Testing & validation

### 4. Product
- [x] Tambah state `isAllRecords`
- [x] Update `useMasterPagination` dengan dynamic limit
- [x] Tambah handler `handleToggleAllRecords`
- [x] Update footer dengan checkbox "All Records"
- [x] Hide pagination saat All Records aktif
- [x] **Note:** Pertimbangkan virtual scrolling untuk banyak data
- [ ] Testing & validation

### 5. Customer
- [x] Tambah state `isAllRecords`
- [x] Update `useMasterPagination` dengan dynamic limit
- [x] Tambah handler `handleToggleAllRecords`
- [x] Update footer dengan checkbox "All Records`
- [x] Hide pagination saat All Records aktif
- [ ] Testing & validation

### 6. Supplier
- [x] Tambah state `isAllRecords`
- [x] Update `useMasterPagination` dengan dynamic limit
- [x] Tambah handler `handleToggleAllRecords`
- [x] Update footer dengan checkbox "All Records"
- [x] Hide pagination saat All Records aktif
- [ ] Testing & validation

## Phase 3: Transaction Data Menu

### 7. Pembelian (Purchase)
- [x] Tambah state `isAllRecords`
- [x] Update `useMasterPagination` dengan dynamic limit
- [x] Tambah handler `handleToggleAllRecords`
- [x] Update footer dengan checkbox "All Records"
- [x] Hide pagination saat All Records aktif
- [ ] Testing & validation

### 8. Stock Receive
- [x] Tambah state `isAllRecords`
- [x] Update `useMasterPagination` dengan dynamic limit
- [x] Tambah handler `handleToggleAllRecords`
- [x] Update footer dengan checkbox "All Records"
- [x] Hide pagination saat All Records aktif
- [ ] Testing & validation

### 9. Retur Pembelian (Purchase Return)
- [x] Tambah state `isAllRecords`
- [x] Update `useMasterPagination` dengan dynamic limit
- [x] Tambah handler `handleToggleAllRecords`
- [x] Update footer dengan checkbox "All Records"
- [x] Hide pagination saat All Records aktif
- [ ] Testing & validation

### 10. Stock Opname
- [x] Tambah state `isAllRecords`
- [x] Update `useMasterPagination` dengan dynamic limit
- [x] Tambah handler `handleToggleAllRecords`
- [x] Update footer dengan checkbox "All Records"
- [x] Hide pagination saat All Records aktif
- [ ] Testing & validation

### 11. Promotion
- [x] Tambah state `isAllRecords`
- [x] Update `useMasterPagination` dengan dynamic limit
- [x] Tambah handler `handleToggleAllRecords`
- [x] Update footer dengan checkbox "All Records"
- [x] Hide pagination saat All Records aktif
- [ ] Testing & validation

## Phase 3b: Laporan Menu

### 12. Laporan Harga Grosir
- [x] Tambah state `isAllRecords`
- [x] Update `useMasterPagination` dengan dynamic limit
- [x] Tambah handler `handleToggleAllRecords`
- [x] Update footer dengan checkbox "All Records"
- [x] Hide pagination saat All Records aktif
- [ ] Testing & validation

### 13. Laporan Stok
- [x] Tambah state `isAllRecords`
- [x] Update `useMasterPagination` dengan dynamic limit
- [x] Tambah handler `handleToggleAllRecords`
- [x] Update footer dengan checkbox "All Records"
- [x] Hide pagination saat All Records aktif
- [ ] Testing & validation

## Phase 4: Testing & Optimization

### Performance Testing
- [ ] Load test 1000 records
- [ ] Load test 5000 records
- [ ] Load test 10000 records
- [ ] Measure response time
- [ ] Check memory usage

### UX Testing
- [ ] Desktop view validation
- [ ] Tablet view validation
- [ ] Mobile view validation
- [ ] Checkbox interaction

### Backend Validation
- [ ] Endpoint support large limit
- [ ] Query performance check
- [ ] Database index review

### Lint & Build
- [x] `npm run lint` pass all files
- [x] `npm run build` success
- [ ] No console errors

## Phase 5: Documentation
- [ ] Update component docs
- [ ] Update user manual
- [ ] Add feature to changelog

---

## Current Progress
**Completed:** 11/11 (All modules implemented)  
**In Progress:** 0/11  
**Pending:** 0/11

---

## Notes
- Copy pattern dari `LapPenjualan.jsx` untuk konsistensi
- Setiap menu mungkin punya struktur data berbeda, sesuaikan mappingnya
- Pastikan test performance sebelum deploy ke production
