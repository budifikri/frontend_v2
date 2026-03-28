import { apiFetch } from '../../../shared/http'

export async function createSale(token, saleData) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  const url = `${baseUrl}/api/sales`
  console.log('API URL:', url)
  console.log('API Token:', token ? 'Token exists' : 'NO TOKEN')
  console.log('Sale data:', saleData)
  
  const raw = await apiFetch('/api/sales', {
    method: 'POST',
    token,
    body: saleData,
  })
  if (!raw.success) {
    const msg = raw.error || raw.message || raw.details || 'Failed to create sale'
    throw new Error(msg)
  }
  return raw
}
