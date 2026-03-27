import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../../shared/auth'
import { createUser, deleteUser, listUsers, updateUser } from '../../../../features/setting/user/user.api'
import { FooterMaster } from '../../footer/FooterMaster'
import { FooterFormMaster } from '../../footer/FooterFormMaster'
import { DeleteMaster } from '../../footer/DeleteMaster'
import { MasterTableHeader } from '../../table/MasterTableHeader'
import { MasterStatusToggle } from '../../table/MasterStatusToggle'
import { useMasterTableSort } from '../../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../../hooks/useMasterPagination'

const DEFAULT_FORM = {
  username: '',
  full_name: '',
  email: '',
  phone: '',
  role: 'CASHIER',
  password: '',
  confirm_password: '',
  is_active: true,
}

const ROLE_OPTIONS = ['ADMIN', 'MANAGER', 'SUPERVISOR', 'CASHIER']

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false },
  { key: 'username', label: 'USERNAME' },
  { key: 'full_name', label: 'NAME' },
  { key: 'email', label: 'EMAIL' },
  { key: 'role', label: 'ROLE' },
  { key: 'is_active', label: 'STATUS' },
]

const DUMMY_USERS = [
  {
    id: 'USR001',
    username: 'admin',
    full_name: 'Administrator',
    email: 'admin@minimarket.local',
    phone: '081234567890',
    role: 'ADMIN',
    is_active: true,
  },
  {
    id: 'USR002',
    username: 'kasir01',
    full_name: 'Kasir Pagi',
    email: 'kasir01@minimarket.local',
    phone: '082233445566',
    role: 'CASHIER',
    is_active: true,
  },
  {
    id: 'USR003',
    username: 'manager',
    full_name: 'Store Manager',
    email: 'manager@minimarket.local',
    phone: '087700110022',
    role: 'MANAGER',
    is_active: false,
  },
]

function isActiveUser(item) {
  if (typeof item?.is_active === 'boolean') return item.is_active
  return String(item?.status ?? 'active').toLowerCase() !== 'inactive'
}

function getUserFullName(item) {
  return item?.full_name || item?.name || '-'
}

function mapFormFromItem(item) {
  return {
    username: item?.username || '',
    full_name: item?.full_name || item?.name || '',
    email: item?.email || '',
    phone: item?.phone || '',
    role: item?.role || 'CASHIER',
    password: '',
    confirm_password: '',
    is_active: isActiveUser(item),
  }
}

