import { useCallback, useEffect, useMemo, useState } from 'react'

import { Toast } from '../../../components/Toast'
import { getCurrentCompany, updateCompany } from '../../../features/master/company/company.api'
import { listModulePackages } from '../../../features/setting/modulePackage/modulePackage.api'
import { useAuth } from '../../../shared/auth'

const DEFAULT_FORM = {
  code: '',
  nama: '',
  email: '',
  telp: '',
  address: '',
  website: '',
  tax_id: '',
  business_license: '',
  business_type: 'retail',
  module_codes: ['retail_basic'],
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
  business_type: 'retail',
  modules: ['retail_basic', 'retail_advanced'],
  is_active: true,
}

const FALLBACK_MODULE_PACKAGES = {
  retail: [
    { id: 'retail_basic', code: 'retail_basic', name: 'Retail Basic', description: 'Paket utama retail untuk master, transaksi, dan laporan inti.', is_default: true },
    { id: 'retail_advanced', code: 'retail_advanced', name: 'Retail Advanced', description: 'Fitur tambahan retail seperti promo dan harga grosir.', is_default: false },
  ],
  clinic: [
    { id: 'clinic_core', code: 'clinic_core', name: 'Clinic Core', description: 'Paket utama klinik untuk operasional dasar.', is_default: true },
    { id: 'clinic_advanced', code: 'clinic_advanced', name: 'Clinic Advanced', description: 'Fitur tambahan klinik seperti promo dan pengembangan layanan.', is_default: false },
  ],
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
    business_type: item?.business_type || 'retail',
    module_codes: Array.isArray(item?.modules) ? item.modules : [],
    is_active: item?.is_active ?? true,
  }
}

function splitModulePackages(items) {
  return {
    defaultItems: items.filter((item) => item.is_default),
    optionalItems: items.filter((item) => !item.is_default),
  }
}

