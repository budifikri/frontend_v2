# PLAN: Companies CRUD Implementation for frontend_v2

## Overview
Implement full CRUD (Create, Read, Update, Delete) for Companies in `frontend_v2` using endpoint `/api/companies`, adapted from `D:\Project\pos_retail\frontend` and aligned with existing `frontend_v2` master-page architecture (without React Query).

## Reference Findings (from frontend)

### Main Endpoints Used by CRUD
- `GET /api/companies` - list companies
- `POST /api/companies` - create company
- `PUT /api/companies/{id}` - update company
- `DELETE /api/companies/{id}` - delete company

### Additional Endpoints (available but optional for first pass)
- `GET /api/companies/current`
- `GET /api/companies/{id}`
- `POST /api/companies/{id}/logo`

### Data Models (reference)

#### Company
```javascript
{
  id: string,
  code: string,
  nama: string,
  email: string,
  telp?: string | null,
  address?: string | null,
  website?: string | null,
  tax_id?: string | null,
  business_license?: string | null,
  is_active?: boolean | null,
  status?: 'active' | 'inactive' | 'suspended' | string,
  logo?: string | null
}
```

#### CreateCompanyInput
```javascript
{
  code: string,
  nama: string,
  email: string,
  address: string,
  telp: string,
  website: string,
  tax_id: string,
  business_license: string,
  is_active?: boolean
}
```

#### UpdateCompanyInput
```javascript
{
  code?: string,
  nama?: string,
  email?: string,
  address?: string,
  telp?: string,
  website?: string,
  tax_id?: string,
  business_license?: string,
  is_active?: boolean
}
```

## Implementation Plan

### 1) Create companies API module
**Target file:** `src/features/master/company/company.api.js`

Implement functions:
- `listCompanies(token)`
- `createCompany(token, input)`
- `updateCompany(token, id, input)`
- `deleteCompany(token, id)`

Behavior:
- `listCompanies` normalizes response from `raw.data`, `raw.data.items`, or `raw.data.data`.
- Throw clear error messages from `raw.error || raw.message`.
- Use `stripUndefined` for update payload.

### 2) Build Company master component
**Target file:** `src/components/ToolbarItem/master/Company.jsx`

Follow current v2 style used in `Warehouse` and `Satuan`:
- API-first with safe fallback when token is unavailable.
- State:
  - `data`, `isLoading`, `isSaving`, `error`
  - `selectedId`, `showForm`, `showDeleteConfirm`, `showExitConfirm`
  - `isActiveFilter`, `searchKeyword`
  - `limit`, `offset`, `togglingId`
- Form model:
  - `code`, `nama`, `email`, `telp`, `address`, `website`, `tax_id`, `business_license`, `is_active`

CRUD behavior:
- Create and edit using form payload
- Delete selected company via API delete
- Toggle active status via `updateCompany(..., { is_active })`

### 3) Table + form alignment for v2
**Target file:** `src/components/ToolbarItem/master/Company.jsx`

Table columns:
- `No`, `Code`, `Name`, `Email`, `Phone`, `Status`

Form fields:
- `Code`, `Name`, `Email`, `Phone`
- `Website`, `Address`
- `Tax ID`, `Business License`

Use existing shared classes in `src/App.css`:
- sticky table header
- status toggle style
- master form card/grid + save/cancel action buttons

### 4) Footer integration
**Files:**
- `src/components/ToolbarItem/master/Company.jsx`
- `src/components/ToolbarItem/footer/FooterMaster.jsx` (reuse)

Hook footer props:
- `onNew`, `onEdit`, `onDelete`, `onSearch`, `onPrint`, `onExit`
- `filter={isActiveFilter}`, `onFilterChange={setIsActiveFilter}`
- `onRefresh={fetchData}`, `isLoading={isLoading}`

Filtering note:
- Active/inactive filter handled locally from fetched list (like reference CompanySection)
- Search handled locally on `code`, `nama`, `email`, `telp`

### 5) Register company menu in dashboard canvas
**Target file:** `src/components/Dashboard/DashboardCanvas.jsx`

Add route branch to render Company component when toolbar key selected.

Important mapping note:
- In `src/data/toolbarItems.js`, company-like menu currently appears as `dept`.
- Decide mapping strategy in implementation:
  - Preferred: map `activeTool === 'dept'` to `<Company onExit={onExit} />` for compatibility.
  - Optional cleanup later: rename key `dept` -> `company` across toolbar/canvas.

### 6) Keyboard + popup consistency
**Related files:**
- `src/components/ToolbarItem/master/Company.jsx`
- `src/components/ToolbarItem/footer/DeleteMaster.jsx` (already supports arrow left/right + enter)

Shortcuts for Company page:
- `+` / `F1`: new
- `F2`: edit selected
- `Delete`: delete selected
- `Escape`: close form / open exit confirm

## Planned File Changes
1. `src/features/master/company/company.api.js` (new)
2. `src/components/ToolbarItem/master/Company.jsx` (new)
3. `src/components/Dashboard/DashboardCanvas.jsx` (update)
4. Optional minor `src/App.css` additions (only if specific spacing tweaks needed)

## Validation Checklist
- `npm run build` passes
- Clicking related toolbar item (`dept`) opens company page
- List loads from `/api/companies`
- Create/Edit/Delete works with expected payload
- Status toggle updates `is_active`
- Footer search/filter/refresh works
- No crash when token unavailable (fallback-safe behavior)

## Notes
- Keep implementation JavaScript-first and consistent with existing v2 patterns.
- Do not introduce React Query in `frontend_v2`.
- Keep diff focused; avoid unrelated structural changes.
