# TODO: Implementasi Jadwal Dokter

## Backend Tasks

- [x] Buat model `JadwalDokter` di `internal/models/clinic.go` (dengan field: ID, DokterID, CompanyID, Hari, JamMulai, JamSelesai, IsActive, CreatedAt, UpdatedAt)
- [x] Buat repository `internal/repository/jadwal_dokter_repository.go` (methods: Create, FindAll, FindByID, Update, Delete, CheckDependencies)
- [x] Buat service `internal/services/jadwal_dokter_service.go` (business logic + validation)
- [x] Buat handler `internal/handlers/jadwal_dokter_handler.go` (HTTP handlers + swagger docs)
- [x] Buat request DTO `internal/types/request/jadwal_dokter_request.go` (Create & Update structs)
- [x] Register routes di `cmd/server/main.go` (path: /api/jadwal-dokter)
- [x] Update AutoMigrate di `main.go` untuk menambahkan `&models.JadwalDokter{}`
- [x] Verifikasi relasi foreign key ke tabel `dokters` (sudah ada)

## Frontend Tasks

- [x] Tambah entry `jadwal_dokter` di `src/data/toolbarItems.js` (filter: clinic + clinic_core)
- [x] Buat API functions `src/features/master/jadwal_dokter/jadwal_dokter.api.js`
- [x] Buat component `src/components/ToolbarItem/master/JadwalDokter.jsx` (dengan fitur: tabel, form, search, pagination, import/export)
- [x] Register di `src/components/Dashboard/DashboardCanvas.jsx`
- [x] Update `IMPLEMENTED_TOOLS` di `src/App.jsx`

## Testing & Quality

- [ ] Backend unit tests untuk repository & service
- [ ] Frontend tests
- [x] Lint: `npm run lint` (passed, no errors in JadwalDokter.jsx)
- [x] Build: `npm run build` (passed)
- [ ] Desktop build: `npm run tauri:build -- --debug`
