# PLAN: Customer CRUD Implementation for frontend_v2

## Overview
Implement full CRUD (Create, Read, Update, Delete) for Customer in `frontend_v2` using endpoint `/api/customers`, adapted from reference implementation in `D:\Project\pos_retail\frontend` and aligned with current `frontend_v2` master-page UX (without React Query).

## Reference Findings (from frontend)

### Main Endpoints Used by CRUD
- `GET /api/customers` - list customers
- `POST /api/customers` - create customer
- `PUT /api/customers/{id}` - update customer
- `DELETE /api/customers/{id}` - delete/deactivate customer

### Additional Endpoints (optional for later)
- `GET /api/customers/search/{term}`
- `GET /api/customers/status/{status}`
- `GET /api/customers/tier/{tier}`
- `GET /api/customers/{id}`

### Query Parameters for list
- `search?: string`
- `tier?: string`
- `is_active?: boolean`
- `include_inactive?: boolean`
- `status?: string` (backward compatibility)
- `limit?: number`
- `offset?: number`

### Data Models (reference)

#### Customer
```javascript
{
  id: string,
  customer_code?: string,
  name: string,
  email?: string | null,
  phone?: string | null,
  address?: string | null,
  city?: string | null,
  tier?: string | null,
  is_active?: boolean | null,
  status?: string | null,
  loyalty_points?: number,
  credit_limit?: string | number | null,
  credit_balance?: string | number | null,
  total_purchases?: string | number | null,
  bank_name?: string | null,
  bank_account_number?: string | null,
  bank_account_name?: string | null,
  bank_branch?: string | null,
  created_at?: string,
  updated_at?: string
}
```

#### CreateCustomerInput
```javascript
{
  name: string,
  email: string,
  phone: string,
  address: string,
  city: string,
  tier: string, // BRONZE | SILVER | GOLD | PLATINUM
  credit_limit: number,
  bank_name: string,
  bank_account_number: string,
  bank_account_name: string,
  bank_branch: string
}
```

#### UpdateCustomerInput
```javascript
{
  name?: string,
  email?: string,
  phone?: string,
  address?: string,
  city?: string,
  tier?: string,
  credit_limit?: number,
  bank_name?: string,
  bank_account_number?: string,
  bank_account_name?: string,
  bank_branch?: string,
  is_active?: boolean,
  status?: string
}
```

## Implementation Plan

### 1) Create customer API module
**Target file:** `src/features/master/customer/customer.api.js`

Implement functions:
- `listCustomers(token, params = {})`
- `createCustomer(token, input)`
- `updateCustomer(token, id, input)`
- `deleteCustomer(token, id)`

Behavior:
- Build query string for `search`, `tier`, `is_active`, `include_inactive`, `status`, `limit`, `offset`.
- Normalize response to `{ items, pagination }`.
  - Support pagination from `raw.pagination` and `raw.data.pagination`.
- Throw clear errors from `raw.error || raw.message`.
- Use `stripUndefined` on update payload.

### 2) Build Customer master page
**Target file:** `src/components/ToolbarItem/master/Customer.jsx`

Follow v2 pattern used in `Warehouse.jsx` and `Satuan.jsx`:
- API-first with graceful fallback handling if token missing (optional local fallback rows).
- State:
  - `data`, `pagination`, `isLoading`, `isSaving`, `error`
  - `selectedId`, `showForm`, `showDeleteConfirm`, `showExitConfirm`
  - `searchKeyword`, `tierFilter`, `isActiveFilter`
  - `limit`, `offset`, `togglingId`
- Form model:
  - `name`, `email`, `phone`, `address`, `city`, `tier`, `credit_limit`, `bank_name`, `bank_account_number`, `bank_account_name`, `bank_branch`
- CRUD actions:
  - create/edit save
  - delete selected customer
  - status toggle via `updateCustomer(..., { is_active })`

### 3) Table and form structure
**Target file:** `src/components/ToolbarItem/master/Customer.jsx`

Table columns (minimum):
- `No`, `Code`, `Name`, `Email`, `Phone`, `Tier`, `Status`

Form fields:
- **Identity:** `Name`, `Email`, `Phone`, `City`, `Address`
- **Customer config:** `Tier`, `Credit Limit`
- **Bank info:** `Bank Name`, `Bank Branch`, `Account Number`, `Account Name`

Recommended tier options:
- `BRONZE`, `SILVER`, `GOLD`, `PLATINUM`

Reuse existing shared style classes in `src/App.css`:
- sticky table header
- status toggle button style
- form card/grid and save/cancel actions

### 4) Footer and filtering integration
**Files:**
- `src/components/ToolbarItem/master/Customer.jsx`
- `src/components/ToolbarItem/footer/FooterMaster.jsx` (reuse existing)

Footer wiring:
- `onNew`, `onEdit`, `onDelete`, `onSearch`, `onPrint`, `onExit`
- `filter={isActiveFilter}`, `onFilterChange={setIsActiveFilter}`
- `onRefresh={fetchData}`, `isLoading={isLoading}`

Customer-specific filter:
- Keep status filter in footer
- Put tier filter in page toolbar/header area (similar to reference), or inline near table controls

### 5) Register customer view in dashboard canvas
**Target file:** `src/components/Dashboard/DashboardCanvas.jsx`

Add branch:
- if `activeTool === 'customer'`, render `<Customer onExit={onExit} />`

Reason:
- Toolbar already includes `customer` key in `src/data/toolbarItems.js`, but canvas currently has no Customer component route.

### 6) Keyboard + popup behavior consistency
**Related files:**
- `src/components/ToolbarItem/master/Customer.jsx`
- `src/components/ToolbarItem/footer/DeleteMaster.jsx` (already supports arrow/enter/esc)

Shortcuts on Customer page:
- `+` / `F1`: new
- `F2`: edit selected
- `Delete`: delete selected
- `Escape`: close form / open exit confirm

## Planned File Changes
1. `src/features/master/customer/customer.api.js` (new)
2. `src/components/ToolbarItem/master/Customer.jsx` (new)
3. `src/components/Dashboard/DashboardCanvas.jsx` (update)
4. `src/App.css` (optional minor style adjustments only if needed)

## Validation Checklist
- `npm run build` passes
- Customer menu opens customer page in canvas
- List fetches from `/api/customers` with `search`, `tier`, `status` filters
- Create/Edit/Delete calls correct endpoints
- Status toggle updates `is_active`
- Pagination (`limit`/`offset`) works with `has_more` logic
- No crash when token unavailable; fallback behavior remains safe

## Notes
- Keep implementation JavaScript-first (no TypeScript migration in v2).
- Do not add React Query; use direct async API flow like current `Warehouse`/`Satuan`.
- Keep diffs focused and consistent with current `frontend_v2` visual/interaction patterns.
