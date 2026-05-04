import { apiFetch } from '../../../shared/http'

function normalizeList(raw) {
  const items = Array.isArray(raw.data) ? raw.data : raw.data?.items ?? raw.data?.data ?? []
  return { items, pagination: raw.pagination ?? raw.data?.pagination ?? {} }
}

export async function listModulePackages(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.business_type) qs.set('business_type', params.business_type)
  if (params.is_active !== undefined) qs.set('is_active', String(params.is_active))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))
  const raw = await apiFetch(`/api/module-packages${qs.toString() ? `?${qs.toString()}` : ''}`, { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load module packages')
  return normalizeList(raw)
}

export async function createModulePackage(token, input) {
  const raw = await apiFetch('/api/module-packages', { method: 'POST', token, body: input })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to create module package')
  return raw.data
}

export async function updateModulePackage(token, id, input) {
  const raw = await apiFetch(`/api/module-packages/${encodeURIComponent(id)}`, { method: 'PUT', token, body: input })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to update module package')
  return raw.data
}
