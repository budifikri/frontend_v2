import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import { listUnits, createUnit, updateUnit, deleteUnit } from '../../../features/master/unit/unit.api'
import { satuanDummyData } from '../../../data'
import { FooterMaster } from '../footer/FooterMaster'
import { DeleteMaster } from '../footer/DeleteMaster'

const DEFAULT_FORM = {
  code: '',
  name: '',
  description: '',
}

function mapDummyRows() {
  return satuanDummyData.rows.map((item) => ({
    id: item.kode,
    code: item.kode,
    name: item.satuan,
    description: '',
    is_active: true,
  }))
}

export function Satuan({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [isActiveFilter, setIsActiveFilter] = useState('active')
  const [searchKeyword, setSearchKeyword] = useState('')

  const [form, setForm] = useState(DEFAULT_FORM)
  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const fetchData = useCallback(async () => {
    if (!token) {
      setData(mapDummyRows())
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await listUnits(token, {
        search: searchKeyword.trim() || undefined,
        is_active: isActiveFilter === 'all' ? undefined : isActiveFilter === 'active',
        include_inactive: isActiveFilter === 'all' ? true : undefined,
        limit: 50,
        offset: 0,
      })
      setData(result)
    } catch (err) {
      console.warn('Units API failed, fallback to dummy data:', err.message)
      setData(mapDummyRows())
    } finally {
      setIsLoading(false)
    }
  }, [token, isActiveFilter, searchKeyword])

  const selectedItem = selectedId == null ? null : data.find((row) => row.id === selectedId) || null
  const filteredData = data.filter((row) => {
    const keyword = searchKeyword.toLowerCase()
    return (
      (row.code || '').toLowerCase().includes(keyword) ||
      (row.name || '').toLowerCase().includes(keyword) ||
      (row.description || '').toLowerCase().includes(keyword)
    )
  })

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showDeleteConfirm) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setShowDeleteConfirm(false)
        }
        return
      }

      if (showForm) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setShowForm(false)
        }
        return
      }

      if (e.key === 'F2') {
        e.preventDefault()
        handleEdit()
      } else if (e.key === 'Delete') {
        e.preventDefault()
        handleDeleteClick()
      } else if (e.key === '+' || e.key === 'F1') {
        e.preventDefault()
        handleNew()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setShowExitConfirm(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showForm, showDeleteConfirm, selectedId, data])

  async function handleSave() {
    if (!form.code || !form.name) return

    setIsSaving(true)
    setError('')

    try {
      const payload = {
        code: form.code,
        name: form.name,
        description: form.description,
      }

      if (token) {
        if (selectedItem) {
          await updateUnit(token, selectedItem.id, payload)
        } else {
          await createUnit(token, payload)
        }
        await fetchData()
      } else {
        if (selectedItem) {
          setData((prev) => prev.map((row) => (
            row.id === selectedItem.id ? { ...row, ...payload } : row
          )))
        } else {
          setData((prev) => [
            ...prev,
            {
              id: form.code,
              ...payload,
              is_active: true,
            },
          ])
        }
      }

      setForm(DEFAULT_FORM)
      setSelectedId(null)
      setShowForm(false)
    } catch (err) {
      setError(err.message || 'Failed to save unit')
    } finally {
      setIsSaving(false)
    }
  }

  function handleSelect(row) {
    setSelectedId(row.id)
  }

  function handleNew() {
    setShowForm(true)
    setForm(DEFAULT_FORM)
    setSelectedId(null)
  }

  function handleEdit() {
    if (selectedItem) {
      setForm({
        code: selectedItem.code || '',
        name: selectedItem.name || '',
        description: selectedItem.description || '',
      })
      setShowForm(true)
      return
    }

    if (filteredData.length > 0) {
      const first = filteredData[0]
      setSelectedId(first.id)
      setForm({
        code: first.code || '',
        name: first.name || '',
        description: first.description || '',
      })
      setShowForm(true)
    }
  }

  function handleDeleteClick() {
    if (selectedItem) setShowDeleteConfirm(true)
  }

  async function handleConfirmDelete() {
    if (!selectedItem) {
      setShowDeleteConfirm(false)
      return
    }

    try {
      if (token) {
        await deleteUnit(token, selectedItem.id)
        await fetchData()
      } else {
        setData((prev) => prev.filter((row) => row.id !== selectedItem.id))
      }
    } catch (err) {
      setError(err.message || 'Failed to delete unit')
    } finally {
      setSelectedId(null)
      setForm(DEFAULT_FORM)
      setShowForm(false)
      setShowDeleteConfirm(false)
    }
  }

  async function handleToggleStatus(row) {
    if (!row?.id || togglingId) return

    const nextIsActive = !row.is_active

    if (token) {
      setTogglingId(row.id)
      try {
        await updateUnit(token, row.id, { is_active: nextIsActive })
        await fetchData()
      } catch (err) {
        setError(err.message || 'Failed to update status')
      } finally {
        setTogglingId(null)
      }
      return
    }

    setData((prev) => prev.map((item) => (
      item.id === row.id ? { ...item, is_active: nextIsActive } : item
    )))
  }

  function handleCancelForm() {
    setShowForm(false)
    setForm(DEFAULT_FORM)
  }

  function handlePrint() {
    setShowForm(false)
    window.print()
  }

  function handleExitClick() {
    setShowExitConfirm(true)
  }

  function handleConfirmExit() {
    setShowExitConfirm(false)
    onExit()
  }

  return (
    <div className="master-content">
      <div className="master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Daftar Satuan</h1>
      </div>

      {error && <div className="master-error">{error}</div>}

      <div className="master-table-wrapper">
        <div className="master-table-container">
          <table className="master-table">
            <thead>
              <tr>
                <th className="master-th-header">
                  <div className="master-th-content">NO</div>
                </th>
                <th className="master-th-header">
                  <div className="master-th-content">CODE</div>
                </th>
                <th className="master-th-header">
                  <div className="master-th-content">NAME</div>
                </th>
                <th className="master-th-header">
                  <div className="master-th-content">DESCRIPTION</div>
                </th>
                <th className="master-th-header">
                  <div className="master-th-content">STATUS</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={selectedId === row.id ? 'master-row-selected' : 'master-row'}
                  onClick={() => handleSelect(row)}
                >
                  <td>{index + 1}</td>
                  <td>{row.code || '-'}</td>
                  <td>{row.name || '-'}</td>
                  <td>{row.description || '-'}</td>
                  <td>
                    <button
                      type="button"
                      className={`master-status-toggle ${row.is_active ? 'is-active' : 'is-inactive'}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleStatus(row)
                      }}
                      disabled={togglingId === row.id}
                    >
                      {togglingId === row.id ? '...' : (row.is_active ? 'ACTIVE' : 'INACTIVE')}
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredData.length === 0 && (
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
            <span className="material-icons-round master-form-icon">straighten</span>
            <h2 className="master-form-title">{selectedItem ? 'Ubah Data Satuan' : 'Isi Data Satuan'}</h2>
          </div>
          <div className="master-form-grid">
            <div className="master-form-group">
              <label className="master-form-label">Kode :</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="master-form-input"
              />
            </div>
            <div className="master-form-group-wide">
              <label className="master-form-label">Nama :</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="master-form-input"
                placeholder="Masukkan nama satuan..."
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Deskripsi :</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="master-form-input"
                placeholder="Masukkan deskripsi..."
              />
            </div>
            <div className="master-form-actions">
              <button
                type="button"
                className="master-btn-save-primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                <span className="material-icons-round">save</span>
                Simpan
              </button>
              <button
                type="button"
                className="master-btn-cancel-secondary"
                onClick={handleCancelForm}
                disabled={isSaving}
              >
                <span className="material-icons-round">close</span>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <FooterMaster
        onNew={handleNew}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        totalRow={filteredData.length}
        onSearch={setSearchKeyword}
        onPrint={handlePrint}
        onExit={handleExitClick}
        filter={isActiveFilter}
        onFilterChange={setIsActiveFilter}
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      {showDeleteConfirm && (
        <DeleteMaster
          itemName={selectedItem?.name}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showExitConfirm && (
        <DeleteMaster
          itemName="keluar dari halaman ini"
          title="Konfirmasi Keluar"
          confirmText="Ya"
          cancelText="Tidak"
          isExit={true}
          onConfirm={handleConfirmExit}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
    </div>
  )
}
