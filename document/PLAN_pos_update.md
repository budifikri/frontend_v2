# PLAN: Update Rule Simpan Sale Items di Backend

## Tujuan
Update penyimpanan di table `sale_items` dengan rule:
- **unit_price**: harga yang dibayar customer
- **original_price**: harga retail normal  
- **discount_amount**: jumlah diskon per unit
- **notes**: info sumber diskon (jika ada)

## Rule Penyimpanan

### A. Harga Normal (tidak ada tier, tidak ada promo)
```
unit_price: harga retail
original_price: harga retail
discount_amount: 0
notes: ""
```

### B. Harga Grosir (ada tier price)
```
unit_price: harga grosir
original_price: harga retail
discount_amount: harga retail - harga grosir
notes: "Grosir {min_quantity}" contoh: "Grosir 10"
```

### C. Harga Promo (ada promo aktif)
```
unit_price: harga promo (setelah diskon)
original_price: harga retail
discount_amount: harga retail - harga promo
notes: "{kode} - {nama}" contoh: "FLASH01 - Flash Sale Merdeka"
```

## File yang Dimodifikasi
1. `go_backend/internal/services/sales_service.go`
   - Update struct ProcessedSaleItem - tambah field Notes
   - Update promotionRow struct - tambah Code, Name
   - Update logic calculation
   - Simpan Notes ke SaleItem

## Status: ✅ Selesai

## Verifikasi

| Kondisi | unit_price | original_price | discount_amount | notes |
|---------|-----------|-------------|---------------|-------|
| Normal | 10000 | 10000 | 0 | "" |
| Grosir | 8000 | 10000 | 2000 | "Grosir 10" |
| Promo | 7000 | 10000 | 3000 | "FLASH01 - Flash Sale" |