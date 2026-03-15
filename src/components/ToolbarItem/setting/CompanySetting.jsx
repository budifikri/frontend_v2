import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import { listCompanies, updateCompany } from '../../../features/master/company/company.api'

const DEFAULT_FORM = {
  code: '',
  nama: '',
  email: '',
  telp: '',
  address: '',
  website: '',
  tax_id: '',
  business_license: '',
  is_active: true,
}

const DUMMY_COMPANY = {
  id: 'CMP001',
  code: 'CMP001',
  nama: 'PT Maju Jaya Retail',
  email: 'admin@majujaya.co.id',
  telp: '021-5551001',
  address: 'Jl. Sudirman No. 88, Jakarta',
  website: 'https://majujaya.co.id',
  tax_id: '01.234.567.8-999.000',
  business_license: 'NIB-2025-0001',
  is_active: true,
}

function mapFormFromItem(item) {
  return {
    code: item?.code || '',
    nama: item?.nama || item?.name || '',
    email: item?.email || '',
    telp: item?.telp || item?.phone || '',
    address: item?.address || '',
    website: item?.website || '',
    tax_id: item?.tax_id || '',
    business_license: item?.business_license || '',
    is_active: item?.is_active ?? true,
  }
}

export function CompanySetting({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const [form, setForm] = useState(DEFAULT_FORM)
  const [companyId, setCompanyId] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  const fetchData = useCallback(async () => {
    setError('')

    try {
      if (!token) {
        setCompanyId(DUMMY_COMPANY.id)
        setForm(mapFormFromItem(DUMMY_COMPANY))
        return
      }

      const result = await listCompanies(token, { limit: 1, offset: 0 })
      const items = result.items || []
      const firstCompany = items[0]

      if (firstCompany) {
        setCompanyId(firstCompany.id)
        setForm(mapFormFromItem(firstCompany))
      }
    } catch (err) {
      setError(err.message || 'Failed to load company data')
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showExitConfirm) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setShowExitConfirm(false)
        }
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        setShowExitConfirm(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showExitConfirm])

  function handleEditClick() {
    setIsEditing(true)
  }

  async function handleSave() {
    if (!form.code || !form.nama || !form.email) return

    setIsSaving(true)
    setError('')

    const payload = {
      code: form.code,
      nama: form.nama,
      email: form.email,
      telp: form.telp || undefined,
      address: form.address || undefined,
      website: form.website || undefined,
      tax_id: form.tax_id || undefined,
      business_license: form.business_license || undefined,
      is_active: form.is_active,
    }

    try {
      if (token && companyId) {
        await updateCompany(token, companyId, payload)
        await fetchData()
      }

      setIsEditing(false)
      setShowToast(true)

      setTimeout(() => {
        setShowToast(false)
      }, 3000)
    } catch (err) {
      setError(err.message || 'Failed to update company')
    } finally {
      setIsSaving(false)
    }
  }

  function handleConfirmExit() {
    setShowExitConfirm(false)
    onExit()
  }

  return (
    <div className="master-content">
      {error && <div className="master-error">{error}</div>}

      {showToast && (
        <div className="toast-notification">
          <span className="material-icons-round">check_circle</span>
          Data tersimpan
        </div>
      )}

      <div className="master-form-card" style={{ marginTop: '16px' }}>
        <div className="master-form-header">
          <span className="material-icons-round master-form-icon">apartment</span>
          <h2 className="master-form-title">Ubah Data Company</h2>
        </div>
        <div className="master-form-grid">
          <div className="master-form-group">
            <label className="master-form-label">Code :</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="master-form-input"
              readOnly={!isEditing}
            />
          </div>
          <div className="master-form-group">
            <label className="master-form-label">Name :</label>
            <input
              type="text"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className="master-form-input"
              readOnly={!isEditing}
            />
          </div>
          <div className="master-form-group">
            <label className="master-form-label">Email :</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="master-form-input"
              readOnly={!isEditing}
            />
          </div>
          <div className="master-form-group">
            <label className="master-form-label">Phone :</label>
            <input
              type="text"
              value={form.telp}
              onChange={(e) => setForm({ ...form, telp: e.target.value })}
              className="master-form-input"
              readOnly={!isEditing}
            />
          </div>
          <div className="master-form-group">
            <label className="master-form-label">Website :</label>
            <input
              type="text"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="master-form-input"
              readOnly={!isEditing}
            />
          </div>
          <div className="master-form-group-wide">
            <label className="master-form-label">Address :</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="master-form-input"
              readOnly={!isEditing}
            />
          </div>
          <div className="master-form-group">
            <label className="master-form-label">Tax ID :</label>
            <input
              type="text"
              value={form.tax_id}
              onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
              className="master-form-input"
              readOnly={!isEditing}
            />
          </div>
          <div className="master-form-group">
            <label className="master-form-label">Business License :</label>
            <input
              type="text"
              value={form.business_license}
              onChange={(e) => setForm({ ...form, business_license: e.target.value })}
              className="master-form-input"
              readOnly={!isEditing}
            />
          </div>

          <div className="master-form-actions">
            <button
              type="button"
              className="master-btn-save-primary"
              onClick={isEditing ? handleSave : handleEditClick}
              disabled={isSaving}
            >
              <span className="material-icons-round">{isEditing ? 'save' : 'edit'}</span>
              {isEditing ? 'SIMPAN' : 'EDIT'}
            </button>
                <button type="button" className="master-footer-btn" onClick={onExit} title="Exit" aria-label="Exit">
            <span className="material-icons-round master-footer-icon red">exit_to_app</span>
          </button>
          </div>
        </div>
      </div>

      {showExitConfirm && (
        <div className="master-dialog-overlay">
          <div className="master-dialog">
            <h3 className="master-dialog-title">Konfirmasi Keluar</h3>
            <p className="master-dialog-text">Apakah Anda yakin ingin keluar dari halaman ini?</p>
            <div className="master-dialog-actions">
              <button className="master-btn master-btn-primary" onClick={handleConfirmExit}>Ya</button>
              <button className="master-btn master-btn-secondary" onClick={() => setShowExitConfirm(false)}>Tidak</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
