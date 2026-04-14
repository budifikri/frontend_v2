import { apiFetch } from '../../../shared/http'

const endpoint = '/sales'

export async function listSales(params = {}, token) {
  return apiFetch('GET', endpoint, params, token)
}

export async function getSaleById(id, token) {
  return apiFetch('GET', `${endpoint}/${id}`, {}, token)
}