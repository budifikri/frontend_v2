import { apiFetch } from '../../../shared/http'

export async function getMyModules(token) {
  const raw = await apiFetch('/api/me/modules', { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load modules')
  return raw.data ?? { business_type: null, modules: [], items: [] }
}

export async function getCompanyModules(token, companyId) {
  const raw = await apiFetch(`/api/companies/${encodeURIComponent(companyId)}/modules`, { token })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load company modules')
  return raw.data ?? { business_type: null, modules: [], items: [] }
}

export async function toggleCompanyModule(token, companyId, moduleCode, isActive) {
  const raw = await apiFetch(`/api/companies/${encodeURIComponent(companyId)}/modules/${encodeURIComponent(moduleCode)}/toggle`, {
    method: 'PATCH',
    token,
    body: { is_active: isActive },
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to update module')
  return raw.data ?? { business_type: null, modules: [], items: [] }
}
