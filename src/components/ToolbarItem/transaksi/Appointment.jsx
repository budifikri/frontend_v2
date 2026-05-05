import { useCallback, useEffect, useState, useRef } from 'react'
import { useAuth } from '../../../shared/auth'
import { listAppointments, createAppointment, updateAppointment, deleteAppointment } from '../../../features/transaksi/appointment/appointment.api'
import { listCustomers } from '../../../features/master/customer/customer.api'
import { listTreatments } from '../../../features/master/treatment/treatment.api'
import { listDokters } from '../../../features/master/dokter/dokter.api'
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
  patient_id: '',
  treatment_id: '',
  therapist_id: '',
  booking_date: new Date().toISOString().slice(0, 10),
  start_time: '09:00',
  end_time: '10:00',
  status: 'scheduled',
  notes: '',
}

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false },
  { key: 'booking_date', label: 'TANGGAL' },
  { key: 'patient_name', label: 'PASIEN' },
  { key: 'treatment_name', label: 'TREATMENT' },
  { key: 'therapist_name', label: 'THERAPIST' },
  { key: 'time_range', label: 'WAKTU' },
  { key: 'status', label: 'STATUS' },
]

const DUMMY_APPOINTMENTS = [
  {
    id: 'APT001',
    patient_id: 'CUST001',
    patient_name: 'Bpk. Budi',
    treatment_id: 'PROD001',
    treatment_name: 'Facial',
    therapist_id: 'DOK001',
    therapist_name: 'Dr. Ani',
    booking_date: '2026-05-05',
    start_time: '10:00',
    end_time: '11:00',
    status: 'scheduled',
    notes: '',
  },
  {
    id: 'APT002',
    patient_id: 'CUST002',
    patient_name: 'Ibu Sari',
    treatment_id: 'PROD002',
    treatment_name: 'Massage',
    therapist_id: 'DOK002',
    therapist_name: 'Dr. Budi',
    booking_date: '2026-05-05',
    start_time: '11:00',
    end_time: '12:00',
    status: 'confirmed',
    notes: '',
  },
]

function formatTime(time) {
  if (!time) return ''
  const str = String(time)
  if (str.includes('T')) {
    return str.slice(11, 16)
  }
  return str.slice(0, 5)
}

function formatDate(date) {
  if (!date) return ''
  return String(date).slice(0, 10)
}

