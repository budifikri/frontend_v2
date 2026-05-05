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

const CALENDAR_FETCH_LIMIT = 1000

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

const FORM_STATUS_STEPS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled', tone: 'cancelled' },
]

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

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

function formatDateISO(date) {
  if (!date || Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDateRange(filterType, customFrom, customTo) {
  const now = new Date()

  if (filterType === 'today') {
    const today = formatDateISO(now)
    return { date_from: today, date_to: today }
  }

  if (filterType === 'this_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { date_from: formatDateISO(firstDay), date_to: formatDateISO(lastDay) }
  }

  if (filterType === 'this_year') {
    const firstDay = new Date(now.getFullYear(), 0, 1)
    const lastDay = new Date(now.getFullYear(), 11, 31)
    return { date_from: formatDateISO(firstDay), date_to: formatDateISO(lastDay) }
  }

  if (filterType === 'custom' && customFrom && customTo) {
    return {
      date_from: formatDateISO(new Date(customFrom)),
      date_to: formatDateISO(new Date(customTo)),
    }
  }

  return { date_from: '', date_to: '' }
}

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

function getMonthRange(date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return {
    date_from: formatDateISO(firstDay),
    date_to: formatDateISO(lastDay),
  }
}

function buildCalendarCells(monthDate) {
  const firstDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
  const leadingEmptyDays = firstDayOfMonth.getDay()
  const cells = []

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(formatDateISO(new Date(monthDate.getFullYear(), monthDate.getMonth(), day)))
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

function isDateInMonth(dateValue, monthDate) {
  if (!dateValue) return false
  const target = new Date(`${dateValue}T00:00:00`)
  return target.getFullYear() === monthDate.getFullYear() && target.getMonth() === monthDate.getMonth()
}

function getMonthLabel(date) {
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

function formatDisplayDate(dateValue) {
  if (!dateValue) return '-'
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function getStatusTone(status) {
  if (status === 'confirmed') return 'confirmed'
  if (status === 'completed') return 'completed'
  if (status === 'cancelled') return 'cancelled'
  return 'scheduled'
}

function sortAppointments(items) {
  return [...items].sort((left, right) => {
    const leftDateTime = `${formatDate(left.booking_date)} ${formatTime(left.start_time)}`
    const rightDateTime = `${formatDate(right.booking_date)} ${formatTime(right.start_time)}`
    return leftDateTime.localeCompare(rightDateTime)
  })
}

export function Appointment({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [localAppointments, setLocalAppointments] = useState(DUMMY_APPOINTMENTS)
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isCalendarLoading, setIsCalendarLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState('list')
  const [dateFilter, setDateFilter] = useState('today')
  const [showDateModal, setShowDateModal] = useState(false)
  const todayStr = formatDateISO(new Date())
  const [customDateFrom, setCustomDateFrom] = useState(todayStr)
  const [customDateTo, setCustomDateTo] = useState(todayStr)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(todayStr)
  const [calendarData, setCalendarData] = useState([])
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
    const { date_from, date_to } = getDateRange(dateFilter, customDateFrom, customDateTo)

    if (!token) {
      let filtered = [...localAppointments]

      if (statusFilter) {
        filtered = filtered.filter((item) => item.status === statusFilter)
      }

      if (date_from && date_to) {
        filtered = filtered.filter((item) => item.booking_date >= date_from && item.booking_date <= date_to)
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
        date_from: date_from || undefined,
        date_to: date_to || undefined,
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
  }, [token, searchKeyword, statusFilter, dateFilter, customDateFrom, customDateTo, limit, offset, localAppointments])

  const fetchCalendarData = useCallback(async () => {
    setError('')
    setIsCalendarLoading(true)
    const { date_from, date_to } = getMonthRange(calendarMonth)

    if (!token) {
      let filtered = [...localAppointments]

      filtered = filtered.filter((item) => item.booking_date >= date_from && item.booking_date <= date_to)

      if (statusFilter) {
        filtered = filtered.filter((item) => item.status === statusFilter)
      }

      if (searchKeyword.trim()) {
        const keyword = searchKeyword.toLowerCase()
        filtered = filtered.filter((item) =>
          (item.patient_name || '').toLowerCase().includes(keyword) ||
          (item.treatment_name || '').toLowerCase().includes(keyword) ||
          (item.therapist_name || '').toLowerCase().includes(keyword)
        )
      }

      setCalendarData(sortAppointments(filtered))
      setIsCalendarLoading(false)
      return
    }

    try {
      const result = await listAppointments(token, {
        date_from,
        date_to,
        status: statusFilter || undefined,
        limit: CALENDAR_FETCH_LIMIT,
        offset: 0,
      })

      const items = (result.items || []).map((item) => ({
        ...item,
        patient_name: item.patient?.name || '',
        treatment_name: item.treatment?.name || '',
        therapist_name: item.therapist?.nama || '',
        time_range: `${formatTime(item.start_time)} - ${formatTime(item.end_time)}`,
        booking_date_formatted: formatDate(item.booking_date),
      }))

      const filteredItems = searchKeyword.trim()
        ? items.filter((item) => {
            const keyword = searchKeyword.toLowerCase()
            return (item.patient_name || '').toLowerCase().includes(keyword) ||
              (item.treatment_name || '').toLowerCase().includes(keyword) ||
              (item.therapist_name || '').toLowerCase().includes(keyword)
          })
        : items

      setCalendarData(sortAppointments(filteredItems))
    } catch (err) {
      setError(err.message || 'Failed to load calendar appointments')
      setCalendarData([])
    } finally {
      setIsCalendarLoading(false)
    }
  }, [calendarMonth, localAppointments, searchKeyword, statusFilter, token])

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

  const selectedItem = selectedId == null
    ? null
    : data.find((row) => row.id === selectedId) || calendarData.find((row) => row.id === selectedId) || null

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
    isModalOpen: showForm || showDeleteConfirm || showExitConfirm || showDateModal,
  })

  useEffect(() => {
    fetchDropdownData()
  }, [fetchDropdownData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchCalendarData()
  }, [fetchCalendarData])

  useEffect(() => {
    if (!isDateInMonth(selectedCalendarDate, calendarMonth)) {
      setSelectedCalendarDate(formatDateISO(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)))
    }
  }, [calendarMonth, selectedCalendarDate])

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

  function handleDateFilterChange(value) {
    setError('')
    if (viewMode === 'calendar') return
    if (value === 'custom') {
      const today = formatDateISO(new Date())
      setCustomDateFrom(today)
      setCustomDateTo(today)
      setShowDateModal(true)
      return
    }

    pager.reset()
    setDateFilter(value)
  }

  function handleViewModeChange(nextMode) {
    setViewMode(nextMode)
  }

  function handleCalendarMonthChange(direction) {
    const nextMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + direction, 1)
    setCalendarMonth(nextMonth)
    setSelectedCalendarDate(formatDateISO(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1)))
  }

  function handleApplyCustomDate() {
    if (!customDateFrom || !customDateTo) {
      setError('Please select both from and to dates')
      return
    }

    const from = new Date(customDateFrom)
    const to = new Date(customDateTo)
    if (from > to) {
      setError('From date must be before to date')
      return
    }

    setError('')
    setShowDateModal(false)
    setDateFilter('custom')
    pager.reset()
  }

  function handleCancelDateModal() {
    setShowDateModal(false)
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
        await Promise.all([fetchData(), fetchCalendarData()])
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
          setLocalAppointments((prev) => [newItem, ...prev])
        } else {
          setLocalAppointments((prev) => prev.map((row) => (
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

  function handleCalendarNew() {
    setSelectedId(null)
    setCurrentEditIndex(null)
    setForm({
      ...DEFAULT_FORM,
      booking_date: selectedCalendarDate || DEFAULT_FORM.booking_date,
    })
    setIsNewMode(true)
    setShowForm(true)
  }

  function handleEdit(targetOverride) {
    const target = targetOverride || selectedItem || (viewMode === 'calendar' ? selectedCalendarItems[0] : sortedData[0])
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
        await Promise.all([fetchData(), fetchCalendarData()])
      } else {
        setLocalAppointments((prev) => prev.filter((row) => row.id !== selectedItem.id))
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
        .then(() => Promise.all([fetchData(), fetchCalendarData()]))
        .catch((err) => setError(err.message || 'Failed to update status'))
        .finally(() => setTogglingId(null))
      return
    }

    setLocalAppointments((prev) => prev.map((item) => (
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

  const calendarCells = buildCalendarCells(calendarMonth)
  const appointmentsByDate = calendarData.reduce((accumulator, item) => {
    const key = formatDate(item.booking_date)
    if (!accumulator[key]) accumulator[key] = []
    accumulator[key].push(item)
    return accumulator
  }, {})
  const selectedCalendarItems = sortAppointments(appointmentsByDate[selectedCalendarDate] || [])
  const formFields = (
    <>
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
      <div className="master-form-group-wide">
        <label className="master-form-label">Notes :</label>
        <input
          type="text"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="master-form-input"
        />
      </div>
    </>
  )

  const formActions = (
    <FooterFormMaster
      onSave={handleSave}
      onClose={handleCloseForm}
      isSaving={isSaving}
      onNext={handleNextRecord}
      onPrev={handlePrevRecord}
      canNext={currentEditIndex !== null && sortedData.length > 1 && currentEditIndex < sortedData.length - 1}
      canPrev={currentEditIndex !== null && sortedData.length > 1 && currentEditIndex > 0}
    />
  )

  const formStatusBar = (
    <div className="appointment-arrow-status-bar" aria-label="Appointment status">
      {FORM_STATUS_STEPS.map((item) => {
        const isActive = form.status === item.value
        return (
          <button
            key={item.value}
            type="button"
            className={`appointment-arrow-step ${isActive ? 'is-active' : 'is-inactive'} ${item.tone === 'cancelled' ? 'appointment-arrow-step-cancelled' : ''}`}
            onClick={() => setForm({ ...form, status: item.value })}
            aria-pressed={isActive}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )

  const formSection = showForm ? (
    viewMode === 'calendar' ? (
      <div className="appointment-calendar-form-overlay">
        <div className="appointment-calendar-form-panel">
          <div className="master-form-header appointment-calendar-form-header">
            <span className="material-icons-round master-form-icon">event</span>
            <h2 className="master-form-title">{isNewMode ? 'Isi Data Appointment' : 'Ubah Data Appointment'}</h2>
            {formStatusBar}
          </div>
          <div className="appointment-calendar-form-body">
            <div className="master-form-grid appointment-calendar-form-grid">{formFields}</div>
          </div>
          <div className="appointment-calendar-form-footer">{formActions}</div>
        </div>
      </div>
    ) : (
      <div className="master-form-card">
        <div className="master-form-header">
          <span className="material-icons-round master-form-icon">event</span>
          <h2 className="master-form-title">{isNewMode ? 'Isi Data Appointment' : 'Ubah Data Appointment'}</h2>
          {formStatusBar}
        </div>
        <div className="master-form-grid">
          {formFields}
          {formActions}
        </div>
      </div>
    )
  ) : null

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
              value={searchKeyword}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <button type="button" className="master-search-btn" onClick={() => (viewMode === 'calendar' ? fetchCalendarData() : fetchData())}>
              <span className="material-icons-round material-icon">search</span>
            </button>
          </div>
          <div className={`master-filter-wrap appointment-date-filter-wrap ${viewMode === 'calendar' ? 'is-disabled' : ''}`}>
            <label htmlFor="appointment-date-filter" className="master-filter-label">Date</label>
            <div className="appointment-date-filter-control">
              <select
                id="appointment-date-filter"
                className="master-filter-select"
                value={dateFilter}
                onChange={(e) => handleDateFilterChange(e.target.value)}
                disabled={viewMode === 'calendar'}
                aria-describedby={viewMode === 'calendar' ? 'appointment-calendar-date-note' : undefined}
              >
                <option value="today">Today</option>
                <option value="this_month">This Month</option>
                <option value="this_year">This Year</option>
                <option value="custom">Custom</option>
              </select>
              {viewMode === 'calendar' && (
                <span className="appointment-disabled-tooltip" role="tooltip">
                  Date mengikuti bulan kalender
                </span>
              )}
            </div>
            {viewMode === 'calendar' && (
              <span id="appointment-calendar-date-note" className="appointment-filter-helper-text">
                Date mengikuti bulan kalender
              </span>
            )}
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
          <div className="appointment-view-toggle" aria-label="Appointment view mode">
            <button
              type="button"
              className={`appointment-view-toggle-btn ${viewMode === 'list' ? 'is-active' : ''}`}
              onClick={() => handleViewModeChange('list')}
              title="List view"
              aria-pressed={viewMode === 'list'}
            >
              <span className="material-icons-round">view_list</span>
            </button>
            <button
              type="button"
              className={`appointment-view-toggle-btn ${viewMode === 'calendar' ? 'is-active' : ''}`}
              onClick={() => handleViewModeChange('calendar')}
              title="Calendar view"
              aria-pressed={viewMode === 'calendar'}
            >
              <span className="material-icons-round">calendar_month</span>
            </button>
          </div>
        </div>
      </div>

      {error && <div className="master-error">{error}</div>}

      {viewMode === 'calendar' ? (
        <div className="appointment-calendar-layout">
          <section className="appointment-calendar-card">
            <div className="appointment-calendar-toolbar">
              <button
                type="button"
                className="appointment-calendar-nav-btn"
                onClick={() => handleCalendarMonthChange(-1)}
                aria-label="Bulan sebelumnya"
              >
                <span className="material-icons-round">chevron_left</span>
              </button>
              <div>
                <h2 className="appointment-calendar-title">{getMonthLabel(calendarMonth)}</h2>
                <p className="appointment-calendar-subtitle">Monitoring appointment per tanggal</p>
              </div>
              <button
                type="button"
                className="appointment-calendar-nav-btn"
                onClick={() => handleCalendarMonthChange(1)}
                aria-label="Bulan berikutnya"
              >
                <span className="material-icons-round">chevron_right</span>
              </button>
            </div>

            <div className="appointment-calendar-card-body">
              <div className="appointment-calendar-grid-header">
                {DAY_LABELS.map((dayLabel) => (
                  <div key={dayLabel} className="appointment-calendar-grid-label">{dayLabel}</div>
                ))}
              </div>

              <div className="appointment-calendar-grid">
                {calendarCells.map((dateValue, index) => {
                  if (!dateValue) {
                    return <div key={`empty-${index}`} className="appointment-calendar-cell is-empty" aria-hidden="true" />
                  }

                  const items = appointmentsByDate[dateValue] || []
                  const activeStatusSet = [...new Set(items.map((item) => item.status))]

                  return (
                    <button
                      key={dateValue}
                      type="button"
                      className={`appointment-calendar-cell ${selectedCalendarDate === dateValue ? 'is-selected' : ''} ${dateValue === todayStr ? 'is-today' : ''}`}
                      onClick={() => setSelectedCalendarDate(dateValue)}
                    >
                      <div className="appointment-calendar-cell-top">
                        <span className="appointment-calendar-day-number">{Number(dateValue.slice(-2))}</span>
                        {items.length > 0 && <span className="appointment-calendar-count">{items.length}</span>}
                      </div>
                      <div className="appointment-calendar-cell-body">
                        <span className="appointment-calendar-count-label">
                          {items.length > 0 ? `${items.length} appt` : 'Tidak ada'}
                        </span>
                        <div className="appointment-calendar-status-dots">
                          {activeStatusSet.map((status) => (
                            <span
                              key={`${dateValue}-${status}`}
                              className={`appointment-status-dot is-${getStatusTone(status)}`}
                              title={getStatusLabel(status)}
                            />
                          ))}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          <aside className="appointment-calendar-detail-card">
            <div className="appointment-calendar-detail-header">
              <div>
                <h2 className="appointment-calendar-detail-title">Appointment Tanggal Terpilih</h2>
                <p className="appointment-calendar-detail-date">{formatDisplayDate(selectedCalendarDate)}</p>
              </div>
              <button
                type="button"
                className="appointment-calendar-add-btn"
                onClick={handleCalendarNew}
                title="Add Appointment"
                aria-label="Add Appointment"
              >
                <span className="material-icons-round">add</span>
              </button>
            </div>

            <div className="appointment-calendar-detail-body">
              {isCalendarLoading ? (
                <div className="appointment-calendar-empty-state">Loading appointment...</div>
              ) : selectedCalendarItems.length === 0 ? (
                <div className="appointment-calendar-empty-state">Belum ada appointment pada tanggal ini.</div>
              ) : (
                <div className="appointment-calendar-detail-list">
                  {selectedCalendarItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`appointment-calendar-detail-item ${selectedId === item.id ? 'is-selected' : ''}`}
                      onClick={() => handleSelect(item)}
                      onDoubleClick={() => handleEdit(item)}
                    >
                      <div className="appointment-calendar-detail-main">
                        <div>
                          <div className="appointment-calendar-detail-time">{formatTime(item.start_time)} - {formatTime(item.end_time)}</div>
                          <div className="appointment-calendar-detail-patient">{item.patient_name || '-'}</div>
                          <div className="appointment-calendar-detail-meta">{item.treatment_name || '-'} • {item.therapist_name || '-'}</div>
                        </div>
                        <span className={`appointment-calendar-status-badge is-${getStatusTone(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : (
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
      )}

      {formSection}

      {viewMode !== 'calendar' && (
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
      )}

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

      {showDateModal && (
        <div className="delete-master-overlay">
          <div className="delete-master-modal date-filter-modal">
            <div className="delete-master-header">
              <span className="material-icons-round material-icon red">calendar_today</span>
              <h2>Custom Date Range</h2>
            </div>
            <div className="delete-master-body">
              <div className="date-filter-group">
                <label htmlFor="appointment-date-from" className="master-form-label">From Date</label>
                <input
                  id="appointment-date-from"
                  type="date"
                  className="master-form-input date-input"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                />
              </div>
              <div className="date-filter-group">
                <label htmlFor="appointment-date-to" className="master-form-label">To Date</label>
                <input
                  id="appointment-date-to"
                  type="date"
                  className="master-form-input date-input"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="delete-master-footer">
              <button
                type="button"
                className="master-btn-cancel-secondary"
                onClick={handleCancelDateModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="master-btn-save-primary"
                onClick={handleApplyCustomDate}
              >
                <span className="material-icons-round">check</span>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && <Toast message={toastMessage} type="success" onClose={() => setShowToast(false)} />}
    </div>
  )
}
