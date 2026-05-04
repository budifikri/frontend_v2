import { apiFetch } from '../../../shared/http'

function normalizeList(raw) {
  const items = Array.isArray(raw.data) ? raw.data : raw.data?.items ?? raw.data?.data ?? []
  return { items, pagination: raw.pagination ?? raw.data?.pagination ?? {} }
}

export async function listBusinessTypes(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.is_active !== undefined) qs.set('is_active', String(params.is_active))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))
  const raw = await apiFetch(`/api/business-types${qs.toString() ? `?${qs.toString()}` : ''}`, { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load business types')
  return normalizeList(raw)
}

export async function createBusinessType(token, input) {
  const raw = await apiFetch('/api/business-types', { method: 'POST', token, body: input })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to create business type')
  return raw.data
}

export async function updateBusinessType(token, id, input) {
  const raw = await apiFetch(`/api/business-types/${encodeURIComponent(id)}`, { method: 'PUT', token, body: input })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to update business type')
  return raw.data
}
