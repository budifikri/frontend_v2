import { apiFetch } from '../../../shared/http'

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizePurchaseReturnItem(raw, index) {
  const lineTotalRaw = raw?.line_total
  const amountRaw = raw?.amount
  const subtotalRaw = raw?.subtotal
  
  const hasValidLineTotal = lineTotalRaw !== undefined && lineTotalRaw !== null && Number(lineTotalRaw) !== 0
  const hasValidAmount = amountRaw !== undefined && amountRaw !== null && Number(amountRaw) !== 0
  const hasValidSubtotal = subtotalRaw !== undefined && subtotalRaw !== null && Number(subtotalRaw) !== 0
  
  const lineTotal = hasValidLineTotal ? lineTotalRaw : 
                    hasValidAmount ? amountRaw : 
                    hasValidSubtotal ? subtotalRaw : 0
  
  return {
    id: raw?.id || `item-${index}`,
    product_id: raw?.product_id || '',
    product_name: raw?.product_name || raw?.product?.name || '-',
    sku: raw?.sku || raw?.product?.sku || '-',
    quantity: toNumber(raw?.quantity ?? raw?.qty ?? 0),
    unit_price: toNumber(raw?.unit_price ?? raw?.price ?? 0),
    discount: toNumber(raw?.discount ?? 0),
    tax_rate: toNumber(raw?.tax_rate ?? raw?.tax ?? 0),
    line_total: toNumber(lineTotal),
    amount: toNumber(amountRaw ?? lineTotal),
  }
}

function normalizePurchaseReturn(raw) {
  const items = (raw?.items ?? []).map((item, idx) => normalizePurchaseReturnItem(item, idx))
  
  const rawSubtotal = raw?.subtotal
  const rawTax = raw?.tax
  const rawGrandTotal = raw?.grand_total
  const rawTotalAmount = raw?.total_amount
  
  const subtotal = (rawSubtotal !== undefined && rawSubtotal !== null) ? rawSubtotal : items.reduce((sum, item) => sum + item.line_total, 0)
  const tax = (rawTax !== undefined && rawTax !== null) ? rawTax : items.reduce((sum, item) => sum + (item.line_total * item.tax_rate / 100), 0)
  const grand_total = (rawGrandTotal !== undefined && rawGrandTotal !== null) ? rawGrandTotal : 
                     (rawTotalAmount !== undefined && rawTotalAmount !== null) ? rawTotalAmount : 
                     subtotal + tax

  return {
    id: raw?.id || '',
    pr_number: raw?.pr_number || raw?.reference || raw?.return_number || '',
    po_number: raw?.po_number || raw?.purchase_order_number || '',
    po_id: raw?.po_id || raw?.purchase_order_id || '',
    supplier_id: raw?.supplier_id || '',
    supplier_name: raw?.supplier_name || raw?.supplier?.name || '-',
    warehouse_id: raw?.warehouse_id || '',
    warehouse_name: raw?.warehouse_name || raw?.warehouse?.name || '-',
    pr_date: raw?.pr_date || raw?.return_date || raw?.date || '',
    status: raw?.status || 'draft',
    notes: raw?.notes || '',
    items,
    subtotal,
    tax,
    grand_total,
  }
}

const DUMMY_PURCHASE_RETURNS = [
  {
    id: 'PR001',
    pr_number: 'PR-20260315-001',
    po_number: 'PO-20260307-001',
    supplier_name: 'PT. Supplier Utama',
    warehouse_name: 'Gudang Utama',
    pr_date: '2026-03-15T10:00:00Z',
    status: 'draft',
    grand_total: 150000,
  },
]

export async function listPurchaseReturns(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.status) qs.set('status', params.status)
  if (params.date_from) qs.set('date_from', params.date_from)
  if (params.date_to) qs.set('date_to', params.date_to)
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const url = `/api/purchase-returns${queryString}`
  console.log('[PurchaseReturnAPI] listPurchaseReturns REQUEST URL:', url)

  if (!token) {
    console.log('[PurchaseReturnAPI] No token - using DUMMY data')
    let items = [...DUMMY_PURCHASE_RETURNS]

    if (params.search) {
      const keyword = params.search.toLowerCase()
      items = items.filter(item =>
        item.pr_number.toLowerCase().includes(keyword) ||
        item.po_number.toLowerCase().includes(keyword) ||
        item.supplier_name.toLowerCase().includes(keyword)
      )
    }
    if (params.status && params.status !== 'all') {
      items = items.filter(item => item.status === params.status)
    }

    const total = items.length
    const limit = params.limit || 10
    const offset = params.offset || 0
    const sliced = items.slice(offset, offset + limit)

    return {
      items: sliced.map(item => normalizePurchaseReturn(item)),
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
      },
    }
  }

  const raw = await apiFetch(url, { token })
  console.log('[PurchaseReturnAPI] listPurchaseReturns RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load purchase returns')

  const rows = Array.isArray(raw.data) ? raw.data : (raw.data?.items ?? raw.data?.data ?? [])
  const pagination = raw.pagination ?? raw.data?.pagination ?? {}

  return {
    items: (rows ?? []).map(item => normalizePurchaseReturn(item)),
    pagination: {
      limit: params.limit ?? 10,
      offset: params.offset ?? 0,
      total: Number(pagination.total ?? 0),
      has_more: Boolean(pagination.has_more),
    },
  }
}

