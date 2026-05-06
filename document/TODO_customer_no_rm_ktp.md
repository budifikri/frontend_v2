# TODO Penambahan NO RM dan KTP di Customer

## Backend

### 1. Model
- [ ] Tambah field `no_rm` di `internal/models/sales.go`
- [ ] Tambah field `no_nik` di `internal/models/sales.go`
- [ ] Tambah field `no_rm` di `internal/repository/customer_repository.go`
- [ ] Tambah field `no_nik` di `internal/repository/customer_repository.go`
- [ ] Update select clause customer list dan detail agar field baru ikut dibaca

### 2. Request
- [ ] Tambah `NoRM` di `CreateCustomerRequest`
- [ ] Tambah `NoNIK` di `CreateCustomerRequest`
- [ ] Tambah `NoRM` di `UpdateCustomerRequest`
- [ ] Tambah `NoNIK` di `UpdateCustomerRequest`

### 3. Handler dan Service
- [ ] Update create customer agar menerima `no_rm`
- [ ] Update create customer agar menerima `no_nik`
- [ ] Update update customer agar menerima `no_rm`
- [ ] Update update customer agar menerima `no_nik`
- [ ] Tambah validasi format `KTP` 16 digit angka
- [ ] Translate duplicate `no_nik` ke pesan bisnis yang jelas
- [ ] Translate duplicate `no_rm` ke pesan bisnis yang jelas

## Frontend

### 4. Form State
- [ ] Tambah `no_rm` ke `DEFAULT_FORM`
- [ ] Tambah `no_nik` ke `DEFAULT_FORM`

### 5. Table dan Print
- [ ] Clinic: hapus `CODE` dari list utama
- [ ] Clinic: tambah kolom `NO RM`
- [ ] Semua business type: tambah kolom `KTP`
- [ ] Sesuaikan `colSpan` empty state
- [ ] Sesuaikan kolom print agar mengikuti aturan tampilan terbaru

### 6. Excel
- [ ] Tambah kolom `NO RM` di `getExcelColumns()` untuk clinic
- [ ] Tambah kolom `KTP` di `getExcelColumns()`
- [ ] Pastikan export customer menyertakan field baru
- [ ] Pastikan import customer membaca field baru
- [ ] Pastikan generate template ikut header baru

### 7. UI Form
- [ ] Tambah input `NO RM` hanya untuk clinic
- [ ] Tambah input `KTP` untuk semua business type
- [ ] Tambah validasi `KTP` di frontend sebelum save

### 8. Mapping Data
- [ ] Update `handleSave()` agar kirim `no_rm`
- [ ] Update `handleSave()` agar kirim `no_nik`
- [ ] Update `handleEdit()` agar isi `no_rm`
- [ ] Update `handleEdit()` agar isi `no_nik`
- [ ] Update next record mapping
- [ ] Update prev record mapping

## Verification

### 9. Backend Testing
- [ ] Test create customer dengan `KTP`
- [ ] Test create customer dengan `KTP` duplicate
- [ ] Test create pasien clinic dengan `NO RM`
- [ ] Test create pasien clinic dengan `NO RM` duplicate
- [ ] Test update `KTP`
- [ ] Test update `NO RM`
- [ ] Test field kosong tetap diterima

### 10. Frontend Testing
- [ ] Test form clinic menampilkan `NO RM`
- [ ] Test form non-clinic tidak menampilkan `NO RM`
- [ ] Test form semua business type menampilkan `KTP`
- [ ] Test list pasien clinic tanpa `CODE`
- [ ] Test save customer dengan field baru
- [ ] Test export/import Excel dengan field baru

### 11. Quality Check
- [ ] Run `npm run lint`
- [ ] Run `npm run build`
- [ ] Run build backend yang relevan
