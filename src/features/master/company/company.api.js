import { apiFetch } from '../../../shared/http'

function stripUndefined(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out
}

export async function listCompanies(token) {
  const raw = await apiFetch('/api/companies', { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load companies')

  const items = Array.isArray(raw.data)
    ? raw.data
    : (raw.data?.items ?? raw.data?.data ?? [])

  return items ?? []
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
