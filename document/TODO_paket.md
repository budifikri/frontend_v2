# TODO PAKET - Master Menu

## 📋 TODO LIST (Urutan Implementasi)

### BACKEND (Go) - `D:\Project\pos_retail\go_backend\`

- [x] **1. Buat Model `Paket` & `DetailPaket`** ✅
  - File: `internal/models/paket.go`
  - Status: Completed

- [x] **2. Tambah Model ke AutoMigrate** ✅
  - File: `cmd/server/main.go`
  - Status: Completed

- [x] **3. Buat Repository `paket_repository.go`** ✅
  - File: `internal/repository/paket_repository.go`
  - Status: Completed

- [x] **4. Buat Service `paket_service.go`** ✅
  - File: `internal/services/paket_service.go`
  - Status: Completed

- [x] **5. Buat Handler `paket_handler.go`** ✅
  - File: `internal/handlers/paket_handler.go`
  - Status: Completed

- [x] **6. Tambah Route `/api/paket`** ✅
  - File: `cmd/server/main.go`
  - Status: Completed

---

### FRONTEND (React) - `D:\Project\pos_retail\frontend_v2\`

- [x] **7. Buat API Layer `paket.api.js`** ✅
  - File: `src/features/master/paket/paket.api.js`
  - Status: Completed

- [x] **8. Buat Komponen `Paket.jsx` (Initial - Tab-based)** ✅
  - File: `src/components/ToolbarItem/master/Paket.jsx`
  - Status: Completed (needs redesign)

- [x] **9. Update Config Files** ✅
  - `toolbarItems.js`, `DashboardCanvas.jsx`, `App.jsx`
  - Status: Completed

---

## 🎨 UI REDESIGN (Purchase Pattern - Left-Right Split)

- [ ] **10. Redesign Paket.jsx - Left-Right Split Layout**
  - File: `src/components/ToolbarItem/master/Paket.jsx`
  - Status: 🔄 Pending
  - Changes:
    - Remove tab system (General/Detail Produk)
    - Implement left-right split layout like PurchaseDetail.jsx
    - Left panel (flex: 1): Detail produk table (scrollable)
    - Right sidebar (width: 380px): Header form + summary section
    - Reference: `PurchaseDetail.jsx` lines 670-1000
    - CSS classes: `.po-layout-container`, `.po-main-content`, `.po-sidebar`

- [ ] **11. Add Keyboard Navigation for Detail Items**
  - Arrow Up/Down: Navigate product items
  - Enter: Add selected product from search
  - Delete: Remove selected item
  - State: `selectedDetailIndex`

- [ ] **12. Upgrade Product Search**
  - Integrate search input with keyboard shortcuts
  - Popup produk with keyboard navigation (↑↓, Enter, Escape)
  - Reference: PurchaseDetail.jsx lines 742-763, 916-952

- [ ] **13. Add Summary Section in Sidebar**
  - Total harga (from backend or calculate locally)
  - Jumlah item count
  - Use `.po-summary-section` class

- [ ] **14. Update CSS for Paket**
  - File: Reuse classes from `Purchase.css` or create `Paket.css`
  - Ensure consistency with Purchase layout
  - Responsive: stack vertically on mobile if needed

- [ ] **15. Test Redesigned Form**
  - Test left-right layout rendering
  - Verify keyboard shortcuts work
  - Test product search popup
  - Verify summary updates correctly
  - Test responsive behavior

---

### TESTING

- [x] **16. Test Backend APIs** ✅
  - Backend build: ✅ Success
  - Manual testing: Pending (need running server)

- [ ] **17. Test Frontend**
  - Start dev server: `npm run dev`
  - Click Master > Paket
  - Test New/Edit/Delete with new layout
  - Verify auto-calculate harga

- [ ] **18. Test Auto-Calculate**
  - Create paket with multiple products
  - Verify `harga_paket` auto-calculated

---

### FINAL CHECKS

- [x] **19. Run Lint** ✅
  - `npm run lint` - ✅ Passed (0 errors)

- [x] **20. Run Build** ✅
  - `npm run build` - ✅ Success

- [ ] **21. Update AGENTS.md**
  - Document new UI pattern (left-right split for master-detail)

---

## 📊 Progress Tracking

| Task | Status | Notes |
|------|--------|-------|
| Backend Model | ✅ Completed | |
| Backend Repository | ✅ Completed | |
| Backend Service | ✅ Completed | |
| Backend Handler | ✅ Completed | |
| Backend Routes | ✅ Completed | |
| Frontend API | ✅ Completed | |
| Frontend Component (Initial) | ✅ Completed | Needs redesign |
| Config Updates | ✅ Completed | |
| UI Redesign (Left-Right Split) | 🔄 Pending | Follow Purchase pattern |
| Keyboard Navigation | 🔄 Pending | Arrow keys, Enter, Delete |
| Product Search Upgrade | 🔄 Pending | Popup with keyboard nav |
| Summary Section | 🔄 Pending | Total + item count |
| CSS Updates | 🔄 Pending | Match Purchase style |
| Testing (Backend) | ✅ Completed | Build success |
| Testing (Frontend) | 🔄 Pending | Need redesign first |
| Lint & Build | ✅ Completed | 0 errors |

---

## 🎯 PRIORITAS REDESIGN

1. **High Priority**: Task 10 (Redesign Layout) - Core UI change
2. **High Priority**: Task 11 (Keyboard Nav) - User experience
3. **Medium Priority**: Task 12 (Product Search) - Enhanced UX
4. **Medium Priority**: Task 13 (Summary) - Information display
5. **Low Priority**: Task 14 (CSS) - Styling consistency
