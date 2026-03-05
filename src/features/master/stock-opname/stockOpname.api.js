import { apiFetch } from '../../../shared/http'

const DUMMY_PRODUCTS = [
  { id: 'PRD001', code: 'PRD-001', name: 'Kopi Luwak', unit: 'PCS' },
  { id: 'PRD002', code: 'PRD-002', name: 'Gula Pasir', unit: 'KG' },
  { id: 'PRD003', code: 'PRD-003', name: 'Teh Botol', unit: 'BOX' },
  { id: 'PRD004', code: 'PRD-004', name: 'Mineral Water', unit: 'PCS' },
  { id: 'PRD005', code: 'PRD-005', name: 'Roti Tawar', unit: 'PCS' },
]

const DUMMY_WAREHOUSES = [
  { id: 'WH001', code: 'WH-001', name: 'Gudang Utama' },
  { id: 'WH002', code: 'WH-002', name: 'Gudang Cabang' },
]

const DUMMY_STOCK_LEVELS = {
  'PRD001-WH001': 150,
  'PRD002-WH001': 80,
  'PRD003-WH001': 200,
  'PRD004-WH001': 500,
  'PRD005-WH001': 50,
  'PRD001-WH002': 50,
  'PRD002-WH002': 30,
  'PRD003-WH002': 100,
}

const DUMMY_OPNAME_RECORDS = [
  {
    id: 'OPN001',
    reference: 'OPN-20260305-001',
    product_id: 'PRD001',
    product: { code: 'PRD-001', name: 'Kopi Luwak', unit: 'PCS' },
    warehouse_id: 'WH001',
    warehouse: { code: 'WH-001', name: 'Gudang Utama' },
    system_qty: 150,
    physical_qty: 145,
    variance: -5,
    reason: 'counting_error',
    notes: 'Selisih saat stock opname bulanan',
    status: 'posted',
    created_by: 'admin',
    created_at: '2026-03-05T10:30:00Z',
  },
  {
    id: 'OPN002',
    reference: 'OPN-20260305-002',
    product_id: 'PRD002',
    product: { code: 'PRD-002', name: 'Gula Pasir', unit: 'KG' },
    warehouse_id: 'WH001',
    warehouse: { code: 'WH-001', name: 'Gudang Utama' },
    system_qty: 80,
    physical_qty: 75,
    variance: -5,
    reason: 'expired',
    notes: 'Gula kadaluarsa, perlu dibuang',
    status: 'pending',
    created_by: 'admin',
    created_at: '2026-03-05T14:00:00Z',
  },
  {
    id: 'OPN003',
    reference: 'OPN-20260305-003',
    product_id: 'PRD003',
    product: { code: 'PRD-003', name: 'Teh Botol', unit: 'BOX' },
    warehouse_id: 'WH001',
    warehouse: { code: 'WH-001', name: 'Gudang Utama' },
    system_qty: 200,
    physical_qty: 205,
    variance: 5,
    reason: 'found',
    notes: 'Stok ditemukan saat pengecekan',
    status: 'approved',
    created_by: 'admin',
    created_at: '2026-03-05T15:00:00Z',
  },
]

function normalizeOpnameItem(raw, index) {
  return {
    id: raw?.id || `opname-${index}`,
    reference: raw?.reference || `OPN-${Date.now()}-${index}`,
    product_id: raw?.product_id || raw?.product?.id || '',
    product: {
      code: raw?.product?.code || raw?.product_code || '-',
      name: raw?.product?.name || raw?.product_name || '-',
      unit: raw?.product?.unit || raw?.product_unit || '-',
    },
    warehouse_id: raw?.warehouse_id || raw?.warehouse?.id || '',
    warehouse: {
      code: raw?.warehouse?.code || raw?.warehouse_code || '-',
      name: raw?.warehouse?.name || raw?.warehouse_name || '-',
    },
    system_qty: Number(raw?.system_qty ?? raw?.system_quantity ?? 0),
    physical_qty: Number(raw?.physical_qty ?? raw?.physical_quantity ?? 0),
    variance: Number(raw?.variance ?? 0),
    reason: raw?.reason || '',
    notes: raw?.notes || '',
    status: raw?.status || 'pending',
    created_by: raw?.created_by || '',
    created_at: raw?.created_at || raw?.date || '',
  }
}

