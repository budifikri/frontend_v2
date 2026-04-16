import { useState, useEffect } from 'react'
import { Toast } from '../../Toast'
import { useAuth } from '../../../shared/auth'
import {
  createBackup,
  listBackups,
  deleteBackup,
  getSchedule,
  updateSchedule,
  getDownloadUrl,
  validateBackup,
  restoreBackup,
  connectRestoreProgress,
  formatFileSize,
  formatDate,
  formatDateTime,
  formatNumber,
  formatSchedule,
  getFrequency,
  buildCronExpression,
} from '../../../features/setting/backup.api'
import './BackupRestore.css'

export function BackupRestore({ onExit }) {
  const { token, user } = useAuthContext()
  const [activeTab, setActiveTab] = useState('backup')
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [schedule, setSchedule] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    loadBackups()
    loadSchedule()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadBackups = async () => {
    setLoading(true)
    try {
      const data = await listBackups(token)
      setBackups(data)
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  const loadSchedule = async () => {
    try {
      const data = await getSchedule(token)
      setSchedule(data)
    } catch (err) {
      console.error('Failed to load schedule:', err)
    }
  }

  const handleCreateBackup = async () => {
    setCreating(true)
    try {
      await createBackup(token)
      setToast({ type: 'success', message: 'Backup berhasil dibuat!' })
      loadBackups()
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (filename) => {
    if (!window.confirm('Hapus backup ini?')) return
    try {
      await deleteBackup(token, filename)
      setToast({ type: 'success', message: 'Backup dihapus' })
      loadBackups()
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    }
  }

  const handleDownload = (filename) => {
    window.open(getDownloadUrl(filename), '_blank')
  }

  const handleSaveSchedule = async (data) => {
    try {
      await updateSchedule(token, data)
      setSchedule(data)
      setShowScheduleModal(false)
      setToast({ type: 'success', message: 'Schedule disimpan' })
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    }
  }

  return (
    <div className="backup-restore-container">
      <div className="backup-header master-header">
        <div className="backup-header-left">
          <button className="master-exit-btn" onClick={onExit}>
            <span className="material-icons-round">arrow_back</span>
          </button>
          <h2>Backup & Restore Database</h2>
        </div>
        <div className="company-badge">
          <span className="material-icons-round">business</span>
          {user?.companyName || 'Company'}
        </div>
      </div>

      <div className="backup-tabs">
        <button
          className={`backup-tab ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          <span className="material-icons-round">backup</span>
          Backup
        </button>
        <button
          className={`backup-tab ${activeTab === 'restore' ? 'active' : ''}`}
          onClick={() => setActiveTab('restore')}
        >
          <span className="material-icons-round">restore</span>
          Restore
        </button>
      </div>

      <div className="backup-content">
        {activeTab === 'backup' && (
          <BackupTab
            backups={backups}
            loading={loading}
            creating={creating}
            schedule={schedule}
            onCreate={handleCreateBackup}
            onDelete={handleDelete}
            onDownload={handleDownload}
            onOpenSchedule={() => setShowScheduleModal(true)}
          />
        )}
        {activeTab === 'restore' && (
          <RestoreTab
            backups={backups}
            token={token}
            onToast={setToast}
            onExit={onExit}
          />
        )}
      </div>

      {showScheduleModal && (
        <BackupScheduleModal
          schedule={schedule}
          onSave={handleSaveSchedule}
          onClose={() => setShowScheduleModal(false)}
        />
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

function useAuthContext() {
  const { auth } = useAuth()
  return {
    token: auth?.token,
    user: auth,
  }
}

function BackupTab({ backups, loading, creating, schedule, onCreate, onDelete, onDownload, onOpenSchedule }) {
  return (
    <div className="backup-tab-content">
      <div className="backup-hero-card master-form-card">
        <div className="backup-hero-icon">
          <span className="material-icons-round">backup</span>
        </div>
        <h3>Backup Database</h3>
        <p>Simpan data company ke file .sql untuk keamanan data</p>

        <button
          className="master-btn-save-primary backup-create-btn"
          onClick={onCreate}
          disabled={creating}
        >
          {creating ? (
            <>
              <span className="material-icons-round spinning">sync</span>
              Membuat Backup...
            </>
          ) : (
            <>
              <span className="material-icons-round">save</span>
              Buat Backup Sekarang
            </>
          )}
        </button>
      </div>

      <div className="backup-list-card master-form-card">
        <div className="backup-list-header">
          <h3>
            <span className="material-icons-round">folder</span>
            Daftar Backup
          </h3>
          <button className="backup-schedule-btn" onClick={onOpenSchedule}>
            <span className="material-icons-round">schedule</span>
            Schedule
            {schedule?.enabled && <span className="schedule-indicator active"></span>}
          </button>
        </div>

        {loading ? (
          <div className="backup-loading">
            <span className="material-icons-round spinning">sync</span>
            Memuat...
          </div>
        ) : backups.length === 0 ? (
          <div className="backup-empty">
            <span className="material-icons-round">folder_open</span>
            <p>Belum ada backup</p>
          </div>
        ) : (
          <div className="backup-table-wrapper">
            <table className="backup-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Ukuran</th>
                  <th>Tanggal</th>
                  <th>Tipe</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id}>
                    <td className="backup-filename">
                      <span className="material-icons-round">description</span>
                      {backup.filename}
                    </td>
                    <td className="backup-size">{formatFileSize(backup.file_size)}</td>
                    <td className="backup-date">{formatDate(backup.created_at)}</td>
                    <td className="backup-type">
                      <span className={`backup-type-badge ${backup.is_auto ? 'auto' : 'manual'}`}>
                        {backup.is_auto ? 'Auto' : 'Manual'}
                      </span>
                    </td>
                    <td className="backup-actions">
                      <button
                        className="backup-action-btn download"
                        onClick={() => onDownload(backup.filename)}
                        title="Download"
                      >
                        <span className="material-icons-round">download</span>
                      </button>
                      <button
                        className="backup-action-btn delete"
                        onClick={() => onDelete(backup.filename)}
                        title="Hapus"
                      >
                        <span className="material-icons-round">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {schedule?.enabled && (
          <div className="backup-schedule-info">
            <span className="material-icons-round">schedule</span>
            <span>
              Auto backup setiap {formatSchedule(schedule.schedule)} • Retensi {schedule.retention_days} hari
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function RestoreTab({ backups, token, onToast, onExit }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [validation, setValidation] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [progress, setProgress] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const handleFileSelect = async (filename) => {
    setSelectedFile(filename)
    setValidation(null)
    setConfirmed(false)
    if (!filename) return

    try {
      const result = await validateBackup(token, filename)
      setValidation(result)
    } catch (err) {
      onToast({ type: 'error', message: err.message })
      setValidation(null)
    }
  }

  const handleRestore = () => {
    if (!confirmed) return
    setShowConfirmModal(true)
  }

  const executeRestore = async () => {
    setShowConfirmModal(false)
    setRestoring(true)
    setProgress({ stage: 'preparing', progress: 0, message: 'Mempersiapkan restore...' })

    const eventSource = connectRestoreProgress(token)

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        setProgress(data)
      } catch (err) {
        console.error('Failed to parse SSE data:', err)
      }
    }

    eventSource.addEventListener('complete', (e) => {
      const result = JSON.parse(e.data)
      setRestoring(false)
      eventSource.close()
      if (result.status === 'success') {
        onToast({ type: 'success', message: `Restore berhasil! ${formatNumber(result.rows_restored)} baris dikembalikan.` })
        onExit()
      } else {
        onToast({ type: 'error', message: result.error || 'Restore gagal' })
      }
    })

    eventSource.addEventListener('error', () => {
      setRestoring(false)
      eventSource.close()
      onToast({ type: 'error', message: 'Koneksi terputus' })
    })

    try {
      await restoreBackup(token, selectedFile)
    } catch (err) {
      setRestoring(false)
      eventSource.close()
      onToast({ type: 'error', message: err.message })
    }
  }

  const manualBackups = backups.filter(b => !b.is_auto)

  return (
    <div className="restore-tab-content">
      <div className="restore-warning-card master-form-card">
        <div className="restore-warning-icon">
          <span className="material-icons-round">warning</span>
        </div>
        <div className="restore-warning-content">
          <h3>Peringatan!</h3>
          <p>Restore akan <strong>menghapus SEMUA data company saat ini</strong> dan menggantinya dengan data dari file backup.</p>
          <ul className="restore-warning-list">
            <li>
              <span className="material-icons-round">check_circle</span>
              Data company lain TIDAK terpengaruh
            </li>
            <li>
              <span className="material-icons-round">check_circle</span>
              Backup otomatis akan dibuat sebelum restore
            </li>
            <li>
              <span className="material-icons-round">check_circle</span>
              Proses restore tidak bisa dibatalkan
            </li>
          </ul>
        </div>
      </div>

      <div className="restore-file-card master-form-card">
        <h3>
          <span className="material-icons-round">folder_open</span>
          Pilih File Backup
        </h3>

        {manualBackups.length === 0 ? (
          <div className="restore-no-backups">
            <span className="material-icons-round">info</span>
            <p>Tidak ada backup yang tersedia. Buat backup terlebih dahulu.</p>
          </div>
        ) : (
          <div className="restore-file-select">
            <select
              className="master-filter-select"
              value={selectedFile || ''}
              onChange={(e) => handleFileSelect(e.target.value)}
              disabled={restoring}
            >
              <option value="">-- Pilih File Backup --</option>
              {manualBackups.map((backup) => (
                <option key={backup.id} value={backup.filename}>
                  {backup.filename}
                </option>
              ))}
            </select>
          </div>
        )}

        {validation && (
          <div className="restore-validation">
            <div className="validation-header">
              <span className="material-icons-round">description</span>
              Detail Backup
            </div>
            <div className="validation-grid">
              <div className="validation-item">
                <label>Ukuran File</label>
                <span>{formatFileSize(validation.file_size)}</span>
              </div>
              <div className="validation-item">
                <label>Tanggal Dibuat</label>
                <span>{formatDateTime(validation.created_at)}</span>
              </div>
              <div className="validation-item">
                <label>Estimasi Tables</label>
                <span>{validation.table_count} tables</span>
              </div>
              <div className="validation-item">
                <label>Estimasi Rows</label>
                <span>{formatNumber(validation.row_count)} rows</span>
              </div>
              <div className="validation-item full">
                <label>Company</label>
                <span className="validation-company">
                  <span className="material-icons-round">check_circle</span>
                  {validation.company_name}
                </span>
              </div>
            </div>
            <div className="validation-status success">
              <span className="material-icons-round">verified</span>
              File valid - siap di-restore
            </div>
          </div>
        )}
      </div>

      {selectedFile && validation && !restoring && (
        <div className="restore-confirm-card master-form-card">
          <label className="checkbox-label restore-confirm-checkbox">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span className="checkbox-custom"></span>
            <span>Saya mengerti dan ingin melanjutkan restore</span>
          </label>
        </div>
      )}

      {restoring && progress && (
        <div className="restore-progress-card master-form-card">
          <h3>
            <span className="material-icons-round spinning">sync</span>
            Progress Restore
          </h3>

          <div className="restore-progress-bar">
            <div
              className="restore-progress-fill"
              style={{ width: `${progress.progress}%` }}
            ></div>
          </div>

          <div className="restore-progress-info">
            <span className="restore-progress-percent">{Math.round(progress.progress)}%</span>
            <span className="restore-progress-message">{progress.message}</span>
          </div>

          <div className="restore-log">
            <div className="restore-log-entry success">
              <span className="material-icons-round">check_circle</span>
              Membuat safety backup...
            </div>
            {progress.stage === 'clearing' && (
              <div className="restore-log-entry active">
                <span className="material-icons-round">arrow_forward</span>
                Clearing: {progress.table || 'tables'}
              </div>
            )}
            {progress.stage === 'restoring' && (
              <>
                <div className="restore-log-entry success">
                  <span className="material-icons-round">check_circle</span>
                  Clearing completed
                </div>
                <div className="restore-log-entry active">
                  <span className="material-icons-round">arrow_forward</span>
                  Restoring: {progress.table || 'data'}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {selectedFile && validation && !restoring && (
        <button
          className="restore-btn-danger"
          onClick={handleRestore}
          disabled={!confirmed}
        >
          <span className="material-icons-round">restore</span>
          Restore Database
        </button>
      )}

      {showConfirmModal && (
        <div className="master-dialog-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="master-dialog restore-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header danger">
              <span className="material-icons-round">warning</span>
              Konfirmasi Restore
            </div>
            <div className="dialog-content">
              <p>Anda akan melakukan restore dari file:</p>
              <p className="confirm-filename">{selectedFile}</p>
              <p>Pastikan Anda sudah memahami konsekuensinya.</p>
            </div>
            <div className="dialog-footer">
              <button
                className="master-btn-cancel-secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Batal
              </button>
              <button className="restore-btn-danger" onClick={executeRestore}>
                <span className="material-icons-round">restore</span>
                Ya, Restore Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BackupScheduleModal({ schedule, onSave, onClose }) {
  const [form, setForm] = useState({
    enabled: schedule?.enabled || false,
    schedule: schedule?.schedule || '0 2 * * *',
    retention_days: schedule?.retention_days || 7,
    frequency: getFrequency(schedule?.schedule || '0 2 * * *'),
    hour: parseInt((schedule?.schedule || '0 2 * * *').split(' ')[1]) || 2,
    day: (schedule?.schedule || '0 2 * * *').split(' ')[4] || '1',
  })

  const handleSave = () => {
    const cronExpression = buildCronExpression(form)
    onSave({ ...form, schedule: cronExpression })
  }

  return (
    <div className="master-dialog-overlay" onClick={onClose}>
      <div className="master-dialog backup-schedule-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>
            <span className="material-icons-round">schedule</span>
            Schedule Backup
          </h3>
          <button className="dialog-close" onClick={onClose}>
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <div className="dialog-content">
          <div className="schedule-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              />
              <span className="checkbox-custom"></span>
              Aktifkan Auto Backup
            </label>
          </div>

          <div className="schedule-field">
            <label>Frekuensi</label>
            <div className="frequency-options">
              <label className={`frequency-option ${form.frequency === 'daily' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="frequency"
                  value="daily"
                  checked={form.frequency === 'daily'}
                  onChange={() => setForm({ ...form, frequency: 'daily' })}
                />
                <span className="material-icons-round">today</span>
                <span>Harian</span>
              </label>
              <label className={`frequency-option ${form.frequency === 'weekly' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="frequency"
                  value="weekly"
                  checked={form.frequency === 'weekly'}
                  onChange={() => setForm({ ...form, frequency: 'weekly' })}
                />
                <span className="material-icons-round">date_range</span>
                <span>Mingguan</span>
              </label>
              <label className={`frequency-option ${form.frequency === 'custom' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="frequency"
                  value="custom"
                  checked={form.frequency === 'custom'}
                  onChange={() => setForm({ ...form, frequency: 'custom' })}
                />
                <span className="material-icons-round">settings</span>
                <span>Custom</span>
              </label>
            </div>
          </div>

          {form.frequency === 'weekly' && (
            <div className="schedule-row">
              <div className="schedule-field">
                <label>Hari</label>
                <select
                  className="master-filter-select"
                  value={form.day}
                  onChange={(e) => setForm({ ...form, day: e.target.value })}
                >
                  <option value="1">Senin</option>
                  <option value="2">Selasa</option>
                  <option value="3">Rabu</option>
                  <option value="4">Kamis</option>
                  <option value="5">Jumat</option>
                  <option value="6">Sabtu</option>
                  <option value="0">Minggu</option>
                </select>
              </div>
              <div className="schedule-field">
                <label>Jam</label>
                <select
                  className="master-filter-select"
                  value={form.hour}
                  onChange={(e) => setForm({ ...form, hour: parseInt(e.target.value) })}
                >
                  {[...Array(24)].map((_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {form.frequency === 'daily' && (
            <div className="schedule-field">
              <label>Jam</label>
              <select
                className="master-filter-select"
                value={form.hour}
                onChange={(e) => setForm({ ...form, hour: parseInt(e.target.value) })}
              >
                {[...Array(24)].map((_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="cron-preview">
            <span className="material-icons-round">code</span>
            <code>{buildCronExpression(form)}</code>
          </div>

          <div className="schedule-field">
            <label>Retensi Backup</label>
            <select
              className="master-filter-select"
              value={form.retention_days}
              onChange={(e) => setForm({ ...form, retention_days: parseInt(e.target.value) })}
            >
              <option value="3">3 hari</option>
              <option value="7">7 hari</option>
              <option value="14">14 hari</option>
              <option value="30">30 hari</option>
            </select>
            <p className="field-hint">Backup older than this will be automatically deleted</p>
          </div>

          {schedule?.last_backup_at && (
            <div className="last-backup-info">
              <span className="material-icons-round">info</span>
              Backup terakhir: {formatDateTime(schedule.last_backup_at)}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="master-btn-cancel-secondary" onClick={onClose}>
            Batal
          </button>
          <button className="master-btn-save-primary" onClick={handleSave}>
            <span className="material-icons-round">save</span>
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}
