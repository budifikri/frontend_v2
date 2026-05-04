import { useCallback, useEffect, useState, useRef } from 'react'
import { useAuth } from '../../../shared/auth'
import { createJadwalDokter, deleteJadwalDokter, listJadwalDokter, updateJadwalDokter, getDokters } from '../../../features/master/jadwal_dokter/jadwal_dokter.api'
import { openReportPrintWindow } from '../../../utils/reportPrint'
import { FooterMaster } from '../footer/FooterMaster'
import { FooterFormMaster } from '../footer/FooterFormMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { MasterStatusToggle } from '../table/MasterStatusToggle'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'
import { useMasterTableKeyboardNav } from '../../../hooks/useMasterTableKeyboardNav'
import { exportToExcel } from '../../../utils/excelUtils'
import { Toast } from '../../../components/Toast'

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

const EXCEL_COLUMNS = [
  { key: 'dokter_nama', label: 'DOKTER' },
  { key: 'hari', label: 'HARI' },
  { key: 'jam_mulai', label: 'JAM MULAI' },
  { key: 'jam_selesai', label: 'JAM SELESAI' },
]

const DUMMY_DATA = [
  {
    id: 'JD001',
    dokter_nama: 'Dr. Budi Santoso',
    hari: 'Senin',
    jam_mulai: '08:00',
    jam_selesai: '12:00',
    is_active: true,
  },
  {
    id: 'JD002',
    dokter_nama: 'Dr. Ani Suryani',
    hari: 'Selasa',
    jam_mulai: '14:00',
    jam_selesai: '17:00',
    is_active: true,
  },
]

function isActiveItem(item) {
  if (typeof item?.is_active === 'boolean') return item.is_active
  return true
}

