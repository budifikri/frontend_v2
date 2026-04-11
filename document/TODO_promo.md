# TODO Promotion Menu

## Tasks

### 1. Create API Layer
- [ ] Create `src/features/master/promotion/promotion.api.js`
  - [ ] listPromotions(token, params)
  - [ ] createPromotion(token, input)
  - [ ] updatePromotion(token, id, input)
  - [ ] deactivatePromotion(token, id)
  - [ ] getPromotionById(token, id)

### 2. Create Promotion Component
- [ ] Create `src/components/ToolbarItem/transaksi/Promotion.jsx`
  - [ ] Define DEFAULT_FORM with all fields
  - [ ] Define TABLE_COLUMNS
  - [ ] Define DUMMY_PROMOTIONS for offline mode
  - [ ] Implement fetchData with pagination
  - [ ] Implement handleSave (create/update)
  - [ ] Implement handleDelete (deactivate)
  - [ ] Implement handleToggleStatus
  - [ ] Render table with columns
  - [ ] Render form with all fields
  - [ ] Render footer with actions

### 3. Update Toolbar Items
- [ ] Update `src/data/toolbarItems.js`
  - [ ] Add promotion to transaksi menu

### 4. Update Dashboard Canvas
- [ ] Update `src/components/Dashboard/DashboardCanvas.jsx`
  - [ ] Import Promotion component
  - [ ] Add render condition for promotion tool

### 5. Update App.jsx
- [ ] Update `src/App.jsx`
  - [ ] Add 'promotion' to IMPLEMENTED_TOOLS

## Status Legend
- [ ] = Pending
- [x] = Completed
- [~] = In Progress

## Priority
1. Create API Layer
2. Create Promotion Component
3. Update Toolbar Items
4. Update Dashboard Canvas
5. Update App.jsx

## Notes
- Follow pattern from Category.jsx for component structure
- Follow pattern from category.api.js for API layer
- Reuse master components: FooterMaster, FooterFormMaster, DeleteMaster, MasterTableHeader, MasterStatusToggle
- Use hooks: useMasterTableSort, useMasterPagination