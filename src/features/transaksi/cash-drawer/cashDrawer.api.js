import { apiFetch } from '../../../shared/http'

export async function openCashDrawer(token, input) {
  const raw = await apiFetch('/api/cash-drawers/open', {
    method: 'POST',
    token,
    body: input,
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to open cash drawer')
  return raw
}
