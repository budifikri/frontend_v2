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

### 1. Create API Module ✅
**File:** `src/features/master/warehouse/warehouse.api.js`

```javascript
// Functions needed:
- listWarehouses(token, params) -> Promise<Warehouse[]>
- createWarehouse(token, input) -> Promise
- updateWarehouse(token, id, input) -> Promise
- deleteWarehouse(token, id) -> Promise
```

### 2. Update Auth Hook to Export Token ✅
**File:** `src/shared/auth.jsx`
- Export `auth` state so Warehouse component can access token

### 3. Update Warehouse Component ✅
**File:** `src/components/ToolbarItem/master/Warehouse.jsx`

**Design Template:** `document/template_table.html`
- Dark gradient header (slate gray: #374151 → #1F2937)
- Primary color: Teal (#0D9488)
- Background: Gray 100 (#F3F4F6)
- White cards with subtle shadows
- Form grid: 2-8-2 column layout (Kode-Nama-Simpan)
- Material Icons Round

**Features Implemented:**
- Fetch data from API on mount
- Filter: Active/Inactive/All
- Table columns: No, Kode, Nama
- Row click to select (teal highlight)
- Alternating row colors (white/slate-50)
- Extended form fields (code, name)
- Loading states on buttons
- Keyboard shortcuts (F2, Delete, +, Escape)

### 4. Update FooterMaster ✅
**File:** `src/components/ToolbarItem/footer/FooterMaster.jsx`
- Filter dropdown
- Refresh button
- Search input
- Pagination

## UI/UX Flow

### List View
- Header with accent bar and title "Daftar Gudang"
- Table with glossy dark header
- Row selection with teal background
- Hover effects on rows
- Material Icons in table headers

### Form (Create/Edit)
- Card design with border and shadow
- Icon + title header
- Grid layout: Kode (2fr) - Nama (8fr) - Simpan button (2fr)
- Input styling with focus states
- Save button with icon and hover effects

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
- Material Icons Round (Google Fonts)

## Files Modified
1. ✅ `src/features/master/warehouse/warehouse.api.js` - Created
2. ✅ `src/shared/auth.jsx` - Updated to export auth state
3. ✅ `src/components/ToolbarItem/master/Warehouse.jsx` - Redesigned
4. ✅ `src/components/ToolbarItem/footer/FooterMaster.jsx` - Updated
5. ✅ `src/App.css` - Added template-based styles
6. ✅ `index.html` - Updated to Material Icons Round

## Status
✅ COMPLETE - Build successful
- Material Icons Round (Google Fonts)

## Files Modified
1. ✅ `src/features/master/warehouse/warehouse.api.js` - Created
2. ✅ `src/shared/auth.jsx` - Updated to export auth state
3. ✅ `src/components/ToolbarItem/master/Warehouse.jsx` - Redesigned
4. ✅ `src/components/ToolbarItem/footer/FooterMaster.jsx` - Updated
5. ✅ `src/App.css` - Added template-based styles
6. ✅ `index.html` - Updated to Material Icons Round

## Status
✅ COMPLETE - Build successful
