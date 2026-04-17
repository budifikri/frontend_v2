import { apiFetch } from '../../shared/http'

export async function getTelegramConfig(token) {
  const result = await apiFetch('/api/telegram', { token })
  if (!result.success) {
    throw new Error(result.error || result.message || 'Gagal mengambil konfigurasi Telegram')
  }
  return result.data
}

export async function saveTelegramConfig(token, config) {
  const result = await apiFetch('/api/telegram', {
    method: 'POST',
    token,
    body: config,
  })
  if (!result.success) {
    throw new Error(result.error || result.message || 'Gagal menyimpan konfigurasi Telegram')
  }
  return result.data
}

export async function testTelegramConnection(token, telegramId, apiKey) {
  const result = await apiFetch('/api/telegram/test', {
    method: 'POST',
    token,
    body: {
      telegram_id: telegramId,
      api_key: apiKey,
    },
  })
  if (!result.success) {
    throw new Error(result.error || result.message || 'Koneksi gagal')
  }
  return result.data
}