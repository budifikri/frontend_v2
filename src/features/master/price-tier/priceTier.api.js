import { apiFetch } from '../../../shared/http'

export async function createPriceTier(token, input) {
  const raw = await apiFetch('/api/price-tiers', { method: 'POST', token, body: input })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to create price tier')
  return raw
}

export async function getPriceTier(token, productId) {
  const raw = await apiFetch(`/api/price-tiers/${encodeURIComponent(productId)}`, { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to get price tier')
  return raw
}

export async function updatePriceTier(token, productId, input) {
  const raw = await apiFetch(`/api/price-tiers/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    token,
    body: input,
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to update price tier')
  return raw
}

export async function deletePriceTier(token, productId) {
  const raw = await apiFetch(`/api/price-tiers/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    token,
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to delete price tier')
  return raw
}
