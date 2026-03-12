import { apiFetch } from '../../../shared/http'

const DUMMY_WAREHOUSES = [
  { id: 'WH001', code: 'WH-001', name: 'Gudang Utama' },
  { id: 'WH002', code: 'WH-002', name: 'Gudang Cabang' },
]

const DUMMY_PRODUCTS = [
  { id: 'PRD001', code: 'PRD-001', name: 'Kopi Luwak', unit: 'PCS' },
  { id: 'PRD002', code: 'PRD-002', name: 'Gula Pasir', unit: 'KG' },
  { id: 'PRD003', code: 'PRD-003', name: 'Teh Botol', unit: 'BOX' },
  { id: 'PRD004', code: 'PRD-004', name: 'Mineral Water', unit: 'PCS' },
  { id: 'PRD005', code: 'PRD-005', name: 'Roti Tawar', unit: 'PCS' },
]

const DUMMY_OPNAME_HEADER = {
  id: 'OPN001',
  opname_number: 'OPN-20260305-001',
  warehouse_id: 'WH001',
  warehouse: { id: 'WH001', code: 'WH-001', name: 'Gudang Utama' },
  user_id: 'user1',
  username: 'Admin Utama',
  opname_date: '2026-03-05T10:30:00Z',
  status: 'draft',
  notes: 'Monthly stock opname',
  created_at: '2026-03-05T10:30:00Z',
  updated_at: '2026-03-05T10:30:00Z',
}

const DUMMY_OPNAME_ITEMS = [
  {
    id: 'item-001',
    opname_id: 'OPN001',
    product_id: 'PRD001',
    product: { code: 'PRD-001', name: 'Kopi Luwak', unit: 'PCS' },
    system_qty: 150,
    physical_qty: 145,
    variance: -5,
    reason: 'counting_error',
    notes: 'Selisih counting',
  },
  {
    id: 'item-002',
    opname_id: 'OPN001',
    product_id: 'PRD002',
    product: { code: 'PRD-002', name: 'Gula Pasir', unit: 'KG' },
    system_qty: 80,
    physical_qty: 80,
    variance: 0,
    reason: null,
    notes: null,
  },
  {
    id: 'item-003',
    opname_id: 'OPN001',
    product_id: 'PRD003',
    product: { code: 'PRD-003', name: 'Teh Botol', unit: 'BOX' },
    system_qty: 200,
    physical_qty: 205,
    variance: 5,
    reason: 'found',
    notes: 'Stok ditemukan',
  },
]

const DUMMY_OPNAME_RECORDS = [
  {
    ...DUMMY_OPNAME_HEADER,
    items: DUMMY_OPNAME_ITEMS,
    summary: {
      total_items: 3,
      variance_positive: 1,
      variance_negative: 1,
      variance_zero: 1,
    },
  },
]

function normalizeOpnameItem(raw, index) {
  return {
    id: raw?.id || `item-${index}`,
    opname_id: raw?.opname_id || '',
    product_id: raw?.product_id || '',
    product_sku: raw?.product_sku || raw?.product?.sku || raw?.product_code || '-',
    product_name: raw?.product_name || raw?.product?.name || '-',
    product_unit_name: raw?.product_unit_name || raw?.product?.unit || '-',
    system_quantity: Number(raw?.system_quantity ?? raw?.system_qty ?? 0),
    actual_quantity: Number(raw?.actual_quantity ?? raw?.physical_qty ?? 0),
    difference: Number(raw?.difference ?? ((raw?.actual_quantity ?? raw?.physical_qty ?? 0) - (raw?.system_quantity ?? raw?.system_qty ?? 0))),
    status: raw?.status || '',
    reason: raw?.reason || '',
    notes: raw?.notes || '',
  }
}

function normalizeOpnameHeader(raw) {
  const items = (raw?.items ?? []).map((item, index) => normalizeOpnameItem(item, index))
  
  return {
    id: raw?.id || '',
    opname_number: raw?.opname_number || raw?.reference || '',
    warehouse_id: raw?.warehouse_id || '',
    warehouse: {
      id: raw?.warehouse?.id || raw?.warehouse_id || '',
      code: raw?.warehouse?.code || raw?.warehouse_code || '-',
      name: raw?.warehouse?.name || raw?.warehouse_name || '-',
    },
    user_id: raw?.user_id || raw?.created_by || '',
    username: raw?.user?.username || raw?.created_by_name || raw?.username || '',
    opname_date: raw?.opname_date ? raw.opname_date.split('T')[0] : '',
    status: raw?.status || 'draft',
    notes: raw?.notes || '',
    created_at: raw?.created_at || '',
    updated_at: raw?.updated_at || '',
    items,
    summary: raw?.summary || {
      total_items: items.length,
      variance_positive: items.filter(i => i.variance > 0).length,
      variance_negative: items.filter(i => i.variance < 0).length,
      variance_zero: items.filter(i => i.variance === 0).length,
    },
  }
}

