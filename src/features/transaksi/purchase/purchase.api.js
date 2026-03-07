import { apiFetch } from '../../../shared/http'

const DUMMY_SUPPLIERS = [
  { id: 'SUP001', name: 'PT. Supplier Utama', code: 'SUP-001' },
  { id: 'SUP002', name: 'CV. Berkah Jaya', code: 'SUP-002' },
  { id: 'SUP003', name: 'UD. Makmur Sentosa', code: 'SUP-003' },
]

const DUMMY_PURCHASES = [
  {
    id: 'PO001',
    po_number: 'PO-20260307-001',
    supplier_id: 'SUP001',
    supplier_name: 'PT. Supplier Utama',
    warehouse_id: 'WH001',
    warehouse_name: 'Gudang Utama',
    status: 'draft',
    po_date: '2026-03-07',
    expected_date: '2026-03-14',
    notes: 'First purchase order',
    subtotal: 1000000,
    discount_total: 0,
    tax_total: 110000,
    grand_total: 1110000,
    created_at: '2026-03-07T10:00:00Z',
    items: [
      {
        id: 'item-001',
        product_id: 'PRD001',
        product_name: 'Kopi Luwak',
        sku: 'PRD-001',
        quantity: 10,
        unit_price: 50000,
        discount: 0,
        tax_rate: 11,
        line_total: 555000,
      },
      {
        id: 'item-002',
        product_id: 'PRD002',
        product_name: 'Gula Pasir',
        sku: 'PRD-002',
        quantity: 20,
        unit_price: 15000,
        discount: 0,
        tax_rate: 11,
        line_total: 333000,
      },
    ],
  },
]

function normalizePurchaseItem(raw, index) {
  return {
    id: raw?.id || `item-${index}`,
    product_id: raw?.product_id || '',
    product_name: raw?.product_name || raw?.product?.name || '-',
    sku: raw?.sku || raw?.product_sku || '-',
    quantity: Number(raw?.quantity || 0),
    unit_price: Number(raw?.unit_price || 0),
    discount: Number(raw?.discount || 0),
    tax_rate: Number(raw?.tax_rate || 0),
    line_total: Number(raw?.line_total || (raw?.quantity || 0) * (raw?.unit_price || 0)),
  }
}

function normalizePurchase(raw) {
  console.log('[PurchaseAPI] normalizePurchase INPUT:', raw)
  console.log('[PurchaseAPI] normalizePurchase INPUT.items:', raw?.items)
  
  const items = (raw?.items ?? []).map((item, index) => normalizePurchaseItem(item, index))
  
  console.log('[PurchaseAPI] normalizePurchase OUTPUT items:', items)
  
  return {
    id: raw?.id || '',
    po_number: raw?.po_number || raw?.purchase_number || '',
    supplier_id: raw?.supplier_id || '',
    supplier_name: raw?.supplier_name || raw?.supplier?.name || '-',
    warehouse_id: raw?.warehouse_id || '',
    warehouse_name: raw?.warehouse_name || raw?.warehouse?.name || '-',
    status: (raw?.status || 'draft').toLowerCase(), // Normalize to lowercase
    po_date: raw?.po_date || raw?.order_date || '',
    expected_date: raw?.expected_date || raw?.expected_delivery || '',
    notes: raw?.notes || '',
    subtotal: Number(raw?.subtotal || 0),
    discount_total: Number(raw?.discount_total || raw?.discount_amount || 0),
    tax_total: Number(raw?.tax_total || raw?.tax_amount || 0),
    grand_total: Number(raw?.grand_total || raw?.total_amount || 0),
    created_at: raw?.created_at || '',
    updated_at: raw?.updated_at || '',
    items,
  }
}

export async function listPurchases(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.status) qs.set('status', params.status)
  if (params.supplier_id) qs.set('supplier_id', params.supplier_id)
  if (params.warehouse_id) qs.set('warehouse_id', params.warehouse_id)
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const url = `/api/purchases${queryString}`
  console.log('[PurchaseAPI] listPurchases REQUEST URL:', url)

  if (!token) {
    console.log('[PurchaseAPI] No token - using DUMMY data')
    let items = [...DUMMY_PURCHASES]

    if (params.search) {
      const keyword = params.search.toLowerCase()
      items = items.filter(item =>
        item.po_number.toLowerCase().includes(keyword) ||
        item.supplier_name.toLowerCase().includes(keyword)
      )
    }
    if (params.status) {
      items = items.filter(item => item.status === params.status)
    }

    const total = items.length
    const limit = params.limit || 10
    const offset = params.offset || 0
    const sliced = items.slice(offset, offset + limit)

    return {
      items: sliced.map(item => normalizePurchase(item)),
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
      },
    }
  }

  const raw = await apiFetch(url, { token })
  console.log('[PurchaseAPI] listPurchases RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load purchases')

  const rows = Array.isArray(raw.data) ? raw.data : (raw.data?.items ?? raw.data?.data ?? [])
  const pagination = raw.pagination ?? raw.data?.pagination ?? {}

  return {
    items: (rows ?? []).map(item => normalizePurchase(item)),
    pagination: {
      limit: params.limit || 10,
      offset: params.offset || 0,
      ...pagination,
    },
  }
}

