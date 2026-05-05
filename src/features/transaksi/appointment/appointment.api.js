import { apiFetch } from '../../../shared/http'

export async function listAppointments(token, params = {}) {
  const qs = new URLSearchParams()
  if (params.date_from) qs.set('date_from', params.date_from)
  if (params.date_to) qs.set('date_to', params.date_to)
  if (params.status) qs.set('status', params.status)
  if (params.therapist_id) qs.set('therapist_id', params.therapist_id)
  if (params.patient_id) qs.set('patient_id', params.patient_id)
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const raw = await apiFetch(`/api/appointments?${qs.toString()}`, { token })
  if (!raw.success) throw new Error(raw.error || 'Failed to load appointments')

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

export async function getAppointment(token, id) {
  const raw = await apiFetch(`/api/appointments/${id}`, { token })
  if (!raw.success) throw new Error(raw.error || 'Failed to load appointment')
  return raw.data
}

export async function createAppointment(token, input) {
  const raw = await apiFetch('/api/appointments', { method: 'POST', token, body: input })
  if (!raw.success) throw new Error(raw.error || 'Create failed')
  return raw
}

export async function updateAppointment(token, id, input) {
  const raw = await apiFetch(`/api/appointments/${id}`, { method: 'PUT', token, body: input })
  if (!raw.success) throw new Error(raw.error || 'Update failed')
  return raw
}

export async function deleteAppointment(token, id) {
  const raw = await apiFetch(`/api/appointments/${id}`, { method: 'DELETE', token })
  if (!raw.success) throw new Error(raw.error || 'Delete failed')
  return raw
}
