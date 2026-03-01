# PLAN: Warehouse CRUD Implementation for frontend_v2

## Overview
Implement full CRUD (Create, Read, Update, Delete) for Warehouse using the API from frontend project, adapted for frontend_v2's JavaScript/React without React Query.

## API Endpoints (from frontend)
- `GET /api/warehouses` - List warehouses
- `POST /api/warehouses` - Create warehouse
- `PUT /api/warehouses/{id}` - Update warehouse
- `DELETE /api/warehouses/{id}` - Delete warehouse

## Data Models

### Warehouse
```javascript
{
  id: string,
  code: string,
  name: string,
  type: 'MAIN' | 'BRANCH' | 'STORAGE' | 'OUTLET',
  address: string,
  city: string,
  phone: string,
  is_active: boolean
}
```

### CreateWarehouseInput
```javascript
{
  code: string,
  name: string,
  type: 'MAIN' | 'BRANCH' | 'STORAGE' | 'OUTLET',
  address: string,
  city: string,
  phone: string
}
```

## Implementation Plan

### 1. Create API Module
**File:** `src/features/master/warehouse/warehouse.api.js`

```javascript
// Functions needed:
- listWarehouses(token, params) -> Promise<Warehouse[]>
- createWarehouse(token, input) -> Promise
- updateWarehouse(token, id, input) -> Promise
- deleteWarehouse(token, id) -> Promise
```

### 2. Update Auth Hook to Export Token
**File:** `src/shared/auth.jsx`
- Export `auth` state so Warehouse component can access token

### 3. Update Warehouse Component
**File:** `src/components/ToolbarItem/master/Warehouse.jsx`

**New State:**
- `data` - warehouse list from API
- `isLoading` - loading state
- `error` - error message
- `form` - extended with type, address, city, phone
- `editIsActive` - for toggle active status

**New Features:**
- Fetch data from API on mount
- Add filter: Active/Inactive/All  
- Add pagination (NEXT/PREV buttons)
- Add refresh button
- Extended form fields (type, address, city, phone)
- Toggle active status inline
- Loading states on buttons

### 4. Update FooterMaster (Optional)
**File:** `src/components/ToolbarItem/footer/FooterMaster.jsx`
- Add Refresh button if not exists

## UI/UX Flow

### List View
- Filter dropdown: Active | Inactive | All
- Refresh button (top right)
- Table columns: No, Code, Name, Type, City, Active (toogle)
- Row click to select
- NEXT/PREV for pagination

### Form (Create/Edit)
- Fields: Code, Name, Type, Address, City, Phone
- Type dropdown: MAIN, BRANCH, STORAGE, OUTLET
- Active checkbox (edit mode only)
- Save/Cancel buttons

### Actions
- **+ (+):** New warehouse
- **F2:** Edit selected
- **Delete:** Delete with confirmation
- **Refresh:** Reload data from API

## Keyboard Shortcuts
- `+`: New
- `F2`: Edit
- `Delete`: Delete
- `Escape`: Exit/Close modal

## Dependencies
- Use existing `apiFetch` from `src/shared/http.js`
- Use existing `useAuth` from `src/shared/auth.jsx`
- Use existing `FooterMaster` component
- Use existing `DeleteMaster` component
