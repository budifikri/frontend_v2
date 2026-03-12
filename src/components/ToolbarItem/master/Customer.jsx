import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import { createCustomer, deleteCustomer, listCustomers, updateCustomer } from '../../../features/master/customer/customer.api'
import { FooterMaster } from '../footer/FooterMaster'
import { FooterFormMaster } from '../footer/FooterFormMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { MasterStatusToggle } from '../table/MasterStatusToggle'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'

const DEFAULT_FORM = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  tier: 'BRONZE',
  credit_limit: 0,
  bank_name: '',
  bank_account_number: '',
  bank_account_name: '',
  bank_branch: '',
}

const TIERS = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false },
  { key: 'customer_code', label: 'CODE' },
  { key: 'name', label: 'NAME' },
  { key: 'email', label: 'EMAIL' },
  { key: 'phone', label: 'PHONE' },
  { key: 'tier', label: 'TIER' },
  { key: 'is_active', label: 'STATUS' },
]

const DUMMY_CUSTOMERS = [
  {
    id: 'CUS001',
    customer_code: 'CUS001',
    name: 'Andi Wijaya',
    email: 'andi@example.com',
    phone: '081234567890',
    address: 'Jl. Merdeka No. 10',
    city: 'Jakarta',
    tier: 'GOLD',
    credit_limit: 1000000,
    bank_name: 'BCA',
    bank_account_number: '1234567890',
    bank_account_name: 'Andi Wijaya',
    bank_branch: 'KCP Sudirman',
    is_active: true,
  },
  {
    id: 'CUS002',
    customer_code: 'CUS002',
    name: 'Budi Santoso',
    email: 'budi@example.com',
    phone: '082345678901',
    address: 'Jl. Sudirman No. 20',
    city: 'Bandung',
    tier: 'SILVER',
    credit_limit: 500000,
    bank_name: 'Mandiri',
    bank_account_number: '9876543210',
    bank_account_name: 'Budi Santoso',
    bank_branch: 'KCP Dago',
    is_active: true,
  },
  {
    id: 'CUS003',
    customer_code: 'CUS003',
    name: 'Citra Lestari',
    email: 'citra@example.com',
    phone: '083456789012',
    address: 'Jl. Diponegoro No. 8',
    city: 'Surabaya',
    tier: 'BRONZE',
    credit_limit: 250000,
    bank_name: 'BNI',
    bank_account_number: '5554443332',
    bank_account_name: 'Citra Lestari',
    bank_branch: 'KCP Tunjungan',
    is_active: false,
  },
]

function isActiveCustomer(item) {
  if (typeof item?.is_active === 'boolean') return item.is_active
  return String(item?.status ?? 'active').toLowerCase() !== 'inactive'
}

