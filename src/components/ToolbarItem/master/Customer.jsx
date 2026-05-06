import { useCallback, useEffect, useState, useRef } from 'react'
import { useAuth } from '../../../shared/auth'
import { useModule } from '../../../shared/useModule'
import { createCustomer, deleteCustomer, listCustomers, updateCustomer } from '../../../features/master/customer/customer.api'
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
import { useMasterTableKeyboardNav } from '../../../hooks/useMasterTableKeyboardNav'
import { exportToExcel, generateTemplate, validateImportFile } from '../../../utils/excelUtils'
import { Toast } from '../../../components/Toast'

function getTableColumns(isClinic) {
  if (isClinic) {
    return [
      { key: 'no', label: 'NO', sortable: false },
      { key: 'name', label: 'NAME' },
      { key: 'no_rm', label: 'NO RM' },
      { key: 'no_nik', label: 'KTP' },
      { key: 'email', label: 'EMAIL' },
      { key: 'phone', label: 'PHONE' },
      { key: 'tier', label: 'TIER' },
      { key: 'allergies', label: 'ALERGI' },
      { key: 'is_active', label: 'STATUS' },
    ]
  }

  return [
    { key: 'no', label: 'NO', sortable: false },
    { key: 'customer_code', label: 'CODE' },
    { key: 'name', label: 'NAME' },
    { key: 'no_nik', label: 'KTP' },
    { key: 'email', label: 'EMAIL' },
    { key: 'phone', label: 'PHONE' },
    { key: 'tier', label: 'TIER' },
    { key: 'is_active', label: 'STATUS' },
  ]
}

function getExcelColumns(isClinic) {
  return [
    { key: 'customer_code', label: 'CODE' },
    { key: 'name', label: 'NAME' },
    ...(isClinic ? [{ key: 'no_rm', label: 'NO RM' }] : []),
    { key: 'no_nik', label: 'KTP' },
    { key: 'email', label: 'EMAIL' },
    { key: 'phone', label: 'PHONE' },
    { key: 'address', label: 'ADDRESS' },
    { key: 'city', label: 'CITY' },
    { key: 'tier', label: 'TIER' },
    ...(isClinic ? [{ key: 'allergies', label: 'ALERGI' }] : []),
  ]
}

const DEFAULT_FORM = {
  name: '',
  no_rm: '',
  no_nik: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  tier: 'BRONZE',
  allergies: '',
  credit_limit: 0,
  bank_name: '',
  bank_account_number: '',
  bank_account_name: '',
  bank_branch: '',
}

const KTP_PATTERN = /^\d{16}$/

function getFormState(item = {}) {
  return {
    name: item.name || '',
    no_rm: item.no_rm || '',
    no_nik: item.no_nik || '',
    email: item.email || '',
    phone: item.phone || '',
    address: item.address || '',
    city: item.city || '',
    tier: item.tier || 'BRONZE',
    allergies: item.allergies || '',
    credit_limit: Number(item.credit_limit || 0),
    bank_name: item.bank_name || '',
    bank_account_number: item.bank_account_number || '',
    bank_account_name: item.bank_account_name || '',
    bank_branch: item.bank_branch || '',
  }
}

const TIERS = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']

