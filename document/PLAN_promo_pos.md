# PLAN: Integrasi Promo POS

## 1. Promo API Summary

### Endpoint Available
- **GET `/api/promotions`** - List promotions
  - Query params: `is_active`, `type`, `scope`, `search`, `limit`, `offset`
- **GET `/api/promotions/{id}`** - Get promotion detail

### Promotion Model
```
- id, code, name, description
- promotion_type: PERCENTAGE | FIXED_AMOUNT | BUY_X_GET_Y | FLASH_SALE
- scope: ALL | BY_CATEGORY | BY_PRODUCT
- discount_value: number (persentase atau nominal)
- min_purchase_amount: minimal pembelian
- max_discount_amount: maksimal diskon
- buy_quantity, get_quantity: untuk BUY_X_GET_Y
- start_date, start_time, end_date, end_time
- is_active: boolean
- product_ids[], category_ids[]: relasi produk/kategori
```

## 2. Aturan Promo (dari sales_service.go)

**Priority**: Harga Promo > Harga Grosir

Jika produk ada dalam promo aktif:
- Pakai harga promo (SETELAH diskon diterapkan)
- BUKAN harga grosir/price_tier

Validasi waktu promo:
- Cek `start_date` dan `end_date`
- Jika ada `start_time` dan `end_time`, cek jam berlaku

## 3. Implementasi Plan

### 3.1 Buat Promo API Client
Buat file: `src/features/master/promotion/promotion.api.js`

```javascript
// GET /api/promotions?is_active=true
export async function listActivePromotions(token, params)
```

### 3.2 Load & Tampilkan Promo Hari Ini di POS
Di `POS.jsx`:
- Tambahkan state: `activePromos`
- Load promo aktif saat mount component (atau saat products di-load)
- Tampilkan banner/header info promo aktif di atas form POS

### 3.3 Modifikasi Harga Logic
Di `resolveItemUnitPrice()` dan `getItemTierLabel()`:

```javascript
// PRIORITY: promo_price > tier_price > retail_price

const checkPromoForProduct = (productId, categoryId) => {
  // Cek apakah produk ada dalam promo aktif
  // Return { promo, discountValue, promoType }
}

// Di resolveItemUnitPrice:
if (promo) {
  // Apply promo discount
  return applyPromoDiscount(basePrice, promo)
}
return resolveTierPrice(retailPrice, tiers, qty)
```

### 3.4 Tampilkan Label Promo di Item
Di cart/table POS:
- Ganti label "Grosir X" menjadi "PROMO" jika menggunakan harga promo
- Tampilkan info diskon/promo

### 3.5 Kirim Promo Code ke Backend
Di proses checkout:
- Kirim `promotion_code` per item jika menggunakan promo
- Backend akan hitung diskon sesuai rule

## 4. File yang Perlu Dibuat/Modify

### New Files
- `src/features/master/promotion/promotion.api.js` - API client

### Modify Files
- `src/components/POS/POS.jsx` - Integrasi promo display & pricing logic
- Tambahkan state & effect untuk load promo
- Modifikasi `resolveItemUnitPrice()` untuk cek promo
- Tampilkan info promo di header/UI

## 5. Priority Implementasi

1. **Tahap 1**: Load & Tampilkan Promo Aktif
   - Fetch `/api/promotions?is_active=true&start_date=hari_ini&end_date=hari_ini`
   - Tampilkan banner promo hari ini

2. **Tahap 2**: Modifikasi Pricing
   - Cek promo sebelum tier price
   - Apply diskon promo ke harga

3. **Tahap 3**: Checkout Integration
   - Kirim promo_code ke backend

## 6. Catatan

- Backend sudahhandle promo calculation di `sales_service.go`
- Frontend perlu: (1) Tampilkan info promo, (2) Gunakan harga promo saat hitung total
- Rule: "jika ada penjualan di promo aktif maka yang berlaku harga promo bukan harga grosir" SUDAH DIIMPLEMENTASI di backend
- Frontend tanggung jawab: tampilkan & gunakan harga promo (BUKAN harga tier) saat ada promo aktif