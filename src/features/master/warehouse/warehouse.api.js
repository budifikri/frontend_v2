import { apiFetch } from '../../../shared/http'

export async function listWarehouses(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.include_inactive) qs.set('include_inactive', 'true')
  if (params.is_active !== undefined) qs.set('is_active', String(params.is_active))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const raw = await apiFetch(`/api/warehouses${queryString}`, { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load warehouses')
  
  const items = Array.isArray(raw.data) ? raw.data : (raw.data?.items ?? raw.data?.data ?? [])
  const pagination = raw.pagination ?? raw.data?.pagination ?? {}

  return {
    items: items ?? [],
    pagination: {
      limit: params.limit ?? 10,
      offset: params.offset ?? 0,
      ...pagination,
    },
  }
}

export async function createWarehouse(token, input) {
  const raw = await apiFetch('/api/warehouses', { method: 'POST', token, body: input })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Create warehouse failed')
  return raw
}

function stripUndefined(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out
}

export async function updateWarehouse(token, id, input) {
  const raw = await apiFetch(`/api/warehouses/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: stripUndefined(input),
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Update warehouse failed')
  return raw
}

export async function deleteWarehouse(token, id) {
  const raw = await apiFetch(`/api/warehouses/${encodeURIComponent(id)}`, { method: 'DELETE', token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Delete warehouse failed')
  return raw
}
