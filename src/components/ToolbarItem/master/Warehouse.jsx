import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../shared/auth'
import { listWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../../../features/master/warehouse/warehouse.api'
import { gudangDummyData } from '../../../data'
import { FooterMaster } from '../footer/FooterMaster'
import { DeleteMaster } from '../footer/DeleteMaster'

const DEFAULT_FORM = {
  code: '',
  name: '',
}

export function Warehouse({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState('active')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [form, setForm] = useState(DEFAULT_FORM)
  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const [isSaving, setIsSaving] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token) {
      setData(gudangDummyData.rows.map(item => ({
        id: item.kode,
        code: item.kode,
        name: item.nama,
        is_active: true,
      })))
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const params = {
        is_active: isActiveFilter === 'all' ? undefined : isActiveFilter === 'active',
        include_inactive: isActiveFilter === 'all' ? true : undefined,
      }
      const result = await listWarehouses(token, params)
      setData(result)
    } catch (err) {
      console.warn('API failed, using dummy data:', err.message)
      setData(gudangDummyData.rows.map(item => ({
        id: item.kode,
        code: item.kode,
        name: item.nama,
        is_active: true,
      })))
    } finally {
      setIsLoading(false)
    }
  }, [token, isActiveFilter])

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
  }, [showForm, showDeleteConfirm, selectedId, data, searchKeyword])

  const filteredData = data.filter((row) => {
    const keyword = searchKeyword.toLowerCase()
    return (
      (row.code || '').toLowerCase().includes(keyword) ||
      (row.name || '').toLowerCase().includes(keyword)
    )
  })

  const selectedItem = selectedId == null ? null : data.find((item) => item.id === selectedId) || null
  const isEditing = selectedItem != null

  const handleSave = async () => {
    if (!form.code || !form.name) return

    setIsSaving(true)
    try {
      if (token) {
        if (selectedItem) {
          await updateWarehouse(token, selectedItem.id, form)
        } else {
          await createWarehouse(token, form)
        }
        await fetchData()
      } else {
        if (selectedItem) {
          const newData = data.map(row => 
            row.id === selectedItem.id ? { ...row, ...form } : row
          )
          setData(newData)
        } else {
          const newItem = {
            id: form.code,
            code: form.code,
            name: form.name,
            is_active: true,
          }
          setData([...data, newItem])
        }
      }
      setForm(DEFAULT_FORM)
      setSelectedId(null)
      setShowForm(false)
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSelect = (row) => {
    setSelectedId(row.id)
  }

  const handleDeleteClick = () => {
    if (selectedItem) {
      setShowDeleteConfirm(true)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedItem) {
      setShowDeleteConfirm(false)
      return
    }

    if (token) {
      try {
        await deleteWarehouse(token, selectedItem.id)
      } catch (err) {
        console.warn('API delete failed, deleting locally:', err.message)
      }
    }

    const newData = data.filter((row) => row.id !== selectedItem.id)
    setData(newData)
    setForm(DEFAULT_FORM)
    setSelectedId(null)
    setShowForm(false)
    setShowDeleteConfirm(false)
  }

  const handleNew = () => {
    setShowForm(true)
    setForm(DEFAULT_FORM)
    setSelectedId(null)
  }

  const handleEdit = () => {
    if (selectedItem) {
      setForm({
        code: selectedItem.code || '',
        name: selectedItem.name || '',
      })
      setShowForm(true)
    } else if (filteredData.length > 0) {
      const item = filteredData[0]
      setSelectedId(item.id)
      setForm({
        code: item.code || '',
        name: item.name || '',
      })
      setShowForm(true)
    }
  }

  const handlePrint = () => {
    setShowForm(false)
    window.print()
  }

  const handleExitClick = () => {
    setShowExitConfirm(true)
  }

  const handleConfirmExit = () => {
    setShowExitConfirm(false)
    onExit()
  }

  return (
    <div className="master-content">
      <div className="master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Daftar Warehouse</h1>
      </div>

      {error && <div className="master-error">{error}</div>}

      <div className="master-table-wrapper">
        <div className="master-table-container">
          <table className="master-table">
            <thead>
              <tr>
                <th className="master-th-header">
                  <div className="master-th-content">
                    NO
                    <span className="material-icons-round">unfold_more</span>
                  </div>
                </th>
                <th className="master-th-header">
                  <div className="master-th-content">
                    KODE
                    <span className="material-icons-round text-primary">expand_more</span>
                  </div>
                </th>
                <th className="master-th-header">
                  <div className="master-th-content">
                    NAMA
                    <span className="material-icons-round">unfold_more</span>
                  </div>
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
                  <td>{row.name}</td>
                </tr>
              ))}
              {!isLoading && filteredData.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="master-form-card">
           <div className="master-form-header">
             <span className="material-icons-round master-form-icon">store</span>
             <h2 className="master-form-title">{isEditing ? 'Ubah Data Warehouse' : 'Isi Data Warehouse'}</h2>
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
                placeholder="Masukkan nama warehouse..."
              />
            </div>
            <button
              type="button"
              className="master-btn-save-primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              <span className="material-icons-round">save</span>
              Simpan
            </button>
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
