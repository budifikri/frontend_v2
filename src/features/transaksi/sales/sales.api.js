import { apiFetch } from '../../../shared/http'

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
