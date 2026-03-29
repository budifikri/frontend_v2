import { apiFetch } from '../../../shared/http'

function buildQuery(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value))
    }
  })
  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export async function listSales(token, params = {}) {
  const raw = await apiFetch(`/api/sales${buildQuery(params)}`, { token })
  if (!raw.success) {
    throw new Error(raw.error || raw.message || 'Failed to get sales list')
  }
  return raw
}

export async function getSaleById(token, saleId) {
  const raw = await apiFetch(`/api/sales/${encodeURIComponent(saleId)}`, { token })
  if (!raw.success) {
    throw new Error(raw.error || raw.message || 'Failed to get sale detail')
  }
  return raw
}

export async function createSale(token, saleData) {
  const raw = await apiFetch('/api/sales', {
    method: 'POST',
    token,
    body: saleData,
  })
  if (!raw.success) {
    const msg = raw.error || raw.message || raw.details || 'Failed to create sale'
    throw new Error(msg)
  }
  return raw
}
