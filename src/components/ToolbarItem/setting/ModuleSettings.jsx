import { useCallback, useEffect, useState } from 'react'

import { Toast } from '../../../components/Toast'
import { useAuth } from '../../../shared/auth'
import { getCompanyModules, toggleCompanyModule } from '../../../features/setting/module/module.api'

export function ModuleSettings({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token
  const companyId = auth?.companyId
  const [data, setData] = useState({ business_type: auth.businessType ?? '', modules: [], items: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savingCode, setSavingCode] = useState(null)
  const [showToast, setShowToast] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token || !companyId) return
    setLoading(true)
    setError('')
    try {
      const result = await getCompanyModules(token, companyId)
      setData(result)
    } catch (err) {
      setError(err.message || 'Failed to load modules')
    } finally {
      setLoading(false)
    }
  }, [companyId, token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleToggle(item) {
    if (!token || !companyId || savingCode || item.is_default) return
    setSavingCode(item.code)
    setError('')
    try {
      const result = await toggleCompanyModule(token, companyId, item.code, !item.is_active)
      setData(result)
      setShowToast(true)
    } catch (err) {
      setError(err.message || 'Failed to update module')
    } finally {
      setSavingCode(null)
    }
  }

  return (
    <div className="master-content">
      <div className="master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Module Management</h1>
      </div>

      {error && <div className="master-error">{error}</div>}
      <Toast message="Module berhasil diperbarui" type="success" isOpen={showToast} onClose={() => setShowToast(false)} />

      <div className="master-table-wrapper">
        <div className="master-table-container">
          <div style={{ padding: 16 }}>
            <div className="receipt-setting-section">
              <h4>Business Type</h4>
              <div className="receipt-setting-field-inline">
                <label>Jenis Bisnis</label>
                <input type="text" className="receipt-text-input" value={data.business_type || '-'} readOnly />
              </div>
            </div>

            <div className="receipt-setting-section">
              <h4>Module Package</h4>
              <div className="company-module-package-note" style={{ marginBottom: 12 }}>
                Package default dikunci agar tetap aktif. Halaman ini dipakai untuk monitoring dan toggle cepat package optional.
              </div>
              <table className="master-table">
                <thead>
                  <tr>
                    <th>CODE</th>
                    <th>NAME</th>
                    <th>DEFAULT</th>
                    <th>ACTIVE</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.items || []).map((item) => (
                    <tr key={item.code}>
                      <td>{item.code}</td>
                      <td>{item.name}</td>
                      <td>{item.is_default ? 'Yes' : 'No'}</td>
                      <td>{item.is_active ? 'Active' : 'Inactive'}</td>
                      <td>
                        <button type="button" className="master-btn-save-primary" onClick={() => handleToggle(item)} disabled={savingCode === item.code || item.is_default}>
                          {item.is_default ? 'LOCKED' : item.is_active ? 'OFF' : 'ON'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!loading && (data.items || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center">No data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="master-footer">
        <div className="master-footer-actions">
          <button type="button" className="master-footer-btn" onClick={fetchData}>
            <span className="material-icons-round master-footer-icon blue">refresh</span>
          </button>
          <button type="button" className="master-footer-btn" onClick={onExit}>
            <span className="material-icons-round master-footer-icon red">exit_to_app</span>
          </button>
        </div>
      </div>
    </div>
  )
}
