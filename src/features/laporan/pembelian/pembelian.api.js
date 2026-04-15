import { apiFetch } from '../../../shared/http'

const endpoint = '/api/purchases'

function normalizePurchaseItem(raw, index) {
  const qtyPo = Number(raw?.qty_po ?? (raw?.quantity || 0))
  const qtyReceive = Number(raw?.qty_receive || 0)

  return {
    id: raw?.id || `item-${index}`,
    product_id: raw?.product_id || '',
    product_name: raw?.product_name || raw?.product?.name || '-',
    sku: raw?.sku || raw?.product_sku || '-',
    quantity: qtyPo,
    qty_receive: qtyReceive,
    unit_price: Number(raw?.unit_price || 0),
    discount: Number(raw?.discount || 0),
    tax_rate: Number(raw?.tax_rate || 0),
    line_total: Number(raw?.line_total || (qtyPo * (raw?.unit_price || 0))),
    unit: raw?.unit || raw?.unit_name || '-',
  }
}

function normalizePurchase(raw) {
  const items = (raw?.items ?? []).map((item, index) => normalizePurchaseItem(item, index))

  const statusValue = raw?.status_po || raw?.status || 'draft'

  const normalizeStatusPo = (value) => {
    const v = String(value || '').toLowerCase()
    if (v === 'approve') return 'approved'
    return v
  }

  return {
    id: raw?.id || '',
    po_number: raw?.po_number || raw?.purchase_number || '',
    supplier_id: raw?.supplier_id || '',
    supplier_name: raw?.supplier_name || raw?.supplier?.name || '-',
    warehouse_id: raw?.warehouse_id || '',
    warehouse_name: raw?.warehouse_name || raw?.warehouse?.name || '-',
    status: normalizeStatusPo(statusValue),
    po_date: raw?.po_date || raw?.order_date || '',
    expected_date: raw?.expected_date || raw?.expected_delivery || '',
    notes: raw?.notes || '',
    subtotal: Number(raw?.subtotal || 0),
    discount_total: Number(raw?.discount_total || 0),
    tax_total: Number(raw?.tax_total || 0),
    grand_total: Number(raw?.grand_total || raw?.total_amount || 0),
    created_at: raw?.created_at || '',
    updated_at: raw?.updated_at || '',
    items,
  }
}

function buildPurchasesQuery(params = {}, includePaging = true) {
  const qs = new URLSearchParams()
  if (params.warehouse_id) qs.set('warehouse_id', params.warehouse_id)
  if (params.supplier_id) qs.set('supplier_id', params.supplier_id)
  if (params.status) qs.set('status', params.status)
  if (params.date_from) qs.set('date_from', params.date_from)
  if (params.date_to) qs.set('date_to', params.date_to)
  if (params.search) qs.set('search', params.search)

  if (includePaging) {
    if (params.limit !== undefined) qs.set('limit', String(params.limit))
    if (params.offset !== undefined) qs.set('offset', String(params.offset))
  }

  return qs.toString() ? `?${qs}` : ''
}

export async function listPurchasesReport(params = {}, token) {
  const query = buildPurchasesQuery(params, true)
  const response = await apiFetch(`${endpoint}${query}`, { token })

  if (response.success) {
    const rows = Array.isArray(response.data)
      ? response.data
      : (response.items || response.data?.items || response.data?.data || [])
    const pagination = response.pagination || response.data?.pagination || {}

    return {
      success: true,
      items: rows.map(item => normalizePurchase(item)),
      pagination: {
        total: Number(pagination.total ?? rows.length ?? 0),
        has_more: Boolean(pagination.has_more ?? pagination.hasMore ?? false),
        limit: params.limit || 50,
        offset: params.offset || 0,
      },
    }
  }

  return {
    success: false,
    items: [],
    pagination: { total: 0, has_more: false, limit: 50, offset: 0 },
    message: response.message || 'Failed to fetch purchases',
  }
}

export async function getPurchaseDetail(id, token) {
  const response = await apiFetch(`${endpoint}/${encodeURIComponent(id)}`, { token })

  if (response.success) {
    return {
      success: true,
      data: normalizePurchase(response.data || response),
    }
  }

  return {
    success: false,
    message: response.message || 'Failed to fetch purchase detail',
  }
}

export function calculateSummary(purchases) {
  const totalRows = purchases.length
  const totalPembelian = purchases.reduce((sum, p) => sum + (p.grand_total || 0), 0)
  return { totalRows, totalPembelian }
}
