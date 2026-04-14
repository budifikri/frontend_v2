import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../shared/auth'
import { listWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../../../features/master/warehouse/warehouse.api'
import { getCurrentCompany } from '../../../features/master/company/company.api'
import { openReportPrintWindow } from '../../../utils/reportPrint'
import { gudangDummyData } from '../../../data'
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

const EXCEL_COLUMNS = [
  { key: 'code', label: 'KODE' },
  { key: 'name', label: 'NAMA' },
  { key: 'type', label: 'TYPE' },
  { key: 'address', label: 'ALAMAT' },
  { key: 'city', label: 'KOTA' },
  { key: 'phone', label: 'TELEPON' },
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
  const [currentEditIndex, setCurrentEditIndex] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [pendingImportData, setPendingImportData] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

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
      setToastMessage('Data tersimpan')
      setShowToast(true)
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
    setSelectedId(null)
    setCurrentEditIndex(null)
    setForm(DEFAULT_FORM)
    setShowForm(true)
  }

  const handleEdit = () => {
    const target = selectedItem || sortedData[0]
    if (!target) return
    const idx = sortedData.findIndex((item) => item.id === target.id)
    setSelectedId(target.id)
    setCurrentEditIndex(idx)
    setForm({
      code: target.code || '',
      name: target.name || '',
      type: target.type || 'MAIN',
      address: target.address || '',
      city: target.city || '',
      phone: target.phone || '',
    })
    setShowForm(true)
  }

  const handleNextRecord = () => {
    if (currentEditIndex === null || currentEditIndex >= sortedData.length - 1) return
    const nextItem = sortedData[currentEditIndex + 1]
    if (!nextItem) return
    setSelectedId(nextItem.id)
    setCurrentEditIndex(currentEditIndex + 1)
    setForm({
      code: nextItem.code || '',
      name: nextItem.name || '',
      type: nextItem.type || 'MAIN',
      address: nextItem.address || '',
      city: nextItem.city || '',
      phone: nextItem.phone || '',
    })
  }

  const handlePrevRecord = () => {
    if (currentEditIndex === null || currentEditIndex <= 0) return
    const prevItem = sortedData[currentEditIndex - 1]
    if (!prevItem) return
    setSelectedId(prevItem.id)
    setCurrentEditIndex(currentEditIndex - 1)
    setForm({
      code: prevItem.code || '',
      name: prevItem.name || '',
      type: prevItem.type || 'MAIN',
      address: prevItem.address || '',
      city: prevItem.city || '',
      phone: prevItem.phone || '',
    })
  }

  const handlePrint = async () => {
    setShowForm(false)
    try {
      const companyInfo = { name: '', address: '', phone: '' };
      if (token) {
        const res = await getCurrentCompany(token);
        if (res?.data) {
          companyInfo.name = res.data.nama || res.data.name || auth.companyName || '';
          companyInfo.address = res.data.address || '';
          companyInfo.phone = res.data.telp || res.data.phone || '';
        }
      }

      const printColumns = [
        { key: 'no', label: 'NO', align: 'text-center', formatter: (_, __, index) => index + 1 },
        { key: 'code', label: 'KODE' },
        { key: 'name', label: 'NAMA' },
        { key: 'type', label: 'TIPE', align: 'text-center' },
        { key: 'city', label: 'KOTA' },
        { key: 'is_active', label: 'STATUS', align: 'text-center', formatter: (v) => v ? 'Aktif' : 'Non-Aktif' },
      ];

      const printData = sortedData.map((item, index) => ({
        ...item,
        no: index + 1
      }));

      openReportPrintWindow({
        title: 'Daftar Master Warehouse',
        company: companyInfo,
        meta: { 
          date: new Date().toLocaleString('id-ID'), 
          user: auth.username || 'Admin' 
        },
        columns: printColumns,
        data: printData,
        footerText: `Laporan Warehouse dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
      });
    } catch (err) {
      console.error('Print error:', err);
      alert('Gagal mencetak laporan: ' + err.message);
    }
  }


  const handleExportExcel = () => {
    const exportData = data.map(row => ({
      KODE: row.code || '',
      NAMA: row.name || '',
      TYPE: row.type || '',
      ALAMAT: row.address || '',
      KOTA: row.city || '',
      TELEPON: row.phone || '',
    }))
    exportToExcel(exportData, 'warehouse')
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
      const code = row.KODE || row.code
      if (!code) continue

      const existingIndex = newData.findIndex(item => item.code === code)
      const itemData = {
        code,
        name: row.NAMA || row.name || '',
        type: row.TYPE || row.type || 'MAIN',
        address: row.ALAMAT || row.address || '',
        city: row.KOTA || row.city || '',
        phone: row.TELEPON || row.phone || '',
        is_active: true,
      }

      if (existingIndex >= 0) {
        if (token) {
          try {
            await updateWarehouse(token, code, itemData)
          } catch (err) {
            console.warn('Update failed:', err.message)
          }
        }
        newData[existingIndex] = { ...newData[existingIndex], ...itemData }
        updatedCount++
      } else {
        if (token) {
          try {
            await createWarehouse(token, itemData)
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
    generateTemplate(EXCEL_COLUMNS, 'warehouse_template')
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

  const handleCloseForm = () => {
    setShowForm(false)
    setSelectedId(null)
    setCurrentEditIndex(null)
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
            <label htmlFor="warehouse-status-filter" className="master-filter-label">Status</label>
            <select
              id="warehouse-status-filter"
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
          <button type="button" className="master-form-close" onClick={handleCloseForm}>
            <span className="material-icons-round">close</span>
          </button>
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
        excelFilename="warehouse"
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
