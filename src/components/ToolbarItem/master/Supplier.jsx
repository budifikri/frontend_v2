import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import { createSupplier, deleteSupplier, listSuppliers, updateSupplier } from '../../../features/master/supplier/supplier.api'
import { FooterMaster } from '../footer/FooterMaster'
import { FooterFormMaster } from '../footer/FooterFormMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { MasterStatusToggle } from '../table/MasterStatusToggle'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'

const DEFAULT_FORM = {
  name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  tax_id: '',
  payment_terms: 'NET_30',
  credit_limit: 0,
  notes: '',
}

const PAYMENT_TERMS = ['CASH', 'NET_30', 'NET_60', 'NET_90', 'COD']

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false },
  { key: 'code', label: 'CODE' },
  { key: 'name', label: 'NAME' },
  { key: 'contact_person', label: 'CONTACT' },
  { key: 'phone', label: 'PHONE' },
  { key: 'payment_terms', label: 'TERMS' },
  { key: 'is_active', label: 'STATUS' },
]

const DUMMY_SUPPLIERS = [
  {
    id: 'SUP001',
    code: 'SUP001',
    name: 'PT Sumber Makmur',
    contact_person: 'Rizal',
    email: 'supplier1@example.com',
    phone: '08121234567',
    address: 'Jl. Gatot Subroto No. 5',
    city: 'Jakarta',
    tax_id: '01.234.567.8-999.000',
    payment_terms: 'NET_30',
    credit_limit: 5000000,
    notes: '',
    is_active: true,
  },
  {
    id: 'SUP002',
    code: 'SUP002',
    name: 'CV Nusantara Trading',
    contact_person: 'Dina',
    email: 'supplier2@example.com',
    phone: '08129876543',
    address: 'Jl. Ahmad Yani No. 11',
    city: 'Bandung',
    tax_id: '02.345.678.9-999.000',
    payment_terms: 'CASH',
    credit_limit: 2000000,
    notes: '',
    is_active: true,
  },
  {
    id: 'SUP003',
    code: 'SUP003',
    name: 'UD Sejahtera Abadi',
    contact_person: 'Yuli',
    email: 'supplier3@example.com',
    phone: '08135557777',
    address: 'Jl. Pemuda No. 8',
    city: 'Semarang',
    tax_id: '03.456.789.0-999.000',
    payment_terms: 'NET_60',
    credit_limit: 3000000,
    notes: '',
    is_active: false,
  },
]

function isActiveSupplier(item) {
  if (typeof item?.is_active === 'boolean') return item.is_active
  return String(item?.status ?? 'active').toLowerCase() !== 'inactive'
}

export function Supplier({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
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
      const filtered = DUMMY_SUPPLIERS.filter((item) => {
        const active = isActiveSupplier(item)
        if (isActiveFilter === 'active' && !active) return false
        if (isActiveFilter === 'inactive' && active) return false
        if (paymentTerms && item.payment_terms !== paymentTerms) return false

        if (!keyword) return true
        return (
          String(item.code || '').toLowerCase().includes(keyword) ||
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
      const result = await listSuppliers(token, {
        search: searchKeyword.trim() || undefined,
        payment_terms: paymentTerms || undefined,
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
      setError(err.message || 'Failed to load suppliers')
      setData([])
      setPagination({ total: 0, has_more: false })
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, paymentTerms, isActiveFilter, limit, offset])

  const selectedItem = selectedId == null ? null : data.find((row) => row.id === selectedId) || null
  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'code',
    valueGetters: {
      is_active: (row) => (isActiveSupplier(row) ? 1 : 0),
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

  function handlePaymentTerms(value) {
    pager.reset()
    setPaymentTerms(value)
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
      contact_person: form.contact_person,
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      tax_id: form.tax_id,
      payment_terms: form.payment_terms,
      credit_limit: Number(form.credit_limit || 0),
      notes: form.notes,
    }

    try {
      if (token) {
        if (selectedItem) {
          await updateSupplier(token, selectedItem.id, payload)
        } else {
          await createSupplier(token, payload)
        }
        await fetchData()
      } else {
        if (selectedItem) {
          setData((prev) => prev.map((row) => (
            row.id === selectedItem.id ? { ...row, ...payload } : row
          )))
        } else {
          const newItem = {
            id: `SUP${Date.now()}`,
            code: `SUP${Date.now().toString().slice(-4)}`,
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
      setError(err.message || 'Failed to save supplier')
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
      contact_person: target.contact_person || '',
      email: target.email || '',
      phone: target.phone || '',
      address: target.address || '',
      city: target.city || '',
      tax_id: target.tax_id || '',
      payment_terms: target.payment_terms || 'NET_30',
      credit_limit: Number(target.credit_limit || 0),
      notes: target.notes || '',
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
        await deleteSupplier(token, selectedItem.id)
        await fetchData()
      } else {
        setData((prev) => prev.filter((row) => row.id !== selectedItem.id))
      }
    } catch (err) {
      setError(err.message || 'Failed to delete supplier')
    } finally {
      setShowDeleteConfirm(false)
      setShowForm(false)
      setSelectedId(null)
      setForm(DEFAULT_FORM)
    }
  }

  async function handleToggleStatus(row) {
    if (!row?.id || togglingId) return

    const nextIsActive = !isActiveSupplier(row)
    if (token) {
      setTogglingId(row.id)
      try {
        await updateSupplier(token, row.id, { is_active: nextIsActive })
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
        <h1 className="master-title">Daftar Supplier</h1>
      </div>

      <div className="master-subheader-controls">
        <div className="master-filter-wrap">
          <label htmlFor="supplier-terms-filter" className="master-filter-label">Terms</label>
          <select
            id="supplier-terms-filter"
            className="master-filter-select"
            value={paymentTerms}
            onChange={(e) => handlePaymentTerms(e.target.value)}
          >
            <option value="">All Terms</option>
            {PAYMENT_TERMS.map((term) => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
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
                >
                  <td>{offset + index + 1}</td>
                  <td>{row.code || '-'}</td>
                  <td>{row.name || '-'}</td>
                  <td>{row.contact_person || '-'}</td>
                  <td>{row.phone || '-'}</td>
                  <td>{row.payment_terms || '-'}</td>
                  <td>
                    <MasterStatusToggle
                      active={isActiveSupplier(row)}
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
            <span className="material-icons-round master-form-icon">local_shipping</span>
            <h2 className="master-form-title">{selectedItem ? 'Ubah Data Supplier' : 'Isi Data Supplier'}</h2>
          </div>
          <div className="master-form-grid">
            <div className="master-form-group">
              <label className="master-form-label">Nama :</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Contact :</label>
              <input type="text" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Email :</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Telepon :</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group-wide">
              <label className="master-form-label">Alamat :</label>
              <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Kota :</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">NPWP :</label>
              <input type="text" value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Terms :</label>
              <select value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} className="master-form-input">
                {PAYMENT_TERMS.map((term) => (
                  <option key={term} value={term}>{term}</option>
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
            <div className="master-form-group-wide">
              <label className="master-form-label">Notes :</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="master-form-input" />
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