export function Appointment({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
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

  const [patients, setPatients] = useState([])
  const [treatments, setTreatments] = useState([])
  const [therapists, setTherapists] = useState([])

  const fetchData = useCallback(async () => {
    setError('')
    setIsLoading(true)

    if (!token) {
      let filtered = DUMMY_APPOINTMENTS

      if (statusFilter) {
        filtered = filtered.filter((item) => item.status === statusFilter)
      }

      if (dateFromFilter) {
        filtered = filtered.filter((item) => item.booking_date >= dateFromFilter)
      }

      if (dateToFilter) {
        filtered = filtered.filter((item) => item.booking_date <= dateToFilter)
      }

      if (searchKeyword.trim()) {
        const keyword = searchKeyword.toLowerCase()
        filtered = filtered.filter((item) =>
          (item.patient_name || '').toLowerCase().includes(keyword) ||
          (item.treatment_name || '').toLowerCase().includes(keyword) ||
          (item.therapist_name || '').toLowerCase().includes(keyword)
        )
      }

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
      const result = await listAppointments(token, {
        date_from: dateFromFilter || undefined,
        date_to: dateToFilter || undefined,
        status: statusFilter || undefined,
        limit,
        offset,
      })

      const items = (result.items || []).map((item) => ({
        ...item,
        patient_name: item.patient?.name || '',
        treatment_name: item.treatment?.name || '',
        therapist_name: item.therapist?.nama || '',
        time_range: `${formatTime(item.start_time)} - ${formatTime(item.end_time)}`,
        booking_date_formatted: formatDate(item.booking_date),
      }))

      setData(items)
      const nextPagination = result.pagination || {}
      setPagination({
        total: Number(nextPagination.total ?? 0),
        has_more: Boolean(nextPagination.has_more),
      })
    } catch (err) {
      setError(err.message || 'Failed to load appointments')
      setData([])
      setPagination({ total: 0, has_more: false })
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, statusFilter, dateFromFilter, dateToFilter, limit, offset])

  const fetchDropdownData = useCallback(async () => {
    if (!token) return

    try {
      const [patientsRes, treatmentsRes, therapistsRes] = await Promise.all([
        listCustomers(token, { limit: 100 }),
        listTreatments(token, { limit: 100 }),
        listDokters(token, { limit: 100 }),
      ])

      setPatients(patientsRes.items || patientsRes || [])
      setTreatments(treatmentsRes.items || treatmentsRes || [])
      setTherapists(therapistsRes.items || therapistsRes || [])
    } catch (err) {
      console.error('Failed to load dropdown data:', err)
    }
  }, [token])

  const selectedItem = selectedId == null ? null : data.find((row) => row.id === selectedId) || null

  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'booking_date',
    valueGetters: {
      status: (row) => {
        const order = { scheduled: 1, confirmed: 2, completed: 3, cancelled: 4 }
        return order[row.status] || 0
      },
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
    fetchDropdownData()
  }, [fetchDropdownData])

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

  function handleStatusFilterChange(value) {
    pager.reset()
    setStatusFilter(value)
  }

  function handleDateFromChange(value) {
    pager.reset()
    setDateFromFilter(value)
  }

  function handleDateToChange(value) {
    pager.reset()
    setDateToFilter(value)
  }

  async function handleSave() {
    if (!form.patient_id) {
      setError('Pasien wajib dipilih')
      return
    }

    if (!form.treatment_id) {
      setError('Treatment wajib dipilih')
      return
    }

    if (!form.therapist_id) {
      setError('Therapist wajib dipilih')
      return
    }

    if (!form.booking_date) {
      setError('Tanggal booking wajib diisi')
      return
    }

    if (!form.start_time || !form.end_time) {
      setError('Jam mulai dan jam selesai wajib diisi')
      return
    }

    setIsSaving(true)
    setError('')

    const payload = {
      patient_id: form.patient_id,
      treatment_id: form.treatment_id || undefined,
      therapist_id: form.therapist_id,
      booking_date: form.booking_date,
      start_time: form.start_time,
      end_time: form.end_time,
      status: form.status,
      notes: form.notes,
    }

    try {
      if (token) {
        if (isNewMode) await createAppointment(token, payload)
        else await updateAppointment(token, selectedItem.id, payload)
        await fetchData()
      } else {
        if (isNewMode) {
          const newItem = {
            id: `APT${Date.now()}`,
            ...payload,
            patient_name: patients.find(p => p.id === payload.patient_id)?.name || '',
            treatment_name: treatments.find(t => t.id === payload.treatment_id)?.name || '',
            therapist_name: therapists.find(t => t.id === payload.therapist_id)?.nama || '',
            time_range: `${payload.start_time} - ${payload.end_time}`,
          }
          setData((prev) => [newItem, ...prev])
        } else {
          setData((prev) => prev.map((row) => (
            row.id === selectedItem.id ? {
              ...row,
              ...payload,
              patient_name: patients.find(p => p.id === payload.patient_id)?.name || '',
              treatment_name: treatments.find(t => t.id === payload.treatment_id)?.name || '',
              therapist_name: therapists.find(t => t.id === payload.therapist_id)?.nama || '',
              time_range: `${payload.start_time} - ${payload.end_time}`,
            } : row
          )))
        }
      }

      setToastMessage('Data tersimpan')
      setShowToast(true)
    } catch (err) {
      setError(err.message || 'Failed to save appointment')
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
      patient_id: target.patient_id || '',
      treatment_id: target.treatment_id || '',
      therapist_id: target.therapist_id || '',
      booking_date: formatDate(target.booking_date),
      start_time: formatTime(target.start_time),
      end_time: formatTime(target.end_time),
      status: target.status || 'scheduled',
      notes: target.notes || '',
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
      patient_id: nextItem.patient_id || '',
      treatment_id: nextItem.treatment_id || '',
      therapist_id: nextItem.therapist_id || '',
      booking_date: formatDate(nextItem.booking_date),
      start_time: formatTime(nextItem.start_time),
      end_time: formatTime(nextItem.end_time),
      status: nextItem.status || 'scheduled',
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
      patient_id: prevItem.patient_id || '',
      treatment_id: prevItem.treatment_id || '',
      therapist_id: prevItem.therapist_id || '',
      booking_date: formatDate(prevItem.booking_date),
      start_time: formatTime(prevItem.start_time),
      end_time: formatTime(prevItem.end_time),
      status: prevItem.status || 'scheduled',
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
        await deleteAppointment(token, selectedItem.id)
        await fetchData()
      } else {
        setData((prev) => prev.filter((row) => row.id !== selectedItem.id))
      }
    } catch (err) {
      setError(err.message || 'Failed to delete appointment')
    } finally {
      setShowDeleteConfirm(false)
      setShowForm(false)
      setSelectedId(null)
      setForm(DEFAULT_FORM)
    }
  }

  function handleToggleStatus(row) {
    if (!row?.id || togglingId) return

    const nextStatus = row.status === 'scheduled' ? 'confirmed' :
                      row.status === 'confirmed' ? 'completed' : 'scheduled'

    if (token) {
      setTogglingId(row.id)
      updateAppointment(token, row.id, { status: nextStatus })
        .then(() => fetchData())
        .catch((err) => setError(err.message || 'Failed to update status'))
        .finally(() => setTogglingId(null))
      return
    }

    setData((prev) => prev.map((item) => (
      item.id === row.id ? { ...item, status: nextStatus } : item
    )))
  }

  function handleCloseForm() {
    setShowForm(false)
    setSelectedId(null)
    setCurrentEditIndex(null)
    setForm(DEFAULT_FORM)
    setIsNewMode(false)
  }

  function getStatusLabel(status) {
    const found = STATUS_OPTIONS.find(opt => opt.value === status)
    return found ? found.label : status
  }

  function handlePrint() {
    setShowForm(false)
    const printColumns = [
      { key: 'no', label: 'NO', align: 'text-center', formatter: (_, __, index) => index + 1 },
      { key: 'booking_date', label: 'TANGGAL' },
      { key: 'patient_name', label: 'PASIEN' },
      { key: 'treatment_name', label: 'TREATMENT' },
      { key: 'therapist_name', label: 'THERAPIST' },
      { key: 'time_range', label: 'WAKTU' },
      { key: 'status', label: 'STATUS', align: 'text-center', formatter: (v) => getStatusLabel(v) },
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
          title: 'Daftar Appointment',
          company: companyInfo,
          meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
          columns: printColumns,
          data: printData,
          footerTextOverride: `Laporan Appointment dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
        })
      }).catch(() => {
        openReportPrintWindow({
          title: 'Daftar Appointment',
          company: companyInfo,
          meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
          columns: printColumns,
          data: printData,
          footerTextOverride: `Laporan Appointment dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
        })
      })
    } else {
      openReportPrintWindow({
        title: 'Daftar Appointment',
        company: companyInfo,
        meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
        columns: printColumns,
        data: printData,
        footerTextOverride: `Laporan Appointment dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
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
        <h1 className="master-title">Appointment</h1>
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
            <label htmlFor="appointment-date-from" className="master-filter-label">Dari</label>
            <input
              id="appointment-date-from"
              type="date"
              className="master-filter-select"
              value={dateFromFilter}
              onChange={(e) => handleDateFromChange(e.target.value)}
            />
          </div>
          <div className="master-filter-wrap">
            <label htmlFor="appointment-date-to" className="master-filter-label">Sampai</label>
            <input
              id="appointment-date-to"
              type="date"
              className="master-filter-select"
              value={dateToFilter}
              onChange={(e) => handleDateToChange(e.target.value)}
            />
          </div>
          <div className="master-filter-wrap">
            <label htmlFor="appointment-status-filter" className="master-filter-label">Status</label>
            <select
              id="appointment-status-filter"
              className="master-filter-select"
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
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
                  <td>{formatDate(row.booking_date)}</td>
                  <td>{row.patient_name || '-'}</td>
                  <td>{row.treatment_name || '-'}</td>
                  <td>{row.therapist_name || '-'}</td>
                  <td>{row.time_range || '-'}</td>
                  <td>
                    <MasterStatusToggle
                      active={row.status === 'scheduled' || row.status === 'confirmed'}
                      loading={togglingId === row.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleStatus(row)
                      }}
                    />
                    <span style={{ marginLeft: 8 }}>{getStatusLabel(row.status)}</span>
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
            <span className="material-icons-round master-form-icon">event</span>
            <h2 className="master-form-title">{isNewMode ? 'Isi Data Appointment' : 'Ubah Data Appointment'}</h2>
          </div>
          <div className="master-form-grid">
            <div className="master-form-group">
              <label className="master-form-label">Pasien :</label>
              <select
                value={form.patient_id}
                onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                className="master-form-input"
              >
                <option value="">Pilih Pasien</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.nama}</option>
                ))}
              </select>
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Treatment :</label>
              <select
                value={form.treatment_id}
                onChange={(e) => setForm({ ...form, treatment_id: e.target.value })}
                className="master-form-input"
              >
                <option value="">Pilih Treatment</option>
                {treatments.map((t) => (
                  <option key={t.id} value={t.id}>{t.name || t.nama}</option>
                ))}
              </select>
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Therapist :</label>
              <select
                value={form.therapist_id}
                onChange={(e) => setForm({ ...form, therapist_id: e.target.value })}
                className="master-form-input"
              >
                <option value="">Pilih Therapist</option>
                {therapists.map((t) => (
                  <option key={t.id} value={t.id}>{t.nama || t.name}</option>
                ))}
              </select>
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Tanggal :</label>
              <input
                type="date"
                value={form.booking_date}
                onChange={(e) => setForm({ ...form, booking_date: e.target.value })}
                className="master-form-input"
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Jam Mulai :</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="master-form-input"
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Jam Selesai :</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="master-form-input"
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Status :</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="master-form-input"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="master-form-group-wide">
              <label className="master-form-label">Notes :</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="master-form-input"
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
      />

      {showDeleteConfirm && (
        <DeleteMaster
          itemName={`appointment ${selectedItem?.patient_name || ''}`}
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
