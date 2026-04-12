# PLAN Promotion Menu

## Overview
Membuat menu Promotion untuk-admin dashboard di menu Transaksi.

## API Endpoints (Backend)
- `GET /api/promotions` - List all promotions
- `POST /api/promotions` - Create new promotion
- `GET /api/promotions/{id}` - Get promotion by ID
- `PUT /api/promotions/{id}` - Update promotion
- `DELETE /api/promotions/{id}` - Delete (deactivate) promotion

## Frontend Table Columns
| Key | Label | Jenis |
|-----|-------|-------|
| code | KODE | string |
| name | NAMA | string |
| promo_type | TIPE | enum |
| scope_type | SCOPE | enum |
| discount_value | DISKON | number |
| start_date | MULAI | datetime |
| end_date | AKHIR | datetime |
| is_active | STATUS | boolean |

## Frontend Form Fields
- **code**: string (AUTO GENERATE based on promo_type)
- **name**: string (Required)
- **promo_type**: enum (percentage, fixed_amount, buy_x_get_y, flash_sale)
- **scope_type**: enum (all, by_category, by_product)
- **category_ids**: array (by_category only)
- **product_ids**: array (by_product only)
- **discount_value**: number (percentage/fixed_amount/flash_sale)
- **buy_quantity**: number (buy_x_get_y only)
- **get_quantity**: number (buy_x_get_y only)
- **start_date**: datetime (Required)
- **end_date**: datetime (Required >= start)
- **start_time**: time (flash_sale only)
- **end_time**: time (flash_sale only)
- **description**: string (Optional)
- **is_active**: boolean (default: true)

## Backend Fields Comparison
| Frontend Field | Backend Field | Status |
|----------------|---------------|--------|
| promo_type: percentage | promotion_type: PERCENTAGE | ✅ |
| promo_type: fixed_amount | promotion_type: FIXED_AMOUNT | ✅ |
| promo_type: buy_x_get_y | promotion_type: BUY_X_GET_Y | ❌ Perlu tambah |
| promo_type: flash_sale | promotion_type: FLASH_SALE | ❌ Perlu tambah |
| scope_type: all | scope: ALL | ✅ |
| scope_type: by_category | scope: BY_CATEGORY | ❌ Perlu normalize |
| scope_type: by_product | scope: BY_PRODUCT | ❌ Perlu normalize |
| buy_quantity | buy_quantity | ❌ Perlu tambah |
| get_quantity | get_quantity | ❌ Perlu tambah |
| start_time | start_time | ❌ Perlu tambah |
| end_time | end_time | ❌ Perlu butuh |

## Backend Changes Needed (go_backend)

### 1. internal/models/promotion.go
- Tambahkan field baru: `buy_quantity`, `get_quantity`, `start_time`, `end_time`
- Update enum untuk `promotion_type`: tambah `BUY_X_GET_Y`, `FLASH_SALE`
- Update enum untuk `scope`: support `BY_CATEGORY`, `BY_PRODUCT`

### 2. internal/repository/promotion_repository.go
- Update query untuk time fields
- Update filter scope dengan prefix "BY_"

### 3. internal/services/promotion_service.go
- Update logic untuk BUY_X_GET_Y type
- Update logic untuk FLASH_SALE (start_time/end_time validation)
- Handle buy_quantity/get_quantity

### 4. internal/handlers/promotion_handler.go
- Accept field baru di request body

### 5. internal/services/sales_service.go
- Update apply promotion logic untuk BUY_X_GET_Y dan FLASH_SALE

## Frontend Files Created ✅
1. `src/features/master/promotion/promotion.api.js` - API layer
2. `src/components/ToolbarItem/transaksi/Promotion.jsx` - Component

## Frontend Files Updated ✅
1. `src/data/toolbarItems.js` - Add promotion to transaksi menu
2. `src/components/Dashboard/DashboardCanvas.jsx` - Import & render
3. `src/App.jsx` - Add 'promotion' to IMPLEMENTED_TOOLS

## Auto Code Generation
Kode di-generate otomatis berdasarkan tipe promotion:

| Tipe Promotion | Prefix | Contoh |
|----------------|--------|---------|
| Percentage | DP | DP00001 |
| Fixed Amount | DA | DA00001 |
| Buy X Get Y | BG | BG00001 |
| Flash Sale | FL | FL00001 |

Format: `{PREFIX}{SEQUENCE_5_DIGIT}`

## Validation Rules
- Tidak bisa ada 2 promo aktif dengan waktu yang sama (overlap)
- Buy X Get Y Free: product gratis bisa sama atau berbeda
- Tanggal format: DD/MM/YYYY