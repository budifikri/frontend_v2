import { apiFetch } from '../../../shared/http'

export async function listUnits(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.include_inactive) qs.set('include_inactive', 'true')
  if (params.is_active !== undefined) qs.set('is_active', String(params.is_active))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const raw = await apiFetch(`/api/units${queryString}`, { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load units')

  const items = Array.isArray(raw.data) ? raw.data : (raw.data?.items ?? raw.data?.data ?? [])
  return items ?? []
}

export async function createUnit(token, input) {
  const raw = await apiFetch('/api/units', { method: 'POST', token, body: input })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Create unit failed')
  return raw
}

function stripUndefined(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out
}

export async function updateUnit(token, id, input) {
  const raw = await apiFetch(`/api/units/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: stripUndefined(input),
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Update unit failed')
  return raw
}

export async function deleteUnit(token, id) {
  const raw = await apiFetch(`/api/units/${encodeURIComponent(id)}`, { method: 'DELETE', token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Delete unit failed')
  return raw
}
