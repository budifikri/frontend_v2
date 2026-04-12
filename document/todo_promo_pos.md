# TODO: Integrasi Promo POS

## Progress: [x] Selesai

---

## Todo List

### Phase 1: Promo API Client
- [x] 1.1 Buat file `src/features/master/promotion/promotion.api.js`
  - Fungsi `listPromotions(token, params)` - GET /api/promotions
  - Fungsi `getPromotionById(token, id)` - GET /api/promotions/{id}

### Phase 2: Load & Display Promo di POS
- [x] 2.1 Tambahkan state `activePromos` dan `promoCacheRef` di POS.jsx
- [x] 2.2 Tambahkan effect untuk load promo aktif saat mount
- [x] 2.3 Buat komponen PromoBanner untuk tampilkan promo hari ini
- [x] 2.4 Render PromoBanner di header POS

### Phase 3: Promo Pricing Logic
- [x] 3.1 Buat fungsi `checkPromoForProduct(productId, categoryId)` di POS.jsx
  - Return Objek promo jika produk ada dalam promo aktif
  - Return null jika tidak ada promo
- [x] 3.2 Modifikasi fungsi `resolveItemUnitPrice(retailPrice, tiers, qty, productId, categoryId)`
  - Cek promo terlebih dahulu SEBELUM cek tier
  - Apply promo discount jika promo aktif
  - Return harga setelah diskon
- [x] 3.3 Update label promo di `getItemTierLabel(item)`
  - Jika pakai promo → tampilkan "PROMO" bukan "Grosir X"

### Phase 4: Checkout Integration  
- [x] 4.1 Update payload sale di proses checkout
  - Kirim `promotion_code` per item jika menggunakan promo
- [x] 4.2 Tampilkan info promo di receipt (via getItemTierLabel sudah show "PROMO")

---

## Estimasi Progress

| Phase | Deskripsi | Status |
|-------|----------|--------|
| 1 | Promo API Client | [x] Selesai |
| 2 | Load & Display Promo | [x] Selesai |
| 3 | Promo Pricing Logic | [x] Selesai |
| 4 | Checkout Integration | [x] Selesai |

---

## Catatan

- Priority: Promo > Grosir
- Backend sudah handle promo calculation
- Frontend perlu: tampikan promo & gunakan harga promo (bukan tier) saat ada promo aktif
- Phase 4 perlu review lebih lanjut karena backend sudah otomatis handle promo di checkout

## Files Modified

1. `src/components/POS/POS.jsx`
   - Import `listPromotions`
   - State `activePromos`, `promoCacheRef`
   - Effect load promo saat mount
   - Fungsi `checkPromoForProduct`, `applyPromoDiscount`
   - Modifikasi `resolveItemUnitPrice`
   - Modifikasi `getItemTierLabel`
   - Promo Banner UI

2. `src/components/POS/POS.css`
   - CSS untuk `.promo-banner`