function normalizeStockItem(raw, index) {
  return {
    id: raw?.id || `stock-${index}`,
    product_id: raw?.product_id || raw?.product?.id || '',
    product: {
      code: raw?.product?.code || raw?.code || raw?.sku || '-',
      name: raw?.product?.name || raw?.name || '-',
      unit: raw?.product?.unit || raw?.unit || '-',
    },
    warehouse_id: raw?.warehouse_id || raw?.warehouse?.id || '',
    warehouse: {
      code: raw?.warehouse?.code || raw?.code || '-',
      name: raw?.warehouse?.name || raw?.name || '-',
    },
    current_stock: Number(raw?.current_stock ?? raw?.stock ?? raw?.quantity ?? 0),
  }
}

export async function getProductStock(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.product_id) qs.set('product_id', params.product_id)
  if (params.warehouse_id) qs.set('warehouse_id', params.warehouse_id)

  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const url = `/api/inventory/stock${queryString}`
  console.log('[StockOpnameAPI] getProductStock REQUEST URL:', url)
  console.log('[StockOpnameAPI] getProductStock PARAMS:', params)

  if (!token) {
    console.log('[StockOpnameAPI] No token - using DUMMY data')
    const key = `${params.product_id}-${params.warehouse_id}`
    const stock = DUMMY_STOCK_LEVELS[key] || 0
    const product = DUMMY_PRODUCTS.find(p => p.id === params.product_id) || { id: params.product_id, code: '-', name: 'Unknown', unit: 'PCS' }
    const warehouse = DUMMY_WAREHOUSES.find(w => w.id === params.warehouse_id) || { id: params.warehouse_id, code: '-', name: 'Unknown' }

    return {
      product_id: params.product_id,
      warehouse_id: params.warehouse_id,
      current_stock: stock,
      product,
      warehouse,
    }
  }

  const raw = await apiFetch(url, { token })
  console.log('[StockOpnameAPI] getProductStock RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to get stock')

  return normalizeStockItem(raw.data || raw, 0)
}

export async function listStockOpname(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.warehouse_id) qs.set('warehouse_id', params.warehouse_id)
  if (params.product_id) qs.set('product_id', params.product_id)
  if (params.status) qs.set('status', params.status)
  if (params.date_from) qs.set('date_from', params.date_from)
  if (params.date_to) qs.set('date_to', params.date_to)
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const url = `/api/stock-opname${queryString}`
  console.log('[StockOpnameAPI] listStockOpname REQUEST URL:', url)
  console.log('[StockOpnameAPI] listStockOpname PARAMS:', params)

  if (!token) {
    console.log('[StockOpnameAPI] No token - using DUMMY data')
    let items = [...DUMMY_OPNAME_RECORDS]

    if (params.search) {
      const keyword = params.search.toLowerCase()
      items = items.filter(item =>
        item.reference.toLowerCase().includes(keyword) ||
        item.product.name.toLowerCase().includes(keyword)
      )
    }
    if (params.warehouse_id) {
      items = items.filter(item => item.warehouse_id === params.warehouse_id)
    }
    if (params.status && params.status !== 'all') {
      items = items.filter(item => item.status === params.status)
    }

    const total = items.length
    const limit = params.limit || 10
    const offset = params.offset || 0
    const sliced = items.slice(offset, offset + limit)

    return {
      items: sliced.map((item, index) => normalizeOpnameItem(item, index)),
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
      },
    }
  }

  const raw = await apiFetch(url, { token })
  console.log('[StockOpnameAPI] listStockOpname RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load stock opname')

  const rows = Array.isArray(raw.data) ? raw.data : (raw.data?.items ?? raw.data?.data ?? [])
  const pagination = raw.pagination ?? raw.data?.pagination ?? {}

  return {
    items: (rows ?? []).map((item, index) => normalizeOpnameItem(item, index)),
    pagination: {
      limit: params.limit || 10,
      offset: params.offset || 0,
      ...pagination,
    },
  }
}