export async function listStockOpname(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.warehouse_id) qs.set('warehouse_id', params.warehouse_id)
  if (params.status) qs.set('status', params.status)
  if (params.from_date) qs.set('from_date', params.from_date)
  if (params.to_date) qs.set('to_date', params.to_date)
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
        item.opname_number.toLowerCase().includes(keyword) ||
        item.warehouse.name.toLowerCase().includes(keyword) ||
        item.notes.toLowerCase().includes(keyword)
      )
    }
    if (params.warehouse_id) {
      items = items.filter(item => item.warehouse_id === params.warehouse_id)
    }
    if (params.status) {
      items = items.filter(item => item.status === params.status)
    }

    const total = items.length
    const limit = params.limit || 10
    const offset = params.offset || 0
    const sliced = items.slice(offset, offset + limit)

    return {
      items: sliced.map((item) => normalizeOpnameHeader(item)),
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
    items: (rows ?? []).map((item) => normalizeOpnameHeader(item)),
    pagination: {
      limit: params.limit || 10,
      offset: params.offset || 0,
      ...pagination,
    },
  }
}

export async function getStockOpnameById(token, id) {
  const url = `/api/stock-opname/${encodeURIComponent(id)}`
  console.log('[StockOpnameAPI] getStockOpnameById REQUEST URL:', url)

  if (!token) {
    console.log('[StockOpnameAPI] No token - using DUMMY data')
    const record = DUMMY_OPNAME_RECORDS.find(r => r.id === id || r.opname_number === id)
    if (!record) {
      throw new Error('Stock opname not found')
    }
    return normalizeOpnameHeader(record)
  }

  const raw = await apiFetch(url, { token })
  console.log('[StockOpnameAPI] getStockOpnameById RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to get stock opname')

  return normalizeOpnameHeader(raw.data || raw)
}

export async function createStockOpname(token, input) {
  const url = '/api/stock-opname'
  console.log('[StockOpnameAPI] createStockOpname REQUEST URL:', url)
  console.log('[StockOpnameAPI] createStockOpname PAYLOAD:', input)

  if (!token) {
    console.log('[StockOpnameAPI] No token - simulating create')
    const newRecord = {
      id: `OPN${Date.now()}`,
      opname_number: input.opname_number || generateReference(),
      ...input,
      user_id: 'user',
      username: 'Current User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: (input.items || []).map((item, index) => ({
        id: `item-${Date.now()}-${index}`,
        ...item,
        variance: (item.physical_qty || item.actual_quantity || 0) - (item.system_qty || item.system_quantity || 0),
      })),
    }
    newRecord.summary = {
      total_items: newRecord.items.length,
      variance_positive: newRecord.items.filter(i => i.variance > 0).length,
      variance_negative: newRecord.items.filter(i => i.variance < 0).length,
      variance_zero: newRecord.items.filter(i => i.variance === 0).length,
    }
    DUMMY_OPNAME_RECORDS.unshift(newRecord)
    return {
      success: true,
      data: normalizeOpnameHeader(newRecord),
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
  console.log('[StockOpnameAPI] updateStockOpname PAYLOAD:', JSON.stringify(input, null, 2))

  if (!token) {
    console.log('[StockOpnameAPI] No token - simulating update')
    const index = DUMMY_OPNAME_RECORDS.findIndex(r => r.id === id || r.opname_number === id)
    if (index === -1) {
      throw new Error('Stock opname not found')
    }
    const updatedRecord = {
      ...DUMMY_OPNAME_RECORDS[index],
      ...input,
      updated_at: new Date().toISOString(),
      items: (input.items || DUMMY_OPNAME_RECORDS[index].items).map((item) => ({
        ...item,
        variance: (item.physical_qty || item.actual_quantity || 0) - (item.system_qty || item.system_quantity || 0),
      })),
    }
    updatedRecord.summary = {
      total_items: updatedRecord.items.length,
      variance_positive: updatedRecord.items.filter(i => i.variance > 0).length,
      variance_negative: updatedRecord.items.filter(i => i.variance < 0).length,
      variance_zero: updatedRecord.items.filter(i => i.variance === 0).length,
    }
    DUMMY_OPNAME_RECORDS[index] = updatedRecord
    return {
      success: true,
      data: normalizeOpnameHeader(updatedRecord),
      message: 'Stock opname updated successfully',
    }
  }

  const raw = await apiFetch(url, {
    method: 'PUT',
    token,
    body: input,
  })
  console.log('[StockOpnameAPI] updateStockOpname RAW RESPONSE:', raw)
  console.log('[StockOpnameAPI] updateStockOpname RESPONSE success:', raw.success)
  console.log('[StockOpnameAPI] updateStockOpname RESPONSE error:', raw.error)
  console.log('[StockOpnameAPI] updateStockOpname RESPONSE message:', raw.message)

  if (!raw.success) {
    const errorMsg = raw.error || raw.message || 'Failed to update stock opname'
    console.error('[StockOpnameAPI] updateStockOpname ERROR:', errorMsg)
    throw new Error(errorMsg)
  }

  return raw
}