export async function getPurchase(token, id) {
  const url = `/api/purchases/${encodeURIComponent(id)}`
  console.log('[PurchaseAPI] getPurchase REQUEST URL:', url)

  if (!token) {
    console.log('[PurchaseAPI] No token - using DUMMY data')
    const record = DUMMY_PURCHASES.find(r => r.id === id || r.po_number === id)
    if (!record) {
      throw new Error('Purchase order not found')
    }
    return normalizePurchase(record)
  }

  const raw = await apiFetch(url, { token })
  console.log('[PurchaseAPI] getPurchase RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to get purchase')

  return normalizePurchase(raw.data || raw)
}

export async function createPurchase(token, input) {
  const url = '/api/purchases'
  console.log('[PurchaseAPI] createPurchase REQUEST URL:', url)
  console.log('[PurchaseAPI] createPurchase PAYLOAD:')
  console.log('  - supplier_id:', input.supplier_id)
  console.log('  - warehouse_id:', input.warehouse_id)
  console.log('  - expected_date:', input.expected_date)
  console.log('  - items count:', input.items?.length || 0)
  console.log('  - items:', JSON.stringify(input.items, null, 2))

  if (!token) {
    console.log('[PurchaseAPI] No token - simulating create')
    const newRecord = {
      id: `PO${Date.now()}`,
      po_number: input.po_number || generatePONumber(),
      ...input,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: (input.items || []).map((item, index) => ({
        id: `item-${Date.now()}-${index}`,
        ...item,
        line_total: (item.quantity || 0) * (item.unit_price || 0),
      })),
    }

    // Calculate totals
    const subtotal = newRecord.items.reduce((sum, item) => sum + item.line_total, 0)
    const discountTotal = newRecord.items.reduce((sum, item) => sum + (item.discount || 0), 0)
    const taxTotal = newRecord.items.reduce((sum, item) => {
      const lineTotal = item.line_total - (item.discount || 0)
      return sum + (lineTotal * (item.tax_rate || 0) / 100)
    }, 0)

    newRecord.subtotal = subtotal
    newRecord.discount_total = discountTotal
    newRecord.tax_total = taxTotal
    newRecord.grand_total = subtotal - discountTotal + taxTotal
    
    console.log('[PurchaseAPI] Simulated created record:', newRecord)
    DUMMY_PURCHASES.unshift(newRecord)
    return {
      success: true,
      data: normalizePurchase(newRecord),
      message: 'Purchase order created successfully',
    }
  }

  const raw = await apiFetch(url, {
    method: 'POST',
    token,
    body: input,
  })
  console.log('[PurchaseAPI] createPurchase RESPONSE:', raw)
  console.log('[PurchaseAPI] createPurchase RESPONSE data:', raw.data)
  console.log('[PurchaseAPI] createPurchase RESPONSE data.items:', raw.data?.items)
  console.log('[PurchaseAPI] createPurchase RESPONSE data.items count:', raw.data?.items?.length)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to create purchase')

  return raw
}

export async function updatePurchase(token, id, input) {
  const url = `/api/purchases/${encodeURIComponent(id)}`
  console.log('[PurchaseAPI] === updatePurchase REQUEST ===')
  console.log('[PurchaseAPI] URL:', url)
  console.log('[PurchaseAPI] Method: PUT')
  
  // Transform frontend field names to backend field names
  const backendPayload = {
    supplier_id: input.supplier_id,
    warehouse_id: input.warehouse_id,
    expected_date: input.expected_date || input.expected_delivery,
    notes: input.notes,
    items: input.items,
  }
  
  console.log('[PurchaseAPI] Backend Payload:')
  console.log(JSON.stringify(backendPayload, null, 2))

  if (!token) {
    console.log('[PurchaseAPI] No token - simulating update')
    const index = DUMMY_PURCHASES.findIndex(r => r.id === id || r.po_number === id)
    if (index === -1) {
      throw new Error('Purchase order not found')
    }
    const updatedRecord = {
      ...DUMMY_PURCHASES[index],
      ...input,
      updated_at: new Date().toISOString(),
    }
    DUMMY_PURCHASES[index] = updatedRecord
    return {
      success: true,
      data: normalizePurchase(updatedRecord),
      message: 'Purchase order updated successfully',
    }
  }

  const raw = await apiFetch(url, {
    method: 'PUT',
    token,
    body: backendPayload,
  })
  
  console.log('[PurchaseAPI] === updatePurchase RESPONSE ===')
  console.log('[PurchaseAPI] Response:', raw)

  if (!raw.success) {
    console.error('[PurchaseAPI] Error:', raw.error || raw.message)
    throw new Error(raw.error || raw.message || 'Failed to update purchase')
  }

  return raw
}

