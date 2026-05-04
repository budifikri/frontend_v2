import { apiFetch } from '../../../shared/http'

export async function listPaket(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.is_active !== undefined) qs.set('active', String(params.is_active))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const raw = await apiFetch(`/api/paket?${qs.toString()}`, { token })
  if (!raw.success) throw new Error(raw.error || 'Failed to load paket')

  return {
    items: Array.isArray(raw.data) ? raw.data : (raw.data?.items ?? []),
    pagination: raw.pagination ?? {}
  }
}

export async function getPaket(token, id) {
  const raw = await apiFetch(`/api/paket/${encodeURIComponent(id)}`, { token })
  if (!raw.success) throw new Error(raw.error || 'Failed to load paket')
  return raw.data ?? raw
}

export async function createPaket(token, input) {
  const raw = await apiFetch('/api/paket', {
    method: 'POST',
    token,
    body: input,
  })
  if (!raw.success) throw new Error(raw.error || 'Create paket failed')
  return raw
}

export async function updatePaket(token, id, input) {
  const raw = await apiFetch(`/api/paket/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: input,
  })
  if (!raw.success) throw new Error(raw.error || 'Update paket failed')
  return raw
}

export async function deletePaket(token, id) {
  const raw = await apiFetch(`/api/paket/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
  if (!raw.success) throw new Error(raw.error || 'Delete paket failed')
  return raw
}
