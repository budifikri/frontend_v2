import { useCallback, useEffect, useState, useRef } from 'react'
import { useAuth } from '../../../shared/auth'
import { createCompany, deleteCompany, listCompanies, updateCompany } from '../../../features/master/company/company.api'
import { listBusinessTypes } from '../../../features/setting/businessType/businessType.api'
import { FooterMaster } from '../footer/FooterMaster'
import { FooterFormMaster } from '../footer/FooterFormMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { ImportConfirmMaster } from '../footer/ImportConfirmMaster'
import { Toast } from '../../../components/Toast'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { MasterStatusToggle } from '../table/MasterStatusToggle'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'
import { useMasterTableKeyboardNav } from '../../../hooks/useMasterTableKeyboardNav'
import { exportToExcel, generateTemplate, validateImportFile } from '../../../utils/excelUtils'

const DEFAULT_FORM = {
  code: '',
  nama: '',
  email: '',
  telp: '',
  address: '',
  website: '',
  tax_id: '',
  business_license: '',
  business_type: 'retail',
  is_active: true,
}

const DUMMY_COMPANIES = [
  {
    id: 'CMP001',
    code: 'CMP001',
    nama: 'PT Maju Jaya Retail',
    email: 'admin@majujaya.co.id',
    telp: '021-5551001',
    address: 'Jl. Sudirman No. 88, Jakarta',
    website: 'https://majujaya.co.id',
    tax_id: '01.234.567.8-999.000',
    business_license: 'NIB-2025-0001',
    business_type: 'retail',
    modules: ['retail_basic', 'retail_advanced'],
    is_active: true,
  },
  {
    id: 'CMP002',
    code: 'CMP002',
    nama: 'CV Nusantara Grosir',
    email: 'contact@nusantara-grosir.id',
    telp: '031-7002002',
    address: 'Jl. Diponegoro No. 12, Surabaya',
    website: 'https://nusantara-grosir.id',
    tax_id: '02.345.678.9-888.000',
    business_license: 'NIB-2025-0002',
    business_type: 'clinic',
    modules: ['clinic_core'],
    is_active: false,
  },
]

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false },
  { key: 'code', label: 'CODE' },
  { key: 'nama', label: 'NAME' },
  { key: 'email', label: 'EMAIL' },
  { key: 'telp', label: 'PHONE' },
  { key: 'is_active', label: 'STATUS' },
]

const EXCEL_COLUMNS = [
  { key: 'code', label: 'CODE' },
  { key: 'nama', label: 'NAME' },
  { key: 'email', label: 'EMAIL' },
  { key: 'telp', label: 'PHONE' },
  { key: 'address', label: 'ADDRESS' },
  { key: 'website', label: 'WEBSITE' },
]

function isActiveCompany(item) {
  if (typeof item?.is_active === 'boolean') return item.is_active
  return String(item?.status ?? 'active').toLowerCase() === 'active'
}

function mapFormFromItem(item) {
  return {
    code: item?.code || '',
    nama: item?.nama || item?.name || '',
    email: item?.email || '',
    telp: item?.telp || item?.phone || '',
    address: item?.address || '',
    website: item?.website || '',
    tax_id: item?.tax_id || '',
    business_license: item?.business_license || '',
    business_type: item?.business_type || 'retail',
    is_active: isActiveCompany(item),
  }
}

