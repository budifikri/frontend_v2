# Plan: Dashboard Statusbar - Database Indicator

## Objective
Menambahkan indikator nama database aktif di dashboard statusbar.

## Status: Completed

## Implementation Details

### Files Modified

1. **`src/components/Dashboard/DashboardFooter.jsx`**
   - Added `useState` and `useEffect` hooks
   - Fetch database name from `/api/health` endpoint on mount
   - Display database name in statusbar right section with icon
   - Fallback to `---` if fetch fails

2. **`src/App.css`**
   - Added `.db-icon` - emoji icon styling
   - Added `.db-name` - database name text styling
   - Added `.status-separator` - visual separator between elements

### API Endpoint Used
```
GET /api/health
Response: { "database": { "database": "klinik", "host": "localhost", "port": 5432, "status": "connected" } }
```

### Visual Output
```
[Username](Role) │ 12 May 2026 │ Version 3.0 │ 🗄️ klinik │ ● System Connected
```

## Verification
- [x] `npm run lint` - Passed (0 errors)
- [ ] Dev server test - pending