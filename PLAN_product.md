# PLAN: Product CRUD Implementation for frontend_v2

## Overview
Implement full CRUD (Create, Read, Update, Delete) for Products in `frontend_v2` using endpoint `/api/products`, adapted from `D:\Project\pos_retail\frontend` and aligned with current master-page patterns in `frontend_v2` (without React Query).

## Reference Findings (from frontend)

### Main Endpoints Used by CRUD
- `GET /api/products` - list products
- `POST /api/products` - create product
- `PUT /api/products/{id}` - update product
- `DELETE /api/products/{id}` - delete/deactivate product

### Additional Endpoint (optional for detail flow)
- `GET /api/products/{id}`

### Query Parameters for list
- `search?: string`
- `category_id?: string`
- `is_active?: boolean`
- `include_inactive?: boolean`
- `status?: string` (backward compatibility)
- `limit?: number`
- `offset?: number`

### Data Models (reference)

#### Product
```javascript
{
  id: string,
  sku: string,
  barcode?: string | null,
  name: string,
  description?: string | null,
  category_id?: string | null,
  unit_id?: string | null,
  cost_price?: number | null,
  retail_price?: number | null,
  tax_rate?: number | null,
  reorder_point?: number | null,
  is_active?: boolean | null,
  status?: string | null,
  category?: { id: string; code?: string; name?: string } | null,
  categoryName?: string | null,
  unit?: { id: string; code?: string; name?: string } | null,
  unitName?: string | null
}
```

#### ProductCreateInput
```javascript
{
  sku: string,
  barcode: string,
  name: string,
  description: string,
  category_id: string,
  unit_id: string,
  cost_price: number,
  retail_price: number,
  tax_rate: number,
  reorder_point: number
}
```

#### ProductUpdateInput
```javascript
{
  sku?: string,
  barcode?: string,
  name?: string,
  description?: string,
  category_id?: string,
  unit_id?: string,
  cost_price?: number,
  retail_price?: number,
  tax_rate?: number,
  reorder_point?: number,
  is_active?: boolean
}
```

## Implementation Plan

### 1) Create product API module
**Target file:** `src/features/master/product/product.api.js`

Implement functions:
- `listProducts(token, params = {})`
- `createProduct(token, input)`
- `updateProduct(token, id, input)`
- `deleteProduct(token, id)`

Behavior:
- Build query string for `search`, `category_id`, `is_active`, `include_inactive`, `status`, `limit`, `offset`.
- Normalize list response to `{ items, pagination }` shape.
- Support `raw.pagination` (if provided by API).
- Use `stripUndefined` before update payload.
- Throw clear errors from `raw.error || raw.message`.

### 2) Build Product master component
**Target file:** `src/components/ToolbarItem/master/Product.jsx`

Follow v2 pattern from `Warehouse.jsx` / `Satuan.jsx`:
- API-first with safe fallback when token unavailable.
- State:
  - `data`, `pagination`, `isLoading`, `isSaving`, `error`
  - `selectedId`, `showForm`, `showDeleteConfirm`, `showExitConfirm`
  - `searchKeyword`, `isActiveFilter`, `categoryFilter`
  - `limit`, `offset`, `togglingId`
- Form state:
  - `sku`, `barcode`, `name`, `description`, `category_id`, `unit_id`, `cost_price`, `retail_price`, `tax_rate`, `reorder_point`

CRUD behavior:
- Create product with mapped payload (optional fields can be `undefined`)
- Edit product using selected row
- Delete selected product
- Status toggle with `updateProduct(..., { is_active })`

### 3) Resolve dependencies for dropdowns (Category + Unit)
**Files:**
- `src/features/master/category/category.api.js` (or equivalent existing module)
- `src/features/master/unit/unit.api.js`
- `src/components/ToolbarItem/master/Product.jsx`

Product form requires:
- Category options from categories API
- Unit options from units API

Load both lookup lists on mount (or when token changes), and keep graceful fallback if API unavailable.

### 4) Table and form structure
**Target file:** `src/components/ToolbarItem/master/Product.jsx`

Table columns (minimum):
- `No`, `SKU`, `Name`, `Category`, `Unit`, `Retail`, `Status`

Form fields:
- `SKU`, `Barcode`
- `Name`, `Description`
- `Category` (select), `Unit` (select)
- `Cost Price`, `Retail Price`
- `Tax Rate (%)`, `Reorder Point`

Use existing `frontend_v2` master styles from `src/App.css`:
- sticky header
- status toggle style
- form card/grid + save/cancel

### 5) Footer and filters integration
**Files:**
- `src/components/ToolbarItem/master/Product.jsx`
- `src/components/ToolbarItem/footer/FooterMaster.jsx` (reuse)

Footer integration:
- `onNew`, `onEdit`, `onDelete`, `onSearch`, `onPrint`, `onExit`
- `filter={isActiveFilter}`, `onFilterChange={setIsActiveFilter}`
- `onRefresh={fetchData}`, `isLoading={isLoading}`

Product-specific filter:
- Keep category filter control near table/header area
- Status filter remains in footer

### 6) Register Product menu in dashboard canvas
**Target file:** `src/components/Dashboard/DashboardCanvas.jsx`

Add route branch:
- `activeTool === 'barang'` renders `<Product onExit={onExit} />`

Reason:
- Toolbar key for product already exists in `src/data/toolbarItems.js` as `barang`, but canvas currently does not render a product page.

### 7) Keyboard + popup consistency
**Related files:**
- `src/components/ToolbarItem/master/Product.jsx`
- `src/components/ToolbarItem/footer/DeleteMaster.jsx` (already supports arrow/enter/esc)

Shortcuts:
- `+` / `F1`: new
- `F2`: edit selected
- `Delete`: delete selected
- `Escape`: close form / open exit confirm

## Planned File Changes
1. `src/features/master/product/product.api.js` (new)
2. `src/components/ToolbarItem/master/Product.jsx` (new)
3. `src/components/Dashboard/DashboardCanvas.jsx` (update)
4. Optional minor updates in `src/App.css` (only if product form layout needs specific spacing)

## Validation Checklist
- `npm run build` passes
- Clicking toolbar `Barang` opens product page
- Product list loads from `/api/products`
- Category and Unit lookups load and populate dropdowns
- Create/Edit/Delete works with expected payload
- Status toggle updates `is_active`
- Search + category + status filtering works
- Pagination controls (`limit`, `offset`, `has_more`) behave correctly

## Notes
- Keep implementation JavaScript-first and consistent with v2 conventions.
- Do not introduce React Query in `frontend_v2`.
- Keep diffs focused; avoid unrelated refactors.
