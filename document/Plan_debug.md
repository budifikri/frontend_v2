# Plan: Debug Logging Feature

## Overview
Implement a debug mode that logs all API requests and responses when the application is accessed with `?debug` query parameter. Logs are saved to `debug.txt` and viewable via a new button in the Settings menu.

## Requirements

### 1. Debug Mode Detection
- Detect `?debug` query parameter in URL
- Enable debug logging when parameter is present
- Bypass this feature in Tauri desktop mode (not applicable)

### 2. Request/Response Logging
- Log all HTTP requests made via `apiFetch`
- Capture:
  - Request URL
  - Request method
  - Request body (if any)
  - Response status
  - Response body
  - Timestamp
- Append logs to `debug.txt` file

### 3. Settings UI Enhancement
- Add new "View Debug Log" button in Settings page
- Display contents of `debug.txt` in a modal or new view
- Include options to:
  - Clear debug log
  - Copy log to clipboard
  - Export log file

### 4. Tauri Considerations
- Feature is web-only (query parameter based)
- Tauri desktop app bypasses this feature automatically
- No changes needed for Tauri backend

## Implementation Steps

### Step 1: Create Debug Logger Utility
**File:** `src/utils/debugLogger.js`

Functions:
- `isDebugEnabled()` - Check if debug mode is active
- `logRequest(url, method, body)` - Log outgoing request
- `logResponse(url, status, data)` - Log response received
- `getLogs()` - Read current logs from debug.txt
- `clearLogs()` - Clear debug.txt contents

### Step 2: Modify HTTP Helper
**File:** `src/shared/http.js`

Changes:
- Import debug logger
- Add logging calls before and after `fetch`
- Wrap in `isDebugEnabled()` check

### Step 3: Create Debug Log Viewer Component
**File:** `src/components/Settings/DebugLogViewer.jsx`

Features:
- Modal/dialog component
- Display log contents in scrollable area
- Buttons: Clear, Copy, Export, Close
- Auto-refresh option

### Step 4: Add Debug Button to Settings
**File:** `src/components/ToolbarItem/setting/Setting.jsx` (or appropriate settings file)

Changes:
- Import debug log viewer
- Add "View Debug Log" button
- Show button only when debug mode is enabled (optional)
- Open modal on click

### Step 5: Add File System Access (if needed)
**File:** `src-tauri/src/main.rs` or existing command module

Commands (if Tauri file access needed for desktop):
- `write_debug_log(content)` - Append to debug.txt
- `read_debug_log()` - Read debug.txt
- `clear_debug_log()` - Clear debug.txt

**Note:** For web mode, use standard File API or store in memory/localStorage

## File Structure

```
src/
├── utils/
│   └── debugLogger.js          # New - Debug logging utility
├── shared/
│   └── http.js                 # Modified - Add debug logging
├── components/
│   └── Settings/
│       └── DebugLogViewer.jsx  # New - Log viewer modal
└── components/
    └── ToolbarItem/
        └── setting/
            └── Setting.jsx     # Modified - Add debug button
```

## Technical Considerations

### Web Mode (Browser)
- Store logs in memory or localStorage
- Use Blob API for file download
- Query parameter detection via `window.location.search`

### Tauri Mode
- Feature automatically disabled (no query param in desktop)
- If needed later, can use Tauri FS API for file access

### Log Format
```
[2026-03-08 14:30:15] REQUEST: GET /api/warehouse
[2026-03-08 14:30:15] RESPONSE: 200 OK - {items: [...], pagination: {...}}
```

### Performance
- Debug mode should not impact production performance
- All debug code wrapped in `isDebugEnabled()` check
- Consider log rotation or size limits

## Testing

### Unit Tests
- `debugLogger.js` functions
- Log format validation
- File I/O operations

### Integration Tests
- Verify logs appear when `?debug` is in URL
- Verify no logs when debug mode is off
- Test viewer component functionality

### Manual Testing
1. Navigate to `http://localhost:5173/?debug`
2. Perform various actions (login, CRUD operations)
3. Open Settings, click "View Debug Log"
4. Verify logs are captured correctly
5. Test Clear, Copy, Export functions

## Acceptance Criteria

- [ ] Debug mode activates when URL contains `?debug`
- [ ] All API requests and responses are logged
- [ ] Logs include timestamp, URL, method, body, status, response
- [ ] Settings page has "View Debug Log" button
- [ ] Debug log viewer displays logs correctly
- [ ] Clear, Copy, Export functions work
- [ ] No impact on performance when debug mode is off
- [ ] Feature gracefully bypassed in Tauri mode

## Dependencies

- No new npm packages required
- Uses existing React patterns
- Standard Web APIs (Blob, URL, localStorage)

## Estimated Effort

- Debug Logger Utility: 1-2 hours
- HTTP Integration: 0.5 hours
- Debug Log Viewer: 2-3 hours
- Settings Integration: 0.5 hours
- Testing: 1-2 hours

**Total:** 5-7 hours
