# PLAN: Categories CRUD Implementation for frontend_v2

## Overview
Implement full CRUD (Create, Read, Update, Delete/Deactivate) for Categories in `frontend_v2` using endpoint `/api/categories`, adapted from `D:\Project\pos_retail\frontend` and aligned with current master UI pattern in `frontend_v2` (no React Query).

## Reference Findings (from frontend)

### Main Endpoints Used
- `GET /api/categories` - list categories
- `POST /api/categories` - create category
- `PUT /api/categories/{id}` - update category
- `DELETE /api/categories/{id}` - soft delete/deactivate category (`is_active=false`)

### Additional Endpoints (available, optional for first pass)
- `GET /api/categories/{id}`

### Query Parameters (list)
- `limit?: number`
- `offset?: number`
- `is_active?: boolean`
- `include_inactive?: boolean`

### Data Models (reference)

#### Category
```javascript
{
  id: string,
  code: string,
  name: string,
  description?: string | null,
  parent_id?: string | null,
  is_active?: boolean
}
```

#### CreateCategoryInput
```javascript
{
  code: string,
  name: string,
  description: string,
  parent_id: string
}
```

#### UpdateCategoryInput
```javascript
{
  code?: string,
  name?: string,
  description?: string,
  parent_id?: string,
  is_active?: boolean
}
```

## Implementation Plan

### 1) Create categories API module
**Target file:** `src/features/master/category/category.api.js`

Implement:
- `listCategories(token, params = {})`
- `createCategory(token, input)`
- `updateCategory(token, id, input)`
- `deactivateCategory(token, id)`

Behavior:
- Build query string from `limit`, `offset`, `is_active`, `include_inactive`.
- Normalize response array from `raw.data`, `raw.data.items`, or `raw.data.data`.
- Throw clear errors from `raw.error || raw.message`.
- Use `stripUndefined` for update payload.

### 2) Build Category master component
**Target file:** `src/components/ToolbarItem/master/Category.jsx`

Follow existing `Warehouse`/`Satuan` style in v2:
- API-first with graceful fallback when token unavailable.
- State:
  - `data`, `isLoading`, `isSaving`, `error`
  - `selectedId`, `showForm`, `showDeleteConfirm`, `showExitConfirm`
  - `isActiveFilter`, `limit`, `offset`
  - `togglingId` for status switch
- Form model:
  - `code`, `name`, `description`, `parent_id`

CRUD behavior:
- Create category using form payload
- Edit category by selected row
- Delete action calls deactivate endpoint
- Status toggle calls update endpoint with `{ is_active }`

### 3) Table and form structure
**Target file:** `src/components/ToolbarItem/master/Category.jsx`

Table columns:
- `No`, `Code`, `Name`, `Parent`, `Status`

Form fields:
- `Code`
- `Name`
- `Description`
- `Parent ID (optional)`

Use existing shared style classes in `src/App.css`:
- sticky table header
- status toggle style
- master form card/grid/actions

### 4) Integrate FooterMaster controls
**Files:**
- `src/components/ToolbarItem/master/Category.jsx`
- `src/components/ToolbarItem/footer/FooterMaster.jsx` (reuse)

Hook props:
- `onNew`, `onEdit`, `onDelete`, `onSearch`, `onPrint`, `onExit`
- `filter={isActiveFilter}`, `onFilterChange={setIsActiveFilter}`
- `onRefresh={fetchData}`, `isLoading={isLoading}`

Search recommendation:
- Local search on `code`, `name`, `description`, `parent_id`.

### 5) Canvas + toolbar key mapping
**Target file:** `src/components/Dashboard/DashboardCanvas.jsx`

Add view branch for categories using master key already present in toolbar:
- Toolbar currently has `golongan` key in `src/data/toolbarItems.js`.
- Map `activeTool === 'golongan'` to render `<Category onExit={onExit} />`.

This avoids toolbar click opening empty canvas.

### 6) Keyboard and popup consistency
**Related files:**
- `src/components/ToolbarItem/master/Category.jsx`
- `src/components/ToolbarItem/footer/DeleteMaster.jsx` (already supports arrow left/right + enter)

Shortcuts:
- `+` / `F1`: new
- `F2`: edit selected
- `Delete`: delete/deactivate selected
- `Escape`: close form / open exit confirm

## Planned File Changes
1. `src/features/master/category/category.api.js` (new)
2. `src/components/ToolbarItem/master/Category.jsx` (new)
3. `src/components/Dashboard/DashboardCanvas.jsx` (update)
4. Optional: `src/App.css` minor tweaks only if Category needs specific spacing

## Validation Checklist
- `npm run build` passes
- Clicking toolbar item `Golongan` opens categories page
- Category list fetch works with active/inactive/all filter
- Create/Edit/Deactivate works via `/api/categories`
- Status toggle updates `is_active`
- Search/filter/refresh works without UI mismatch
- No crash when token unavailable (fallback-safe behavior)

## Notes
- Keep JavaScript-first approach; do not migrate to TypeScript.
- Do not introduce React Query in `frontend_v2` implementation.
- Keep diff focused and follow existing master component patterns.
