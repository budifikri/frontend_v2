import { apiFetch } from '../../../shared/http'

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizePriceTierItem(raw, index) {
  return {
    id: raw?.id || `price-tier-${index}`,
    product_id: raw?.product_id || raw?.product?.id || '',
    sku: raw?.sku || raw?.product_sku || raw?.product?.sku || '-',
    product_name: raw?.product_name || raw?.product?.name || '-',
    tier_name: raw?.tier_name || '-',
    min_quantity: toNumber(raw?.min_quantity, 0),
    unit_price: toNumber(raw?.unit_price, 0),
    base_price: toNumber(raw?.base_price ?? raw?.retail_price, 0),
    is_active: raw?.is_active ?? true,
  }
}

function normalizePriceTierReportByProductItem(raw, index) {
  return {
    id: raw?.product_id || `price-tier-report-${index}`,
    product_id: raw?.product_id || '',
    sku: raw?.sku || '-',
    product_name: raw?.product_name || '-',
    unit_name: raw?.unit_name || '-',
    category_id: raw?.category_id || '',
    category_name: raw?.category_name || '-',
    retail_price: toNumber(raw?.retail_price, 0),
    grosir_1_price: toNumber(raw?.grosir_1_price, 0),
    grosir_1_qty: toNumber(raw?.grosir_1_qty, 0),
    grosir_2_price: toNumber(raw?.grosir_2_price, 0),
    grosir_2_qty: toNumber(raw?.grosir_2_qty, 0),
    grosir_3_price: toNumber(raw?.grosir_3_price, 0),
    grosir_3_qty: toNumber(raw?.grosir_3_qty, 0),
  }
}

export async function listPriceTiers(token, params = {}) {
  const qs = new URLSearchParams()
  const keyword = params.search?.trim?.()
  if (keyword) qs.set('search', keyword)
  if (params.product_id) qs.set('product_id', params.product_id)
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const query = qs.toString() ? `?${qs.toString()}` : ''
  const raw = await apiFetch(`/api/price-tiers${query}`, { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load price tiers')

  const rows = Array.isArray(raw.data) ? raw.data : (raw.data?.items ?? raw.data?.data ?? [])
  const pagination = raw.pagination ?? raw.data?.pagination ?? {}

  return {
    items: (rows ?? []).map((item, index) => normalizePriceTierItem(item, index)),
    pagination: {
      limit: params.limit ?? 10,
      offset: params.offset ?? 0,
      ...pagination,
    },
  }
}

export async function listPriceTierReportByProduct(token, params = {}) {
  const qs = new URLSearchParams()
  const keyword = params.search?.trim?.()
  if (keyword) qs.set('search', keyword)
  if (params.scope) qs.set('scope', params.scope)
  if (params.category_id) qs.set('category_id', params.category_id)
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const query = qs.toString() ? `?${qs.toString()}` : ''
  const raw = await apiFetch(`/api/price-tiers/report/by-product${query}`, { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load grouped price tiers')

  const rows = Array.isArray(raw.data) ? raw.data : (raw.data?.items ?? raw.data?.data ?? [])
  const pagination = raw.pagination ?? raw.data?.pagination ?? {}

  return {
    items: (rows ?? []).map((item, index) => normalizePriceTierReportByProductItem(item, index)),
    pagination: {
      limit: params.limit ?? 10,
      offset: params.offset ?? 0,
      ...pagination,
    },
  }
}

export async function createPriceTier(token, input) {
  const raw = await apiFetch('/api/price-tiers', { method: 'POST', token, body: input })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to create price tier')
  return raw
}

export async function getPriceTier(token, productId) {
  const raw = await apiFetch(`/api/price-tiers/product/${encodeURIComponent(productId)}`, { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to get price tier')
  return raw
}

export async function updatePriceTier(token, productId, input) {
  const raw = await apiFetch(`/api/price-tiers/product/${encodeURIComponent(productId)}`, {
    method: 'POST',
    token,
    body: input,
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to update price tier')
  return raw
}

export async function deletePriceTier(token, productId) {
  const raw = await apiFetch(`/api/price-tiers/product/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    token,
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to delete price tier')
  return raw
}
