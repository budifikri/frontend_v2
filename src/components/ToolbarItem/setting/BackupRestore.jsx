import { useState, useEffect } from 'react'
import { Toast } from '../../Toast'
import { useAuth } from '../../../shared/auth'
import {
  createBackup,
  listBackups,
  deleteBackup,
  getSchedule,
  updateSchedule,
  downloadBackup,
  validateBackup,
  restoreBackup,
  connectRestoreProgress,
  deleteData,
  getTableCounts,
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
  const { auth } = useAuth()
  const token = auth?.token
  const user = { companyName: auth?.companyName }
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

  const handleDownload = async (filename) => {
    try {
      const { blob, filename: downloadName } = await downloadBackup(token, filename)
      const objectUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = downloadName || filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(objectUrl)
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Gagal download backup' })
    }
  }

  const handleSaveSchedule = async (data) => {
    try {
      const nextSchedule = await updateSchedule(token, data)
      setSchedule(nextSchedule)
      setShowScheduleModal(false)
      setToast({ type: 'success', message: 'Schedule disimpan' })
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    }
  }

  return (
    <div className="backup-restore-container">
      <div className="master-header backup-master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Backup & Restore Database</h1>

           <div className="backup-footer-company master-header-filters ">
            <span className="material-icons-round">business</span>
            {user?.companyName || 'Company'}
          </div>
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
          />
        )}
        {activeTab === 'delete' && (
          <DeleteDataTab
            token={token}
            onToast={setToast}
          />
        )}
      </div>

      <div className="master-footer backup-footer">
        <div className="backup-footer-tabs">
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
          <button
            className={`backup-tab ${activeTab === 'delete' ? 'active' : ''}`}
            onClick={() => setActiveTab('delete')}
          >
            <span className="material-icons-round">delete</span>
            Hapus Data
          </button>
          <button className="master-footer-btn" onClick={onExit}>
            <span className="material-icons-round master-footer-icon red">exit_to_app</span>
            
          </button>
        </div>
        <div className="backup-footer-right">        
          
       
        </div>
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

function BackupTab({ backups, loading, creating, schedule, onCreate, onDelete, onDownload, onOpenSchedule }) {
  return (
    <div className="backup-content-grid">
      <div className="backup-left-column">
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
      </div>

      <div className="backup-right-column">
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
    </div>
  )
}