const DUMMY_CUSTOMERS = [
  {
    id: 'CUS001',
    customer_code: 'CUS001',
    name: 'Andi Wijaya',
    no_nik: '3174010101010001',
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
    no_nik: '3174010101010002',
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
    no_nik: '3174010101010003',
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
  const { companyConfig } = useModule()
  const token = auth?.token

  const isClinic = companyConfig?.businessType === 'clinic'
  const entityLabel = isClinic ? 'Pasien' : 'Customer'

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
  const [currentEditIndex, setCurrentEditIndex] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [isNewMode, setIsNewMode] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [pendingImportData, setPendingImportData] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [togglingId, setTogglingId] = useState(null)
  const tableRef = useRef(null)

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
          String(item.no_rm || '').toLowerCase().includes(keyword) ||
          String(item.no_nik || '').toLowerCase().includes(keyword) ||
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

  useMasterTableKeyboardNav({
    data: sortedData,
    selectedId,
    setSelectedId,
    handleEdit,
    tableRef,
    isModalOpen: showForm || showDeleteConfirm || showExitConfirm || showImportConfirm,
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
        } else if (e.ctrlKey && e.key === 'ArrowLeft') {
          e.preventDefault()
          handlePrevRecord()
        } else if (e.ctrlKey && e.key === 'ArrowRight') {
          e.preventDefault()
          handleNextRecord()
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
  }, [showDeleteConfirm, showForm, selectedId, data, handlePrevRecord, handleNextRecord])

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

  function handleToggleAllRecords(value) {
    pager.toggleAllRecords(value)
  }

  async function handleSave() {
    const trimmedName = form.name.trim()
    const trimmedNoRM = form.no_rm.trim()
    const trimmedNoNIK = form.no_nik.trim()

    if (!trimmedName) return
    if (trimmedNoNIK && !KTP_PATTERN.test(trimmedNoNIK)) {
      setError('KTP harus 16 digit angka')
      return
    }

    setIsSaving(true)
    setError('')

    const payload = {
      name: trimmedName,
      no_rm: isClinic ? trimmedNoRM : undefined,
      no_nik: trimmedNoNIK || undefined,
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      tier: form.tier,
      allergies: form.allergies,
      credit_limit: Number(form.credit_limit || 0),
      bank_name: form.bank_name,
      bank_account_number: form.bank_account_number,
      bank_account_name: form.bank_account_name,
      bank_branch: form.bank_branch,
    }

    try {
      if (token) {
        if (isNewMode) await createCustomer(token, payload)
        else await updateCustomer(token, selectedItem.id, payload)
        await fetchData()
      } else {
        if (isNewMode) {
          const newItem = {
            id: `CUST${Date.now()}`,
            customer_code: `CUST${Date.now().toString().slice(-4)}`,
            ...payload,
            no_rm: isClinic ? trimmedNoRM : '',
            no_nik: trimmedNoNIK,
            is_active: true,
          }
          setData((prev) => [newItem, ...prev])
        } else {
          setData((prev) => prev.map((row) => (
            row.id === selectedItem.id ? { ...row, ...payload } : row
          )))
        }
      }

      setToastMessage('Data tersimpan')
      setShowToast(true)
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
    setCurrentEditIndex(null)
    setForm(DEFAULT_FORM)
    setIsNewMode(true)
    setShowForm(true)
  }

  function handleEdit() {
    const target = selectedItem || sortedData[0]
    if (!target) return
    const idx = sortedData.findIndex((item) => item.id === target.id)
    setSelectedId(target.id)
    setCurrentEditIndex(idx)
    setForm(getFormState(target))
    setIsNewMode(false)
    setShowForm(true)
  }

  function handleNextRecord() {
    if (currentEditIndex === null || currentEditIndex >= sortedData.length - 1) return
    const nextItem = sortedData[currentEditIndex + 1]
    if (!nextItem) return
    setSelectedId(nextItem.id)
    setCurrentEditIndex(currentEditIndex + 1)
    setForm(getFormState(nextItem))
  }

  function handlePrevRecord() {
    if (currentEditIndex === null || currentEditIndex <= 0) return
    const prevItem = sortedData[currentEditIndex - 1]
    if (!prevItem) return
    setSelectedId(prevItem.id)
    setCurrentEditIndex(currentEditIndex - 1)
    setForm(getFormState(prevItem))
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


  function handleCloseForm() {
    setShowForm(false)
    setSelectedId(null)
    setCurrentEditIndex(null)
    setForm(DEFAULT_FORM)
    setIsNewMode(false)
  }

  function handlePrint() {
    setShowForm(false)
    const printColumns = [
      { key: 'no', label: 'NO', align: 'text-center', formatter: (_, __, index) => index + 1 },
      ...(!isClinic ? [{ key: 'customer_code', label: 'KODE' }] : []),
      { key: 'name', label: 'NAMA' },
      ...(isClinic ? [{ key: 'no_rm', label: 'NO RM' }] : []),
      { key: 'no_nik', label: 'KTP' },
      { key: 'email', label: 'EMAIL' },
      { key: 'phone', label: 'TELEPON' },
      { key: 'address', label: 'ALAMAT' },
      { key: 'city', label: 'KOTA' },
      ...(isClinic ? [{ key: 'allergies', label: 'ALERGI' }] : []),
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
          title: `Daftar Master ${entityLabel}`,
          company: companyInfo,
          meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
          columns: printColumns,
          data: printData,
          footerTextOverride: `Laporan ${entityLabel} dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
        });
      }).catch(() => {
        openReportPrintWindow({
          title: `Daftar Master ${entityLabel}`,
          company: companyInfo,
          meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
          columns: printColumns,
          data: printData,
          footerTextOverride: `Laporan ${entityLabel} dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
        });
      });
    } else {
      openReportPrintWindow({
        title: `Daftar Master ${entityLabel}`,
        company: companyInfo,
        meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
        columns: printColumns,
        data: printData,
        footerTextOverride: `Laporan ${entityLabel} dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
      });
    }
  }

  const handleExportExcel = () => {
    const exportData = data.map(row => {
      const base = {
        CODE: row.customer_code || row.code || '',
        NAME: row.name || '',
        KTP: row.no_nik || '',
        EMAIL: row.email || '',
        PHONE: row.phone || '',
        ADDRESS: row.address || '',
        CITY: row.city || '',
        TIER: row.tier || 'BRONZE',
      }
      if (isClinic) base['NO RM'] = row.no_rm || ''
      if (isClinic) base.ALERGI = row.allergies || ''
      return base
    })
    exportToExcel(exportData, 'customer')
  }

  const handleImportExcel = async (file) => {
    try {
      const result = await validateImportFile(file, getExcelColumns(isClinic))
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
      const code = row.CODE || row.customer_code || row.code
      if (!code) continue

      const existingIndex = newData.findIndex(item => item.customer_code === code || item.code === code)
      const itemData = {
        customer_code: code,
        name: row.NAME || row.name || '',
        no_rm: isClinic ? (row['NO RM'] || row.no_rm || '') : '',
        no_nik: row.KTP || row.no_nik || '',
        email: row.EMAIL || row.email || '',
        phone: row.PHONE || row.phone || '',
        address: row.ADDRESS || row.address || '',
        city: row.CITY || row.city || '',
        tier: row.TIER || row.tier || 'BRONZE',
        allergies: isClinic ? (row.ALERGI || row.allergies || '') : '',
        is_active: true,
      }

      if (existingIndex >= 0) {
        if (token) {
          try {
            await updateCustomer(token, newData[existingIndex].id, itemData)
          } catch (err) {
            console.warn('Update failed:', err.message)
          }
        }
        newData[existingIndex] = { ...newData[existingIndex], ...itemData }
        updatedCount++
      } else {
        if (token) {
          try {
            await createCustomer(token, itemData)
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
    generateTemplate(getExcelColumns(isClinic), 'customer_template')
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
        <h1 className="master-title">Daftar {entityLabel}</h1>
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

      <div className="master-table-wrapper" ref={tableRef} tabIndex={0}>
        <div className="master-table-container">
          <table className="master-table">
            <MasterTableHeader columns={getTableColumns(isClinic)} sortConfig={sortConfig} onSort={handleSort} />
            <tbody>
              {sortedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={selectedId === row.id ? 'master-row-selected' : 'master-row'}
                  onClick={() => handleSelect(row)}
                  onDoubleClick={() => handleEdit()}
                >
                  <td>{offset + index + 1}</td>
                  {!isClinic && <td>{row.customer_code || '-'}</td>}
                  <td>{row.name || '-'}</td>
                  {isClinic && <td>{row.no_rm || '-'}</td>}
                  <td>{row.no_nik || '-'}</td>
                  <td>{row.email || '-'}</td>
                  <td>{row.phone || '-'}</td>
                  <td>{row.tier || '-'}</td>
                  {isClinic && <td>{row.allergies || '-'}</td>}
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
                  <td colSpan={isClinic ? 9 : 8} className="text-center">No data</td>
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
            <h2 className="master-form-title">{isNewMode ? `Isi Data ${entityLabel}` : `Ubah Data ${entityLabel}`}</h2>
          </div>
          <div className="master-form-grid">
            <div className="master-form-group">
              <label className="master-form-label">Nama :</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="master-form-input" />
            </div>
            {isClinic && (
              <div className="master-form-group">
                <label className="master-form-label">NO RM :</label>
                <input type="text" value={form.no_rm} onChange={(e) => setForm({ ...form, no_rm: e.target.value })} className="master-form-input" />
              </div>
            )}
            <div className="master-form-group">
              <label className="master-form-label">KTP :</label>
              <input type="text" value={form.no_nik} onChange={(e) => setForm({ ...form, no_nik: e.target.value })} className="master-form-input" maxLength={16} />
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
            {isClinic && (
              <div className="master-form-group-wide">
                <label className="master-form-label">Alergi :</label>
                <textarea
                  value={form.allergies}
                  onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                  className="master-form-input"
                  rows={3}
                />
              </div>
            )}
            {!isClinic && (
              <>
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
              </>
            )}

            <FooterFormMaster
              onSave={handleSave}
              onClose={handleCloseForm}
              isSaving={isSaving}
              onNext={handleNextRecord}
              onPrev={handlePrevRecord}
              canNext={currentEditIndex !== null && sortedData.length > 1 && currentEditIndex < sortedData.length - 1}
              canPrev={currentEditIndex !== null && sortedData.length > 1 && currentEditIndex > 0}
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
        excelColumns={getExcelColumns(isClinic)}
        excelFilename="customer"
        onExportExcel={handleExportExcel}
        onImportExcel={handleImportExcel}
        onGenerateTemplate={handleGenerateTemplate}
        isAllRecords={pager.isAllRecords}
        onToggleAllRecords={handleToggleAllRecords}
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
