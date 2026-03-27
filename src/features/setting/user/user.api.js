import { apiFetch } from '../../../shared/http'

function stripUndefined(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out
}

export async function listUsers(token, params = {}) {
  const qs = new URLSearchParams()
  const keyword = params.search?.trim?.()
  if (keyword) {
    qs.set('search', keyword)
    qs.set('keyword', keyword)
    qs.set('q', keyword)
  }
  if (params.include_inactive) qs.set('include_inactive', 'true')
  if (params.is_active !== undefined) qs.set('is_active', String(params.is_active))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const raw = await apiFetch(`/api/users${queryString}`, { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load users')

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

export async function createUser(token, input) {
  console.log('[UserAPI] createUser - input:', JSON.parse(JSON.stringify(input)))
  const raw = await apiFetch('/api/users', { method: 'POST', token, body: input })
  console.log('[UserAPI] createUser - response:', raw)
  if (!raw.success) throw new Error(raw.error || raw.message || 'Create user failed')
  return raw
}

export async function updateUser(token, id, input) {
  const raw = await apiFetch(`/api/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: stripUndefined(input),
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Update user failed')
  return raw
}

export async function deleteUser(token, id) {
  const raw = await apiFetch(`/api/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Delete user failed')
  return raw
}
