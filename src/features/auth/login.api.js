import { apiFetch } from '../../shared/http'
import { extractRoleFromLoginData, extractTokenFromLoginData } from '../../shared/auth'

export async function login(input) {
  const raw = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: input,
  })

  if (!raw.success) {
    throw new Error(raw.error || raw.message || 'Login failed')
  }

  const token = extractTokenFromLoginData(raw.data)
  if (!token) {
    throw new Error('Login succeeded but token is missing in response')
  }

  const role = extractRoleFromLoginData(raw.data)
  const username = raw.data?.username ?? raw.data?.user?.username ?? raw.data?.user?.name ?? input.username
  const companyName = raw.data?.company?.name ?? raw.data?.company_name ?? null
  return { token, role, username, companyName, raw }
}
