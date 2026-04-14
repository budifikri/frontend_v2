import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import { createSupplier, deleteSupplier, listSuppliers, updateSupplier } from '../../../features/master/supplier/supplier.api'
import { getCurrentCompany } from '../../../features/master/company/company.api'
import { openReportPrintWindow } from '../../../utils/reportPrint'
import { FooterMaster } from '../footer/FooterMaster'
import { FooterFormMaster } from '../footer/FooterFormMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { ImportConfirmMaster } from '../footer/ImportConfirmMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { MasterStatusToggle } from '../table/MasterStatusToggle'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'
import { exportToExcel, generateTemplate, validateImportFile } from '../../../utils/excelUtils'
import { Toast } from '../../../components/Toast'

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

const EXCEL_COLUMNS = [
  { key: 'code', label: 'CODE' },
  { key: 'name', label: 'NAME' },
  { key: 'contact_person', label: 'CONTACT_PERSON' },
  { key: 'email', label: 'EMAIL' },
  { key: 'phone', label: 'PHONE' },
  { key: 'address', label: 'ADDRESS' },
  { key: 'city', label: 'CITY' },
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
  const [currentEditIndex, setCurrentEditIndex] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [pendingImportData, setPendingImportData] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
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

      setToastMessage('Data tersimpan')
      setShowToast(true)
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
    setCurrentEditIndex(null)
    setForm(DEFAULT_FORM)
    setShowForm(true)
  }

  function handleEdit() {
    const target = selectedItem || sortedData[0]
    if (!target) return
    const idx = sortedData.findIndex((item) => item.id === target.id)
    setSelectedId(target.id)
    setCurrentEditIndex(idx)
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

  function handleNextRecord() {
    if (currentEditIndex === null || currentEditIndex >= sortedData.length - 1) return
    const nextItem = sortedData[currentEditIndex + 1]
    if (!nextItem) return
    setSelectedId(nextItem.id)
    setCurrentEditIndex(currentEditIndex + 1)
    setForm({
      name: nextItem.name || '',
      contact_person: nextItem.contact_person || '',
      email: nextItem.email || '',
      phone: nextItem.phone || '',
      address: nextItem.address || '',
      city: nextItem.city || '',
      tax_id: nextItem.tax_id || '',
      payment_terms: nextItem.payment_terms || 'NET_30',
      credit_limit: Number(nextItem.credit_limit || 0),
      notes: nextItem.notes || '',
    })
  }

  function handlePrevRecord() {
    if (currentEditIndex === null || currentEditIndex <= 0) return
    const prevItem = sortedData[currentEditIndex - 1]
    if (!prevItem) return
    setSelectedId(prevItem.id)
    setCurrentEditIndex(currentEditIndex - 1)
    setForm({
      name: prevItem.name || '',
      contact_person: prevItem.contact_person || '',
      email: prevItem.email || '',
      phone: prevItem.phone || '',
      address: prevItem.address || '',
      city: prevItem.city || '',
      tax_id: prevItem.tax_id || '',
      payment_terms: prevItem.payment_terms || 'NET_30',
      credit_limit: Number(prevItem.credit_limit || 0),
      notes: prevItem.notes || '',
    })
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


  function handleCloseForm() {
    setShowForm(false)
    setSelectedId(null)
    setCurrentEditIndex(null)
    setForm(DEFAULT_FORM)
  }

  function handlePrint() {
    setShowForm(false)
    const printColumns = [
      { key: 'no', label: 'NO', align: 'text-center', formatter: (_, __, index) => index + 1 },
      { key: 'code', label: 'KODE' },
      { key: 'name', label: 'NAMA' },
      { key: 'contact_person', label: 'KONTAK' },
      { key: 'email', label: 'EMAIL' },
      { key: 'phone', label: 'TELEPON' },
      { key: 'address', label: 'ALAMAT' },
      { key: 'city', label: 'KOTA' },
      { key: 'is_active', label: 'STATUS', align: 'text-center', formatter: (v) => v ? 'Aktif' : 'Non-Aktif' },
    ]
    const printData = sortedData.map((item, index) => ({ ...item, no: index + 1 }))
    
    const companyInfo = { name: '', address: '', phone: '' };
    if (token) {
      getCurrentCompany(token).then(res => {
        if (res?.data) {
          companyInfo.name = res.data.nama || res.data.name || auth.companyName || '';
          companyInfo.address = res.data.address || '';
          companyInfo.phone = res.data.telp || res.data.phone || '';
        }
        openReportPrintWindow({
          title: 'Daftar Master Supplier',
          company: companyInfo,
          meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
          columns: printColumns,
          data: printData,
          footerTextOverride: `Laporan Supplier dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
        });
      }).catch(() => {
        openReportPrintWindow({
          title: 'Daftar Master Supplier',
          company: companyInfo,
          meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
          columns: printColumns,
          data: printData,
          footerTextOverride: `Laporan Supplier dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
        });
      });
    } else {
      openReportPrintWindow({
        title: 'Daftar Master Supplier',
        company: companyInfo,
        meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
        columns: printColumns,
        data: printData,
        footerTextOverride: `Laporan Supplier dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
      });
    }
  }

  const handleExportExcel = () => {
    const exportData = data.map(row => ({
      CODE: row.code || '',
      NAME: row.name || '',
      CONTACT_PERSON: row.contact_person || '',
      EMAIL: row.email || '',
      PHONE: row.phone || '',
      ADDRESS: row.address || '',
      CITY: row.city || '',
    }))
    exportToExcel(exportData, 'supplier')
  }

  const handleImportExcel = async (file) => {
    try {
      const result = await validateImportFile(file, EXCEL_COLUMNS)
      setPendingImportData({ file, data: result.data, count: result.recordCount, fileName: result.fileName, isValid: true })
      setShowImportConfirm(true)
    } catch (err) {
      setPendingImportData({ file, fileName: file.name, isValid: false, errorMessage: err.message })
      setShowImportConfirm(true)
    }
  }

  const handleConfirmImport = async () => {
    if (!pendingImportData || !pendingImportData.isValid) return
    const { data: imported } = pendingImportData
    const newData = [...data]
    let addedCount = 0
    let updatedCount = 0

    for (const row of imported) {
      const code = row.CODE || row.code
      if (!code) continue

      const existingIndex = newData.findIndex(item => item.code === code)
      const itemData = {
        code,
        name: row.NAME || row.name || '',
        contact_person: row.CONTACT_PERSON || row.contact_person || '',
        email: row.EMAIL || row.email || '',
        phone: row.PHONE || row.phone || '',
        address: row.ADDRESS || row.address || '',
        city: row.CITY || row.city || '',
        is_active: true,
      }

      if (existingIndex >= 0) {
        if (token) {
          try {
            await updateSupplier(token, code, itemData)
          } catch (err) {
            console.warn('Update failed:', err.message)
          }
        }
        newData[existingIndex] = { ...newData[existingIndex], ...itemData }
        updatedCount++
      } else {
        if (token) {
          try {
            await createSupplier(token, itemData)
          } catch (err) {
            console.warn('Create failed:', err.message)
          }
        }
        newData.push({ id: code, ...itemData })
        addedCount++
      }
    }

    setData(newData)
    setPagination({ ...pagination, total: newData.length })
    setShowImportConfirm(false)
    setPendingImportData(null)
    setToastMessage(`Berhasil import: ${addedCount} baru, ${updatedCount} diperbarui`)
    setShowToast(true)
  }

  const handleCancelImport = () => {
    setShowImportConfirm(false)
    setPendingImportData(null)
  }

  const handleGenerateTemplate = () => {
    generateTemplate(EXCEL_COLUMNS, 'supplier_template')
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
          <div className="master-filter-wrap">
            <label htmlFor="supplier-status-filter" className="master-filter-label">Status</label>
            <select
              id="supplier-status-filter"
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
          <button type="button" className="master-form-close" onClick={handleCloseForm}>
            <span className="material-icons-round">close</span>
          </button>
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

            <FooterFormMaster
              onSave={handleSave}
              onClose={handleCloseForm}
              isSaving={isSaving}
              onNext={handleNextRecord}
              onPrev={handlePrevRecord}
              canNext={currentEditIndex !== null && currentEditIndex < sortedData.length - 1}
              canPrev={currentEditIndex !== null && currentEditIndex > 0}
            />
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
        excelColumns={EXCEL_COLUMNS}
        excelFilename="supplier"
        onExportExcel={handleExportExcel}
        onImportExcel={handleImportExcel}
        onGenerateTemplate={handleGenerateTemplate}
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

      {showImportConfirm && (
        <ImportConfirmMaster
          fileName={pendingImportData?.fileName || ''}
          recordCount={pendingImportData?.count || 0}
          isValid={pendingImportData?.isValid ?? true}
          errorMessage={pendingImportData?.errorMessage || ''}
          onConfirm={handleConfirmImport}
          onCancel={handleCancelImport}
        />
      )}

      {showToast && <Toast message={toastMessage} type="success" onClose={() => setShowToast(false)} />}
    </div>
  )
}
