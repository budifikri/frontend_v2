import { apiFetch } from '../../../shared/http'

export async function getCurrentCashDrawer(token) {
  try {
    const raw = await apiFetch('/api/cash-drawers/current', { token })
    return raw
  } catch (err) {
    if (err.message === 'No open cash drawer found' || err.message?.includes('No open cash drawer')) {
      return { success: false, message: 'No open cash drawer' }
    }
    throw err
  }
}

export async function openCashDrawer(token, input) {
  const raw = await apiFetch('/api/cash-drawers/open', {
    method: 'POST',
    token,
    body: input,
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to open cash drawer')
  return raw
}
