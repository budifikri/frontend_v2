import { apiFetch } from '../../../shared/http'

export async function listDokters(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.tipe) qs.set('tipe', params.tipe)
  if (params.active !== undefined) qs.set('active', String(params.active))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const raw = await apiFetch(`/api/dokters?${qs.toString()}`, { token })
  if (!raw.success) throw new Error(raw.error || 'Failed to load dokters')

  const items = Array.isArray(raw.data)
    ? raw.data
    : Array.isArray(raw.data?.items)
      ? raw.data.items
      : []

  return {
    items,
    pagination: raw.pagination ?? {}
  }
}

export async function createDokter(token, input) {
  const raw = await apiFetch('/api/dokters', { method: 'POST', token, body: input })
  if (!raw.success) throw new Error(raw.error || 'Create failed')
  return raw
}

export async function updateDokter(token, id, input) {
  const raw = await apiFetch(`/api/dokters/${id}`, { method: 'PUT', token, body: input })
  if (!raw.success) throw new Error(raw.error || 'Update failed')
  return raw
}

export async function deleteDokter(token, id) {
  const raw = await apiFetch(`/api/dokters/${id}`, { method: 'DELETE', token })
  if (!raw.success) throw new Error(raw.error || 'Delete failed')
  return raw
}
