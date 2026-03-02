import { apiFetch } from '../../../shared/http'

function stripUndefined(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out
}

export async function listCompanies(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.include_inactive) qs.set('include_inactive', 'true')
  if (params.is_active !== undefined) qs.set('is_active', String(params.is_active))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const raw = await apiFetch(`/api/companies${queryString}`, { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load companies')

  const items = Array.isArray(raw.data)
    ? raw.data
    : (raw.data?.items ?? raw.data?.data ?? [])
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

export async function createCompany(token, input) {
  const raw = await apiFetch('/api/companies', { method: 'POST', token, body: input })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Create company failed')
  return raw
}

export async function updateCompany(token, id, input) {
  const raw = await apiFetch(`/api/companies/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: stripUndefined(input),
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Update company failed')
  return raw
}

export async function deleteCompany(token, id) {
  const raw = await apiFetch(`/api/companies/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Delete company failed')
  return raw
}