export function User({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showPasswordMismatchPopup, setShowPasswordMismatchPopup] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [formKey, setFormKey] = useState(0)

  const [searchKeyword, setSearchKeyword] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState('active')
  const pager = useMasterPagination({ initialLimit: 10, total: pagination.total, hasMore: pagination.has_more })
  const { limit, offset } = pager

  const [form, setForm] = useState(DEFAULT_FORM)

  const selectedItem = selectedId == null ? null : data.find((row) => row.id === selectedId) || null
  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'username',
    valueGetters: {
      full_name: (row) => getUserFullName(row),
      is_active: (row) => (isActiveUser(row) ? 1 : 0),
    },
  })

  const fetchData = useCallback(async () => {
    setError('')
    setIsLoading(true)

    try {
      if (!token) {
        const keyword = searchKeyword.trim().toLowerCase()
        const filtered = DUMMY_USERS.filter((item) => {
          const active = isActiveUser(item)
          if (isActiveFilter === 'active' && !active) return false
          if (isActiveFilter === 'inactive' && active) return false

          if (!keyword) return true
          return (
            String(item.username || '').toLowerCase().includes(keyword) ||
            String(getUserFullName(item)).toLowerCase().includes(keyword) ||
            String(item.email || '').toLowerCase().includes(keyword) ||
            String(item.role || '').toLowerCase().includes(keyword)
          )
        })

        const rows = filtered.slice(offset, offset + limit)
        setData(rows)
        setPagination({
          total: filtered.length,
          has_more: offset + limit < filtered.length,
        })
        return
      }

      const result = await listUsers(token, {
        search: searchKeyword.trim() || undefined,
        is_active: isActiveFilter === 'all' ? undefined : isActiveFilter === 'active',
        include_inactive: isActiveFilter === 'all' ? true : undefined,
        limit,
        offset,
      })

      setData(result.items || [])
      const nextPagination = result.pagination || {}
      setPagination({
        total: Number(nextPagination.total ?? 0),
        has_more: Boolean(nextPagination.has_more),
      })
    } catch (err) {
      setError(err.message || 'Failed to load users')
      setData([])
      setPagination({ total: 0, has_more: false })
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, isActiveFilter, limit, offset])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (showForm && !selectedItem) {
      setForm(DEFAULT_FORM)
      setShowChangePassword(true)
    }
  }, [showForm, selectedItem])

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
  }, [showDeleteConfirm, showForm, selectedId, data])

  function handleSearchChange(value) {
    pager.reset()
    setSearchKeyword(value)
  }

  function handleStatusFilter(value) {
    pager.reset()
    setIsActiveFilter(value)
  }

  function handleSelect(row) {
    setSelectedId(row.id)
  }

  function handleNew() {
    setFormKey((k) => k + 1)
    setForm(DEFAULT_FORM)
    setShowChangePassword(true)
    setSelectedId(null)
    setShowForm(true)
  }

  function handleEdit() {
    const target = selectedItem || data[0]
    if (!target) return

    setSelectedId(target.id)
    setForm(mapFormFromItem(target))
    setShowChangePassword(false)
    setShowForm(true)
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
        await deleteUser(token, selectedItem.id)
        await fetchData()
      } else {
        setData((prev) => prev.filter((row) => row.id !== selectedItem.id))
      }
    } catch (err) {
      setError(err.message || 'Failed to delete user')
    } finally {
      setShowDeleteConfirm(false)
      setShowForm(false)
      setSelectedId(null)
      setForm(DEFAULT_FORM)
    }
  }

  async function handleSave() {
    if (!form.username || form.username.trim().length < 3) {
      setError('Username minimal 3 karakter')
      return
    }
    if (!form.full_name || form.full_name.trim().length < 2) {
      setError('Nama lengkap minimal 2 karakter')
      return
    }
    if (!form.email || !form.email.trim()) {
      setError('Email wajib diisi')
      return
    }

    const shouldValidatePassword = !selectedItem || showChangePassword
    const passwordValue = shouldValidatePassword ? form.password.trim() : ''
    const confirmPasswordValue = shouldValidatePassword ? form.confirm_password.trim() : ''

    if (!selectedItem && (!passwordValue || passwordValue.length < 6)) {
      setError('Password minimal 6 karakter')
      return
    }

    if (passwordValue || confirmPasswordValue) {
      if (passwordValue !== confirmPasswordValue) {
        setShowPasswordMismatchPopup(true)
        return
      }
    }

    setIsSaving(true)
    setError('')

    const payload = {
      username: form.username.trim(),
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone?.trim() || undefined,
      role: form.role.toLowerCase(),
      is_active: form.is_active,
    }

    if (passwordValue) {
      payload.password = passwordValue
    }

    console.log('[User] handleSave - payload:', JSON.parse(JSON.stringify(payload)))

    try {
      if (token) {
        if (selectedItem) {
          console.log('[User] updateUser - calling API')
          await updateUser(token, selectedItem.id, payload)
        } else {
          console.log('[User] createUser - calling API')
          await createUser(token, payload)
        }
        await fetchData()
      } else if (selectedItem) {
        setData((prev) => prev.map((row) => (
          row.id === selectedItem.id
            ? {
              ...row,
              ...payload,
            }
            : row
        )))
      } else {
        const newItem = {
          id: `USR${Date.now()}`,
          ...payload,
        }
        setData((prev) => [newItem, ...prev])
      }

      setShowForm(false)
      setSelectedId(null)
      setForm(DEFAULT_FORM)
    } catch (err) {
      setError(err.message || 'Failed to save user')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleStatus(row) {
    if (!row?.id || togglingId) return

    const nextIsActive = !isActiveUser(row)
    if (token) {
      setTogglingId(row.id)
      try {
        await updateUser(token, row.id, { is_active: nextIsActive })
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
    setShowChangePassword(false)
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
        <h1 className="master-title">Daftar User</h1>
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
                  onDoubleClick={() => {
                    setSelectedId(row.id)
                    setForm(mapFormFromItem(row))
                    setShowChangePassword(false)
                    setShowForm(true)
                  }}
                >
                  <td>{offset + index + 1}</td>
                  <td>{row.username || '-'}</td>
                  <td>{getUserFullName(row)}</td>
                  <td>{row.email || '-'}</td>
                  <td>{row.role || '-'}</td>
                  <td>
                    <MasterStatusToggle
                      active={isActiveUser(row)}
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
        <div className="master-form-card" key={selectedItem ? `edit-${selectedItem.id}` : 'new-user'}>
          <div className="master-form-header">
            <span className="material-icons-round master-form-icon">person</span>
            <h2 className="master-form-title">{selectedItem ? 'Ubah Data User' : 'Isi Data User'}</h2>
          </div>
          <div className="master-form-grid" key={`form-grid-${formKey}`}>
            <div className="master-form-group">
              <label className="master-form-label">Username :</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="master-form-input"
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Nama :</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="master-form-input"
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Email :</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="master-form-input"
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Telepon :</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="master-form-input"
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Role :</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="master-form-input"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            {(!selectedItem || showChangePassword) && (
              <div className="master-form-section">
                <div className="master-form-group">
                  <label className="master-form-label">Password :</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="master-form-input"
                    placeholder={selectedItem ? 'Masukkan password baru' : 'Masukkan password'}
                  />
                </div>
                <div className="master-form-group">
                  <label className="master-form-label">Ulangi Password :</label>
                  <input
                    type="password"
                    value={form.confirm_password}
                    onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                    className="master-form-input"
                    placeholder={selectedItem ? 'Ulangi password baru' : 'Ulangi password'}
                  />
                </div>
                 <div className="master-form-group"></div><div className="master-form-group"></div><div className="master-form-group"></div>
              </div>
            )}

            <FooterFormMaster
              onSave={handleSave}
              onCancel={handleCancelForm}
              isSaving={isSaving}
              leftButtons={
                selectedItem && (
                  <button
                    type="button"
                    className={`user-password-toggle ${showChangePassword ? 'is-on' : 'is-off'}`}
                    onClick={() => {
                      setShowChangePassword((prev) => {
                        const next = !prev
                        if (!next) {
                          setForm((current) => ({
                            ...current,
                            password: '',
                            confirm_password: '',
                          }))
                        }
                        return next
                      })
                    }}
                  >
                    Ganti Password
                  </button>
                )
              }
            />
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
          itemName={selectedItem?.username || getUserFullName(selectedItem)}
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

      {showPasswordMismatchPopup && (
        <DeleteMaster
          title="Validasi Password"
          message="Konfirmasi password tidak sama"
          confirmText="OK"
          singleAction={true}
          onConfirm={() => setShowPasswordMismatchPopup(false)}
          onCancel={() => setShowPasswordMismatchPopup(false)}
        />
      )}
    </div>
  )
}
