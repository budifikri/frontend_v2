import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../shared/auth'
import { listWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../../../features/master/warehouse/warehouse.api'
import { gudangDummyData } from '../../../data'
import { FooterMaster } from '../footer/FooterMaster'
import { DeleteMaster } from '../footer/DeleteMaster'

const DEFAULT_FORM = {
  code: '',
  name: '',
  type: 'MAIN',
  address: '',
  city: '',
  phone: '',
}

export function Warehouse({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState('active')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const fetchData = useCallback(async () => {
    if (!token) {
      setData(gudangDummyData.rows.map(item => ({
        id: item.kode,
        code: item.kode,
        name: item.nama,
        type: 'MAIN',
        address: '',
        city: '',
        phone: '',
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
        type: 'MAIN',
        address: '',
        city: '',
        phone: '',
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
  }, [showForm, showDeleteConfirm, showExitConfirm, selectedIndex, data])

  const filteredData = data.filter((row) => {
    const keyword = searchKeyword.toLowerCase()
    return (
      (row.code || '').toLowerCase().includes(keyword) ||
      (row.name || '').toLowerCase().includes(keyword)
    )
  })

  const handleSave = async () => {
    if (!form.code || !form.name) return

    setIsSaving(true)
    try {
      if (token) {
        if (selectedIndex >= 0) {
          const item = filteredData[selectedIndex]
          await updateWarehouse(token, item.id, { ...form, is_active: editIsActive })
        } else {
          await createWarehouse(token, form)
        }
        await fetchData()
      } else {
        if (selectedIndex >= 0) {
          const item = filteredData[selectedIndex]
          const newData = data.map(row => 
            row.id === item.id ? { ...row, ...form, is_active: editIsActive } : row
          )
          setData(newData)
        } else {
          const newItem = {
            id: form.code,
            code: form.code,
            name: form.name,
            type: form.type,
            address: form.address,
            city: form.city,
            phone: form.phone,
            is_active: editIsActive,
          }
          setData([...data, newItem])
        }
      }
      setForm(DEFAULT_FORM)
      setSelectedIndex(-1)
      setShowForm(false)
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSelect = (index) => {
    setSelectedIndex(index)
  }

  const handleDeleteClick = () => {
    if (selectedIndex >= 0) {
      setShowDeleteConfirm(true)
    }
  }

  const handleConfirmDelete = async () => {
    if (token) {
      try {
        const item = filteredData[selectedIndex]
        await deleteWarehouse(token, item.id)
      } catch (err) {
        console.warn('API delete failed, deleting locally:', err.message)
      }
    }
    
    const newData = data.filter((_, i) => i !== selectedIndex)
    setData(newData)
    setForm(DEFAULT_FORM)
    setSelectedIndex(-1)
    setShowForm(false)
    setShowDeleteConfirm(false)
  }

  const handleNew = () => {
    setShowForm(true)
    setForm(DEFAULT_FORM)
    setSelectedIndex(-1)
    setEditIsActive(true)
  }

  const handleEdit = () => {
    if (selectedIndex >= 0) {
      const item = filteredData[selectedIndex]
      setForm({
        code: item.code || '',
        name: item.name || '',
        type: item.type || 'MAIN',
        address: item.address || '',
        city: item.city || '',
        phone: item.phone || '',
      })
      setEditIsActive(item.is_active !== false)
      setShowForm(true)
    } else if (filteredData.length > 0) {
      setSelectedIndex(0)
      const item = filteredData[0]
      setForm({
        code: item.code || '',
        name: item.name || '',
        type: item.type || 'MAIN',
        address: item.address || '',
        city: item.city || '',
        phone: item.phone || '',
      })
      setEditIsActive(item.is_active !== false)
      setShowForm(true)
    }
  }

  const handleToggleActive = async (item) => {
    if (togglingId) return
    const nextIsActive = !item.is_active
    
    if (token) {
      setTogglingId(item.id)
      try {
        await updateWarehouse(token, item.id, { is_active: nextIsActive })
        await fetchData()
      } catch (err) {
        console.warn('API toggle failed, toggling locally:', err.message)
      } finally {
        setTogglingId(null)
      }
    }
    
    const newData = data.map(row => 
      row.id === item.id ? { ...row, is_active: nextIsActive } : row
    )
    setData(newData)
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

  const getStatusLabel = (item) => {
    if (typeof item.is_active === 'boolean') return item.is_active
    return String(item.status ?? 'active').toLowerCase() !== 'inactive'
  }

  return (
    <div className="master-content">
      <h1 className="master-title">warehouse</h1>

      {error && <div className="master-error">{error}</div>}

      <div className="master-table-wrapper">
        <table className="master-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Kode</th>
              <th>Nama</th>
              <th>Type</th>
              <th>Kota</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <tr
                key={row.id || index}
                className={selectedIndex === index ? 'selected' : ''}
                onClick={() => handleSelect(index)}
              >
                <td>{index + 1}</td>
                <td>{row.code || '-'}</td>
                <td>{row.name}</td>
                <td>{row.type || '-'}</td>
                <td>{row.city || '-'}</td>
                <td>
                  <label className="master-toggle">
                    <input
                      type="checkbox"
                      checked={getStatusLabel(row)}
                      disabled={togglingId === row.id}
                      onChange={() => handleToggleActive(row)}
                    />
                    <span className={`master-toggle-label ${getStatusLabel(row) ? 'active' : ''}`}>
                      {getStatusLabel(row) ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </td>
              </tr>
            ))}
            {!isLoading && filteredData.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center">No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="master-form">
          <h2>{selectedIndex >= 0 ? 'Ubah Data Warehouse' : 'Isi Data Warehouse'}</h2>
          <div className="master-form-grid">
            <div className="master-form-group">
              <label>Kode :</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="master-input"
              />
            </div>
            <div className="master-form-group">
              <label>Nama :</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="master-input"
              />
            </div>
            <div className="master-form-group">
              <label>Type :</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="master-input"
              >
                <option value="MAIN">MAIN</option>
                <option value="BRANCH">BRANCH</option>
                <option value="STORAGE">STORAGE</option>
                <option value="OUTLET">OUTLET</option>
              </select>
            </div>
            <div className="master-form-group">
              <label>Alamat :</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="master-input"
              />
            </div>
            <div className="master-form-group">
              <label>Kota :</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="master-input"
              />
            </div>
            <div className="master-form-group">
              <label>Telepon :</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="master-input"
              />
            </div>
            {selectedIndex >= 0 && (
              <div className="master-form-group">
                <label>Aktif :</label>
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                />
              </div>
            )}
            <div className="master-form-actions">
              <button type="button" className="master-btn-save" onClick={handleSave} disabled={isSaving}>
                {isSaving ? '...' : 'Simpan'}
              </button>
              <button type="button" className="master-btn-cancel" onClick={() => setShowForm(false)} disabled={isSaving}>
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
          itemName={filteredData[selectedIndex]?.name}
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