export function Company({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [isNewMode, setIsNewMode] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const tableRef = useRef(null)
  const [pendingImportData, setPendingImportData] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const [isActiveFilter, setIsActiveFilter] = useState('active')
  const [searchKeyword, setSearchKeyword] = useState('')
  const pager = useMasterPagination({ initialLimit: 10, total: pagination.total, hasMore: pagination.has_more })
  const { limit, offset } = pager
  const [togglingId, setTogglingId] = useState(null)

  const [form, setForm] = useState(DEFAULT_FORM)
  const [businessTypes, setBusinessTypes] = useState([
    { id: 'retail', code: 'retail', name: 'Retail' },
    { id: 'clinic', code: 'clinic', name: 'Klinik' },
  ])

  const selectedItem = selectedId == null ? null : data.find((row) => row.id === selectedId) || null
  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'code',
    valueGetters: {
      nama: (row) => row?.nama || row?.name || '',
      telp: (row) => row?.telp || row?.phone || '',
      is_active: (row) => (isActiveCompany(row) ? 1 : 0),
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

  const fetchData = useCallback(async () => {
    setError('')
    setIsLoading(true)

    try {
      if (!token) {
        const keyword = searchKeyword.trim().toLowerCase()
        const filtered = DUMMY_COMPANIES.filter((item) => {
          const active = isActiveCompany(item)
          if (isActiveFilter === 'active' && !active) return false
          if (isActiveFilter === 'inactive' && active) return false

          if (!keyword) return true
          return (
            String(item.code || '').toLowerCase().includes(keyword) ||
            String(item.nama || item.name || '').toLowerCase().includes(keyword) ||
            String(item.email || '').toLowerCase().includes(keyword) ||
            String(item.telp || item.phone || '').toLowerCase().includes(keyword)
          )
        })

        const rows = filtered.slice(offset, offset + limit)
        setData(rows)
        setPagination({ total: filtered.length, has_more: offset + limit < filtered.length })
        return
      }

      const result = await listCompanies(token, {
        search: searchKeyword.trim() || undefined,
        is_active: isActiveFilter === 'all' ? undefined : isActiveFilter === 'active',
        include_inactive: isActiveFilter === 'all' ? true : undefined,
        limit,
        offset,
      })
      const items = result.items || []
      const nextPagination = result.pagination || {}

      setData(items)
      setPagination({
        total: Number(nextPagination.total ?? 0),
        has_more: Boolean(nextPagination.has_more),
      })
    } catch (err) {
      setError(err.message || 'Failed to load companies')
      setData([])
      setPagination({ total: 0, has_more: false })
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, isActiveFilter, offset, limit])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    async function fetchBusinessTypes() {
      if (!token) return
      try {
        const result = await listBusinessTypes(token, { is_active: true, limit: 100, offset: 0 })
        if (Array.isArray(result.items) && result.items.length > 0) {
          setBusinessTypes(result.items)
        }
      } catch {
        // keep fallback options
      }
    }

    fetchBusinessTypes()
  }, [token])

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

  async function handleSave() {
    if (!form.code || !form.nama || !form.email) return

    setIsSaving(true)
    setError('')

      const payload = {
        code: form.code,
        nama: form.nama,
        email: form.email,
        business_type: form.business_type,
        telp: form.telp || undefined,
        address: form.address || undefined,
      website: form.website || undefined,
      tax_id: form.tax_id || undefined,
      business_license: form.business_license || undefined,
      is_active: form.is_active,
    }

    try {
      if (token) {
        if (isNewMode) await createCompany(token, payload)
        else await updateCompany(token, selectedItem.id, payload)
        await fetchData()
      } else {
        if (isNewMode) {
          const next = {
            id: `CMP${Date.now()}`,
            ...payload,
          }
          setData((prev) => [next, ...prev])
          setPagination((prev) => ({ ...prev, total: prev.total + 1 }))
        } else {
          setData((prev) => prev.map((row) => (
            row.id === selectedItem.id ? { ...row, ...payload } : row
          )))
        }
      }

      setForm(DEFAULT_FORM)
      setSelectedId(null)
      setShowForm(false)
    } catch (err) {
      setError(err.message || 'Failed to save company')
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
    setIsNewMode(true)
    setShowForm(true)
  }

  function handleEdit() {
    const target = selectedItem || data[0]
    if (!target) return
    setSelectedId(target.id)
    setForm(mapFormFromItem(target))
    setIsNewMode(false)
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
        await deleteCompany(token, selectedItem.id)
        await fetchData()
      } else {
        setData((prev) => prev.filter((row) => row.id !== selectedItem.id))
        setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }))
      }
    } catch (err) {
      setError(err.message || 'Failed to delete company')
    } finally {
      setShowDeleteConfirm(false)
      setShowForm(false)
      setSelectedId(null)
      setForm(DEFAULT_FORM)
    }
  }

  async function handleToggleStatus(row) {
    if (!row?.id || togglingId) return
    const nextIsActive = !isActiveCompany(row)

    if (token) {
      setTogglingId(row.id)
      try {
        await updateCompany(token, row.id, { is_active: nextIsActive })
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

  function handleSearchChange(value) {
    pager.reset()
    setSearchKeyword(value)
  }

  function handleStatusFilter(value) {
    pager.reset()
    setIsActiveFilter(value)
  }

  function handlePrint() {
    setShowForm(false)
    window.print()
  }

  const handleExportExcel = () => {
    const exportData = data.map(row => ({
      CODE: row.code || '',
      NAME: row.nama || row.name || '',
      EMAIL: row.email || '',
      PHONE: row.telp || row.phone || '',
      ADDRESS: row.address || '',
      WEBSITE: row.website || '',
    }))
    exportToExcel(exportData, 'company')
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
          nama: row.NAME || row.nama || row.name || '',
          email: row.EMAIL || row.email || '',
          business_type: row.BUSINESS_TYPE || row.business_type || 'retail',
          telp: row.PHONE || row.phone || row.telp || '',
        address: row.ADDRESS || row.address || '',
        website: row.WEBSITE || row.website || '',
        is_active: true,
      }

      if (existingIndex >= 0) {
        if (token) {
          try {
            await updateCompany(token, code, itemData)
          } catch (err) {
            console.warn('Update failed:', err.message)
          }
        }
        newData[existingIndex] = { ...newData[existingIndex], ...itemData }
        updatedCount++
      } else {
        if (token) {
          try {
            await createCompany(token, itemData)
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
    generateTemplate(EXCEL_COLUMNS, 'company_template')
  }

  function handleExitClick() {
    setShowExitConfirm(true)
  }

  function handleConfirmExit() {
    setShowExitConfirm(false)
    onExit()
  }

  function handleCancelForm() {
    setShowForm(false)
    setForm(DEFAULT_FORM)
    setIsNewMode(false)
  }

  return (
    <div className="master-content">
      <div className="master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Daftar Company</h1>
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
            <label htmlFor="company-status-filter" className="master-filter-label">Status</label>
            <select
              id="company-status-filter"
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
                  <td>{row.nama || row.name || '-'}</td>
                  <td>{row.email || '-'}</td>
                  <td>{row.telp || row.phone || '-'}</td>
                  <td>
                    <MasterStatusToggle
                      active={isActiveCompany(row)}
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
            <span className="material-icons-round master-form-icon">apartment</span>
            <h2 className="master-form-title">{isNewMode ? 'Isi Data Company' : 'Ubah Data Company'}</h2>
          </div>
          <div className="master-form-grid">
            <div className="master-form-group">
              <label className="master-form-label">Code :</label>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Name :</label>
              <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Email :</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Phone :</label>
              <input type="text" value={form.telp} onChange={(e) => setForm({ ...form, telp: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Business Type :</label>
              <select
                value={form.business_type}
                onChange={(e) => setForm({ ...form, business_type: e.target.value })}
                className="master-form-input"
              >
                {businessTypes.map((item) => (
                  <option key={item.id || item.code} value={item.code}>{item.name || item.code}</option>
                ))}
              </select>
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Website :</label>
              <input type="text" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group-wide">
              <label className="master-form-label">Address :</label>
              <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Tax ID :</label>
              <input type="text" value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Business License :</label>
              <input
                type="text"
                value={form.business_license}
                onChange={(e) => setForm({ ...form, business_license: e.target.value })}
                className="master-form-input"
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
        excelFilename="company"
        onExportExcel={handleExportExcel}
        onImportExcel={handleImportExcel}
        onGenerateTemplate={handleGenerateTemplate}
      />

      {showDeleteConfirm && (
        <DeleteMaster
          itemName={selectedItem?.nama || selectedItem?.name}
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
