# Plan: Price Tiers (Harga Grosir)

## Overview
Fitur Harga Grosir memungkinkan user untuk menyimpan hingga 3 level harga grosir untuk setiap product.

## Data Structure

### Price Tier Model
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| product_id | UUID | Foreign key ke products |
| tier_name | string | Nama tier (e.g., "Grosir 1") |
| min_quantity | int | Minimum qty untuk dapat harga grosir |
| unit_price | decimal | Harga per unit |
| is_active | boolean | Status aktif |
| created_at | timestamp | Tanggal created |
| updated_at | timestamp | Tanggal updated |

### Frontend State
```javascript
const DEFAULT_PRICE_TIER = [
  { tier_name: 'Grosir 1', min_quantity: 1, unit_price: 0 },
  { tier_name: 'Grosir 2', min_quantity: 1, unit_price: 0 },
  { tier_name: 'Grosir 3', min_quantity: 1, unit_price: 0 },
]
```

## Workflow

### 1. Load Price Tier (Edit Product)

```
User klik Edit Product
        │
        ▼
handleEdit() dipanggil
        │
        ▼
loadPriceTierData(productId) dipanggil
        │
        ▼
GET /api/price-tiers/product/{product_id}
        │
        ├── Response 200 OK ──────────────┐
        │   └── Parse tiers array         │
        │       └── setPriceTierData()    │
        │                                 │
        └── Response 404 Not Found ───────┘
            └── setPriceTierData(DEFAULT_PRICE_TIER)
```

**Endpoint:**
- Method: `GET`
- URL: `/api/price-tiers/product/{product_id}`
- Response: `{ data: [{tier_name, min_quantity, unit_price}, ...] }`

### 2. Save Price Tier (Simpan Product)

```
User klik tombol "Simpan"
        │
        ▼
handleSave() dipanggil
        │
        ▼
Simpan data product (PUT /api/products/{id})
        │
        ▼
Filter tiers dengan unit_price > 0
        │
        ├── Empty array ─────────────────────┐
        │   └── Skip save price tier         │
        │                                    │
        └── Array dengan data ───────────────┘
            │
            ▼
        Cek apakah price tier exists?
        │
        ├── GET /api/price-tiers/product/{product_id}
        │       │
        │       ├── Response 200 OK ───────────────────────────┐
        │       │   └── PUT /api/price-tiers/product/{id}     │
        │       │       (Update existing - full replace)     │
        │       │                                              │
        │       └── Response 404 ─────────────────────────────┘
        │           └── POST /api/price-tiers
        │               (Create new)
        │
        ▼
Simpan berhasil
```

**Detail Update Flow:**

```
1. CEK EXISTS
   GET /api/price-tiers/product/{product_id}
   
   Response 200 OK → Price tier EXISTS → UPDATE
   Response 404    → Price tier NOT EXISTS → CREATE
   
2. UPDATE (jika exists)
   PUT /api/price-tiers/product/{product_id}
   
   Request Body: Array tiers (full replace)
   ```json
   [
     { "tier_name": "Grosir 1", "min_quantity": 1, "unit_price": 5000 },
     { "tier_name": "Grosir 2", "min_quantity": 5, "unit_price": 4500 }
   ]
   ```
   
3. CREATE (jika not exists)
   POST /api/price-tiers
   
   Request Body: Object dengan product_id dan tiers array
   ```json
   {
     "product_id": "uuid",
     "tiers": [
       { "tier_name": "Grosir 1", "min_quantity": 1, "unit_price": 5000 },
       { "tier_name": "Grosir 2", "min_quantity": 5, "unit_price": 4500 }
     ]
   }
   ```
   
   Note: Payload CREATE berbeda dengan UPDATE
   - CREATE: perlu `product_id` di root object
   - UPDATE: array langsung tanpa wrapper
```

## UI Structure

### Tab Layout
```
┌─────────────────────────────────────────────────────┐
│ [Icon] Ubah Data Product      [General] [Adjust Stock] [Harga Grosir] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Tab: Harga Grosir                                  │
│  ┌──────────────────────────────────────────────┐   │
│  │ SKU          : [readonly - SKU product]       │   │
│  │ Nama Product : [readonly - Nama product]     │   │
│  │                                                      │
│  │ Grosir 1    : [Harga__________] / [Qty____] │   │
│  │ Grosir 2    : [Harga__________] / [Qty____] │   │
│  │ Grosir 3    : [Harga__________] / [Qty____] │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│              [ Simpan ]  [ Batal ]                  │
└─────────────────────────────────────────────────────┘
```

## Business Rules

1. **Unit Price = 0** tidak dikirim ke backend (difilter)
2. **Tabs Adjust Stock & Harga Grosir** hanya muncul saat **edit product** (selectedItem exists)
3. **Tombol Simpan/Batal** muncul di semua tabs
4. **Save dilakukan bersamaan** dengan save product (1 klik)

## File Changes

### Frontend
| File | Changes |
|------|---------|
| `src/features/master/price-tier/priceTier.api.js` | API functions |
| `src/components/ToolbarItem/master/Product.jsx` | Tab UI, state, load/save logic |
| `src/App.css` | Tab styling, price-qty-row |

### Backend (Required)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/price-tiers/product/{product_id}` | GET | Get price tiers by product |
| `/api/price-tiers` | POST | Create price tier |
| `/api/price-tiers/product/{product_id}` | PUT | Update price tier |

## Error Handling

| Scenario | Handling |
|----------|----------|
| GET 404 | Use default values (no price tiers) |
| POST error | Log error, continue with product save |
| PUT error | Log error, continue |
| Network error | Show error message |
