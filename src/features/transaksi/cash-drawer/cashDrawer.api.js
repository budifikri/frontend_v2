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

export async function getCashDrawerSummary(token, drawerId) {
  const raw = await apiFetch(`/api/cash-drawers/${encodeURIComponent(drawerId)}/summary`, { token })
  return raw
}

export async function closeCashDrawer(token, drawerId, closingBalance, notes) {
  const raw = await apiFetch(`/api/cash-drawers/${encodeURIComponent(drawerId)}/close`, {
    method: 'POST',
    token,
    body: {
      closing_balance: closingBalance,
      notes: notes,
    },
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to close cash drawer')
  return raw
}

export async function cashInDrawer(token, drawerId, amount, reason) {
  const raw = await apiFetch(`/api/cash-drawers/${encodeURIComponent(drawerId)}/cash-in`, {
    method: 'POST',
    token,
    body: {
      amount: amount,
      reason: reason,
    },
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to cash in')
  return raw
}

export async function cashOutDrawer(token, drawerId, amount, reason) {
  const raw = await apiFetch(`/api/cash-drawers/${encodeURIComponent(drawerId)}/cash-out`, {
    method: 'POST',
    token,
    body: {
      amount: amount,
      reason: reason,
    },
  })
  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to cash out')
  return raw
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
