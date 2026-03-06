import { apiFetch } from '../../../shared/http'

const DUMMY_WAREHOUSES = [
  { id: 'WH001', code: 'WH-001', name: 'Gudang Utama' },
  { id: 'WH002', code: 'WH-002', name: 'Gudang Cabang' },
]

const DUMMY_OPNAME_RECORDS = [
  {
    id: 'OPN001',
    opname_number: 'OPN-20260305-001',
    warehouse_id: 'WH001',
    warehouse: { id: 'WH001', code: 'WH-001', name: 'Gudang Utama' },
    user_id: 'user1',
    opname_date: '2026-03-05T10:30:00Z',
    status: 'posted',
    notes: 'Stock opname bulanan',
    created_at: '2026-03-05T10:30:00Z',
    updated_at: '2026-03-05T10:30:00Z',
  },
  {
    id: 'OPN002',
    opname_number: 'OPN-20260305-002',
    warehouse_id: 'WH001',
    warehouse: { id: 'WH001', code: 'WH-001', name: 'Gudang Utama' },
    user_id: 'user1',
    opname_date: '2026-03-05T14:00:00Z',
    status: 'draft',
    notes: 'Stock opname mingguan',
    created_at: '2026-03-05T14:00:00Z',
    updated_at: '2026-03-05T14:00:00Z',
  },
  {
    id: 'OPN003',
    opname_number: 'OPN-20260305-003',
    warehouse_id: 'WH002',
    warehouse: { id: 'WH002', code: 'WH-002', name: 'Gudang Cabang' },
    user_id: 'user2',
    opname_date: '2026-03-05T15:00:00Z',
    status: 'draft',
    notes: 'Stock opname cabang',
    created_at: '2026-03-05T15:00:00Z',
    updated_at: '2026-03-05T15:00:00Z',
  },
]

function normalizeOpnameItem(raw, index) {
  return {
    id: raw?.id || `opname-${index}`,
    opname_number: raw?.opname_number || raw?.reference || `OPN-${Date.now()}-${index}`,
    warehouse_id: raw?.warehouse_id || '',
    warehouse: {
      id: raw?.warehouse?.id || raw?.warehouse_id || '',
      code: raw?.warehouse?.code || raw?.warehouse_code || '-',
      name: raw?.warehouse?.name || raw?.warehouse_name || '-',
    },
    user_id: raw?.user_id || raw?.created_by || '',
    username: raw?.user?.username || raw?.created_by_name || raw?.username || '',
    opname_date: raw?.opname_date || raw?.date || raw?.created_at || '',
    status: raw?.status || 'draft',
    notes: raw?.notes || '',
    created_at: raw?.created_at || '',
    updated_at: raw?.updated_at || '',
  }
}

export async function listStockOpname(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.warehouse_id) qs.set('warehouse_id', params.warehouse_id)
  if (params.status) qs.set('status', params.status)
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
    const newRecord = {
      id: `OPN${Date.now()}`,
      ...input,
      user_id: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
    DUMMY_OPNAME_RECORDS[index] = { ...DUMMY_OPNAME_RECORDS[index], ...input, updated_at: new Date().toISOString() }
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
