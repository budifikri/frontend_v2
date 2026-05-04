import { useCallback, useEffect, useState } from 'react'

import { Toast } from '../../../components/Toast'
import { listBusinessTypes, createBusinessType, updateBusinessType } from '../../../features/setting/businessType/businessType.api'
import { useAuth } from '../../../shared/auth'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { MasterStatusToggle } from '../table/MasterStatusToggle'
import { MasterDefaultToggle } from '../table/MasterDefaultToggle'

const DEFAULT_FORM = {
  code: '',
  name: '',
  description: '',
  is_active: true,
  is_default: false,
  is_system: false,
}

const TABLE_COLUMNS = [
  { key: 'code', label: 'CODE' },
  { key: 'name', label: 'NAME' },
  { key: 'is_active', label: 'STATUS' },
  { key: 'is_default', label: 'DEFAULT' },
  { key: 'is_system', label: 'SYSTEM' },
]

export function BusinessTypeSetting({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isNewMode, setIsNewMode] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [showToast, setShowToast] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const result = await listBusinessTypes(token, { search, limit: 100, offset: 0 })
      setItems(result.items || [])
    } catch (err) {
      setError(err.message || 'Failed to load business types')
    } finally {
      setLoading(false)
    }
  }, [search, token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function openNewForm() {
    setSelectedItem(null)
    setForm(DEFAULT_FORM)
    setIsNewMode(true)
    setShowForm(true)
  }

  function openEditForm(item) {
    setSelectedItem(item)
    setSelectedId(item.id)
    setForm({
      code: item.code || '',
      name: item.name || '',
      description: item.description || '',
      is_active: item.is_active ?? true,
      is_default: item.is_default ?? false,
      is_system: item.is_system ?? false,
    })
    setIsNewMode(false)
    setShowForm(true)
  }

  function handleSelect(item) {
    setSelectedId(item.id)
  }

  async function handleToggleStatus(item) {
    if (!item?.id || togglingId) return

    const nextIsActive = !item.is_active
    if (token) {
      setTogglingId(item.id)
      try {
        await updateBusinessType(token, item.id, { is_active: nextIsActive })
        await fetchData()
      } catch (err) {
        setError(err.message || 'Failed to update status')
      } finally {
        setTogglingId(null)
      }
      return
    }

    setItems((prev) => prev.map((row) =>
      row.id === item.id ? { ...row, is_active: nextIsActive } : row
    ))
  }

  async function handleToggleDefault(item) {
    if (!item?.id || togglingId) return

    const nextIsDefault = !item.is_default
    if (token) {
      setTogglingId(item.id)
      try {
        await updateBusinessType(token, item.id, { is_default: nextIsDefault })
        await fetchData()
      } catch (err) {
        setError(err.message || 'Failed to update default status')
      } finally {
        setTogglingId(null)
      }
      return
    }

    setItems((prev) => prev.map((row) =>
      row.id === item.id ? { ...row, is_default: nextIsDefault } : row
    ))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      if (isNewMode) {
        await createBusinessType(token, form)
      } else if (selectedItem?.id) {
        await updateBusinessType(token, selectedItem.id, {
          name: form.name,
          description: form.description,
          is_active: form.is_active,
          is_default: form.is_default,
          is_system: form.is_system,
        })
      }
      setShowForm(false)
      setShowToast(true)
      await fetchData()
    } catch (err) {
      setError(err.message || 'Failed to save business type')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="master-content">
      <div className="master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Master Business Type</h1>
        <div className="master-header-filters">
          <div className="master-footer-search">
            <input type="text" placeholder="Search business type..." className="master-search-input" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {error && <div className="master-error">{error}</div>}
      <Toast message="Data tersimpan" type="success" isOpen={showToast} onClose={() => setShowToast(false)} />

      <div className="master-table-wrapper">
        <div className="master-table-container">
          <table className="master-table">
            <MasterTableHeader columns={TABLE_COLUMNS} />
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={selectedId === item.id ? 'master-row-selected' : 'master-row'}
                  onClick={() => handleSelect(item)}
                  onDoubleClick={() => openEditForm(item)}
                >
                  <td>{item.code}</td>
                  <td>{item.name}</td>
                  <td>
                    <MasterStatusToggle
                      active={item.is_active}
                      loading={togglingId === item.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleStatus(item)
                      }}
                    />
                  </td>
                  <td>
                    <MasterDefaultToggle
                      active={item.is_default}
                      loading={togglingId === item.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleDefault(item)
                      }}
                    />
                  </td>
                  <td>{item.is_system ? 'Yes' : 'No'}</td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="master-form-card">
          <div className="master-form-header">
            <span className="material-icons-round master-form-icon">category</span>
            <h2 className="master-form-title">{isNewMode ? 'Tambah Business Type' : 'Ubah Business Type'}</h2>
          </div>
          <div className="master-form-grid">
            <div className="master-form-group">
              <label className="master-form-label">Code :</label>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} className="master-form-input" readOnly={!isNewMode} />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Name :</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group-wide">
              <label className="master-form-label">Description :</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Active :</label>
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Default :</label>
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">System :</label>
              <input type="checkbox" checked={form.is_system} onChange={(e) => setForm({ ...form, is_system: e.target.checked })} />
            </div>
            <div className="master-form-group-wide" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="master-btn-cancel-secondary" onClick={() => setShowForm(false)}>Batal</button>
              <button type="button" className="master-btn-save-primary" onClick={handleSave} disabled={saving}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      <div className="master-footer">
        <div className="master-footer-actions">
          <button type="button" className="master-btn-save-primary" onClick={openNewForm}>Tambah</button>
          <button type="button" className="master-footer-btn" onClick={onExit}>
            <span className="material-icons-round master-footer-icon red">exit_to_app</span>
          </button>
        </div>
      </div>
    </div>
  )
}