function RestoreTab({ backups, token, onToast }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [validation, setValidation] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [progress, setProgress] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [restoreResult, setRestoreResult] = useState(null)

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

  const resetRestoreForm = () => {
    setSelectedFile(null)
    setValidation(null)
    setConfirmed(false)
    setRestoring(false)
    setProgress(null)
    setShowConfirmModal(false)
  }

  const executeRestore = async () => {
    console.log('[DEBUG] executeRestore: Starting...')
    setShowConfirmModal(false)
    setRestoring(true)
    setProgress({ stage: 'preparing', progress: 0, message: 'Mempersiapkan restore...' })

    console.log('[DEBUG] executeRestore: Connecting to SSE...')
    const eventSource = connectRestoreProgress(token)

    eventSource.onopen = () => {
      console.log('[DEBUG] executeRestore: SSE connected')
    }

    eventSource.onmessage = (e) => {
      console.log('[DEBUG] executeRestore: onmessage', e.data)
      try {
        const data = JSON.parse(e.data)
        console.log('[DEBUG] executeRestore: Parsed progress data', data)
        setProgress(data)
      } catch (err) {
        console.error('[DEBUG] executeRestore: Failed to parse SSE data:', err)
      }
    }

    eventSource.addEventListener('complete', (e) => {
      console.log('[DEBUG] executeRestore: complete event raw data:', e.data)
      let result
      try {
        result = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
      } catch (parseErr) {
        console.error('[DEBUG] executeRestore: parse error', parseErr, 'raw:', e.data)
        result = { status: 'error', error: 'Failed to parse response' }
      }
      console.log('[DEBUG] executeRestore: parsed result:', result, 'rows_restored:', result?.rows_restored)
      setRestoring(false)
      eventSource.close()
      if (result.status === 'success') {
        setRestoreResult({
          rows_restored: result.rows_restored,
          tables_cleared: result.tables_cleared,
          duration: result.duration,
        })
        setShowSuccessModal(true)
      } else {
        onToast({ type: 'error', message: result.error || 'Restore gagal' })
      }
    })

    eventSource.addEventListener('error', (e) => {
      console.error('[DEBUG] executeRestore: SSE error', e)
      setRestoring(false)
      eventSource.close()
      onToast({ type: 'error', message: 'Koneksi terputus' })
    })

    try {
      console.log('[DEBUG] executeRestore: Calling restoreBackup API...')
      const result = await restoreBackup(token, selectedFile)
      console.log('[DEBUG] executeRestore: restoreBackup completed', result)
    } catch (err) {
      console.error('[DEBUG] executeRestore: restoreBackup error', err)
      setRestoring(false)
      eventSource.close()
      onToast({ type: 'error', message: err.message })
    }
  }

  const manualBackups = backups.filter(b => !b.is_auto)

  return (
    <div className="backup-content-grid">
      <div className="backup-left-column">
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
      </div>

      <div className="backup-right-column">
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
      </div>

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

      {showSuccessModal && restoreResult && (
        <div className="master-dialog-overlay" onClick={() => { setShowSuccessModal(false); resetRestoreForm() }}>
          <div className="master-dialog restore-success-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header success">
              <span className="material-icons-round">check_circle</span>
              Restore Berhasil
            </div>
            <div className="dialog-content">
              <div className="success-result-grid">
                <div className="result-item">
                  <span className="material-icons-round">table_rows</span>
                  <div className="result-info">
                    <label>Baris Dikembalikan</label>
                    <span className="result-value">{formatNumber(restoreResult.rows_restored || 0)}</span>
                  </div>
                </div>
                <div className="result-item">
                  <span className="material-icons-round">delete_sweep</span>
                  <div className="result-info">
                    <label>Tabel Dihapus</label>
                    <span className="result-value">{restoreResult.tables_cleared || 0}</span>
                  </div>
                </div>
                <div className="result-item">
                  <span className="material-icons-round">timer</span>
                  <div className="result-info">
                    <label>Durasi</label>
                    <span className="result-value">{restoreResult.duration || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="dialog-footer">
              <button className="master-btn-save-primary" onClick={() => { setShowSuccessModal(false); resetRestoreForm() }}>
                OK
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
    hour: (schedule?.schedule || '0 2 * * *').split(' ')[1] || '2',
    day: (schedule?.schedule || '0 2 * * *').split(' ')[4] || '1',
  })

  const handleSave = () => {
    const nextForm = {
      ...form,
      day: String(form.day),
      hour: String(form.hour),
    }
    const cronExpression = buildCronExpression(nextForm)
    onSave({ ...nextForm, schedule: cronExpression })
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
                  onChange={(e) => setForm({ ...form, hour: e.target.value })}
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
              onChange={(e) => setForm({ ...form, hour: e.target.value })}
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

function DeleteDataTab({ token, onToast }) {
  const [scope, setScope] = useState('master')
  const [backupConfirmed, setBackupConfirmed] = useState(false)
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [counts, setCounts] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope])

  const loadCounts = async () => {
    setLoading(true)
    try {
      const data = await getTableCounts(token, scope)
      setCounts(data)
    } catch (err) {
      console.error('Failed to load counts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Yakin ingin menghapus semua ${scope === 'all' ? 'data' : scope === 'master' ? 'data master' : 'data transaksi'}?`)) {
      return
    }

    setDeleting(true)
    try {
      await deleteData(token, scope)
      onToast({ type: 'success', message: `Berhasil menghapus data ${scope === 'master' ? 'master' : scope === 'transaction' ? 'transaksi' : 'semua'}` })
      setBackupConfirmed(false)
      setDeleteConfirmed(false)
      loadCounts()
    } catch (err) {
      onToast({ type: 'error', message: err.message })
    } finally {
      setDeleting(false)
    }
  }

  const canDelete = backupConfirmed && deleteConfirmed && !deleting

  const scopeLabels = {
    all: 'Semua Data',
    master: 'Data Master',
    transaction: 'Data Transaksi',
  }

  return (
    <div className="backup-content-grid">
      <div className="backup-left-column">
        <div className="delete-warning-card master-form-card">
          <div className="delete-warning-icon">
            <span className="material-icons-round">warning</span>
          </div>
          <div className="delete-warning-content">
            <h3>PERINGATAN!</h3>
            <p>Menghapus data akan MEMPERMANEN menghapus semua data dari scope yang dipilih. Proses ini TIDAK DAPAT DIBATALKAN!</p>
            <label className="checkbox-label delete-warning-checkbox">
              <input
                type="checkbox"
                checked={backupConfirmed}
                onChange={(e) => setBackupConfirmed(e.target.checked)}
              />
              <span className="checkbox-custom"></span>
              <span>Saya sudah membuat backup sebelum menghapus data</span>
            </label>
          </div>
        </div>
      </div>

      <div className="backup-right-column">
        <div className="delete-scope-card master-form-card">
          <h3>
            <span className="material-icons-round">delete_sweep</span>
            Pilih Scope Data yang Akan Dihapus
          </h3>

          <div className="delete-scope-options">
            <label className={`delete-scope-option ${scope === 'all' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="deleteScope"
                value="all"
                checked={scope === 'all'}
                onChange={() => setScope('all')}
              />
              <span className="material-icons-round">delete_forever</span>
              <span className="delete-scope-title">Semua Data</span>
              <span className="delete-scope-desc">Master + Transaksi</span>
            </label>

            <label className={`delete-scope-option ${scope === 'master' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="deleteScope"
                value="master"
                checked={scope === 'master'}
                onChange={() => setScope('master')}
              />
              <span className="material-icons-round">inventory_2</span>
              <span className="delete-scope-title">Data Master</span>
              <span className="delete-scope-desc">Users, Products, dll</span>
            </label>

            <label className={`delete-scope-option ${scope === 'transaction' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="deleteScope"
                value="transaction"
                checked={scope === 'transaction'}
                onChange={() => setScope('transaction')}
              />
              <span className="material-icons-round">receipt_long</span>
              <span className="delete-scope-title">Data Transaksi</span>
              <span className="delete-scope-desc">Sales, Purchases, dll</span>
            </label>
          </div>
        </div>

        <div className="delete-preview-card master-form-card">
          <h3>
            <span className="material-icons-round">analytics</span>
            Preview: {scopeLabels[scope]}
          </h3>

          {loading ? (
            <div className="delete-preview-loading">
              <span className="material-icons-round spinning">sync</span>
              Memuat...
            </div>
          ) : counts ? (
            <>
              <div className="delete-preview-list">
                {counts.tables.map((t) => (
                  <div key={t.table_name} className="delete-preview-item">
                    <span className="delete-preview-table">{t.table_name}</span>
                    <span className="delete-preview-count">{formatNumber(t.row_count)} data</span>
                  </div>
                ))}
              </div>
              <div className="delete-preview-total">
                Total: <strong>{formatNumber(counts.total)}</strong> data
              </div>
            </>
          ) : (
            <p className="delete-preview-empty">Tidak ada data</p>
          )}
        </div>

        <div className="delete-confirm-card master-form-card">
          <label className={`checkbox-label delete-confirm-checkbox ${!backupConfirmed ? 'disabled' : ''}`}>
            <input
              type="checkbox"
              checked={deleteConfirmed}
              onChange={(e) => setDeleteConfirmed(e.target.checked)}
              disabled={!backupConfirmed}
            />
            <span className="checkbox-custom"></span>
            <span>Saya memahami bahwa data akan dihapus permanen dan tidak dapat dikembalikan</span>
          </label>
        </div>

        <button
          className="delete-btn-danger"
          onClick={handleDelete}
          disabled={!canDelete}
        >
          {deleting ? (
            <>
              <span className="material-icons-round spinning">sync</span>
              Menghapus...
            </>
          ) : (
            <>
              <span className="material-icons-round">delete_forever</span>
              Hapus {scopeLabels[scope]}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
