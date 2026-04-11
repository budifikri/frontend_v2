# PLAN Promotion Menu

## Overview
Membuat menu Promotion untuk-admin dashboard di menu Transaksi.

## API Endpoints
- `GET /api/promotions` - List all promotions
- `POST /api/promotions` - Create new promotion
- `GET /api/promotions/{id}` - Get promotion by ID
- `PUT /api/promotions/{id}` - Update promotion
- `DELETE /api/promotions/{id}` - Delete (deactivate) promotion

## Table Columns
| Key | Label | Jenis |
|-----|-------|-------|
| code | KODE | string |
| name | NAMA | string |
| type | TIPE | enum |
| scope | SCOPE | string |
| discount_value | DISKON | number |
| min_purchase | MIN BELI | number |
| start_date | MULAI | datetime |
| end_date | AKHIR | datetime |
| is_active | STATUS | boolean |

## Form Fields
- **code**: string (Required, unique)
- **name**: string (Required)
- **promo_type**: enum (Required)
  - Discount Percentage
  - Discount Fixed Amount
  - Buy X Get Y Free
  - Flash Sale
- **scope_type**: enum
  - All Products
  - By Category
  - By Product
- **category_ids**: array (if scope=category)
- **product_ids**: array (if scope=product)
- **discount_value**: number (Required, > 0)
- **buy_quantity**: number (for Buy X Get Y Free)
- **get_quantity**: number (for Buy X Get Y Free)
- **min_purchase_amount**: number (>= 0)
- **start_date**: datetime (Required)
- **end_date**: datetime (Required >= start)
- **description**: string (Optional)
- **is_active**: boolean (default: true)

## Files to Create
1. `src/features/master/promotion/promotion.api.js` - API layer
2. `src/components/ToolbarItem/transaksi/Promotion.jsx` - Component

## Files to Update
1. `src/data/toolbarItems.js` - Add promotion to transaksi menu
2. `src/components/Dashboard/DashboardCanvas.jsx` - Import & render
3. `src/App.jsx` - Add 'promotion' to IMPLEMENTED_TOOLS

## Validation Rules
- Tidak bisa ada 2 promo aktif dengan waktu yang sama (overlap)
- Buy X Get Y Free: product gratis bisa sama atau berbeda
- Tanggal format: DD/MM/YYYY