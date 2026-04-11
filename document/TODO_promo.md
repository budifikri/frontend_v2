# TODO Promotion Menu

## Tasks

### 1. Create API Layer
- [x] Create `src/features/master/promotion/promotion.api.js`
  - [x] listPromotions(token, params)
  - [x] createPromotion(token, input)
  - [x] updatePromotion(token, id, input)
  - [x] deactivatePromotion(token, id)
  - [x] getPromotionById(token, id)

### 2. Create Promotion Component
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

### 3. Update Toolbar Items
- [x] Update `src/data/toolbarItems.js`
  - [x] Add promotion to transaksi menu

### 4. Update Dashboard Canvas
- [x] Update `src/components/Dashboard/DashboardCanvas.jsx`
  - [x] Import Promotion component
  - [x] Add render condition for promotion tool

### 5. Update App.jsx
- [x] Update `src/App.jsx`
  - [x] Add 'promotion' to IMPLEMENTED_TOOLS

### 6. IMPROVEMENT - Auto Code Generation
- [x] Update `src/components/ToolbarItem/transaksi/Promotion.jsx`
  - [x] Add generatePromotionCode helper function
  - [x] Update PROMO_TYPE_OPTIONS with 'min_purchase' option
  - [x] Update handleNew to auto-generate code
  - [x] Update handlePromoTypeChange to regenerate code when type changes

## Status Legend
- [ ] = Pending
- [x] = Completed
- [~] = In Progress

## Priority
1. IMPROVEMENT - Auto Code Generation

## Notes
- Follow pattern from Category.jsx for component structure
- Follow pattern from category.api.js for API layer
- Reuse master components: FooterMaster, FooterFormMaster, DeleteMaster, MasterTableHeader, MasterStatusToggle
- Use hooks: useMasterTableSort, useMasterPagination
- Auto code format: {PREFIX}{TIMESTAMP_5_DIGIT}