export function JadwalDokter({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState('active')
  const pager = useMasterPagination({ initialLimit: 10, total: pagination.total, hasMore: pagination.has_more })
  const { limit, offset } = pager

  const [form, setForm] = useState(DEFAULT_FORM)
  const [selectedId, setSelectedId] = useState(null)
  const [currentEditIndex, setCurrentEditIndex] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [isNewMode, setIsNewMode] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [togglingId, setTogglingId] = useState(null)
  const [dokterList, setDokterList] = useState([])
  const tableRef = useRef(null)

  const fetchData = useCallback(async () => {
    setError('')
    setIsLoading(true)

    if (!token) {
      const keyword = searchKeyword.trim().toLowerCase()
      const filtered = DUMMY_DATA.filter((item) => {
        const active = isActiveItem(item)
        if (isActiveFilter === 'active' && !active) return false
        if (isActiveFilter === 'inactive' && active) return false
        if (keyword) {
          return (
            item.dokter_nama?.toLowerCase().includes(keyword) ||
            item.hari?.toLowerCase().includes(keyword)
          )
        }
        return true
      })
      setData(filtered)
      setPagination({ has_more: false, total: filtered.length })
      setIsLoading(false)
      return
    }

    try {
      const isActiveParam =
        isActiveFilter === 'active' ? true : isActiveFilter === 'inactive' ? false : undefined
      const result = await listJadwalDokter(token, {
        search: searchKeyword,
        is_active: isActiveParam,
        limit,
        offset,
      })
      setData(result.items || [])
      setPagination(result.pagination || {})
    } catch (err) {
      setError(err.message || 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, isActiveFilter, limit, offset])

  const fetchDokters = useCallback(async () => {
    if (!token) return
    try {
      const result = await getDokters(token, { limit: 100 })
      setDokterList(result || [])
    } catch (err) {
      console.error('Failed to load dokters:', err)
    }
  }, [token])

  useEffect(() => {
    fetchData()
    fetchDokters()
  }, [fetchData, fetchDokters])

  const handleSave = useCallback(async () => {
    if (!form.dokter_id || !form.hari || !form.jam_mulai || !form.jam_selesai) {
      setError('All fields are required')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      if (isNewMode) {
        await createJadwalDokter(token, form)
        setToastMessage('Jadwal dokter created successfully')
      } else {
        await updateJadwalDokter(token, selectedId, form)
        setToastMessage('Jadwal dokter updated successfully')
      }
      setShowToast(true)
      setShowForm(false)
      setForm(DEFAULT_FORM)
      setSelectedId(null)
      setIsNewMode(false)
      fetchData()
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }, [token, form, isNewMode, selectedId, fetchData])

  const handleNew = useCallback(() => {
    setForm(DEFAULT_FORM)
    setSelectedId(null)
    setIsNewMode(true)
    setShowForm(true)
  }, [])

  const handleEdit = useCallback((item) => {
    setForm({
      dokter_id: item.dokter_id || '',
      hari: item.hari || 'Senin',
      jam_mulai: item.jam_mulai || '08:00',
      jam_selesai: item.jam_selesai || '12:00',
    })
    setSelectedId(item.id)
    setIsNewMode(false)
    setShowForm(true)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!selectedId) return
    try {
      await deleteJadwalDokter(token, selectedId)
      setToastMessage('Jadwal dokter deleted successfully')
      setShowToast(true)
      setShowDeleteConfirm(false)
      setSelectedId(null)
      fetchData()
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }, [token, selectedId, fetchData])

  const handleToggleActive = useCallback(async (item) => {
    setTogglingId(item.id)
    try {
      await updateJadwalDokter(token, item.id, { is_active: !item.is_active })
      fetchData()
    } catch (err) {
      setError(err.message || 'Toggle failed')
    } finally {
      setTogglingId(null)
    }
  }, [token, fetchData])

  const handleExport = useCallback(() => {
    const exportData = data.map((item, idx) => ({
      No: idx + 1,
      Dokter: item.dokter_nama || '',
      Hari: item.hari || '',
      'Jam Mulai': item.jam_mulai || '',
      'Jam Selesai': item.jam_selesai || '',
      Status: item.is_active ? 'Active' : 'Inactive',
    }))
    exportToExcel(exportData, 'jadwal_dokter.xlsx')
  }, [data])

  const {
    sortConfig,
    sortedData,
    requestSort,
  } = useMasterTableSort({ data, tableColumns: TABLE_COLUMNS })

  useMasterTableKeyboardNav({
    tableRef,
    data: sortedData,
    selectedId,
    setSelectedId,
    setCurrentEditIndex,
    onNew: handleNew,
    onEdit: handleEdit,
    onDelete: () => setShowDeleteConfirm(true),
    onExit: () => setShowExitConfirm(true),
  })

  return (
    <div className="dashboard-canvas">
      <MasterTableHeader
        title="Jadwal Dokter"
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        isActiveFilter={isActiveFilter}
        setIsActiveFilter={setIsActiveFilter}
        showActiveFilter
        onRefresh={fetchData}
        extra={
          <select
            value={form.dokter_id}
            onChange={(e) => setForm({ ...form, dokter_id: e.target.value })}
            style={{ marginLeft: 8, padding: 4 }}
          >
            <option value="">All Dokters</option>
            {dokterList.map((d) => (
              <option key={d.id} value={d.id}>{d.nama}</option>
            ))}
          </select>
        }
      />

      {error && (
        <div style={{ color: 'red', padding: '8px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div className="table-container" ref={tableRef}>
        <table className="master-table">
          <thead>
            <tr>
              {TABLE_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && requestSort(col.key)}
                  style={{ cursor: col.sortable !== false ? 'pointer' : 'default' }}
                >
                  {col.label}
                  {sortConfig.key === col.key && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
              <th>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length + 1} style={{ textAlign: 'center' }}>
                  Loading...
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length + 1} style={{ textAlign: 'center' }}>
                  No data found
                </td>
              </tr>
            ) : (
              sortedData.map((item, idx) => (
                <tr
                  key={item.id}
                  className={selectedId === item.id ? 'selected' : ''}
                  onClick={() => setSelectedId(item.id)}
                  onDoubleClick={() => handleEdit(item)}
                >
                  <td>{idx + 1 + (offset || 0)}</td>
                  <td>{item.dokter_nama || '-'}</td>
                  <td>{item.hari || '-'}</td>
                  <td>{item.jam_mulai || '-'}</td>
                  <td>{item.jam_selesai || '-'}</td>
                  <td>
                    <MasterStatusToggle
                      isActive={isActiveItem(item)}
                      isToggling={togglingId === item.id}
                      onClick={() => handleToggleActive(item)}
                    />
                  </td>
                  <td>
                    <button onClick={() => handleEdit(item)}>Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <FooterMaster
        pager={pager}
        onNew={handleNew}
        onEdit={() => {
          const item = sortedData.find((d) => d.id === selectedId)
          if (item) handleEdit(item)
        }}
        onDelete={() => setShowDeleteConfirm(true)}
        onPrint={() => openReportPrintWindow('Jadwal Dokter', sortedData)}
        onImport={() => setShowImportConfirm(true)}
        onExport={handleExport}
        onExit={() => setShowExitConfirm(true)}
        isFormOpen={showForm}
        hasSelected={!!selectedId}
      />

      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h3>{isNewMode ? 'New' : 'Edit'} Jadwal Dokter</h3>
            <div className="form-body">
              <div className="form-group">
                <label>Dokter</label>
                <select
                  value={form.dokter_id}
                  onChange={(e) => setForm({ ...form, dokter_id: e.target.value })}
                >
                  <option value="">Select Dokter</option>
                  {dokterList.map((d) => (
                    <option key={d.id} value={d.id}>{d.nama}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Hari</label>
                <select
                  value={form.hari}
                  onChange={(e) => setForm({ ...form, hari: e.target.value })}
                >
                  {HARI_LIST.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Jam Mulai</label>
                <input
                  type="time"
                  value={form.jam_mulai}
                  onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Jam Selesai</label>
                <input
                  type="time"
                  value={form.jam_selesai}
                  onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })}
                />
              </div>
            </div>
            <FooterFormMaster
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false)
                setForm(DEFAULT_FORM)
              }}
              isSaving={isSaving}
            />
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <DeleteMaster
          itemName={`jadwal dokter ${selectedId}`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  )
}
