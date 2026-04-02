# PLAN: Update Stock Opname - Full Replace Workflow (Option 1)

**Date:** 6 March 2026  
**Module:** Stock Opname - Update Operation  
**Status:** Planned  
**Priority:** High  

---

## 1. Overview

### 1.1 Purpose
Implement **Full Replace** workflow untuk update Stock Opname yang melibatkan 2 tabel (`stock_opname` header dan `stock_opname_items`). Pendekatan ini memastikan data selalu konsisten dan sinkron antara frontend dan backend.

### 1.2 Business Context
Stock Opname adalah transaksi kritis yang memerlukan:
- **Data consistency** - Header dan items harus selalu sinkron
- **Atomicity** - Semua perubahan berhasil atau semua gagal
- **Idempotency** - Bisa dipanggil berulang kali dengan hasil sama
- **Audit trail** - Track perubahan dengan jelas

### 1.3 Selected Approach: Full Replace (Option 1)

**Alasan Pemilihan:**
- ✅ Sinkronisasi penuh (items yang dihapus di frontend juga terhapus di DB)
- ✅ Simple logic dan easy to maintain
- ✅ Data selalu konsisten
- ✅ Idempotent operation
- ✅ Cocok dengan current frontend design
- ✅ Transaction memastikan atomicity

**Trade-offs:**
- ⚠️ DELETE + INSERT ulang untuk items yang tidak berubah (less efficient)
- ⚠️ Performance impact untuk > 100 items (acceptable untuk use case ini)

---

## 2. API Specification

### 2.1 Endpoint

```
PUT /api/stock-opname/{id}
```

**Authentication:** Bearer Token Required  
**Authorization:** User dengan permission `stock_opname.update`

---

### 2.2 Request

**Path Parameters:**
```json
{
  "id": "uuid"
}
```

**Request Body:**
```json
{
  "warehouse_id": "uuid",
  "opname_date": "2026-03-06",
  "status": "draft",
  "notes": "Updated notes",
  "items": [
    {
      "id": "existing-item-uuid",
      "product_id": "uuid",
      "system_quantity": 15,
      "actual_quantity": 10,
      "difference": -5,
      "status": "pending",
      "notes": "Reason for variance"
    },
    {
      "id": "",
      "product_id": "uuid",
      "system_quantity": 20,
      "actual_quantity": 20,
      "difference": 0,
      "status": "pending",
      "notes": ""
    }
  ]
}
```

---

### 2.3 Response

**Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "33f2078b-b008-4e7b-a7e9-9498b01e9f48",
    "opname_number": "OPN-20260306-006",
    "warehouse_id": "7faf63da-41f0-465e-ad68-48d40b6a135f",
    "warehouse": {
      "id": "7faf63da-41f0-465e-ad68-48d40b6a135f",
      "code": "WH2-20260305T07203",
      "name": "Second Warehouse 20260305T07203"
    },
    "user_id": "583e3b50-e159-43bf-bd8d-e91b79975a0a",
    "opname_date": "2026-03-06T07:00:00+07:00",
    "status": "draft",
    "notes": "Updated notes",
    "updated_at": "2026-03-06T14:30:00+07:00",
    "items": [
      {
        "id": "dff466a9-9261-4207-b5cc-fda63110c6fb",
        "product_id": "3708c1e7-5f0e-4d24-870a-78eb01e0f036",
        "product_sku": "PROD-20260304T06254",
        "product_name": "Test Product 20260304T06254",
        "product_unit_name": "KiloGram",
        "system_quantity": 15,
        "actual_quantity": 10,
        "difference": -5,
        "status": "pending",
        "notes": "Damaged goods"
      }
    ],
    "summary": {
      "total_items": 1,
      "variance_positive": 0,
      "variance_negative": 1,
      "variance_zero": 0
    }
  },
  "message": "Stock opname updated successfully"
}
```

---

## 3. Backend Implementation

### 3.1 File Structure

```
go_backend/
├── internal/
│   ├── handler/
│   │   └── stock_opname_handler.go
│   ├── service/
│   │   └── stock_opname_service.go
│   ├── repository/
│   │   └── stock_opname_repository.go
│   └── dto/
│       └── stock_opname_dto.go
└── routes/
    └── stock_opname_routes.go
