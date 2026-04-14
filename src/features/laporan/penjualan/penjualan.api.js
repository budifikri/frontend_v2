import { apiFetch } from '../../../shared/http'

const endpoint = '/sales'

export async function listSales(params = {}, token) {
  const qs = new URLSearchParams()
  if (params.warehouse_id) qs.set('warehouse_id', params.warehouse_id)
  if (params.customer_id) qs.set('customer_id', params.customer_id)
  if (params.cashier_id) qs.set('cashier_id', params.cashier_id)
  if (params.status) qs.set('status', params.status)
  if (params.date_from) qs.set('date_from', params.date_from)
  if (params.date_to) qs.set('date_to', params.date_to)
  if (params.sale_number) qs.set('sale_number', params.sale_number)
  if (params.search) qs.set('search', params.search)
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const query = qs.toString() ? `?${qs}` : ''
  return apiFetch('GET', `${endpoint}${query}`, {}, token)
}

export async function getSaleById(id, token) {
  return apiFetch('GET', `${endpoint}/${id}`, {}, token)
}