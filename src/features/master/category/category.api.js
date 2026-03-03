import { apiFetch } from '../../../shared/http'

export async function listCategories(token, params = {}) {
  const qs = new URLSearchParams()
  const keyword = params.search?.trim?.()
  if (keyword) {
    qs.set('search', keyword)
    qs.set('keyword', keyword)
    qs.set('q', keyword)
  }
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))
  if (params.include_inactive) qs.set('include_inactive', 'true')
  if (params.is_active !== undefined) qs.set('is_active', String(params.is_active))

  const query = qs.toString() ? `?${qs.toString()}` : ''
  const raw = await apiFetch(`/api/categories${query}`, { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load categories')

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

export async function createCategory(token, input) {
  const raw = await apiFetch('/api/categories', { method: 'POST', token, body: input })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Create category failed')
  return raw
}

function stripUndefined(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out
}

export async function updateCategory(token, id, input) {
  const raw = await apiFetch(`/api/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: stripUndefined(input),
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Update category failed')
  return raw
}

export async function deactivateCategory(token, id) {
  const raw = await apiFetch(`/api/categories/${encodeURIComponent(id)}`, { method: 'DELETE', token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Delete category failed')
  return raw
}
