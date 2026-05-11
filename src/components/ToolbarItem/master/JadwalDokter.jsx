import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Toast } from '../../../components/Toast'
import { listDokters } from '../../../features/master/dokter/dokter.api'
import {
  createJadwalDokter,
  deleteJadwalDokter,
  listJadwalDokter,
  updateJadwalDokter,
} from '../../../features/master/jadwal_dokter/jadwal_dokter.api'
import { useMasterPagination } from '../../../hooks/useMasterPagination'
import { useMasterTableKeyboardNav } from '../../../hooks/useMasterTableKeyboardNav'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useAuth } from '../../../shared/auth'
import { exportToExcel } from '../../../utils/excelUtils'
import { openReportPrintWindow } from '../../../utils/reportPrint'
import { DeleteMaster } from '../footer/DeleteMaster'
import { FooterFormMaster } from '../footer/FooterFormMaster'
import { FooterMaster } from '../footer/FooterMaster'
import { MasterStatusToggle } from '../table/MasterStatusToggle'
import { MasterTableHeader } from '../table/MasterTableHeader'

const DEFAULT_FORM = {
  dokter_id: '',
  hari: 'Senin',
  jam_mulai: '08:00',
  jam_selesai: '12:00',
}

const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false },
  { key: 'dokter_nama', label: 'DOKTER' },
  { key: 'hari', label: 'HARI' },
  { key: 'jam_mulai', label: 'JAM MULAI' },
  { key: 'jam_selesai', label: 'JAM SELESAI' },
  { key: 'is_active', label: 'STATUS' },
]

const PRINT_COLUMNS = [
  { key: 'no', label: 'No', align: 'text-center' },
  { key: 'dokter_nama', label: 'Dokter' },
  { key: 'hari', label: 'Hari' },
  { key: 'jam_mulai', label: 'Jam Mulai', align: 'text-center' },
  { key: 'jam_selesai', label: 'Jam Selesai', align: 'text-center' },
  {
    key: 'is_active',
    label: 'Status',
    formatter: (value) => (value ? 'Active' : 'Inactive'),
    align: 'text-center',
  },
]

const EXCEL_COLUMNS = [
  { key: 'dokter_nama', label: 'DOKTER' },
  { key: 'hari', label: 'HARI' },
  { key: 'jam_mulai', label: 'JAM MULAI' },
  { key: 'jam_selesai', label: 'JAM SELESAI' },
  { key: 'status_label', label: 'STATUS' },
]

const DUMMY_DATA = [
  {
    id: 'jd-1',
    dokter_id: 'dok-1',
    dokter_nama: 'Dr. Budi Santoso',
    hari: 'Senin',
    jam_mulai: '08:00',
    jam_selesai: '12:00',
    is_active: true,
  },
  {
    id: 'jd-2',
    dokter_id: 'dok-2',
    dokter_nama: 'Dr. Ani Suryani',
    hari: 'Selasa',
    jam_mulai: '14:00',
    jam_selesai: '17:00',
    is_active: true,
  },
]

function isActiveJadwal(item) {
  return Boolean(item?.is_active)
}

