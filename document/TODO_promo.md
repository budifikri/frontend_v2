# TODO Promotion Menu

## Tasks

### Frontend - Development ✅ DONE

#### 1. Create API Layer
- [x] Create `src/features/master/promotion/promotion.api.js`
  - [x] listPromotions(token, params)
  - [x] createPromotion(token, input)
  - [x] updatePromotion(token, id, input)
  - [x] deactivatePromotion(token, id)
  - [x] getPromotionById(token, id)

#### 2. Create Promotion Component
- [x] Create `src/components/ToolbarItem/transaksi/Promotion.jsx`
  - [x] Define DEFAULT_FORM with all fields
  - [x] Define TABLE_COLUMNS
  - [x] Define DUMMY_PROMOTIONS for offline mode
  - [x] Implement fetchData with pagination
  - [x] Implement handleSave (create/update)
  - [x] Implement handleDelete (deactivate)
  - [x] Implement handleToggleStatus
  - [x] Render table with columns
  - [x] Render form with all fields
  - [x] Render footer with actions

#### 3. Update Toolbar Items
- [x] Update `src/data/toolbarItems.js`
  - [x] Add promotion to transaksi menu

#### 4. Update Dashboard Canvas
- [x] Update `src/components/Dashboard/DashboardCanvas.jsx`
  - [x] Import Promotion component
  - [x] Add render condition for promotion tool

#### 5. Update App.jsx
- [x] Update `src/App.jsx`
  - [x] Add 'promotion' to IMPLEMENTED_TOOLS

### Frontend - Improvements ✅ DONE

#### 6. Auto Code Generation
- [x] Update `Promotion.jsx`
  - [x] Add generatePromotionCode helper function
  - [x] Update PROMO_TYPE_OPTIONS (remove min_purchase)
  - [x] Update handleNew to auto-generate code
  - [x] Update handlePromoTypeChange to regenerate code when type changes
  - [x] Use sequence format DPOOOOO1

#### 7. Scope/Target with Search
- [x] Update `Promotion.jsx`
  - [x] Add input search + dropdown untuk by_category
  - [x] Add input search + dropdown untuk by_product
  - [x] Gabungkan menjadi 1 input dengan datalist

#### 8. Flash Sale Date & Time
- [x] Update `Promotion.jsx`
  - [x] 1 field tanggal untuk flash sale
  - [x] 2 column: Tanggal | Waktu (Jam start s/d end)
  - [x] Set start_date = end_date when input

### Backend - go_backend ✅ DONE

#### 9. Update Models
- [x] Update `internal/models/promotion.go`
  - [x] Add field: `buy_quantity` (int)
  - [x] Add field: `get_quantity` (int)
  - [x] Add field: `start_time` (time)
  - [x] Add field: `end_time` (time)
  - [x] Update enum `promotion_type`: add BUY_X_GET_Y, FLASH_SALE
  - [x] Update enum `scope`: add BY_CATEGORY, BY_PRODUCT

#### 10. Update Repository
- [x] Update `internal/repository/promotion_repository.go`
  - [x] Query already parameterized - no changes needed

#### 11. Update Service
- [x] Update `internal/services/promotion_service.go`
  - [x] Handle BUY_X_GET_Y logic (buy_quantity, get_quantity)
  - [x] Handle FLASH_SALE time (start_time, end_time)
  - [x] Update Create/Update input structs
  - [x] Update response data

#### 12. Update Handler
- [x] Update `internal/handlers/promotion_handler.go`
  - [x] Accept field baru: buy_quantity, get_quantity, start_time, end_time

#### 13. Update Sales Service
- [x] Update `internal/services/sales_service.go`
  - [x] Apply BUY_X_GET_Y discount logic
  - [x] Apply FLASH_SALE discount logic with time validation

## Status Legend
- [ ] = Pending
- [x] = Completed
- [~] = In Progress

## Priority
1. Backend - Update Models (9)
2. Backend - Update Repository (10)
3. Backend - Update Service (11)
4. Backend - Update Handler (12)
5. Backend - Update Sales Service (13)

## Notes
- Frontend sudah complete dan siap di-test
- Backend perlu disesuaikan untuk support field baru
- Setelah backend diupdate, perlu update frontend API layer jika ada field name changes