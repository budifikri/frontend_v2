import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../shared/auth'
import { listWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../../../features/master/warehouse/warehouse.api'
import { gudangDummyData } from '../../../data'
import { FooterMaster } from '../footer/FooterMaster'
import { FooterFormMaster } from '../footer/FooterFormMaster'
import { DeleteMaster } from '../footer/DeleteMaster'

const DEFAULT_FORM = {
  code: '',
  name: '',
  type: 'MAIN',
  address: '',
  city: '',
  phone: '',
}

const WAREHOUSE_TYPES = ['MAIN', 'BRANCH', 'STORAGE', 'OUTLET']

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
  const [togglingId, setTogglingId] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: 'code', direction: 'asc' })

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm, showDeleteConfirm, selectedId, data, searchKeyword])

  const filteredData = data.filter((row) => {
    const keyword = searchKeyword.toLowerCase()
    return (
      (row.code || '').toLowerCase().includes(keyword) ||
      (row.name || '').toLowerCase().includes(keyword) ||
      (row.type || '').toLowerCase().includes(keyword) ||
      (row.address || '').toLowerCase().includes(keyword) ||
      (row.city || '').toLowerCase().includes(keyword) ||
      (row.phone || '').toLowerCase().includes(keyword)
    )
  })

  const sortedData = [...filteredData].sort((a, b) => {
    const { key, direction } = sortConfig

    if (key === 'is_active') {
      const aVal = a.is_active ? 1 : 0
      const bVal = b.is_active ? 1 : 0
      return direction === 'asc' ? aVal - bVal : bVal - aVal
    }

    const aVal = String(a[key] ?? '').toLowerCase()
    const bVal = String(b[key] ?? '').toLowerCase()
    if (aVal === bVal) return 0
    const cmp = aVal > bVal ? 1 : -1
    return direction === 'asc' ? cmp : -cmp
  })

  const selectedItem = selectedId == null ? null : data.find((item) => item.id === selectedId) || null
  const isEditing = selectedItem != null

  const handleSave = async () => {
    if (!form.code || !form.name || !form.type) return

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
            type: form.type,
            address: form.address,
            city: form.city,
            phone: form.phone,
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
        type: selectedItem.type || 'MAIN',
        address: selectedItem.address || '',
        city: selectedItem.city || '',
        phone: selectedItem.phone || '',
      })
      setShowForm(true)
    } else if (sortedData.length > 0) {
      const item = sortedData[0]
      setSelectedId(item.id)
      setForm({
        code: item.code || '',
        name: item.name || '',
        type: item.type || 'MAIN',
        address: item.address || '',
        city: item.city || '',
        phone: item.phone || '',
      })
      setShowForm(true)
    }
  }

  const handlePrint = () => {
    setShowForm(false)
    window.print()
  }

  const handleToggleStatus = async (row) => {
    if (!row?.id || togglingId) return

    const nextIsActive = !row.is_active

    if (token) {
      setTogglingId(row.id)
      try {
        await updateWarehouse(token, row.id, { is_active: nextIsActive })
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

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        }
      }

      return {
        key,
        direction: 'asc',
      }
    })
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return 'unfold_more'
    return sortConfig.direction === 'asc' ? 'expand_less' : 'expand_more'
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setForm(DEFAULT_FORM)
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
                <th className="master-th-header master-th-sortable" onClick={() => handleSort('code')}>
                  <div className="master-th-content">
                    KODE
                    <span className={`material-icons-round ${sortConfig.key === 'code' ? 'text-primary' : ''}`}>{getSortIcon('code')}</span>
                  </div>
                </th>
                <th className="master-th-header master-th-sortable" onClick={() => handleSort('name')}>
                  <div className="master-th-content">
                    NAMA
                    <span className={`material-icons-round ${sortConfig.key === 'name' ? 'text-primary' : ''}`}>{getSortIcon('name')}</span>
                  </div>
                </th>
                <th className="master-th-header master-th-sortable" onClick={() => handleSort('type')}>
                  <div className="master-th-content">
                    TYPE
                    <span className={`material-icons-round ${sortConfig.key === 'type' ? 'text-primary' : ''}`}>{getSortIcon('type')}</span>
                  </div>
                </th>
                <th className="master-th-header master-th-sortable" onClick={() => handleSort('city')}>
                  <div className="master-th-content">
                    CITY
                    <span className={`material-icons-round ${sortConfig.key === 'city' ? 'text-primary' : ''}`}>{getSortIcon('city')}</span>
                  </div>
                </th>
                <th className="master-th-header master-th-sortable" onClick={() => handleSort('is_active')}>
                  <div className="master-th-content">
                    STATUS
                    <span className={`material-icons-round ${sortConfig.key === 'is_active' ? 'text-primary' : ''}`}>{getSortIcon('is_active')}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={selectedId === row.id ? 'master-row-selected' : 'master-row'}
                  onClick={() => handleSelect(row)}
                >
                  <td>{index + 1}</td>
                  <td>{row.code || '-'}</td>
                  <td>{row.name}</td>
                  <td>{row.type || '-'}</td>
                  <td>{row.city || '-'}</td>
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
              {!isLoading && sortedData.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center">No data</td>
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
            <div className="master-form-group">
              <label className="master-form-label">Tipe :</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="master-form-input"
              >
                {WAREHOUSE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="master-form-group-wide">
              <label className="master-form-label">Alamat :</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="master-form-input"
                placeholder="Masukkan alamat warehouse..."
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Kota :</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="master-form-input"
                placeholder="Masukkan kota..."
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Telepon :</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="master-form-input"
                placeholder="Masukkan telepon..."
              />
            </div>
            <FooterFormMaster onSave={handleSave} onCancel={handleCancelForm} isSaving={isSaving} />
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
