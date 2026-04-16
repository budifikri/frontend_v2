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
  const payload = {
    enabled: Boolean(scheduleData?.enabled),
    schedule: scheduleData?.schedule || '0 2 * * *',
    retention_days: Number(scheduleData?.retention_days || 7),
    frequency: scheduleData?.frequency || 'daily',
    day: scheduleData?.day !== undefined ? String(scheduleData.day) : '',
    hour: scheduleData?.hour !== undefined ? String(scheduleData.hour) : '',
  }

  const result = await apiFetch('/api/backup/schedule', {
    method: 'POST',
    token,
    body: payload,
  })
  if (!result.success) {
    throw new Error(result.error || result.message || 'Gagal menyimpan schedule')
  }
  return result.data
}

export async function downloadBackup(token, filename) {
  const encoded = encodeURIComponent(filename)
  const response = await fetch(`${baseUrl}/api/backup/download/${encoded}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    let message = 'Gagal download backup'
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const errorJson = await response.json().catch(() => null)
      message = errorJson?.error || errorJson?.message || message
    }
    throw new Error(message)
  }

  const blob = await response.blob()
  const header = response.headers.get('content-disposition') || ''
  const match = header.match(/filename="?([^";]+)"?/i)
  const downloadName = match?.[1] || filename

  return { blob, filename: downloadName }
}

export async function validateBackup(token, filename) {
  const result = await apiFetch(`/api/restore/validate?filename=${encodeURIComponent(filename)}`, {
    method: 'POST',
    token,
  })
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

export async function deleteData(token, scope) {
  const result = await apiFetch('/api/backup/delete', {
    method: 'POST',
    token,
    body: { scope, backuped: true },
  })
  if (!result.success) {
    throw new Error(result.error || result.message || 'Gagal menghapus data')
  }
  return result.data
}

export async function getTableCounts(token, scope) {
  const result = await apiFetch(`/api/backup/count/${scope}`, { token })
  if (!result.success) {
    throw new Error(result.error || result.message || 'Gagal mengambil jumlah data')
  }
  return result.data
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