export async function createStockOpname(token, input) {
  const url = '/api/stock-opname'
  console.log('[StockOpnameAPI] createStockOpname REQUEST URL:', url)
  console.log('[StockOpnameAPI] createStockOpname PAYLOAD:', input)

  if (!token) {
    console.log('[StockOpnameAPI] No token - simulating create')
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const newRecord = {
      id: `OPN${Date.now()}`,
      reference: `OPN-${today}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`,
      ...input,
      status: 'pending',
      created_by: 'user',
      created_at: new Date().toISOString(),
    }
    DUMMY_OPNAME_RECORDS.unshift(newRecord)
    return {
      success: true,
      data: newRecord,
      message: 'Stock opname created successfully',
    }
  }

  const raw = await apiFetch(url, {
    method: 'POST',
    token,
    body: input,
  })
  console.log('[StockOpnameAPI] createStockOpname RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to create stock opname')

  return raw
}

export async function updateStockOpname(token, id, input) {
  const url = `/api/stock-opname/${encodeURIComponent(id)}`
  console.log('[StockOpnameAPI] updateStockOpname REQUEST URL:', url)
  console.log('[StockOpnameAPI] updateStockOpname PAYLOAD:', input)

  if (!token) {
    console.log('[StockOpnameAPI] No token - simulating update')
    const index = DUMMY_OPNAME_RECORDS.findIndex(r => r.id === id)
    if (index === -1) {
      throw new Error('Record not found')
    }
    DUMMY_OPNAME_RECORDS[index] = { ...DUMMY_OPNAME_RECORDS[index], ...input }
    return {
      success: true,
      data: DUMMY_OPNAME_RECORDS[index],
      message: 'Stock opname updated successfully',
    }
  }

  const raw = await apiFetch(url, {
    method: 'PUT',
    token,
    body: input,
  })
  console.log('[StockOpnameAPI] updateStockOpname RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to update stock opname')

  return raw
}

export async function deleteStockOpname(token, id) {
  const url = `/api/stock-opname/${encodeURIComponent(id)}`
  console.log('[StockOpnameAPI] deleteStockOpname REQUEST URL:', url)

  if (!token) {
    console.log('[StockOpnameAPI] No token - simulating delete')
    const index = DUMMY_OPNAME_RECORDS.findIndex(r => r.id === id)
    if (index === -1) {
      throw new Error('Record not found')
    }
    DUMMY_OPNAME_RECORDS.splice(index, 1)
    return {
      success: true,
      message: 'Stock opname deleted successfully',
    }
  }

  const raw = await apiFetch(url, {
    method: 'DELETE',
    token,
  })
  console.log('[StockOpnameAPI] deleteStockOpname RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to delete stock opname')

  return raw
}

export async function approveStockOpname(token, id, action, rejectionReason) {
  const url = `/api/stock-opname/${encodeURIComponent(id)}/approve`
  console.log('[StockOpnameAPI] approveStockOpname REQUEST URL:', url)
  console.log('[StockOpnameAPI] approveStockOpname PAYLOAD:', { action, rejectionReason })

  if (!token) {
    console.log('[StockOpnameAPI] No token - simulating approve')
    const index = DUMMY_OPNAME_RECORDS.findIndex(r => r.id === id)
    if (index === -1) {
      throw new Error('Record not found')
    }
    DUMMY_OPNAME_RECORDS[index].status = action === 'approve' ? 'approved' : 'rejected'
    if (action === 'reject' && rejectionReason) {
      DUMMY_OPNAME_RECORDS[index].rejection_reason = rejectionReason
    }
    return {
      success: true,
      data: DUMMY_OPNAME_RECORDS[index],
      message: `Stock opname ${action}d successfully`,
    }
  }

  const raw = await apiFetch(url, {
    method: 'POST',
    token,
    body: {
      action,
      rejection_reason: rejectionReason,
    },
  })
  console.log('[StockOpnameAPI] approveStockOpname RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to approve stock opname')

  return raw
}

export function getReasonOptions() {
  return [
    { value: 'damage', label: 'Barang Rusak' },
    { value: 'expired', label: 'Kadaluarsa' },
    { value: 'lost', label: 'Hilang' },
    { value: 'found', label: 'Ditemukan (Surplus)' },
    { value: 'counting_error', label: 'Kesalahan Hitung' },
    { value: 'return', label: 'Retur' },
    { value: 'adjustment', label: 'Penyesuaian' },
    { value: 'other', label: 'Lainnya' },
  ]
}

export function generateReference() {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
  const randomNum = Math.floor(Math.random() * 999) + 1
  return `OPN-${dateStr}-${String(randomNum).padStart(3, '0')}`
}
