import { apiFetch } from '../../../shared/http'

// Treatment API functions
export async function listTreatments(token, params = {}) {
  const qs = new URLSearchParams()
  const keyword = params.search?.trim?.()
  if (keyword) {
    qs.set('search', keyword)
    qs.set('keyword', keyword)
    qs.set('q', keyword)
  }
  if (params.tag_id) qs.set('tag_id', params.tag_id)
  if (params.include_inactive) qs.set('include_inactive', 'true')
  if (params.is_active !== undefined) qs.set('is_active', String(params.is_active))
  else if (params.status) qs.set('status', params.status)
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const raw = await apiFetch(`/api/treatments?${qs.toString()}`, { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load treatments')

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

export async function createTreatment(token, input) {
  const raw = await apiFetch('/api/treatments', { method: 'POST', token, body: input })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Create treatment failed')
  return raw
}

function stripUndefined(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out
}

export async function updateTreatment(token, id, input) {
  const url = `/api/treatments/${encodeURIComponent(id)}`
  const raw = await apiFetch(url, {
    method: 'PUT',
    token,
    body: stripUndefined(input),
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Update treatment failed')
  return raw
}

export async function deleteTreatment(token, id) {
  const raw = await apiFetch(`/api/treatments/${encodeURIComponent(id)}`, { method: 'DELETE', token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Delete treatment failed')
  return raw
}

// Treatment Tags API functions
export async function listTreatmentTags(token) {
  const raw = await apiFetch('/api/treatment-tags', { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load treatment tags')
  return raw.data || []
}

export async function createTreatmentTag(token, name) {
  const raw = await apiFetch('/api/treatment-tags', { method: 'POST', token, body: { name } })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Create treatment tag failed')
  return raw
}

export async function updateTreatmentTag(token, id, name) {
  const raw = await apiFetch(`/api/treatment-tags/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: { name },
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Update treatment tag failed')
  return raw
}

export async function deleteTreatmentTag(token, id) {
  const raw = await apiFetch(`/api/treatment-tags/${encodeURIComponent(id)}`, { method: 'DELETE', token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Delete treatment tag failed')
  return raw
}
