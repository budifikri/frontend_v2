# Dashboard Refactoring Plan

## Overview
Refactor dashboard components in `src/App.jsx` to improve code organization, maintainability, and separation of concerns.

## Current Structure
All dashboard components (header, menu, toolbar icons, footer) are in a single file `App.jsx` (~167 lines).

## Target Structure

### 1. Component Files
```
src/
├── components/
│   ├── Dashboard/
│   │   ├── DashboardHeader.jsx    # Title bar + window controls
│   │   ├── DashboardMenuBar.jsx    # Menu tabs (Master, Transaksi, etc.)
│   │   ├── DashboardToolbar.jsx    # Icon list with dividers
│   │   ├── DashboardCanvas.jsx     # Main content area
│   │   ├── DashboardFooter.jsx     # Status bar
│   │   └── index.js               # Export all dashboard components
│   ├── Login/
│   │   ├── LoginForm.jsx
│   │   └── index.js
│   └── index.js                   # Export all components
├── App.jsx                        # Main app - only routing/state
└── App.css                        # Keep all styles (or split per component)
```

### 2. Data Files
```
src/
├── data/
│   ├── menuItems.js               # Menu bar items
│   ├── toolbarItems.js             # Toolbar icon definitions
│   └── statusBar.js               # Footer status data
```

### 3. Hooks (optional)
```
src/
├── hooks/
│   └── useAuth.js                 # Login/auth state management
```

## Refactoring Steps

### Step 1: Extract Dashboard Data
- Move `dashboardTools` array to `src/data/toolbarItems.js`
- Move menu items to `src/data/menuItems.js`
- Move status bar data to `src/data/statusBar.js`

### Step 2: Create Dashboard Components
- Create `DashboardHeader` component
- Create `DashboardMenuBar` component
- Create `DashboardToolbar` component
- Create `DashboardCanvas` component
- Create `DashboardFooter` component

### Step 3: Create Login Components
- Extract login form to `LoginForm` component

### Step 4: Update App.jsx
- Import and compose dashboard components
- Keep only view state (`login` / `dashboard`) and handlers

### Step 5: Update Tests
- Update existing tests to work with new component structure
- Add unit tests for each extracted component

## Benefits
1. **Single Responsibility**: Each component handles one thing
2. **Reusability**: Toolbar items and menu items are now data-driven
3. **Testability**: Components can be tested in isolation
4. **Readability**: Smaller files are easier to understand
5. **Maintainability**: Changes to toolbar only affect one file

## Files to Modify
- Create: `src/components/Dashboard/*.jsx`
- Create: `src/components/Login/*.jsx`
- Create: `src/data/*.js`
- Modify: `src/App.jsx` (simplify)
- Modify: `src/App.test.jsx` (update tests)

## Files to Keep Unchanged
- `src/App.css` (all styles can stay together, or optionally split)
- `src/index.css`
- Configuration files

## Testing Strategy
1. Keep existing integration tests in `App.test.jsx`
2. Add component-specific tests as needed
3. Test data files directly (pure functions)

## Estimated Changes
- New files: ~8-10 files
- Modified files: 2 files (`App.jsx`, `App.test.jsx`)
- Lines of code moved: ~80-100 lines
