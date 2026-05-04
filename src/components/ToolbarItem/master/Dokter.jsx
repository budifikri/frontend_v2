import { useCallback, useEffect, useState, useRef } from 'react'
import { useAuth } from '../../../shared/auth'
import { createDokter, deleteDokter, listDokters, updateDokter } from '../../../features/master/dokter/dokter.api'
import { getCurrentCompany } from '../../../features/master/company/company.api'
import { openReportPrintWindow } from '../../../utils/reportPrint'
import { FooterMaster } from '../footer/FooterMaster'
import { FooterFormMaster } from '../footer/FooterFormMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { MasterStatusToggle } from '../table/MasterStatusToggle'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'
import { useMasterTableKeyboardNav } from '../../../hooks/useMasterTableKeyboardNav'
import { Toast } from '../../../components/Toast'

const DEFAULT_FORM = {
  nama: '',
  jenis_kelamin: 'L',
  tempat_lahir: '',
  tanggal_lahir: '',
  alamat: '',
  no_telp: '',
  email: '',
  tipe: 'Dokter',
  active: true,
}

const TIPE_OPTIONS = ['Dokter', 'Beautician']

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false },
  { key: 'nama', label: 'NAMA' },
  { key: 'tipe', label: 'TIPE' },
  { key: 'jenis_kelamin', label: 'GENDER' },
  { key: 'no_telp', label: 'NO TELP' },
  { key: 'email', label: 'EMAIL' },
  { key: 'active', label: 'STATUS' },
]

const DUMMY_DOKTERS = [
  {
    id: 'DOK001',
    nama: 'Dr. Budi Santoso',
    jenis_kelamin: 'L',
    tempat_lahir: 'Jakarta',
    tanggal_lahir: '1980-05-15',
    alamat: 'Jl. Sudirman No. 10',
    no_telp: '081212345678',
    email: 'budi@example.com',
    tipe: 'Dokter',
    active: true,
  },
  {
    id: 'DOK002',
    nama: 'Sari Wijaya',
    jenis_kelamin: 'P',
    tempat_lahir: 'Bandung',
    tanggal_lahir: '1985-08-20',
    alamat: 'Jl. Ahmad Yani No. 25',
    no_telp: '081298765432',
    email: 'sari@example.com',
    tipe: 'Beautician',
    active: true,
  },
  {
    id: 'DOK003',
    nama: 'Dr. Ani Suryani',
    jenis_kelamin: 'P',
    tempat_lahir: 'Surabaya',
    tanggal_lahir: '1978-12-10',
    alamat: 'Jl. Pemuda No. 5',
    no_telp: '081355577777',
    email: 'ani@example.com',
    tipe: 'Dokter',
    active: false,
  },
]

function isActiveDokter(item) {
  if (typeof item?.active === 'boolean') return item.active
  return String(item?.status ?? 'active').toLowerCase() !== 'inactive'
}

