import { apiFetch } from '../../../shared/http'

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeInventoryItem(raw, index) {
  const productId = raw?.product_id ?? raw?.product?.id ?? ''
  const warehouseId = raw?.warehouse_id ?? raw?.warehouse?.id ?? ''

  return {
    id: raw?.id ?? `${productId || 'product'}-${warehouseId || 'warehouse'}-${index}`,
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

export async function listInventory(token, params = {}) {
  const qs = new URLSearchParams()
  const keyword = params.search?.trim?.()
  if (keyword) qs.set('search', keyword)
  if (params.warehouse_id) qs.set('warehouse_id', params.warehouse_id)
  if (params.product_id) qs.set('product_id', params.product_id)
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const raw = await apiFetch(`/api/inventory${queryString}`, { token })
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