function getDefaultModuleCodes(items) {
  return items.filter((item) => item.is_default).map((item) => item.code)
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
  const [modulePackages, setModulePackages] = useState(FALLBACK_MODULE_PACKAGES.retail)

  const { defaultItems, optionalItems } = useMemo(() => splitModulePackages(modulePackages), [modulePackages])

  const fetchData = useCallback(async () => {
    setError('')

    try {
      if (!token) {
        setCompanyId(DUMMY_COMPANY.id)
        setForm(mapFormFromItem(DUMMY_COMPANY))
        return
      }

      const result = await getCurrentCompany(token)
      const company = result.data

      if (company) {
        setCompanyId(company.id)
        setForm(mapFormFromItem(company))
      }
    } catch (err) {
      setError(err.message || 'Failed to load company data')
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    async function fetchModulePackages() {
      const businessType = form.business_type || 'retail'

      if (!token) {
        const fallback = FALLBACK_MODULE_PACKAGES[businessType] || []
        const defaultCodes = getDefaultModuleCodes(fallback)
        setModulePackages(fallback)
        setForm((prev) => {
          const nextCodes = Array.from(new Set([...defaultCodes, ...(prev.module_codes || [])]))
          return { ...prev, module_codes: nextCodes }
        })
        return
      }

      try {
        const result = await listModulePackages(token, { business_type: businessType, is_active: true, limit: 100, offset: 0 })
        const items = Array.isArray(result.items) && result.items.length > 0
          ? result.items
          : (FALLBACK_MODULE_PACKAGES[businessType] || [])

        const defaultCodes = getDefaultModuleCodes(items)
        const availableCodes = new Set(items.map((item) => item.code))

        setModulePackages(items)
        setForm((prev) => {
          const selectedCodes = (prev.module_codes || []).filter((code) => availableCodes.has(code))
          return { ...prev, module_codes: Array.from(new Set([...defaultCodes, ...selectedCodes])) }
        })
      } catch {
        const fallback = FALLBACK_MODULE_PACKAGES[businessType] || []
        const defaultCodes = getDefaultModuleCodes(fallback)
        setModulePackages(fallback)
        setForm((prev) => ({ ...prev, module_codes: Array.from(new Set([...defaultCodes, ...(prev.module_codes || [])])) }))
      }
    }

    fetchModulePackages()
  }, [form.business_type, token])

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

  function handleModuleToggle(moduleCode, isDefault) {
    if (isDefault || !isEditing) return

    setForm((prev) => {
      const selected = new Set(prev.module_codes || [])
      if (selected.has(moduleCode)) selected.delete(moduleCode)
      else selected.add(moduleCode)

      for (const code of getDefaultModuleCodes(modulePackages)) {
        selected.add(code)
      }

      return { ...prev, module_codes: Array.from(selected) }
    })
  }

  async function handleSave() {
    if (!form.code || !form.nama || !form.email) return

    setIsSaving(true)
    setError('')

    const defaultCodes = getDefaultModuleCodes(modulePackages)
    const moduleCodes = Array.from(new Set([...(form.module_codes || []), ...defaultCodes]))

    const payload = {
      code: form.code,
      nama: form.nama,
      email: form.email,
      telp: form.telp || undefined,
      address: form.address || undefined,
      website: form.website || undefined,
      tax_id: form.tax_id || undefined,
      business_license: form.business_license || undefined,
      business_type: form.business_type,
      module_codes: moduleCodes,
      is_active: form.is_active,
    }

    try {
      if (token && companyId) {
        await updateCompany(token, companyId, payload)
        await fetchData()
      }

      setIsEditing(false)
      setShowToast(true)
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

  function renderModuleSection(title, items, isDefaultSection) {
    if (items.length === 0) return null

    return (
      <div className="company-module-package-section">
        <div className="company-module-package-heading">{title}</div>
        <div className="company-module-package-list">
          {items.map((item) => (
            <label key={item.id || item.code} className="company-module-package-item">
              <input
                type="checkbox"
                checked={(form.module_codes || []).includes(item.code)}
                onChange={() => handleModuleToggle(item.code, isDefaultSection)}
                disabled={!isEditing || isDefaultSection}
              />
              <div className="company-module-package-content">
                <span className="company-module-package-name">{item.name || item.code}</span>
                {item.description ? <span className="company-module-package-description">{item.description}</span> : null}
              </div>
              {isDefaultSection ? <span className="company-module-package-badge">Default</span> : null}
            </label>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="master-content">
      <div className="master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Pengaturan Company</h1>
      </div>

      {error && <div className="master-error">{error}</div>}
      <Toast message="Data tersimpan" type="success" isOpen={showToast} onClose={() => setShowToast(false)} />

      <div className="master-table-wrapper">
        <div className="master-table-container">
          <div style={{ padding: '16px' }}>
            <div className="receipt-setting-body">
              <div className="receipt-setting-form">
                <div className="receipt-setting-section">
                  <h4>Informasi Dasar</h4>
                  <div className="receipt-setting-field-inline">
                    <label htmlFor="company-code">Code</label>
                    <input type="text" id="company-code" className="receipt-text-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} readOnly={!isEditing} />
                  </div>
                  <div className="receipt-setting-field-inline">
                    <label htmlFor="company-name">Nama Company</label>
                    <input type="text" id="company-name" className="receipt-text-input" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} readOnly={!isEditing} />
                  </div>
                  <div className="receipt-setting-field-inline">
                    <label htmlFor="company-email">Email</label>
                    <input type="email" id="company-email" className="receipt-text-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} readOnly={!isEditing} />
                  </div>
                  <div className="receipt-setting-field-inline">
                    <label htmlFor="company-business-type">Jenis Bisnis</label>
                    <input type="text" id="company-business-type" className="receipt-text-input" value={form.business_type} readOnly />
                  </div>
                  <div className="receipt-setting-field-inline">
                    <label htmlFor="company-phone">No. Telepon</label>
                    <input type="text" id="company-phone" className="receipt-text-input" value={form.telp} onChange={(e) => setForm({ ...form, telp: e.target.value })} readOnly={!isEditing} />
                  </div>
                  <div className="receipt-setting-field-inline">
                    <label htmlFor="company-website">Website</label>
                    <input type="text" id="company-website" className="receipt-text-input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} readOnly={!isEditing} />
                  </div>
                  <div className="receipt-footer-text-wrap">
                    <label htmlFor="company-address">Alamat</label>
                    <textarea id="company-address" className="receipt-footer-text-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} readOnly={!isEditing} rows={3} />
                  </div>
                </div>

                <div className="receipt-setting-section">
                  <h4>Module Package</h4>
                  <div className="company-module-package-box">
                    <div className="company-module-package-note">
                      Package default selalu aktif. Anda hanya bisa mengubah package optional untuk company ini.
                    </div>
                    {renderModuleSection('Default Package', defaultItems, true)}
                    {renderModuleSection('Optional Package', optionalItems, false)}
                    {modulePackages.length === 0 ? <span className="company-module-package-empty">Tidak ada module package</span> : null}
                  </div>
                </div>

                <div className="receipt-setting-section">
                  <h4>Legal & Pajak</h4>
                  <div className="receipt-setting-field-inline">
                    <label htmlFor="company-tax-id">NPWP / Tax ID</label>
                    <input type="text" id="company-tax-id" className="receipt-text-input" value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} readOnly={!isEditing} />
                  </div>
                  <div className="receipt-setting-field-inline">
                    <label htmlFor="company-license">No. Izin Usaha (NIB)</label>
                    <input type="text" id="company-license" className="receipt-text-input" value={form.business_license} onChange={(e) => setForm({ ...form, business_license: e.target.value })} readOnly={!isEditing} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="master-footer">
        <div className="master-footer-actions">
          <button type="button" className="master-btn-save-primary" onClick={isEditing ? handleSave : handleEditClick} disabled={isSaving}>
            <span className="material-icons-round">{isEditing ? 'save' : 'edit'}</span>
            {isEditing ? 'SIMPAN' : 'EDIT'}
          </button>
          {isEditing ? (
            <button type="button" className="master-btn-cancel-secondary" onClick={() => setIsEditing(false)}>
              BATAL
            </button>
          ) : (
            <button type="button" className="master-footer-btn" onClick={onExit}>
              <span className="material-icons-round master-footer-icon red">exit_to_app</span>
            </button>
          )}
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
