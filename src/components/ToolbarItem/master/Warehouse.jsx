import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../shared/auth'
import { listWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../../../features/master/warehouse/warehouse.api'
import { gudangDummyData } from '../../../data'
import { FooterMaster } from '../footer/FooterMaster'
import { FooterFormMaster } from '../footer/FooterFormMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { MasterStatusToggle } from '../table/MasterStatusToggle'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'

const DEFAULT_FORM = {
  code: '',
  name: '',
  type: 'MAIN',
  address: '',
  city: '',
  phone: '',
}

const WAREHOUSE_TYPES = ['MAIN', 'BRANCH', 'STORAGE', 'OUTLET']

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false },
  { key: 'code', label: 'KODE' },
  { key: 'name', label: 'NAMA' },
  { key: 'type', label: 'TYPE' },
  { key: 'city', label: 'CITY' },
  { key: 'is_active', label: 'STATUS' },
]

export function Warehouse({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [error, setError] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState('active')

  const [searchKeyword, setSearchKeyword] = useState('')
  const pager = useMasterPagination({ initialLimit: 10, total: pagination.total, hasMore: pagination.has_more })
  const { limit, offset } = pager
  const [form, setForm] = useState(DEFAULT_FORM)
  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const fetchData = useCallback(async () => {
    if (!token) {
      const mapped = gudangDummyData.rows.map(item => ({
        id: item.kode,
        code: item.kode,
        name: item.nama,
        type: 'MAIN',
        address: '',
        city: '',
        phone: '',
        is_active: true,
      }))

      const keyword = searchKeyword.trim().toLowerCase()
      const filtered = mapped.filter((item) => {
        if (isActiveFilter === 'active' && !item.is_active) return false
        if (isActiveFilter === 'inactive' && item.is_active) return false
        if (!keyword) return true

        return (
          String(item.code || '').toLowerCase().includes(keyword) ||
          String(item.name || '').toLowerCase().includes(keyword) ||
          String(item.type || '').toLowerCase().includes(keyword) ||
          String(item.address || '').toLowerCase().includes(keyword) ||
          String(item.city || '').toLowerCase().includes(keyword) ||
          String(item.phone || '').toLowerCase().includes(keyword)
        )
      })

      const rows = filtered.slice(offset, offset + limit)
      setData(rows)
      setPagination({ total: filtered.length, has_more: offset + limit < filtered.length })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const params = {
        search: searchKeyword.trim() || undefined,
        is_active: isActiveFilter === 'all' ? undefined : isActiveFilter === 'active',
        include_inactive: isActiveFilter === 'all' ? true : undefined,
        limit,
        offset,
      }
      const result = await listWarehouses(token, params)
      setData(result.items || [])
      const nextPagination = result.pagination || {}
      setPagination({
        total: Number(nextPagination.total ?? 0),
        has_more: Boolean(nextPagination.has_more),
      })
    } catch (err) {
      console.warn('API failed, using dummy data:', err.message)
      const mapped = gudangDummyData.rows.map(item => ({
        id: item.kode,
        code: item.kode,
        name: item.nama,
        type: 'MAIN',
        address: '',
        city: '',
        phone: '',
        is_active: true,
      }))
      const rows = mapped.slice(offset, offset + limit)
      setData(rows)
      setPagination({ total: mapped.length, has_more: offset + limit < mapped.length })
    } finally {
      setIsLoading(false)
    }
  }, [token, isActiveFilter, searchKeyword, limit, offset])

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

  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'code',
    valueGetters: {
      is_active: (row) => (row?.is_active ? 1 : 0),
    },
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

  const handleSearchChange = (value) => {
    pager.reset()
    setSearchKeyword(value)
  }

  const handleStatusFilter = (value) => {
    pager.reset()
    setIsActiveFilter(value)
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
            <MasterTableHeader columns={TABLE_COLUMNS} sortConfig={sortConfig} onSort={handleSort} />
            <tbody>
              {sortedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={selectedId === row.id ? 'master-row-selected' : 'master-row'}
                  onClick={() => handleSelect(row)}
                >
                  <td>{offset + index + 1}</td>
                  <td>{row.code || '-'}</td>
                  <td>{row.name}</td>
                  <td>{row.type || '-'}</td>
                  <td>{row.city || '-'}</td>
                  <td>
                    <MasterStatusToggle
                      active={row.is_active}
                      loading={togglingId === row.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleStatus(row)
                      }}
                    />
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
        totalRow={pagination.total}
        onSearch={handleSearchChange}
        onPrint={handlePrint}
        onExit={handleExitClick}
        filter={isActiveFilter}
        onFilterChange={handleStatusFilter}
        onRefresh={fetchData}
        isLoading={isLoading}
        page={pager.page}
        totalPages={pager.totalPages}
        canPrev={pager.canPrev}
        canNext={pager.canNext}
        onFirstPage={pager.goFirst}
        onPrevPage={pager.goPrev}
        onNextPage={pager.goNext}
        onLastPage={pager.goLast}
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