```

### 3.2 DTO Definitions

**File:** `internal/dto/stock_opname_dto.go`

```go
package dto

import "time"

type UpdateStockOpnameRequest struct {
    WarehouseID  string                      `json:"warehouse_id" validate:"required,uuid"`
    OpnameDate   string                      `json:"opname_date" validate:"required,date"`
    Status       string                      `json:"status" validate:"required,oneof=draft approved posted rejected"`
    Notes        string                      `json:"notes"`
    Items        []UpdateStockOpnameItemRequest `json:"items" validate:"required,gt=0"`
}

type UpdateStockOpnameItemRequest struct {
    ID               string  `json:"id"`
    ProductID        string  `json:"product_id" validate:"required,uuid"`
    SystemQuantity   float64 `json:"system_quantity" validate:"required,gte=0"`
    ActualQuantity   float64 `json:"actual_quantity" validate:"required,gte=0"`
    Difference       float64 `json:"difference"`
    Status           string  `json:"status" validate:"required,oneof=pending approved rejected"`
    Notes            string  `json:"notes"`
}

type StockOpnameResponse struct {
    ID           string                    `json:"id"`
    OpnameNumber string                    `json:"opname_number"`
    WarehouseID  string                    `json:"warehouse_id"`
    Warehouse    WarehouseInfo             `json:"warehouse"`
    UserID       string                    `json:"user_id"`
    User         UserInfo                  `json:"user"`
    OpnameDate   time.Time                 `json:"opname_date"`
    Status       string                    `json:"status"`
    Notes        string                    `json:"notes"`
    CreatedAt    time.Time                 `json:"created_at"`
    UpdatedAt    time.Time                 `json:"updated_at"`
    Items        []StockOpnameItemResponse `json:"items"`
    Summary      OpnameSummary             `json:"summary"`
}

type StockOpnameItemResponse struct {
    ID              string  `json:"id"`
    ProductID       string  `json:"product_id"`
    ProductSku      string  `json:"product_sku"`
    ProductName     string  `json:"product_name"`
    ProductUnitName string  `json:"product_unit_name"`
    SystemQuantity  float64 `json:"system_quantity"`
    ActualQuantity  float64 `json:"actual_quantity"`
    Difference      float64 `json:"difference"`
    Status          string  `json:"status"`
    Notes           string  `json:"notes"`
}

type OpnameSummary struct {
    TotalItems       int `json:"total_items"`
    VariancePositive int `json:"variance_positive"`
    VarianceNegative int `json:"variance_negative"`
    VarianceZero     int `json:"variance_zero"`
}
```

### 3.3 Service Layer

**File:** `internal/service/stock_opname_service.go`

```go
package service

import (
    "errors"
    "fmt"
    "time"
    "go_backend/internal/dto"
    "go_backend/internal/model"
    "gorm.io/gorm"
)

type StockOpnameService struct {
    repo *repository.StockOpnameRepository
    db   *gorm.DB
}

