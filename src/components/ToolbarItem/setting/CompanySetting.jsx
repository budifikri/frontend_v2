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
      <div className="master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Pengaturan Company</h1>
      </div>

      {error && <div className="master-error">{error}</div>}
      {showToast && (
        <div className="toast-notification">
          <span className="material-icons-round">check_circle</span>
          Data tersimpan
        </div>
      )}

      <div className="master-table-wrapper">
        <div className="master-table-container">
          <div style={{ padding: '16px' }}>
            <div className="receipt-setting-body">
              <div className="receipt-setting-form">
                <div className="receipt-setting-section">
                  <h4>Informasi Dasar</h4>
                  <div className="receipt-setting-field-inline">
                    <label htmlFor="company-code">Code</label>
                    <input
                      type="text"
                      id="company-code"
                      className="receipt-text-input"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="receipt-setting-field-inline">
                    <label htmlFor="company-name">Nama Company</label>
                    <input
                      type="text"
                      id="company-name"
                      className="receipt-text-input"
                      value={form.nama}
                      onChange={(e) => setForm({ ...form, nama: e.target.value })}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="receipt-setting-field-inline">
                    <label htmlFor="company-email">Email</label>
                    <input
                      type="email"
                      id="company-email"
                      className="receipt-text-input"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="receipt-setting-field-inline">
                    <label htmlFor="company-phone">No. Telepon</label>
                    <input
                      type="text"
                      id="company-phone"
                      className="receipt-text-input"
                      value={form.telp}
                      onChange={(e) => setForm({ ...form, telp: e.target.value })}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="receipt-setting-field-inline">
                    <label htmlFor="company-website">Website</label>
                    <input
                      type="text"
                      id="company-website"
                      className="receipt-text-input"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="receipt-footer-text-wrap">
                    <label htmlFor="company-address">Alamat</label>
                    <textarea
                      id="company-address"
                      className="receipt-footer-text-input"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      readOnly={!isEditing}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="receipt-setting-section">
                  <h4>Legal & Pajak</h4>
                  <div className="receipt-setting-field-inline">
                    <label htmlFor="company-tax-id">NPWP / Tax ID</label>
                    <input
                      type="text"
                      id="company-tax-id"
                      className="receipt-text-input"
                      value={form.tax_id}
                      onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="receipt-setting-field-inline">
                    <label htmlFor="company-license">No. Izin Usaha (NIB)</label>
                    <input
                      type="text"
                      id="company-license"
                      className="receipt-text-input"
                      value={form.business_license}
                      onChange={(e) => setForm({ ...form, business_license: e.target.value })}
                      readOnly={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="master-footer">
        <button type="button" className="master-btn-save-primary" onClick={isEditing ? handleSave : handleEditClick} disabled={isSaving}>
          <span className="material-icons-round">{isEditing ? 'save' : 'edit'}</span>
          {isEditing ? 'SIMPAN' : 'EDIT'}
        </button>
        {isEditing ? (
          <button type="button" className="master-footer-btn" onClick={() => setIsEditing(false)}>
            BATAL
          </button>
        ) : (
          <button type="button" className="master-footer-btn" onClick={onExit}>
            <span className="material-icons-round master-footer-icon">exit_to_app</span>
            KELUAR
          </button>
        )}
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