export function Customer({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState('active')
  const pager = useMasterPagination({ initialLimit: 10, total: pagination.total, hasMore: pagination.has_more })
  const { limit, offset } = pager

  const [form, setForm] = useState(DEFAULT_FORM)
  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const fetchData = useCallback(async () => {
    setError('')
    setIsLoading(true)

    if (!token) {
      const keyword = searchKeyword.trim().toLowerCase()
      const filtered = DUMMY_CUSTOMERS.filter((item) => {
        const active = isActiveCustomer(item)
        if (isActiveFilter === 'active' && !active) return false
        if (isActiveFilter === 'inactive' && active) return false
        if (tierFilter && String(item.tier || '').toUpperCase() !== tierFilter) return false

        if (!keyword) return true
        return (
          String(item.customer_code || '').toLowerCase().includes(keyword) ||
          String(item.name || '').toLowerCase().includes(keyword) ||
          String(item.email || '').toLowerCase().includes(keyword) ||
          String(item.phone || '').toLowerCase().includes(keyword)
        )
      })

      const rows = filtered.slice(offset, offset + limit)
      setData(rows)
      setPagination({
        total: filtered.length,
        has_more: offset + limit < filtered.length,
      })
      setIsLoading(false)
      return
    }

    try {
      const result = await listCustomers(token, {
        search: searchKeyword.trim() || undefined,
        tier: tierFilter || undefined,
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
      setError(err.message || 'Failed to load customers')
      setData([])
      setPagination({ total: 0, has_more: false })
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, tierFilter, isActiveFilter, limit, offset])

  const selectedItem = selectedId == null ? null : data.find((row) => row.id === selectedId) || null
  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'customer_code',
    valueGetters: {
      is_active: (row) => (isActiveCustomer(row) ? 1 : 0),
    },
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeleteConfirm, showForm, selectedId, data])

  function handleSearchChange(value) {
    pager.reset()
    setSearchKeyword(value)
  }

  function handleTierChange(value) {
    pager.reset()
    setTierFilter(value)
  }

  function handleStatusFilter(value) {
    pager.reset()
    setIsActiveFilter(value)
  }

  async function handleSave() {
    if (!form.name) return

    setIsSaving(true)
    setError('')

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      tier: form.tier,
      credit_limit: Number(form.credit_limit || 0),
      bank_name: form.bank_name,
      bank_account_number: form.bank_account_number,
      bank_account_name: form.bank_account_name,
      bank_branch: form.bank_branch,
    }

    try {
      if (token) {
        if (selectedItem) {
          await updateCustomer(token, selectedItem.id, payload)
        } else {
          await createCustomer(token, payload)
        }
        await fetchData()
      } else {
        if (selectedItem) {
          setData((prev) => prev.map((row) => (
            row.id === selectedItem.id ? { ...row, ...payload } : row
          )))
        } else {
          const newItem = {
            id: `CUST${Date.now()}`,
            customer_code: `CUST${Date.now().toString().slice(-4)}`,
            ...payload,
            is_active: true,
          }
          setData((prev) => [newItem, ...prev])
        }
      }

      setForm(DEFAULT_FORM)
      setShowForm(false)
      setSelectedId(null)
    } catch (err) {
      setError(err.message || 'Failed to save customer')
    } finally {
      setIsSaving(false)
    }
  }

  function handleSelect(row) {
    setSelectedId(row.id)
  }

  function handleNew() {
    setSelectedId(null)
    setForm(DEFAULT_FORM)
    setShowForm(true)
  }

  function handleEdit() {
    const target = selectedItem || data[0]
    if (!target) return

    setSelectedId(target.id)
    setForm({
      name: target.name || '',
      email: target.email || '',
      phone: target.phone || '',
      address: target.address || '',
      city: target.city || '',
      tier: target.tier || 'BRONZE',
      credit_limit: Number(target.credit_limit || 0),
      bank_name: target.bank_name || '',
      bank_account_number: target.bank_account_number || '',
      bank_account_name: target.bank_account_name || '',
      bank_branch: target.bank_branch || '',
    })
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
        await deleteCustomer(token, selectedItem.id)
        await fetchData()
      } else {
        setData((prev) => prev.filter((row) => row.id !== selectedItem.id))
      }
    } catch (err) {
      setError(err.message || 'Failed to delete customer')
    } finally {
      setShowDeleteConfirm(false)
      setShowForm(false)
      setSelectedId(null)
      setForm(DEFAULT_FORM)
    }
  }

  async function handleToggleStatus(row) {
    if (!row?.id || togglingId) return

    const nextIsActive = !isActiveCustomer(row)
    if (token) {
      setTogglingId(row.id)
      try {
        await updateCustomer(token, row.id, { is_active: nextIsActive })
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
        <h1 className="master-title">Daftar Customer</h1>
        <div className="master-header-filters">
          <div className="master-footer-search">
            <input
              type="text"
              placeholder="Search keyword..."
              className="master-search-input"
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <button type="button" className="master-search-btn">
              <span className="material-icons-round material-icon">search</span>
            </button>
          </div>
          <div className="master-filter-wrap">
            <label htmlFor="customer-tier-filter" className="master-filter-label">Tier</label>
            <select
              id="customer-tier-filter"
              className="master-filter-select"
              value={tierFilter}
              onChange={(e) => handleTierChange(e.target.value)}
            >
              <option value="">All Tier</option>
              {TIERS.map((tier) => (
                <option key={tier} value={tier}>{tier}</option>
              ))}
            </select>
          </div>
          <div className="master-filter-wrap">
            <label htmlFor="customer-status-filter" className="master-filter-label">Status</label>
            <select
              id="customer-status-filter"
              className="master-filter-select"
              value={isActiveFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
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
                  onDoubleClick={() => handleEdit()}
                >
                  <td>{offset + index + 1}</td>
                  <td>{row.customer_code || '-'}</td>
                  <td>{row.name || '-'}</td>
                  <td>{row.email || '-'}</td>
                  <td>{row.phone || '-'}</td>
                  <td>{row.tier || '-'}</td>
                  <td>
                    <MasterStatusToggle
                      active={isActiveCustomer(row)}
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
                  <td colSpan={7} className="text-center">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="master-form-card">
          <div className="master-form-header">
            <span className="material-icons-round master-form-icon">groups</span>
            <h2 className="master-form-title">{selectedItem ? 'Ubah Data Customer' : 'Isi Data Customer'}</h2>
          </div>
          <div className="master-form-grid">
            <div className="master-form-group">
              <label className="master-form-label">Nama :</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Email :</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Telepon :</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Kota :</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group-wide">
              <label className="master-form-label">Alamat :</label>
              <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Tier :</label>
              <select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} className="master-form-input">
                {TIERS.map((tier) => (
                  <option key={tier} value={tier}>{tier}</option>
                ))}
              </select>
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Credit Limit :</label>
              <input
                type="number"
                value={form.credit_limit}
                onChange={(e) => setForm({ ...form, credit_limit: Number(e.target.value) })}
                className="master-form-input"
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Bank :</label>
              <input type="text" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Cabang :</label>
              <input type="text" value={form.bank_branch} onChange={(e) => setForm({ ...form, bank_branch: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">No. Rek :</label>
              <input type="text" value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">A/N Rek :</label>
              <input type="text" value={form.bank_account_name} onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })} className="master-form-input" />
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
        onPrint={handlePrint}
        onExit={handleExitClick}
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
