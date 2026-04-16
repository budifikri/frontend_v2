import { apiFetch } from '../../shared/http'

const baseUrl = import.meta.env.VITE_API_BASE_URL || ''

export async function createBackup(token) {
  const result = await apiFetch('/api/backup', {
    method: 'POST',
    token,
  })
  if (!result.success) {
    throw new Error(result.error || result.message || 'Gagal membuat backup')
  }
  return result.data
}

export async function listBackups(token) {
  const result = await apiFetch('/api/backup/list', { token })
  if (!result.success) {
    throw new Error(result.error || result.message || 'Gagal mengambil daftar backup')
  }
  return result.data || []
}

export async function deleteBackup(token, filename) {
  const result = await apiFetch(`/api/backup/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    token,
  })
  if (!result.success) {
    throw new Error(result.error || result.message || 'Gagal menghapus backup')
  }
  return result.data
}

export async function getSchedule(token) {
  const result = await apiFetch('/api/backup/schedule', { token })
  if (!result.success) {
    throw new Error(result.error || result.message || 'Gagal mengambil schedule')
  }
  return result.data
}

export async function updateSchedule(token, scheduleData) {
  const result = await apiFetch('/api/backup/schedule', {
    method: 'POST',
    token,
    body: scheduleData,
  })
  if (!result.success) {
    throw new Error(result.error || result.message || 'Gagal menyimpan schedule')
  }
  return result.data
}

export function getDownloadUrl(filename) {
  const encoded = encodeURIComponent(filename)
  return `${baseUrl}/api/backup/download/${encoded}`
}

export async function validateBackup(token, filename) {
  const result = await apiFetch(`/api/restore/validate?filename=${encodeURIComponent(filename)}`, { token })
  if (!result.success) {
    throw new Error(result.error || result.message || 'Gagal validasi file backup')
  }
  return result.data
}

export async function restoreBackup(token, filename) {
  const result = await apiFetch('/api/restore', {
    method: 'POST',
    token,
    body: { filename, confirm: true },
  })
  if (!result.success) {
    throw new Error(result.error || result.message || 'Gagal restore backup')
  }
  return result.data
}

export function connectRestoreProgress(token) {
  return new EventSource(`${baseUrl}/api/restore/progress?token=${token}`)
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatNumber(num) {
  if (!num) return '0'
  return num.toLocaleString('id-ID')
}

export function formatSchedule(cron) {
  if (!cron) return 'Tidak dijadwalkan'
  const parts = cron.split(' ')
  if (parts.length < 5) return cron

  const [minute, hour, , , dayOfWeek] = parts

  const dayNames = {
    '0': 'Minggu',
    '1': 'Senin',
    '2': 'Selasa',
    '3': 'Rabu',
    '4': 'Kamis',
    '5': 'Jumat',
    '6': 'Sabtu',
    '7': 'Minggu',
  }

  if (dayOfWeek === '*') {
    return `Setiap hari pukul ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
  }

  const days = dayOfWeek.split(',').map(d => dayNames[d] || d).join(', ')
  return `Setiap ${days} pukul ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
}

export function getFrequency(cron) {
  if (!cron) return 'daily'
  const parts = cron.split(' ')
  if (parts.length < 5) return 'daily'

  const [, , , , dayOfWeek] = parts

  if (dayOfWeek === '*') return 'daily'
  return 'weekly'
}

export function buildCronExpression(form) {
  const minute = '0'
  const hour = String(form.hour || 2)
  const dayOfMonth = '*'
  const month = '*'
  let dayOfWeek = '*'

  if (form.frequency === 'weekly') {
    dayOfWeek = String(form.day || 0)
  }

  return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`
}