export async function updatePurchaseStatus(token, id, status) {
  const url = `/api/purchases/${encodeURIComponent(id)}/status`
  console.log('[PurchaseAPI] updatePurchaseStatus REQUEST URL:', url)
  console.log('[PurchaseAPI] updatePurchaseStatus PAYLOAD:', { status })

  if (!token) {
    console.log('[PurchaseAPI] No token - simulating status update')
    const index = DUMMY_PURCHASES.findIndex(r => r.id === id || r.po_number === id)
    if (index === -1) {
      throw new Error('Purchase order not found')
    }
    DUMMY_PURCHASES[index].status = status
    DUMMY_PURCHASES[index].updated_at = new Date().toISOString()
    return {
      success: true,
      data: normalizePurchase(DUMMY_PURCHASES[index]),
      message: `Purchase order status updated to ${status}`,
    }
  }

  const raw = await apiFetch(url, {
    method: 'POST',
    token,
    body: { status },
  })
  console.log('[PurchaseAPI] updatePurchaseStatus RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to update status')

  return raw
}

export async function cancelPurchase(token, id) {
  const url = `/api/purchases/${encodeURIComponent(id)}/cancel`
  console.log('[PurchaseAPI] cancelPurchase REQUEST URL:', url)

  if (!token) {
    console.log('[PurchaseAPI] No token - simulating cancel')
    const index = DUMMY_PURCHASES.findIndex(r => r.id === id || r.po_number === id)
    if (index === -1) {
      throw new Error('Purchase order not found')
    }
    DUMMY_PURCHASES[index].status = 'cancelled'
    DUMMY_PURCHASES[index].updated_at = new Date().toISOString()
    return {
      success: true,
      data: normalizePurchase(DUMMY_PURCHASES[index]),
      message: 'Purchase order cancelled successfully',
    }
  }

  const raw = await apiFetch(url, {
    method: 'POST',
    token,
  })
  console.log('[PurchaseAPI] cancelPurchase RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to cancel purchase')

  return raw
}

export async function deletePurchase(token, id) {
  const url = `/api/purchases/${encodeURIComponent(id)}`
  console.log('[PurchaseAPI] deletePurchase REQUEST URL:', url)

  if (!token) {
    console.log('[PurchaseAPI] No token - simulating delete')
    const index = DUMMY_PURCHASES.findIndex(r => r.id === id || r.po_number === id)
    if (index === -1) {
      throw new Error('Purchase order not found')
    }
    DUMMY_PURCHASES.splice(index, 1)
    return {
      success: true,
      message: 'Purchase order deleted successfully',
    }
  }

  const raw = await apiFetch(url, {
    method: 'DELETE',
    token,
  })
  console.log('[PurchaseAPI] deletePurchase RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to delete purchase')

  return raw
}

export async function listSuppliers(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.limit !== undefined) qs.set('limit', String(params.limit))

  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const url = `/api/suppliers${queryString}`

  if (!token) {
    return {
      items: DUMMY_SUPPLIERS,
      pagination: { total: DUMMY_SUPPLIERS.length, limit: 50, offset: 0 },
    }
  }

  const raw = await apiFetch(url, { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load suppliers')

  const rows = Array.isArray(raw.data) ? raw.data : (raw.data?.items ?? raw.data?.data ?? [])
  const pagination = raw.pagination ?? raw.data?.pagination ?? {}

  return {
    items: (rows ?? []).map(item => ({
      id: item.id || '',
      code: item.code || '-',
      name: item.name || '-',
    })),
    pagination: {
      limit: params.limit || 50,
      offset: 0,
      ...pagination,
    },
  }
}

export function generatePONumber() {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
  const randomNum = Math.floor(Math.random() * 999) + 1
  return `PO-${dateStr}-${String(randomNum).padStart(3, '0')}`
}