export function Dokter({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [tipeFilter, setTipeFilter] = useState('')
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
  const tableRef = useRef(null)
  const [togglingId, setTogglingId] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const fetchData = useCallback(async () => {
    setError('')
    setIsLoading(true)

    if (!token) {
      const keyword = searchKeyword.trim().toLowerCase()
      const filtered = DUMMY_DOKTERS.filter((item) => {
        const active = isActiveDokter(item)
        if (isActiveFilter === 'active' && !active) return false
        if (isActiveFilter === 'inactive' && active) return false
        if (tipeFilter && item.tipe !== tipeFilter) return false

        if (!keyword) return true
        return (
          String(item.nama || '').toLowerCase().includes(keyword) ||
          String(item.email || '').toLowerCase().includes(keyword) ||
          String(item.no_telp || '').toLowerCase().includes(keyword)
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
      const result = await listDokters(token, {
        search: searchKeyword.trim() || undefined,
        tipe: tipeFilter || undefined,
        active: isActiveFilter === 'all' ? undefined : isActiveFilter === 'active',
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
      setError(err.message || 'Failed to load dokters')
      setData([])
      setPagination({ total: 0, has_more: false })
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, tipeFilter, isActiveFilter, limit, offset])

  const selectedItem = selectedId == null ? null : data.find((row) => row.id === selectedId) || null
  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'nama',
    valueGetters: {
      active: (row) => (isActiveDokter(row) ? 1 : 0),
    },
  })

  useMasterTableKeyboardNav({
    data: sortedData,
    selectedId,
    setSelectedId,
    handleEdit,
    tableRef,
    isModalOpen: showForm || showDeleteConfirm || showExitConfirm,
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

  function handleTipeFilter(value) {
    pager.reset()
    setTipeFilter(value)
  }

  function handleStatusFilter(value) {
    pager.reset()
    setIsActiveFilter(value)
  }

  async function handleSave() {
    if (!form.nama) return

    setIsSaving(true)
    setError('')

    const payload = {
      nama: form.nama,
      jenis_kelamin: form.jenis_kelamin,
      tempat_lahir: form.tempat_lahir,
      tanggal_lahir: form.tanggal_lahir || null,
      alamat: form.alamat,
      no_telp: form.no_telp,
      email: form.email,
      tipe: form.tipe,
      active: form.active,
    }

    try {
      if (token) {
        if (isNewMode) await createDokter(token, payload)
        else await updateDokter(token, selectedItem.id, payload)
        await fetchData()
      } else {
        if (isNewMode) {
          const newItem = {
            id: `DOK${Date.now()}`,
            ...payload,
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
      setError(err.message || 'Failed to save dokter')
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
    setForm({
      nama: target.nama || '',
      jenis_kelamin: target.jenis_kelamin || 'L',
      tempat_lahir: target.tempat_lahir || '',
      tanggal_lahir: target.tanggal_lahir || '',
      alamat: target.alamat || '',
      no_telp: target.no_telp || '',
      email: target.email || '',
      tipe: target.tipe || 'Dokter',
      active: target.active !== undefined ? target.active : true,
    })
    setIsNewMode(false)
    setShowForm(true)
  }

  function handleNextRecord() {
    if (currentEditIndex === null || currentEditIndex >= sortedData.length - 1) return
    const nextItem = sortedData[currentEditIndex + 1]
    if (!nextItem) return
    setSelectedId(nextItem.id)
    setCurrentEditIndex(currentEditIndex + 1)
    setForm({
      nama: nextItem.nama || '',
      jenis_kelamin: nextItem.jenis_kelamin || 'L',
      tempat_lahir: nextItem.tempat_lahir || '',
      tanggal_lahir: nextItem.tanggal_lahir || '',
      alamat: nextItem.alamat || '',
      no_telp: nextItem.no_telp || '',
      email: nextItem.email || '',
      tipe: nextItem.tipe || 'Dokter',
      active: nextItem.active !== undefined ? nextItem.active : true,
    })
  }

  function handlePrevRecord() {
    if (currentEditIndex === null || currentEditIndex <= 0) return
    const prevItem = sortedData[currentEditIndex - 1]
    if (!prevItem) return
    setSelectedId(prevItem.id)
    setCurrentEditIndex(currentEditIndex - 1)
    setForm({
      nama: prevItem.nama || '',
      jenis_kelamin: prevItem.jenis_kelamin || 'L',
      tempat_lahir: prevItem.tempat_lahir || '',
      tanggal_lahir: prevItem.tanggal_lahir || '',
      alamat: prevItem.alamat || '',
      no_telp: prevItem.no_telp || '',
      email: prevItem.email || '',
      tipe: prevItem.tipe || 'Dokter',
      active: prevItem.active !== undefined ? prevItem.active : true,
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
        await deleteDokter(token, selectedItem.id)
        await fetchData()
      } else {
        setData((prev) => prev.filter((row) => row.id !== selectedItem.id))
      }
    } catch (err) {
      setError(err.message || 'Failed to delete dokter')
    } finally {
      setShowDeleteConfirm(false)
      setShowForm(false)
      setSelectedId(null)
      setForm(DEFAULT_FORM)
    }
  }

  async function handleToggleStatus(row) {
    if (!row?.id || togglingId) return

    const nextActive = !isActiveDokter(row)
    if (token) {
      setTogglingId(row.id)
      try {
        await updateDokter(token, row.id, { active: nextActive })
        await fetchData()
      } catch (err) {
        setError(err.message || 'Failed to update status')
      } finally {
        setTogglingId(null)
      }
      return
    }

    setData((prev) => prev.map((item) => (
      item.id === row.id ? { ...item, active: nextActive } : item
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
      { key: 'nama', label: 'NAMA' },
      { key: 'tipe', label: 'TIPE' },
      { key: 'jenis_kelamin', label: 'GENDER' },
      { key: 'no_telp', label: 'NO TELP' },
      { key: 'email', label: 'EMAIL' },
      { key: 'active', label: 'STATUS', align: 'text-center', formatter: (v) => v ? 'Aktif' : 'Non-Aktif' },
    ]
    const printData = sortedData.map((item, index) => ({ ...item, no: index + 1 }))

    const companyInfo = { name: '', address: '', phone: '' }
    if (token) {
      getCurrentCompany(token).then(res => {
        if (res?.data) {
          companyInfo.name = res.data.nama || res.data.name || auth.companyName || ''
          companyInfo.address = res.data.address || ''
          companyInfo.phone = res.data.telp || res.data.phone || ''
        }
        openReportPrintWindow({
          title: 'Daftar Master Dokter',
          company: companyInfo,
          meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
          columns: printColumns,
          data: printData,
          footerTextOverride: `Laporan Dokter dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
        })
      }).catch(() => {
        openReportPrintWindow({
          title: 'Daftar Master Dokter',
          company: companyInfo,
          meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
          columns: printColumns,
          data: printData,
          footerTextOverride: `Laporan Dokter dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
        })
      })
    } else {
      openReportPrintWindow({
        title: 'Daftar Master Dokter',
        company: companyInfo,
        meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
        columns: printColumns,
        data: printData,
        footerTextOverride: `Laporan Dokter dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
      })
    }
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
        <h1 className="master-title">Daftar Dokter</h1>
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
            <label htmlFor="dokter-tipe-filter" className="master-filter-label">Tipe</label>
            <select
              id="dokter-tipe-filter"
              className="master-filter-select"
              value={tipeFilter}
              onChange={(e) => handleTipeFilter(e.target.value)}
            >
              <option value="">All Tipe</option>
              {TIPE_OPTIONS.map((tipe) => (
                <option key={tipe} value={tipe}>{tipe}</option>
              ))}
            </select>
          </div>
          <div className="master-filter-wrap">
            <label htmlFor="dokter-status-filter" className="master-filter-label">Status</label>
            <select
              id="dokter-status-filter"
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
                  <td>{row.nama || '-'}</td>
                  <td>{row.tipe || '-'}</td>
                  <td>{row.jenis_kelamin || '-'}</td>
                  <td>{row.no_telp || '-'}</td>
                  <td>{row.email || '-'}</td>
                  <td>
                    <MasterStatusToggle
                      active={isActiveDokter(row)}
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
            <span className="material-icons-round master-form-icon">person</span>
            <h2 className="master-form-title">{isNewMode ? 'Isi Data Dokter' : 'Ubah Data Dokter'}</h2>
          </div>
          <div className="master-form-grid">
            <div className="master-form-group">
              <label className="master-form-label">Nama :</label>
              <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Tipe :</label>
              <select value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })} className="master-form-input">
                {TIPE_OPTIONS.map((tipe) => (
                  <option key={tipe} value={tipe}>{tipe}</option>
                ))}
              </select>
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Gender :</label>
              <select value={form.jenis_kelamin} onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })} className="master-form-input">
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Tempat Lahir :</label>
              <input type="text" value={form.tempat_lahir} onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Tgl Lahir :</label>
              <input type="date" value={form.tanggal_lahir} onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">No Telp :</label>
              <input type="text" value={form.no_telp} onChange={(e) => setForm({ ...form, no_telp: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Email :</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group-wide">
              <label className="master-form-label">Alamat :</label>
              <input type="text" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Active :</label>
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
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
      />

      {showDeleteConfirm && (
        <DeleteMaster
          itemName={selectedItem?.nama}
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

      {showToast && <Toast message={toastMessage} type="success" onClose={() => setShowToast(false)} />}
    </div>
  )
}
