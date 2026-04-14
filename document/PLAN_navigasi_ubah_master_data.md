# PLAN: Navigator Next/Prev di Form Ubah Master Data

## 1. Tujuan

Menambahkan fitur navigasi next/prev record pada form ubah data master, agar user dapat mengedit berbagai record secara berurutan tanpa harus menutup dan membuka form ulang.

## 2. Layout Form Edit

```
┌─────────────────────────────────────────────────┐
│  ✕  Ubah Data Kategori                         │  ← Close button (kiri atas)
├─────────────────────────────────────────────────┤
│  Kode    : [________]                        │
│  Nama    : [________]                        │
│  Deskripsi: [________]                        │
│  Parent  : [________]                        │
│                              [ Prev ] [ Next ] │  ← Tombol nav pojok kanan bawah
├─────────────────────────────────────────────────┤
│         [ Simpan ]                            │
└─────────────────────────────────────────────────┘
```

## 3. Component `FooterFormMaster.jsx`

### Props
```jsx
export function FooterFormMaster({
  onSave,           // fungsi simpan
  onClose,          // fungsi close (nama baru dari onCancel)
  isSaving = false,
  saveLabel = 'Simpan',
  cancelLabel = 'Close',
  leftButtons,      // untuk tombol custom di kiri
  onNext,           // fungsi next record
  onPrev,          // fungsi prev record  
  canNext,          // boolean - enable/disable next
  canPrev,         // boolean - enable/disable prev
})
```

### Aturan Tampilan Navigation
- Jika `canNext` = `false` → tombol Next hidden
- Jika `canPrev` = `false` → tombol Prev hidden
- Jika `canNext` dan `canPrev` keduanya `false` → keduanya hidden

### Icon
- Prev: `navigate_before`
- Next: `navigate_next`

## 4. Perubahan di Setiap Master

### File yang Perlu Diubah
1. `Category.jsx`
2. `Satuan.jsx`
3. `Warehouse.jsx`
4. `Supplier.jsx`
5. `Customer.jsx`
6. `Product.jsx`

### State yang Ditambahkan
```jsx
const [currentEditIndex, setCurrentEditIndex] = useState(null)
```

### Fungsi Navigasi

```jsx
// handleNextRecord
function handleNextRecord() {
  if (currentEditIndex === null || currentEditIndex >= sortedData.length - 1) return
  const nextItem = sortedData[currentEditIndex + 1]
  setSelectedItem(nextItem)
  setCurrentEditIndex(currentEditIndex + 1)
  setForm({
    code: nextItem.code || '',
    name: nextItem.name || '',
    description: nextItem.description || '',
    parent_id: nextItem.parent_id || '',
  })
}

// handlePrevRecord
function handlePrevRecord() {
  if (currentEditIndex === null || currentEditIndex <= 0) return
  const prevItem = sortedData[currentEditIndex - 1]
  setSelectedItem(prevItem)
  setCurrentEditIndex(currentEditIndex - 1)
  setForm({
    code: prevItem.code || '',
    name: prevItem.name || '',
    description: prevItem.description || '',
    parent_id: prevItem.parent_id || '',
  })
}
```

### Kondisi Navigation

| Kondisi | Tampilan Prev | Tampilan Next |
|---------|---------------|---------------|
| `sortedData.length === 1` | hidden | hidden |
| `currentEditIndex === 0` (atau null dan item pertama) | hidden | visible |
| `currentEditIndex === length-1` | visible | hidden |
| Di tengah (0 < index < length-1) | visible | visible |

### Update handleEdit()
Set `currentEditIndex` saat membuka form edit:
```jsx
function handleEdit() {
  const target = selectedItem || data[0]
  if (!target) return
  const idx = sortedData.findIndex(item => item.id === target.id)
  setSelectedId(target.id)
  setCurrentEditIndex(idx)  // tambahkan ini
  setForm({ ... })
  setShowForm(true)
}
```

### Update handleSave()
Setelah simpan berhasil, tetap di form dan tampilkan toast:
```jsx
async function handleSave() {
  if (!form.code || !form.name) return
  setIsSaving(true)
  
  try {
    // ... simpan logic ...
    
    // Tidak setShowForm(false) - tetap terbuka
    // Tampilkan toast
    setToastMessage('Data tersimpan')
    setShowToast(true)
  } finally {
    setIsSaving(false)
  }
}
```

### Update handleCloseForm()
```jsx
function handleCloseForm() {
  setShowForm(false)
  setSelectedItem(null)
  setCurrentEditIndex(null)  // reset index
  setForm(DEFAULT_FORM)
}

// Pada click di close button (pojok kiri atas form)
<button type="button" className="master-form-close" onClick={handleCloseForm}>
  <span className="material-icons-round">close</span>
</button>
```

### Update FooterFormMaster call
```jsx
<FooterFormMaster
  onSave={handleSave}
  onClose={handleCloseForm}
  isSaving={isSaving}
  onNext={handleNextRecord}
  onPrev={handlePrevRecord}
  canNext={currentEditIndex !== null && currentEditIndex < sortedData.length - 1}
  canPrev={currentEditIndex !== null && currentEditIndex > 0}
/>
```

## 5. Perubahan Layout Form (Parent Component)

### Close Button di Pojok Kiri Atas
Tambahkan di dalam `{showForm && (...)}` sebelum title:

```jsx
{showForm && (
  <div className="master-form-card">
    <button 
      type="button" 
      className="master-form-close" 
      onClick={handleCloseForm}
    >
      <span className="material-icons-round">close</span>
    </button>
    <div className="master-form-header">
      <span className="material-icons-round master-form-icon">category</span>
      <h2 className="master-form-title">
        {selectedItem ? 'Ubah Data Kategori' : 'Isi Data Kategori'}
      </h2>
    </div>
    {/* ... form fields ... */}
  </div>
)}
```

### CSS (perlu ditambahkan)
```css
.master-form-close {
  position: absolute;
  top: 12px;
  left: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.master-form-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

.master-form-close .material-icons-round {
  font-size: 24px;
  color: #666;
}
```

## 6. Perubahan Button Label

- `onCancel` di FooterFormMaster diganti menjadi `onClose`
- Label default tetap "Close" (bukan "Cancel")

## 7. Urutan Implementasi

1. **Step 1**: Modifikasi `FooterFormMaster.jsx` - tambahkan props navigasi
2. **Step 2**: Modifikasi `Category.jsx` - implementasikan fitur lengkap sebagai contoh
3. **Step 3**: Modifikasi `Satuan.jsx`
4. **Step 4**: Modifikasi `Warehouse.jsx`
5. **Step 5**: Modifikasi `Supplier.jsx`
6. **Step 6**: Modifikasi `Customer.jsx`
7. **Step 7**: Modifikasi `Product.jsx` (complex, perlu hati-hati)
8. **Step 8**: Test dan verifikasi semua master

## 8. Catatan

- Fitur ini hanya aktif saat mode **edit** (ada selectedItem)
- Pada mode **new**, tombol prev/next tetap hidden
- Setelah save berhasil: tetap di form, tidak menutup
- Toast message: "Data tersimpan" (tanpa perlu menutup form)