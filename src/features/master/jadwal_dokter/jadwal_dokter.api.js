import { apiFetch } from '../../../shared/http'

export async function listJadwalDokter(token, params = {}) {
  const qs = new URLSearchParams()
  const keyword = params.search?.trim?.()
  if (keyword) {
    qs.set('search', keyword)
  }
  if (params.dokter_id) qs.set('dokter_id', params.dokter_id)
  if (params.hari) qs.set('hari', params.hari)
  if (params.is_active !== undefined) qs.set('is_active', String(params.is_active))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const raw = await apiFetch(`/api/jadwal-dokter?${qs.toString()}`, { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load jadwal dokter')

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

export async function createJadwalDokter(token, input) {
  const raw = await apiFetch('/api/jadwal-dokter', { method: 'POST', token, body: input })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Create jadwal dokter failed')
  return raw
}

function stripUndefined(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out
}

export async function updateJadwalDokter(token, id, input) {
  const raw = await apiFetch(`/api/jadwal-dokter/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: stripUndefined(input),
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Update jadwal dokter failed')
  return raw
}

export async function deleteJadwalDokter(token, id) {
  const raw = await apiFetch(`/api/jadwal-dokter/${encodeURIComponent(id)}`, { method: 'DELETE', token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Delete jadwal dokter failed')
  return raw
}

export async function getDokters(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const raw = await apiFetch(`/api/dokters?${qs.toString()}`, { token })
  if (!raw.success) throw new Error(raw.error || 'Failed to load dokters')
  return Array.isArray(raw.data) ? raw.data : (raw.data?.items ?? raw.data?.data ?? [])
}