func (s *StockOpnameService) UpdateStockOpname(id string, req dto.UpdateStockOpnameRequest) (*dto.StockOpnameResponse, error) {
    tx := s.db.Begin()
    defer func() {
        if r := recover(); r != nil {
            tx.Rollback()
        }
    }()

    // 1. Check existence
    var existingOpname model.StockOpname
    if err := tx.First(&existingOpname, "id = ?", id).Error; err != nil {
        tx.Rollback()
        return nil, fmt.Errorf("stock opname not found")
    }

    // 2. Validate status
    if existingOpname.Status == "posted" || existingOpname.Status == "rejected" {
        tx.Rollback()
        return nil, fmt.Errorf("cannot update stock opname with status '%s'", existingOpname.Status)
    }

    // 3. Update header
    updateHeader := map[string]interface{}{
        "warehouse_id": req.WarehouseID,
        "opname_date":  req.OpnameDate,
        "status":       req.Status,
        "notes":        req.Notes,
        "updated_at":   time.Now(),
    }
    if err := tx.Model(&model.StockOpname{}).Where("id = ?", id).Updates(updateHeader).Error; err != nil {
        tx.Rollback()
        return nil, fmt.Errorf("failed to update header: %w", err)
    }

    // 4. Get existing items
    var existingItems []model.StockOpnameItem
    if err := tx.Where("opname_id = ?", id).Find(&existingItems).Error; err != nil {
        tx.Rollback()
        return nil, fmt.Errorf("failed to get existing items: %w", err)
    }

    existingItemIDs := make(map[string]bool)
    for _, item := range existingItems {
        existingItemIDs[item.ID] = true
    }

    requestedItemIDs := make(map[string]bool)

    // 5. Process items
    for _, itemReq := range req.Items {
        requestedItemIDs[itemReq.ID] = true
        difference := itemReq.Difference
        if difference == 0 {
            difference = itemReq.ActualQuantity - itemReq.SystemQuantity
        }

        if itemReq.ID != "" {
            // UPDATE
            if !existingItemIDs[itemReq.ID] {
                tx.Rollback()
                return nil, fmt.Errorf("item ID %s does not exist", itemReq.ID)
            }
            updateItem := map[string]interface{}{
                "actual_quantity": itemReq.ActualQuantity,
                "difference":      difference,
                "status":          itemReq.Status,
                "notes":           itemReq.Notes,
                "updated_at":      time.Now(),
            }
            if err := tx.Model(&model.StockOpnameItem{}).Where("id = ?", itemReq.ID).Updates(updateItem).Error; err != nil {
                tx.Rollback()
                return nil, fmt.Errorf("failed to update item %s: %w", itemReq.ID, err)
            }
        } else {
            // CREATE
            newItem := model.StockOpnameItem{
                ID:              generateUUID(),
                OpnameID:        id,
                ProductID:       itemReq.ProductID,
                SystemQuantity:  itemReq.SystemQuantity,
                ActualQuantity:  itemReq.ActualQuantity,
                Difference:      difference,
                Status:          itemReq.Status,
                Notes:           itemReq.Notes,
                CreatedAt:       time.Now(),
                UpdatedAt:       time.Now(),
            }
            if err := tx.Create(&newItem).Error; err != nil {
                tx.Rollback()
                return nil, fmt.Errorf("failed to create new item: %w", err)
            }
        }
    }

    // 6. DELETE items not in request
    for existingID := range existingItemIDs {
        if !requestedItemIDs[existingID] {
            if err := tx.Where("id = ?", existingID).Delete(&model.StockOpnameItem{}).Error; err != nil {
                tx.Rollback()
                return nil, fmt.Errorf("failed to delete item %s: %w", existingID, err)
            }
        }
    }

    // 7. Commit
    if err := tx.Commit().Error; err != nil {
        return nil, fmt.Errorf("failed to commit transaction: %w", err)
    }

    return s.GetByID(id)
}
```

### 3.4 Handler Layer

**File:** `internal/handler/stock_opname_handler.go`

```go
func (h *StockOpnameHandler) UpdateStockOpname(c *fiber.Ctx) error {
    id := c.Params("id")
    var req dto.UpdateStockOpnameRequest
    if err := c.BodyParser(&req); err != nil {
        return response.Error(c, fiber.StatusBadRequest, "Invalid payload", err.Error())
    }
    if err := validateUpdateRequest(req); err != nil {
        return response.Error(c, fiber.StatusBadRequest, "Validation failed", err.Error())
    }
    result, err := h.service.UpdateStockOpname(id, req)
    if err != nil {
        if err.Error() == "stock opname not found" {
            return response.Error(c, fiber.StatusNotFound, err.Error(), nil)
        }
        if err.Error()[:17] == "cannot update stock" {
            return response.Error(c, fiber.StatusForbidden, err.Error(), nil)
        }
        return response.Error(c, fiber.StatusInternalServerError, "Failed to update stock opname", err.Error())
    }
    return response.Success(c, fiber.StatusOK, "Stock opname updated successfully", result)
}
```

### 3.5 Routes

**File:** `routes/stock_opname_routes.go`

```go
stockOpnameAPI.Put("/:id", handler.UpdateStockOpname)
```

---

## 4. Frontend Implementation

### 4.1 Update API Function

**File:** `src/features/master/stock-opname/stockOpname.api.js`

```javascript
export async function updateStockOpname(token, id, input) {
  const url = `/api/stock-opname/${encodeURIComponent(id)}`
  
  const payload = {
    warehouse_id: input.warehouse_id,
    opname_date: input.opname_date,
    status: input.status,
    notes: input.notes || '',
    items: input.items.map(item => ({
      id: item.id || '',
      product_id: item.product_id,
      system_quantity: item.system_quantity,
      actual_quantity: item.actual_quantity,
      difference: item.difference,
      status: item.status || 'pending',
      notes: item.reason || item.notes || '',
    })),
  }

  const raw = await apiFetch(url, {
    method: 'PUT',
    token,
    body: payload,
  })
  
  if (!raw.success) {
    throw new Error(raw.error || raw.message || 'Failed to update stock opname')
  }
  
  return raw
}
```

### 4.2 Component Save Handler

**File:** `src/components/ToolbarItem/master/StockOpnameDetail.jsx`

```javascript
const handleSave = async () => {
  const { isValid, errors } = validate()
  if (!isValid) {
    setError(errors.join(', '))
    return
  }

  setIsSaving(true)
  setError('')

  const payload = {
    opname_number: header.opname_number,
    warehouse_id: header.warehouse_id,
    opname_date: header.opname_date,
    status: header.status,
    notes: header.notes,
    items: items.map((item) => ({
      id: item.id || '',
      product_id: item.product_id,
      system_quantity: item.system_quantity,
      actual_quantity: item.actual_quantity,
      difference: item.difference,
      status: item.status || 'pending',
      notes: item.reason || item.notes,
    })),
  }

  try {
    if (propSelectedId) {
      await updateStockOpname(token, propSelectedId, payload)
    } else {
      await createStockOpname(token, payload)
    }
    onExit()
  } catch (err) {
    setError(err.message || 'Failed to save stock opname')
  } finally {
    setIsSaving(false)
  }
}
```

---

## 5. Database Schema

```sql
CREATE TABLE stock_opname (
    id UUID PRIMARY KEY,
    opname_number VARCHAR(50) UNIQUE,
    warehouse_id UUID REFERENCES warehouses(id),
    user_id UUID REFERENCES users(id),
    opname_date TIMESTAMP,
    status VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE stock_opname_items (
    id UUID PRIMARY KEY,
    opname_id UUID REFERENCES stock_opname(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    system_quantity DECIMAL(15,2),
    actual_quantity DECIMAL(15,2),
    difference DECIMAL(15,2),
    status VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_stock_opname_items_opname_id ON stock_opname_items(opname_id);
```

---

## 6. Workflow Diagram

```
BEGIN TRANSACTION
  ↓
UPDATE stock_opname (header) WHERE id = {id}
  ↓
SELECT * FROM stock_opname_items WHERE opname_id = {id}
  ↓
FOR EACH item IN request:
  IF item.id EXISTS → UPDATE
  ELSE → INSERT
  ↓
DELETE FROM stock_opname_items 
  WHERE opname_id = {id} AND id NOT IN (request IDs)
  ↓
COMMIT TRANSACTION
  ↓
Return updated data
```

---

## 7. Testing Checklist

### Backend
- [ ] Update header only
- [ ] Update existing item
- [ ] Add new item
- [ ] Remove item
- [ ] Update with empty items
- [ ] Update non-existent ID (404)
- [ ] Update posted opname (403)
- [ ] Transaction rollback on error

### Frontend
- [ ] Save button calls update API
- [ ] Form validation before submit
- [ ] Error display on failure
- [ ] Loading state during save
- [ ] Success navigation to list

---

## 8. Migration Plan

**Phase 1: Backend (2-3 days)**
- Create DTOs
- Create Service layer
- Update Handler
- Add Routes
- Unit tests

**Phase 2: Frontend (1 day)**
- Update API function
- Update save handler
- Integration test

**Phase 3: Testing (1-2 days)**
- Integration tests
- UAT
- Performance test

**Phase 4: Production (1 day)**
- Deploy backend
- Deploy frontend
- Monitor

---

**Document Version:** 1.0  
**Last Updated:** 6 March 2026  
**Status:** Ready for Implementation