export async function getPurchaseReturn(token, id) {
  const url = `/api/purchase-returns/${encodeURIComponent(id)}`
  console.log('[PurchaseReturnAPI] getPurchaseReturn REQUEST URL:', url)

  if (!token) {
    console.log('[PurchaseReturnAPI] No token - using DUMMY data')
    const record = DUMMY_PURCHASE_RETURNS.find(r => r.id === id || r.pr_number === id)
    if (!record) {
      throw new Error('Purchase return not found')
    }
    return normalizePurchaseReturn(record)
  }

  const raw = await apiFetch(url, { token })
  console.log('[PurchaseReturnAPI] getPurchaseReturn RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to get purchase return')

  return normalizePurchaseReturn(raw.data || raw)
}

export async function createPurchaseReturn(token, input) {
  const url = '/api/purchase-returns'
  console.log('[PurchaseReturnAPI] createPurchaseReturn REQUEST URL:', url)
  console.log('[PurchaseReturnAPI] createPurchaseReturn PAYLOAD:', input)

  if (!token) {
    console.log('[PurchaseReturnAPI] No token - simulating create')
    const newRecord = {
      id: `PR${Date.now()}`,
      pr_number: input.pr_number || generateReturnNumber(),
      ...input,
      status: 'draft',
      created_at: new Date().toISOString(),
    }
    DUMMY_PURCHASE_RETURNS.unshift(newRecord)
    return {
      success: true,
      data: normalizePurchaseReturn(newRecord),
      message: 'Purchase return created successfully',
    }
  }

  const raw = await apiFetch(url, {
    method: 'POST',
    token,
    body: input,
  })
  console.log('[PurchaseReturnAPI] createPurchaseReturn RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to create purchase return')

  return raw
}

export async function updatePurchaseReturn(token, id, input) {
  const url = `/api/purchase-returns/${encodeURIComponent(id)}`
  console.log('[PurchaseReturnAPI] updatePurchaseReturn REQUEST URL:', url)
  console.log('[PurchaseReturnAPI] updatePurchaseReturn PAYLOAD:', input)

  if (!token) {
    console.log('[PurchaseReturnAPI] No token - simulating update')
    const index = DUMMY_PURCHASE_RETURNS.findIndex(r => r.id === id || r.pr_number === id)
    if (index === -1) {
      throw new Error('Purchase return not found')
    }
    const updatedRecord = {
      ...DUMMY_PURCHASE_RETURNS[index],
      ...input,
      updated_at: new Date().toISOString(),
    }
    DUMMY_PURCHASE_RETURNS[index] = updatedRecord
    return {
      success: true,
      data: normalizePurchaseReturn(updatedRecord),
      message: 'Purchase return updated successfully',
    }
  }

  const raw = await apiFetch(url, {
    method: 'PUT',
    token,
    body: input,
  })
  console.log('[PurchaseReturnAPI] updatePurchaseReturn RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to update purchase return')

  return raw
}

export async function updatePurchaseReturnStatus(token, id, status) {
  const url = `/api/purchase-returns/${encodeURIComponent(id)}/status`
  console.log('[PurchaseReturnAPI] updatePurchaseReturnStatus REQUEST URL:', url)
  console.log('[PurchaseReturnAPI] updatePurchaseReturnStatus PAYLOAD:', { status })

  if (!token) {
    console.log('[PurchaseReturnAPI] No token - simulating status update')
    const index = DUMMY_PURCHASE_RETURNS.findIndex(r => r.id === id || r.pr_number === id)
    if (index === -1) {
      throw new Error('Purchase return not found')
    }
    DUMMY_PURCHASE_RETURNS[index].status = status
    DUMMY_PURCHASE_RETURNS[index].updated_at = new Date().toISOString()
    return {
      success: true,
      data: normalizePurchaseReturn(DUMMY_PURCHASE_RETURNS[index]),
      message: `Purchase return status updated to ${status}`,
    }
  }

  const raw = await apiFetch(url, {
    method: 'PUT',
    token,
    body: { status },
  })
  console.log('[PurchaseReturnAPI] updatePurchaseReturnStatus RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to update purchase return status')

  return raw
}

export async function deletePurchaseReturn(token, id) {
  const url = `/api/purchase-returns/${encodeURIComponent(id)}`
  console.log('[PurchaseReturnAPI] deletePurchaseReturn REQUEST URL:', url)

  if (!token) {
    console.log('[PurchaseReturnAPI] No token - simulating delete')
    const index = DUMMY_PURCHASE_RETURNS.findIndex(r => r.id === id || r.pr_number === id)
    if (index === -1) {
      throw new Error('Purchase return not found')
    }
    DUMMY_PURCHASE_RETURNS.splice(index, 1)
    return {
      success: true,
      message: 'Purchase return deleted successfully',
    }
  }

  const raw = await apiFetch(url, {
    method: 'DELETE',
    token,
  })
  console.log('[PurchaseReturnAPI] deletePurchaseReturn RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to delete purchase return')

  return raw
}

export function generateReturnNumber() {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
  const randomNum = Math.floor(Math.random() * 999) + 1
  return `PR-${dateStr}-${String(randomNum).padStart(3, '0')}`
}

export async function listSuppliers(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.offset) qs.set('offset', String(params.offset))

  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const url = `/api/suppliers${queryString}`

  const raw = await apiFetch(url, { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load suppliers')

  const items = raw.data?.items ?? raw.data?.data ?? raw.data ?? []
  return { items }
}

export async function listPurchaseOrders(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.status) qs.set('status', params.status)
  if (params.supplier_id) qs.set('supplier_id', params.supplier_id)
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.offset) qs.set('offset', String(params.offset))

  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const url = `/api/purchases${queryString}`

  const raw = await apiFetch(url, { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load purchase orders')

  const items = raw.data?.items ?? raw.data?.data ?? raw.data ?? []
  return { items }
}
