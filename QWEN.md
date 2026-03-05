# Project Context: minimarket-frontend (frontend_v2)

## Overview
A **React + Vite + Tauri v2** desktop application for POS (Point of Sale) retail management. This is the frontend for a minimarket/retail administration system with master data management, reporting, and settings modules.

**Tech Stack:**
- **Frontend:** React 19 (JavaScript, functional components), Vite 7
- **Desktop Shell:** Tauri v2 (Rust)
- **Styling:** Custom CSS with Material Icons
- **Testing:** Vitest + @testing-library/react
- **Package Manager:** npm (ESM modules)

**Architecture:**
- Main source: `src/`
- Tauri backend: `src-tauri/`
- API communication via `src/shared/http.js` (`apiFetch` helper)
- Authentication context in `src/shared/auth.jsx`
- Feature modules organized by domain in `src/features/`

## Directory Structure
```
frontend_v2/
├── src/                      # Frontend source code
│   ├── components/           # Reusable UI components
│   │   ├── Dashboard/        # Dashboard shell components
│   │   ├── Login/            # Login form components
│   │   ├── ToolbarItem/      # Master/setting/report pages
│   │   └── table/            # Table templates & helpers
│   ├── features/             # Domain-specific logic
│   │   ├── auth/             # Authentication API
│   │   ├── master/           # CRUD modules (warehouse, product, etc.)
│   │   ├── laporan/          # Reports
│   │   └── setting/          # App settings
│   ├── hooks/                # Custom React hooks
│   ├── data/                 # Static data & configurations
│   ├── shared/               # Shared utilities (auth, http)
│   ├── utils/                # Helper functions
│   ├── assets/               # Static assets
│   └── test/                 # Test setup
├── src-tauri/                # Tauri Rust backend
├── document/                 # Documentation & design assets
├── dist/                     # Build output (generated)
└── public/                   # Public static files
```

## Building and Running

### Development
```bash
# Install dependencies
npm install

# Frontend dev server (browser)
npm run dev

# Tauri desktop dev (full app)
npm run tauri:dev
```

### Production
```bash
# Frontend build
npm run build

# Tauri desktop build
npm run tauri:build

# Debug build (faster, larger binary)
npm run tauri:build -- --debug

# Preview production build
npm run preview
```

### Testing
```bash
# Run all tests (watch mode)
npm run test

# Run tests once
npm run test:run

# Single test file
npx vitest run src/App.test.jsx

# Test by name pattern
npx vitest run -t "renders login form"
```

### Quality Checks
```bash
# Lint
npm run lint

# Tauri CLI passthrough
npm run tauri -- <command>
```

## Development Conventions

### Code Style
- **Components:** Functional components with hooks (`.jsx` extension)
- **Indentation:** 2 spaces
- **Quotes:** Single quotes preferred
- **Semicolons:** Omitted (unless file already uses them)
- **Naming:**
  - Components: `PascalCase` (e.g., `Warehouse`, `LoginForm`)
  - Variables/functions: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - CSS classes: `kebab-case`

### Import Order
1. Third-party packages
2. Local CSS imports
3. Local modules/components

Use one blank line between import groups.

### Component Patterns
- Keep components small and focused
- Use early returns to reduce nesting
- Add runtime guards for nullable data
- Show graceful fallback UI instead of crashing
- Keep styles near their components

### Master Page Pattern (CRUD Modules)
Existing master pages follow a consistent structure:
- **API module:** `src/features/master/<entity>/<entity>.api.js`
  - `listEntities(token, params)`
  - `createEntity(token, input)`
  - `updateEntity(token, id, input)`
  - `deleteEntity(token, id)`
- **Component:** `src/components/ToolbarItem/master/<Entity>.jsx`
  - State: `data`, `pagination`, `isLoading`, `isSaving`, `error`
  - Filters: `searchKeyword`, `isActiveFilter`
  - Keyboard shortcuts: `F1`/`+` (new), `F2` (edit), `Delete` (delete), `Escape` (exit)
  - Table with sticky header, status toggle
  - Form card with grid layout
  - Footer with navigation and actions

### Error Handling
- Guard event handlers from invalid input
- Use `try/catch` for async operations
- Log actionable errors in development
- Show user-friendly error messages
- Fallback to dummy data if API unavailable

### Tauri Integration
- Frontend output: `../dist` from `src-tauri/`
- Vite watch excludes `src-tauri/**`
- Access Tauri APIs via `@tauri-apps/api`
- Mocks available in tests via `globalThis.__TAURI_MOCKS__`
- Test setup: `src/test/setup.js`

### Environment Variables
Defined in `.env`:
- `VITE_DEFAULT_WALLPAPER` - Dashboard background
- `VITE_DEFAULT_TITLEBAR_COLOR` - Titlebar gradient
- `VITE_API_BASE_URL` - Backend API URL (default: `http://localhost:3000`)

## Key Files
- `package.json` - Scripts, dependencies
- `vite.config.js` - Dev server, build, test config
- `eslint.config.js` - Lint rules (extends `@eslint/js`, React Hooks, React Refresh)
- `src-tauri/tauri.conf.json` - Tauri app config
- `src-tauri/Cargo.toml` - Rust dependencies
- `src/main.jsx` - React entry point
- `src/App.jsx` - Root component with auth provider
- `src/shared/auth.jsx` - Authentication context
- `src/data/toolbarItems.js` - Dashboard menu definitions

## Avoid Editing
- `dist/` - Generated build output
- `src-tauri/target/` - Rust build artifacts
- `src-tauri/icons/` - Binary icon assets

## Pre-Commit Checklist
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `npm run tauri:build -- --debug` passes (if desktop changes)
- [ ] No generated artifacts committed
- [ ] Changes align with existing patterns

## API Integration
All API calls use `apiFetch` from `src/shared/http.js`:
```javascript
import { apiFetch } from '../../../shared/http'

const result = await apiFetch('/api/endpoint', {
  method: 'POST',
  token: auth.token,
  body: { key: value }
})

if (!result.success) {
  throw new Error(result.error || result.message)
}
```

Query parameters are built with `URLSearchParams`. Pagination uses `limit`/`offset`. Responses include `items` array and `pagination` object.
