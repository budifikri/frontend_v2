import { apiFetch } from '../../../shared/http'

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeInventoryItem(raw, index) {
  const productId = raw?.product_id ?? raw?.product?.id ?? ''
  const warehouseId = raw?.warehouse_id ?? raw?.warehouse?.id ?? ''

  const isValidId = raw?.id && raw?.id !== '00000000-0000-0000-0000-000000000000'
  return {
    id: isValidId ? raw?.id : `${productId || 'product'}-${warehouseId || 'warehouse'}-${index}`,
    product_id: productId,
    code: raw?.product_code ?? raw?.code ?? raw?.sku ?? raw?.product?.code ?? '-',
    name: raw?.product_name ?? raw?.name ?? raw?.product?.name ?? '-',
    category: raw?.category_name ?? raw?.category ?? raw?.product?.category_name ?? '-',
    category_id: raw?.category_id ?? raw?.product?.category_id ?? '',
    warehouse: raw?.warehouse_name ?? raw?.warehouse ?? raw?.warehouse?.name ?? '-',
    warehouse_id: warehouseId,
    stock: toNumber(raw?.stock ?? raw?.qty ?? raw?.quantity ?? raw?.on_hand ?? raw?.quantity_on_hand, 0),
    unit: raw?.unit_name ?? raw?.unit ?? raw?.uom ?? raw?.product?.unit_name ?? '-',
  }
}

function normalizeStockCardItem(raw, index) {
  return {
    id: raw?.documentNumber ?? raw?.id ?? `stock-card-${index}`,
    date: raw?.date ?? raw?.transaction_date ?? '-',
    reference: raw?.reference ?? raw?.documentNumber ?? '-',
    type: raw?.type ?? raw?.transactionName ?? '-',
    qty_in: toNumber(raw?.qtyIn ?? raw?.quantity_in ?? raw?.masuk, 0),
    qty_out: toNumber(raw?.qtyOut ?? raw?.quantity_out ?? raw?.keluar, 0),
    balance: toNumber(raw?.balance ?? raw?.saldo ?? raw?.stock, 0),
    note: raw?.description ?? raw?.note ?? raw?.transactionName ?? '-',
  }
}

const DUMMY_STOCK_CARD = [
  { id: '1', date: '2024-01-15', reference: 'PO-001', type: 'IN', qty_in: 100, qty_out: 0, balance: 100, note: 'Pembelian' },
  { id: '2', date: '2024-01-20', reference: 'SO-001', type: 'OUT', qty_in: 0, qty_out: 25, balance: 75, note: 'Penjualan' },
  { id: '3', date: '2024-01-25', reference: 'ADJ-001', type: 'ADJUST', qty_in: 0, qty_out: 5, balance: 70, note: 'Stock Opname' },
  { id: '4', date: '2024-02-01', reference: 'PO-002', type: 'IN', qty_in: 50, qty_out: 0, balance: 120, note: 'Pembelian' },
  { id: '5', date: '2024-02-10', reference: 'SO-002', type: 'OUT', qty_in: 0, qty_out: 30, balance: 90, note: 'Penjualan' },
]

export async function listInventory(token, params = {}) {
  const qs = new URLSearchParams()
  const keyword = params.search?.trim?.()
  if (keyword) qs.set('search', keyword)
  if (params.stock) qs.set('stock', params.stock)
  if (params.warehouse_id) qs.set('warehouse_id', params.warehouse_id)
  if (params.product_id) qs.set('product_id', params.product_id)
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const url = `/api/inventory${queryString}`
  console.log('[LapStockAPI] listInventory REQUEST URL:', url)
  console.log('[LapStockAPI] listInventory PARAMS:', params)

  const raw = await apiFetch(url, { token })
  console.log('[LapStockAPI] listInventory RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load inventory')

  const rows = Array.isArray(raw.data) ? raw.data : (raw.data?.items ?? raw.data?.data ?? [])
  const pagination = raw.pagination ?? raw.data?.pagination ?? {}

  return {
    items: (rows ?? []).map((item, index) => normalizeInventoryItem(item, index)),
    pagination: {
      limit: params.limit ?? 10,
      offset: params.offset ?? 0,
      ...pagination,
    },
  }
}

export async function getStockCard(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.product_id) qs.set('product_id', params.product_id)
  if (params.warehouse_id) qs.set('warehouse_id', params.warehouse_id)

  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const url = `/api/inventory/stock-card${queryString}`
  console.log('[StockCard] REQUEST URL:', url)
  console.log('[StockCard] PARAMS:', params)

  if (!token) {
    console.log('[StockCard] No token - returning DUMMY data')
    return {
      items: DUMMY_STOCK_CARD,
      total: DUMMY_STOCK_CARD.length,
    }
  }

  const raw = await apiFetch(url, { token })
  console.log('[StockCard] RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load stock card')

  const transactions = raw.data?.transactions ?? raw.data?.items ?? raw.data?.data ?? []
  const rows = Array.isArray(transactions) ? transactions : []
  console.log('[StockCard] ROWS:', rows)

  return {
    items: (rows ?? []).map((item, index) => normalizeStockCardItem(item, index)),
    total: rows?.length ?? 0,
  }
}