export function JadwalDokter({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [dokterList, setDokterList] = useState([])
  const [pagination, setPagination] = useState({ total: 0, has_more: false })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [dokterFilter, setDokterFilter] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState('active')
  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isNewMode, setIsNewMode] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const tableRef = useRef(null)

  const pager = useMasterPagination({
    initialLimit: 10,
    total: pagination.total,
    hasMore: pagination.has_more,
  })
  const { limit, offset } = pager

  const selectedItem = selectedId == null ? null : data.find((row) => row.id === selectedId) || null

  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'dokter_nama',
    valueGetters: {
      is_active: (row) => (isActiveJadwal(row) ? 1 : 0),
    },
  })

  useMasterTableKeyboardNav({
    data: sortedData,
    selectedId,
    setSelectedId,
    handleEdit: (row) => handleEdit(row),
    tableRef,
    isModalOpen: showForm || showDeleteConfirm,
  })

  const printData = useMemo(() => {
    return sortedData.map((item, index) => ({
      ...item,
      no: index + 1,
    }))
  }, [sortedData])

  const exportData = useMemo(() => {
    return sortedData.map((item) => ({
      dokter_nama: item.dokter_nama || '-',
      hari: item.hari || '-',
      jam_mulai: item.jam_mulai || '-',
      jam_selesai: item.jam_selesai || '-',
      status_label: isActiveJadwal(item) ? 'Active' : 'Inactive',
    }))
  }, [sortedData])

  const fetchData = useCallback(async () => {
    setError('')
    setIsLoading(true)

    if (!token) {
      const keyword = searchKeyword.trim().toLowerCase()
      const filtered = DUMMY_DATA.filter((item) => {
        if (dokterFilter && item.dokter_id !== dokterFilter) return false
        if (isActiveFilter === 'active' && !isActiveJadwal(item)) return false
        if (isActiveFilter === 'inactive' && isActiveJadwal(item)) return false
        if (!keyword) return true
        return (
          String(item.dokter_nama || '').toLowerCase().includes(keyword) ||
          String(item.hari || '').toLowerCase().includes(keyword)
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
      const result = await listJadwalDokter(token, {
        search: searchKeyword.trim() || undefined,
        dokter_id: dokterFilter || undefined,
        is_active: isActiveFilter === 'all' ? undefined : isActiveFilter === 'active',
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
      setError(err.message || 'Failed to load jadwal dokter')
      setData([])
      setPagination({ total: 0, has_more: false })
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, dokterFilter, isActiveFilter, limit, offset])

  const fetchDokterList = useCallback(async () => {
    if (!token) {
      setDokterList([
        { id: 'dok-1', nama: 'Dr. Budi Santoso' },
        { id: 'dok-2', nama: 'Dr. Ani Suryani' },
      ])
      return
    }

    try {
      const result = await listDokters(token, { active: true, tipe: 'Dokter', limit: 100, offset: 0 })
      setDokterList(result.items || [])
    } catch (err) {
      setDokterList([])
      setError((prev) => prev || err.message || 'Failed to load dokter list')
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchDokterList()
  }, [fetchDokterList])

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
          handleCloseForm()
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
        onExit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  function handleSearchChange(value) {
    pager.reset()
    setSearchKeyword(value)
  }

  function handleDokterFilter(value) {
    pager.reset()
    setDokterFilter(value)
  }

  function handleStatusFilter(value) {
    pager.reset()
    setIsActiveFilter(value)
  }

  function handleSelect(row) {
    setSelectedId(row?.id || null)
  }

  function handleNew() {
    setError('')
    setForm(DEFAULT_FORM)
    setIsNewMode(true)
    setShowForm(true)
  }

  function handleEdit(row = selectedItem) {
    if (!row) return
    setError('')
    setSelectedId(row.id)
    setForm({
      dokter_id: row.dokter_id || '',
      hari: row.hari || 'Senin',
      jam_mulai: row.jam_mulai || '08:00',
      jam_selesai: row.jam_selesai || '12:00',
    })
    setIsNewMode(false)
    setShowForm(true)
  }

  function handleCloseForm() {
    setShowForm(false)
    setIsNewMode(false)
    setForm(DEFAULT_FORM)
  }

  async function handleSave() {
    if (!form.dokter_id || !form.hari || !form.jam_mulai || !form.jam_selesai) {
      setError('Dokter, hari, jam mulai, dan jam selesai wajib diisi')
      return
    }

    if (form.jam_mulai >= form.jam_selesai) {
      setError('Jam mulai harus lebih kecil dari jam selesai')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      if (isNewMode) {
        await createJadwalDokter(token, form)
        setToastMessage('Jadwal dokter berhasil ditambahkan')
      } else if (selectedId) {
        await updateJadwalDokter(token, selectedId, form)
        setToastMessage('Jadwal dokter berhasil diperbarui')
      }

      setShowToast(true)
      handleCloseForm()
      await fetchData()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan jadwal dokter')
    } finally {
      setIsSaving(false)
    }
  }

  function handleDeleteClick() {
    if (!selectedItem) return
    setShowDeleteConfirm(true)
  }

  async function handleConfirmDelete() {
    if (!selectedItem) return

    try {
      await deleteJadwalDokter(token, selectedItem.id)
      setShowDeleteConfirm(false)
      setSelectedId(null)
      setToastMessage('Jadwal dokter berhasil dihapus')
      setShowToast(true)
      await fetchData()
    } catch (err) {
      setError(err.message || 'Gagal menghapus jadwal dokter')
    }
  }

  async function handleToggleStatus(row) {
    if (!row?.id) return
    setTogglingId(row.id)

    try {
      await updateJadwalDokter(token, row.id, { is_active: !isActiveJadwal(row) })
      await fetchData()
    } catch (err) {
      setError(err.message || 'Gagal mengubah status jadwal dokter')
    } finally {
      setTogglingId(null)
    }
  }

  function handleExportExcel() {
    exportToExcel(exportData, 'jadwal_dokter.xlsx')
  }

  function handlePrint() {
    openReportPrintWindow({
      title: 'Daftar Jadwal Dokter',
      meta: {
        date: new Date().toLocaleString('id-ID'),
        user: auth?.username || 'Admin',
      },
      columns: PRINT_COLUMNS,
      data: printData,
      footerTextOverride: `Laporan Jadwal Dokter dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
    })
  }

  return (
    <div className="master-content">
      <div className="master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Daftar Jadwal Dokter</h1>
        <div className="master-header-filters">
          <div className="master-footer-search">
            <input
              type="text"
              placeholder="Search keyword..."
              className="master-search-input"
              value={searchKeyword}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <button type="button" className="master-search-btn">
              <span className="material-icons-round material-icon">search</span>
            </button>
          </div>
          <div className="master-filter-wrap">
            <label htmlFor="jadwal-dokter-filter" className="master-filter-label">Dokter</label>
            <select
              id="jadwal-dokter-filter"
              className="master-filter-select"
              value={dokterFilter}
              onChange={(e) => handleDokterFilter(e.target.value)}
            >
              <option value="">All Dokter</option>
              {dokterList.map((dokter) => (
                <option key={dokter.id} value={dokter.id}>{dokter.nama}</option>
              ))}
            </select>
          </div>
          <div className="master-filter-wrap">
            <label htmlFor="jadwal-status-filter" className="master-filter-label">Status</label>
            <select
              id="jadwal-status-filter"
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
                  onDoubleClick={() => handleEdit(row)}
                >
                  <td>{offset + index + 1}</td>
                  <td>{row.dokter_nama || '-'}</td>
                  <td>{row.hari || '-'}</td>
                  <td>{row.jam_mulai || '-'}</td>
                  <td>{row.jam_selesai || '-'}</td>
                  <td>
                    <MasterStatusToggle
                      active={isActiveJadwal(row)}
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
              {isLoading && (
                <tr>
                  <td colSpan={6} className="text-center">Loading...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="master-form-card">
          <div className="master-form-header">
            <span className="material-icons-round master-form-icon">calendar_month</span>
            <h2 className="master-form-title">{isNewMode ? 'Isi Jadwal Dokter' : 'Ubah Jadwal Dokter'}</h2>
          </div>
          <div className="master-form-grid">
            <div className="master-form-group">
              <label className="master-form-label">Dokter :</label>
              <select
                value={form.dokter_id}
                onChange={(e) => setForm((prev) => ({ ...prev, dokter_id: e.target.value }))}
                className="master-form-input"
              >
                <option value="">Pilih Dokter</option>
                {dokterList.map((dokter) => (
                  <option key={dokter.id} value={dokter.id}>{dokter.nama}</option>
                ))}
              </select>
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Hari :</label>
              <select
                value={form.hari}
                onChange={(e) => setForm((prev) => ({ ...prev, hari: e.target.value }))}
                className="master-form-input"
              >
                {HARI_LIST.map((hari) => (
                  <option key={hari} value={hari}>{hari}</option>
                ))}
              </select>
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Jam Mulai :</label>
              <input
                type="time"
                value={form.jam_mulai}
                onChange={(e) => setForm((prev) => ({ ...prev, jam_mulai: e.target.value }))}
                className="master-form-input"
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Jam Selesai :</label>
              <input
                type="time"
                value={form.jam_selesai}
                onChange={(e) => setForm((prev) => ({ ...prev, jam_selesai: e.target.value }))}
                className="master-form-input"
              />
            </div>

            <FooterFormMaster
              onSave={handleSave}
              onClose={handleCloseForm}
              isSaving={isSaving}
            />
          </div>
        </div>
      )}

      <FooterMaster
        onNew={handleNew}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onPrint={handlePrint}
        onExit={onExit}
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
        excelFilename="jadwal_dokter.xlsx"
        onExportExcel={handleExportExcel}
      />

      {showDeleteConfirm && (
        <DeleteMaster
          itemName={selectedItem?.dokter_nama || 'jadwal dokter'}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showToast && <Toast message={toastMessage} type="success" isOpen={showToast} onClose={() => setShowToast(false)} />}
    </div>
  )
}
