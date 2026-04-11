# PLAN: Excel Import/Export for Master Data Panels

## Overview
Add Excel import/export functionality (Template, Import, Export) to all master data panels. Start with Warehouse as the first implementation.

## Goals
1. Add 3 buttons to footer: Template (TMP), Import (IMP), Export (EXP)
2. Position: Bottom right before Total Row display
3. Enable ALL master panels with Excel functionality

## Design

### Visual Design
```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ [+][F2][DEL][PRINT][REFRESH] [TMP][IMP][EXP] ... [extraActions] ... [EXIT]  │ Total Row: 25  │
│           ↑                                              ↑                    │
│     (existing buttons)                          (NEW - Excel buttons)         │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Button Details

| Button | Icon | Label | Color | Purpose |
|--------|------|-------|------|---------|
| Template | `table_chart` | TMP | Purple (#8B5CF6) | Download empty Excel template |
| Import | `file_upload` | IMP | Purple (#8B5CF6) | Import data from Excel file |
| Export | `file_download` | EXP | Purple (#8B5CF6) | Export data to Excel file |

## Dependencies
- `xlsx` (^0.18.5) - Already installed
- `file-saver` (^2.0.5) - Already installed

## Implementation Steps

### Step 1: Create Excel Utility Module
**File:** `src/utils/excelUtils.js`

Functions:
- `exportToExcel(data, filename)` - Export array of objects to .xlsx
- `importFromExcel(file)` - Parse .xlsx file, return array of objects
- `generateTemplate(columns, filename)` - Generate empty template with headers

### Step 2: Update FooterMaster Component
**File:** `src/components/ToolbarItem/footer/FooterMaster.jsx`

Add new props:
```javascript
excelColumns,        // Array of column definitions [{key, label}]
excelFilename,      // Default filename for export
onExportExcel,     // Callback for export action
onImportExcel,     // Callback for import action
onGenerateTemplate // Callback for template generation
```

Add new buttons (shown when excelColumns && excelFilename provided):
- TMP: Download template
- IMP: Import from Excel
- EXP: Export to Excel

### Step 3: Update Master Panels (in order)

| Order | File | Excel Columns |
|-------|------|--------------|
| 1 | Warehouse.jsx | code, name, type, address, city, phone, is_active |
| 2 | Category.jsx | code, name, description, parent_id, is_active |
| 3 | Product.jsx | sku, barcode, name, category_id, unit_id, cost_price, retail_price, is_active |
| 4 | Supplier.jsx | code, name, address, city, phone, email, is_active |
| 5 | Customer.jsx | code, name, address, city, phone, email, is_active |
| 6 | Satuan.jsx | code, name, is_active |
| 7 | Company.jsx | code, name, address, city, phone, email, is_active |

Each panel needs:
1. Define `EXCEL_COLUMNS` array with column definitions
2. Add handler functions:
   - `handleExportExcel()` - Export current data
   - `handleImportExcel(event)` - Import from file, parse and merge
   - `handleGenerateTemplate()` - Download empty template
3. Pass props to `FooterMaster` component

## Workflows

### Export Flow
```
User clicks EXP → handleExportExcel() 
  → Map data to Excel format 
  → exportToExcel(data, "warehouse.xlsx") 
  → Browser downloads file
```

### Import Flow
```
User clicks IMP → File input opens 
  → User selects .xlsx file 
  → handleImportExcel(file)
    → parse with importFromExcel() 
    → Map Excel rows to data model
    → For each row:
      - If ID exists in current data: Update that record
      - If ID not exists: Add as new record
    → Update state
    → Refresh table display
```

### Template Flow
```
User clicks TMP → handleGenerateTemplate()
  → generateTemplate(columns, "warehouse_template.xlsx")
  → Browser downloads template with headers only
```

## Import Logic (handleImportExcel)

```javascript
async function handleImportExcel(event) {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    const importedData = await importFromExcel(file)
    
    const newData = [...data]
    let addedCount = 0
    let updatedCount = 0
    
    for (const row of importedData) {
      // Find by code (primary key for most masters)
      const existingIndex = newData.findIndex(
        item => item.code === row.code
      )
      
      if (existingIndex >= 0) {
        // Update existing
        newData[existingIndex] = { ...newData[existingIndex], ...row }
        updatedCount++
      } else {
        // Add new
        newData.push({ id: row.code, ...row, is_active: true })
        addedCount++
      }
    }
    
    setData(newData)
    setPagination({ ...pagination, total: newData.length })
    
  } catch (err) {
    setError(err.message)
  }
}
```

## Files to Create
1. `src/utils/excelUtils.js` - Excel utility functions

## Files to Modify

### Existing Files
1. `src/components/ToolbarItem/footer/FooterMaster.jsx` - Add props + buttons
2. `src/components/ToolbarItem/master/Warehouse.jsx` - Add handlers
3. `src/components/ToolbarItem/master/Category.jsx` - Add handlers
4. `src/components/ToolbarItem/master/Product.jsx` - Add handlers
5. `src/components/ToolbarItem/master/Supplier.jsx` - Add handlers
6. `src/components/ToolbarItem/master/Customer.jsx` - Add handlers
7. `src/components/ToolbarItem/master/Satuan.jsx` - Add handlers
8. `src/components/ToolbarItem/master/Company.jsx` - Add handlers

## UI/UX Requirements

### Button Visibility
- Buttons positioned: After refresh, before extraActions
- Only show when BOTH `excelColumns` AND `excelFilename` are provided
- This allows opt-in per component

### Icons (Material Icons Round)
- Template: `table_chart` (purple)
- Import: `file_upload` (purple)
- Export: `file_download` (purple)

### Keyboard Shortcuts
- TMP: Download template
- IMP: Import from Excel
- EXP: Export to Excel

## Status
PENDING - Plan created, implementation in progress