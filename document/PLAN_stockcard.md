# PLAN: Stock Card Popup (Kartu Stok)

## Tujuan
Menambahkan fitur tombol "Kartu Stok" (Stock Card) di halaman Laporan Stok. Saat diklik, akan menampilkan popup modal yang menampilkan riwayat stok produk berdasarkan `product_id` dan `warehouse_id`.

---

## Referensi API

### Endpoint Stock Card
```
GET /api/inventory/stock-card?product_id=&warehouse_id=
```

Query parameters:
- `product_id` (string, required) - ID produk
- `warehouse_id` (string, optional) - ID warehouse

Response (contoh):
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "reference": "PO-001",
      "type": "IN",
      "qty_in": 100,
      "qty_out": 0,
      "balance": 100,
      "note": "Pembelian"
    }
  ]
}
```

---

## Scope Implementasi

### In Scope
1. Tambahkan fungsi `onStockCard` di `LapStock.jsx`
2. Buat API function `getStockCard(token, params)` di `stock.api.js`
3. Tambahkan state untuk modal stock card (`showStockCardModal`, `stockCardData`, `selectedProduct`)
4. Buat komponen popup modal `StockCardModal.jsx`
5. Integrasi button Stock Card di footer laporan stok

### Out of Scope
- Export stock card ke PDF/Excel
- Filter tanggal di stock card (nanti phase berikutnya)

---

## Arsitektur File

### File baru
1. `src/components/ToolbarItem/laporan/stok/StockCardModal.jsx`
   - Component modal popup untuk menampilkan stock card
   - Props: `isOpen`, `onClose`, `data`, `productName`, `isLoading`, `error`

### File update
1. `src/features/laporan/stock/stock.api.js`
   - Tambahkan function `getStockCard(token, params)`

2. `src/components/ToolbarItem/laporan/stok/LapStock.jsx`
   - Import `StockCardModal`
   - Tambahkan state: `showStockCardModal`, `stockCardData`, `selectedId`, `isLoadingCard`
   - Implementasi `handleStockCard` function
   - Row selection (default index 0)
   - Render `<StockCardModal />` di bawah

---

## Logic & Workflow

### 1. Row Selection
- State: `selectedId` (default null)
- Setelah data loaded, otomatis select row index 0
- Klik row untuk mengubah selection

### 2. Saat tombol Stock Card diklik
- Ambil `product_id` dan `warehouse_id` dari row yang dipilih
- Set `showStockCardModal = true`
- Fetch data dari `GET /api/inventory/stock-card`

### 3. Jika user belum login (tanpa token)
- Tampilkan dummy data stock card untuk mode dev

### 4. Loading state
- Tampilkan spinner/loading saat fetch stock card

### 5. Error handling
- Jika API gagal, tampilkan pesan error di dalam modal

---

## Mapping Field API ke UI

| API Field | UI Column |
|-----------|-----------|
| date | Tanggal |
| reference | Referensi |
| type | Jenis |
| qty_in / quantity_in | Masuk |
| qty_out / quantity_out | Keluar |
| balance / saldo | Saldo |
| note / description | Keterangan |

---

## Style Modal

Menggunakan pola yang sudah ada di codebase:
- Overlay: `.delete-master-overlay`
- Modal container: `.stock-card-modal`
- Header: dengan icon dan title
- Table: sama dengan table di laporan stok
- Footer: tombol TUTUP

---

## Acceptance Criteria

1. Row pertama otomatis terseleksi saat data loaded (index 0)
2. Klik row lain mengubah selection
3. Tombol Stock Card memanggil API dengan product_id & warehouse_id yang dipilih
4. Modal popup menampilkan stock card data
5. Loading state ditampilkan saat fetch data
6. Error handling jika API gagal
7. Lint dan build lolos

---

## Test Checklist

1. Klik tombol Stock Card di footer laporan stok
2. Verifikasi modal terbuka dengan judul yang benar
3. Verifikasi data stock card ditampilkan
4. Klik TUTUP untuk menutup modal
5. Verifikasi tidak ada console error
