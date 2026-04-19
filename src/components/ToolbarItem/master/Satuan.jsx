import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import { listUnits, createUnit, updateUnit, deleteUnit } from '../../../features/master/unit/unit.api'
import { getCurrentCompany } from '../../../features/master/company/company.api'
import { openReportPrintWindow } from '../../../utils/reportPrint'
import { satuanDummyData } from '../../../data'
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
  code: '',
  name: '',
  description: '',
}

function mapDummyRows() {
  return satuanDummyData.rows.map((item) => ({
    id: item.kode,
    code: item.kode,
    name: item.satuan,
    description: '',
    is_active: true,
  }))
}

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false },
  { key: 'code', label: 'CODE' },
  { key: 'name', label: 'NAME' },
  { key: 'description', label: 'DESCRIPTION' },
  { key: 'is_active', label: 'STATUS' },
]

const EXCEL_COLUMNS = [
  { key: 'code', label: 'CODE' },
  { key: 'name', label: 'NAME' },
  { key: 'description', label: 'DESCRIPTION' },
]

export function Satuan({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [isActiveFilter, setIsActiveFilter] = useState('active')
  const [searchKeyword, setSearchKeyword] = useState('')
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
    if (!token) {
      const keyword = searchKeyword.trim().toLowerCase()
      const filtered = mapDummyRows().filter((row) => {
        if (isActiveFilter === 'active' && !row.is_active) return false
        if (isActiveFilter === 'inactive' && row.is_active) return false
        if (!keyword) return true
        return (
          (row.code || '').toLowerCase().includes(keyword) ||
          (row.name || '').toLowerCase().includes(keyword) ||
          (row.description || '').toLowerCase().includes(keyword)
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
      const result = await listUnits(token, {
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
      console.warn('Units API failed, fallback to dummy data:', err.message)
      const fallback = mapDummyRows()
      const rows = fallback.slice(offset, offset + limit)
      setData(rows)
      setPagination({ total: fallback.length, has_more: offset + limit < fallback.length })
    } finally {
      setIsLoading(false)
    }
  }, [token, isActiveFilter, searchKeyword, limit, offset])

  const selectedItem = selectedId == null ? null : data.find((row) => row.id === selectedId) || null
  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'code',
    valueGetters: {
      is_active: (row) => (row?.is_active ? 1 : 0),
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
  }, [showForm, showDeleteConfirm, selectedId, data, handlePrevRecord, handleNextRecord])

  async function handleSave() {
    if (!form.code || !form.name) return

    setIsSaving(true)
    setError('')

    try {
      const payload = {
        code: form.code,
        name: form.name,
        description: form.description,
      }

      if (token) {
        if (selectedItem) {
          await updateUnit(token, selectedItem.id, payload)
        } else {
          await createUnit(token, payload)
        }
        await fetchData()
      } else {
        if (selectedItem) {
          setData((prev) => prev.map((row) => (
            row.id === selectedItem.id ? { ...row, ...payload } : row
          )))
        } else {
          setData((prev) => [
            ...prev,
            {
              id: form.code,
              ...payload,
              is_active: true,
            },
          ])
        }
      }

      setToastMessage('Data tersimpan')
      setShowToast(true)
    } catch (err) {
      setError(err.message || 'Failed to save unit')
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
      code: target.code || '',
      name: target.name || '',
      description: target.description || '',
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
      code: nextItem.code || '',
      name: nextItem.name || '',
      description: nextItem.description || '',
    })
  }

  function handlePrevRecord() {
    if (currentEditIndex === null || currentEditIndex <= 0) return
    const prevItem = sortedData[currentEditIndex - 1]
    if (!prevItem) return
    setSelectedId(prevItem.id)
    setCurrentEditIndex(currentEditIndex - 1)
    setForm({
      code: prevItem.code || '',
      name: prevItem.name || '',
      description: prevItem.description || '',
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
        await deleteUnit(token, selectedItem.id)
        await fetchData()
      } else {
        setData((prev) => prev.filter((row) => row.id !== selectedItem.id))
      }
    } catch (err) {
      setError(err.message || 'Failed to delete unit')
    } finally {
      setSelectedId(null)
      setForm(DEFAULT_FORM)
      setShowForm(false)
      setShowDeleteConfirm(false)
    }
  }

  async function handleToggleStatus(row) {
    if (!row?.id || togglingId) return

    const nextIsActive = !row.is_active

    if (token) {
      setTogglingId(row.id)
      try {
        await updateUnit(token, row.id, { is_active: nextIsActive })
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
      { key: 'description', label: 'DESKRIPSI' },
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
          title: 'Daftar Master Satuan',
          company: companyInfo,
          meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
          columns: printColumns,
          data: printData,
          footerTextOverride: `Laporan Satuan dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
        });
      }).catch(() => {
        openReportPrintWindow({
          title: 'Daftar Master Satuan',
          company: companyInfo,
          meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
          columns: printColumns,
          data: printData,
          footerTextOverride: `Laporan Satuan dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
        });
      });
    } else {
      openReportPrintWindow({
        title: 'Daftar Master Satuan',
        company: companyInfo,
        meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
        columns: printColumns,
        data: printData,
        footerTextOverride: `Laporan Satuan dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
      });
    }
  }

  const handleExportExcel = () => {
    const exportData = data.map(row => ({
      CODE: row.code || '',
      NAME: row.name || '',
      DESCRIPTION: row.description || '',
    }))
    exportToExcel(exportData, 'satuan')
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
        description: row.DESCRIPTION || row.description || '',
        is_active: true,
      }

      if (existingIndex >= 0) {
        if (token) {
          try {
            await updateUnit(token, code, itemData)
          } catch (err) {
            console.warn('Update failed:', err.message)
          }
        }
        newData[existingIndex] = { ...newData[existingIndex], ...itemData }
        updatedCount++
      } else {
        if (token) {
          try {
            await createUnit(token, itemData)
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
    generateTemplate(EXCEL_COLUMNS, 'satuan_template')
  }

  function handleSearchChange(value) {
    pager.reset()
    setSearchKeyword(value)
  }

  function handleStatusFilter(value) {
    pager.reset()
    setIsActiveFilter(value)
  }

  function handleToggleAllRecords(value) {
    pager.toggleAllRecords(value)
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
        <h1 className="master-title">Daftar Satuan</h1>
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
            <label htmlFor="satuan-status-filter" className="master-filter-label">Status</label>
            <select
              id="satuan-status-filter"
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
                  <td>{row.description || '-'}</td>
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
                  <td colSpan={5} className="text-center">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="master-form-card">
  
          <div className="master-form-header">
            <span className="material-icons-round master-form-icon">straighten</span>
            <h2 className="master-form-title">{selectedItem ? 'Ubah Data Satuan' : 'Isi Data Satuan'}</h2>
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
                placeholder="Masukkan nama satuan..."
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Deskripsi :</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="master-form-input"
                placeholder="Masukkan deskripsi..."
              />
            </div>
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
        excelColumns={EXCEL_COLUMNS}
        excelFilename="satuan"
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