export async function updateStockOpnameStatus(token, id, status) {
  const url = `/api/stock-opname/${encodeURIComponent(id)}/status`
  console.log('[StockOpnameAPI] updateStockOpnameStatus REQUEST URL:', url)
  console.log('[StockOpnameAPI] updateStockOpnameStatus PAYLOAD:', { status })

  if (!token) {
    console.log('[StockOpnameAPI] No token - simulating status update')
    const index = DUMMY_OPNAME_RECORDS.findIndex(r => r.id === id || r.opname_number === id)
    if (index === -1) {
      throw new Error('Stock opname not found')
    }
    DUMMY_OPNAME_RECORDS[index].status = status
    DUMMY_OPNAME_RECORDS[index].updated_at = new Date().toISOString()
    return {
      success: true,
      data: normalizeOpnameHeader(DUMMY_OPNAME_RECORDS[index]),
      message: `Stock opname status updated to ${status}`,
    }
  }

  const raw = await apiFetch(url, {
    method: 'POST',
    token,
    body: { status },
  })
  console.log('[StockOpnameAPI] updateStockOpnameStatus RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to update stock opname status')

  return raw
}

export async function deleteStockOpname(token, id) {
  const url = `/api/stock-opname/${encodeURIComponent(id)}`
  console.log('[StockOpnameAPI] deleteStockOpname REQUEST URL:', url)

  if (!token) {
    console.log('[StockOpnameAPI] No token - simulating delete')
    const index = DUMMY_OPNAME_RECORDS.findIndex(r => r.id === id || r.opname_number === id)
    if (index === -1) {
      throw new Error('Stock opname not found')
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

export async function getProductStock(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.product_id) qs.set('product_id', params.product_id)
  if (params.warehouse_id) qs.set('warehouse_id', params.warehouse_id)
  qs.set('limit', '1')

  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const url = `/api/inventory${queryString}`
  console.log('[StockOpnameAPI] getProductStock REQUEST URL:', url)

  if (!token) {
    const key = `${params.product_id}-${params.warehouse_id}`
    const stockLevels = {
      'PRD001-WH001': 150,
      'PRD002-WH001': 80,
      'PRD003-WH001': 200,
      'PRD004-WH001': 500,
      'PRD005-WH001': 50,
    }
    const stock = stockLevels[key] || 0
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
  console.log('[StockOpnameAPI] getProductStock RAW RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to get stock')

  const items = raw.data?.items || raw.data?.data || raw.data || []
  const item = Array.isArray(items) ? items[0] : items
  const currentStock = item?.stock ?? item?.quantity ?? item?.on_hand ?? 0
  console.log('[StockOpnameAPI] getProductStock current_stock extracted:', currentStock)

  return {
    product_id: params.product_id,
    warehouse_id: params.warehouse_id,
    current_stock: Number(currentStock),
    product: item?.product || { id: params.product_id, code: '-', name: 'Unknown', unit: 'PCS' },
    warehouse: item?.warehouse || { id: params.warehouse_id, code: '-', name: 'Unknown' },
  }
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

export function getStatusOptions() {
  return [
    { value: 'draft', label: 'Draft' },
    { value: 'approved', label: 'Approved' },
    { value: 'posted', label: 'Posted' },
    { value: 'rejected', label: 'Rejected' },
  ]
}

export function generateReference() {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
  const randomNum = Math.floor(Math.random() * 999) + 1
  return `OPN-${dateStr}-${String(randomNum).padStart(3, '0')}`
}
