# PLAN: Supplier CRUD Implementation for frontend_v2

## Overview
Implement full CRUD (Create, Read, Update, Delete) for Supplier in `frontend_v2` using API endpoint `/api/suppliers`, adapted from reference implementation in `D:\Project\pos_retail\frontend` and aligned with current `frontend_v2` master-page patterns (no React Query).

## Reference Findings (from frontend)

### Main Endpoints Used by CRUD
- `GET /api/suppliers` - list suppliers
- `POST /api/suppliers` - create supplier
- `PUT /api/suppliers/{id}` - update supplier
- `DELETE /api/suppliers/{id}` - delete/deactivate supplier

### Additional Endpoints (available but optional for v2 first pass)
- `GET /api/suppliers/payment-terms/{terms}`
- `GET /api/suppliers/search/{term}`
- `GET /api/suppliers/status/{status}`
- `GET /api/suppliers/{id}`

### Query Parameters for list
- `search?: string`
- `payment_terms?: string`
- `is_active?: boolean`
- `include_inactive?: boolean`
- `limit?: number`
- `offset?: number`

### Data Models (reference)

#### Supplier
```javascript
{
  id: string,
  code?: string,
  name: string,
  contact_person?: string | null,
  email?: string | null,
  phone?: string | null,
  address?: string | null,
  city?: string | null,
  tax_id?: string | null,
  payment_terms?: string | null,
  credit_limit?: number | string | null,
  is_active?: boolean | null,
  status?: string | null,
  notes?: string | null
}
```

#### CreateSupplierInput
```javascript
{
  name: string,
  contact_person: string,
  email: string,
  phone: string,
  address: string,
  city: string,
  tax_id: string,
  payment_terms: string, // CASH | NET_30 | NET_60 | NET_90 | COD
  credit_limit: number,
  notes: string
}
```

#### UpdateSupplierInput
```javascript
{
  name?: string,
  contact_person?: string,
  email?: string,
  phone?: string,
  address?: string,
  city?: string,
  tax_id?: string,
  payment_terms?: string,
  credit_limit?: number,
  notes?: string,
  is_active?: boolean,
  status?: string
}
```

## Implementation Plan

### 1) Create supplier API module
**Target file:** `src/features/master/supplier/supplier.api.js`

Implement:
- `listSuppliers(token, params = {})`
- `createSupplier(token, input)`
- `updateSupplier(token, id, input)`
- `deleteSupplier(token, id)`

Behavior:
- Build query string from list params (`search`, `payment_terms`, `is_active`, `include_inactive`, `limit`, `offset`).
- Default query values in caller (e.g., limit 20/50, offset 0).
- Normalize list response to support either array response or wrapped payload.
- Return `{ items, pagination }` shape for list to preserve `has_more` handling.
- Use `stripUndefined` for update payload.

### 2) Build Supplier master component
**Target file:** `src/components/ToolbarItem/master/Supplier.jsx`

Follow existing `Warehouse.jsx` / `Satuan.jsx` style in v2:
- API-first, fallback-safe when token unavailable (optional local fallback list).
- State:
  - `data`, `isLoading`, `isSaving`, `error`
  - `selectedId`, `showForm`, `showDeleteConfirm`, `showExitConfirm`
  - `searchKeyword`, `isActiveFilter`, `paymentTerms`
  - `togglingId` for status toggle
  - pagination state (`limit`, `offset`, optional `hasMore`)
- Form model:
  - `name`, `contact_person`, `email`, `phone`, `address`, `city`, `tax_id`, `payment_terms`, `credit_limit`, `notes`
- CRUD actions:
  - create/edit save
  - delete selected supplier
  - status toggle via `updateSupplier(..., { is_active })`

### 3) UI layout (table + form)
**Target file:** `src/components/ToolbarItem/master/Supplier.jsx`

List table columns:
- `No`, `Code`, `Name`, `Contact`, `Phone`, `Terms`, `Status`

Form fields:
- `Name`, `Contact Person`, `Email`, `Phone`
- `Address`, `City`, `Tax ID`
- `Payment Terms` (dropdown: `CASH`, `NET_30`, `NET_60`, `NET_90`, `COD`)
- `Credit Limit` (numeric)
- `Notes`

Use existing master styles in `src/App.css`:
- sticky table header
- status toggle pill/button
- save/cancel action block

### 4) Integrate footer controls
**Files:**
- `src/components/ToolbarItem/master/Supplier.jsx`
- `src/components/ToolbarItem/footer/FooterMaster.jsx` (reuse existing props)

Use `FooterMaster` with:
- `onNew`, `onEdit`, `onDelete`, `onSearch`, `onPrint`, `onExit`
- `filter={isActiveFilter}` and `onFilterChange={setIsActiveFilter}`
- `onRefresh={fetchData}` and `isLoading={isLoading}`

Supplier-specific filter:
- Keep status filter in footer
- Put payment terms filter in page header area (near search) or form of quick filter in content area

### 5) Register Supplier in dashboard canvas
**Target file:** `src/components/Dashboard/DashboardCanvas.jsx`

Add rendering branch:
- if `activeTool === 'supplier'`, render `<Supplier onExit={onExit} />`

This is required because toolbar already has supplier item key (`supplier`), but canvas currently has no Supplier view branch.

### 6) Keyboard and popup behavior consistency
**Related files:**
- `src/components/ToolbarItem/master/Supplier.jsx`
- `src/components/ToolbarItem/footer/DeleteMaster.jsx` (already supports arrow/enter/esc)

Shortcuts on Supplier page:
- `+`/`F1`: new
- `F2`: edit selected
- `Delete`: delete selected
- `Escape`: close form or open exit confirm

## Planned File Changes
1. `src/features/master/supplier/supplier.api.js` (new)
2. `src/components/ToolbarItem/master/Supplier.jsx` (new)
3. `src/components/Dashboard/DashboardCanvas.jsx` (update)
4. `src/App.css` (optional small additions only if Supplier form/table needs specific class tuning)

## Validation Checklist
- `npm run build` passes
- Supplier menu opens real Supplier page (not empty canvas)
- List loads from `/api/suppliers` with filters
- Create/Edit/Delete works with correct payload
- Status toggle updates `is_active`
- Search + payment terms filter behave correctly
- Footer status filter works (`Active/Inactive/All`)
- No runtime crash when token unavailable; graceful fallback handling

## Notes
- Keep implementation in JavaScript and existing v2 coding conventions.
- Do not add React Query; use direct async API calls like Warehouse/Satuan v2.
- Keep diffs scoped and avoid unrelated refactors.
