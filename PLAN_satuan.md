# PLAN: Satuan (Unit) CRUD Implementation for frontend_v2

## Overview
Implement full CRUD (Create, Read, Update, Delete) for **Satuan/Unit** in `frontend_v2` using REST API endpoint `/api/units`, adapted from reference implementation in `D:\Project\pos_retail\frontend` (without React Query).

## Reference Findings (from frontend)

### API Endpoint
- `GET /api/units` - List units
- `POST /api/units` - Create unit
- `PUT /api/units/{id}` - Update unit
- `DELETE /api/units/{id}` - Delete unit

### Query Parameters (list)
- `search?: string`
- `is_active?: boolean`
- `include_inactive?: boolean`
- `limit?: number`
- `offset?: number`

### Data Models (reference)

#### Unit
```javascript
{
  id: string,
  code: string,
  name: string,
  description?: string | null,
  is_active?: boolean
}
```

#### CreateUnitInput
```javascript
{
  code: string,
  name: string,
  description: string
}
```

#### UpdateUnitInput
```javascript
{
  code?: string,
  name?: string,
  description?: string,
  is_active?: boolean
}
```

## Implementation Plan

### 1) Create Unit API module
**Target file:** `src/features/master/unit/unit.api.js`

Implement functions (pattern mengikuti `warehouse.api.js`):
- `listUnits(token, params = {})`
- `createUnit(token, input)`
- `updateUnit(token, id, input)`
- `deleteUnit(token, id)`

Behavior:
- Build query string from `search`, `is_active`, `include_inactive`, `limit`, `offset`.
- Normalize response: support `raw.data`, `raw.data.items`, `raw.data.data`.
- Throw clear errors from `raw.error || raw.message`.
- Use `stripUndefined` before `PUT` payload.

### 2) Upgrade Satuan page to API-based CRUD
**Target file:** `src/components/ToolbarItem/master/Satuan.jsx`

Refactor from local dummy-only to API-first:
- Use `useAuth()` to get `auth.token`.
- Fetch unit list on mount and on filter/refresh.
- Keep local fallback to `satuanDummyData` when token absent or API fails (same strategy as Warehouse page).

State additions:
- `isLoading`, `isSaving`, `error`
- `isActiveFilter` (`active | inactive | all`)
- `selectedId` (replace `selectedIndex` to avoid mismatch after search/filter/sort)
- Optional: `togglingId` for status toggle

Form shape:
```javascript
{
  code: '',
  name: '',
  description: ''
}
```

Mapping note:
- Existing UI field `satuan` should map to API field `name`.

### 3) Table + form alignment
**Target file:** `src/components/ToolbarItem/master/Satuan.jsx`

Align with current master UX used by Warehouse:
- Table columns: `No`, `Code`, `Name`, `Description`, `Status`.
- Status column uses toggle (`is_active`) if requested.
- Form fields: `Code`, `Name`, `Description`.
- Keep existing keyboard shortcuts:
  - `+` for new
  - `F2` edit
  - `Delete` delete
  - `Escape` close form/confirm exit

### 4) Integrate footer status filter + refresh
**Files:**
- `src/components/ToolbarItem/master/Satuan.jsx`
- `src/components/ToolbarItem/footer/FooterMaster.jsx` (already supports filter; reuse)

Hook Satuan to footer props:
- `filter={isActiveFilter}`
- `onFilterChange={setIsActiveFilter}`
- `onRefresh={fetchData}`
- `isLoading={isLoading}`

### 5) Maintain popup behavior and keyboard consistency
**Related files:**
- `src/components/ToolbarItem/footer/DeleteMaster.jsx`

Ensure Satuan delete/exit popups follow existing behavior:
- Arrow Left/Right to switch active button
- Enter to confirm selected button
- Escape to cancel

## File Changes Summary (planned)
1. `src/features/master/unit/unit.api.js` (new)
2. `src/components/ToolbarItem/master/Satuan.jsx` (major refactor to API CRUD)
3. Optional minor style adjustments in `src/App.css` (only if needed for Satuan table/form parity)

## Validation Checklist
- `npm run build` passes
- Satuan list can load from `/api/units`
- Create/Edit/Delete call correct endpoints and update UI
- Filter `Active/Inactive/All` works
- Search works for `code`, `name`, `description`
- No crash when token missing (fallback data still rendered)

## Notes
- Follow existing `frontend_v2` convention: JavaScript + functional components + minimal focused diffs.
- Do not introduce React Query; use direct async calls like Warehouse implementation.
- Keep endpoint and payload naming in English (`unit`, `name`, `description`) while UI labels may remain Indonesian as needed.
