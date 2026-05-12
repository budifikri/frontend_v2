import { useCallback, useEffect, useState, useRef } from 'react'
import { useAuth } from '../../../shared/auth'
import { listAppointments, createAppointment, updateAppointment, deleteAppointment } from '../../../features/transaksi/appointment/appointment.api'
import { getSaleById } from '../../../features/transaksi/sales/sales.api'
import { createCustomer, listCustomers, updateCustomer } from '../../../features/master/customer/customer.api'
import { listTreatments } from '../../../features/master/treatment/treatment.api'
import { listDokters } from '../../../features/master/dokter/dokter.api'
import { getCurrentCompany } from '../../../features/master/company/company.api'
import { loadReceiptSettings, RECEIPT_FONTS } from '../../../features/setting/receiptSetting.storage'
import { ReceiptPreview } from '../../POS/ReceiptPreview'
import { getReceiptPaperClass, renderReceiptContent } from '../../POS/ReceiptLayouts'
import { openReportPrintWindow } from '../../../utils/reportPrint'
import { FooterMaster } from '../footer/FooterMaster'
import { FooterFormMaster } from '../footer/FooterFormMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'
import { useMasterTableKeyboardNav } from '../../../hooks/useMasterTableKeyboardNav'
import { Toast } from '../../../components/Toast'
import '../../POS/POS.css'

const CALENDAR_FETCH_LIMIT = 1000
const APPOINTMENT_DRAFT_PREFIX = 'pos_appointment_draft_'

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

const DEFAULT_PATIENT_FORM = {
  name: '',
  no_rm: '',
  no_nik: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  allergies: '',
}

const KTP_PATTERN = /^\d{16}$/

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const FORM_STATUS_STEPS = [
  { value: 'scheduled', label: 'Scheduled', tooltip: 'Isi data pasien sesuai jadwal dokter' },
  { value: 'confirmed', label: 'Confirmed', tooltip: 'Konfirmasi ke dokter' },
  { value: 'completed', label: 'Completed', tooltip: 'Pasien akan melakukan pembayaran' },
  { value: 'cancelled', label: 'Cancelled', tone: 'cancelled', tooltip: 'Cancel jadwal pemeriksaan' },
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
  { key: 'invoice_status', label: 'INVOICE', sortable: false },
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

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalizePatient(item = {}) {
  return {
    id: item.id || item.patient_id || item.customer_id || '',
    name: item.name || item.nama || item.patient_name || item.customer_name || '-',
    no_rm: item.no_rm || item.medical_record_number || '',
    no_nik: item.no_nik || item.nik || '',
    phone: item.phone || item.mobile_phone || item.telp || '',
    allergies: item.allergies || '',
    is_active: item.is_active ?? (String(item.status || 'active').toLowerCase() !== 'inactive'),
  }
}

function matchPatientKeyword(item, keyword) {
  const normalizedKeyword = String(keyword || '').trim().toLowerCase()
  if (!normalizedKeyword) return true

  return [item.name, item.no_rm, item.no_nik, item.phone]
    .some((value) => String(value || '').toLowerCase().includes(normalizedKeyword))
}

function getPatientFormState(item = {}) {
  return {
    name: item.name || '',
    no_rm: item.no_rm || '',
    no_nik: item.no_nik || '',
    email: item.email || '',
    phone: item.phone || '',
    address: item.address || '',
    city: item.city || '',
    allergies: item.allergies || '',
  }
}

function getStatusTone(status) {
  if (status === 'confirmed') return 'approve'
  if (status === 'completed') return 'receive'
  if (status === 'cancelled') return 'void'
  return 'pending'
}

function getAppointmentStatusMeta(status) {
  const value = String(status || '').toLowerCase()
  if (value === 'confirmed') return { label: 'Confirmed', variant: 'approve', icon: 'check_circle' }
  if (value === 'completed') return { label: 'Completed', variant: 'receive', icon: 'task_alt' }
  if (value === 'cancelled') return { label: 'Cancelled', variant: 'void', icon: 'cancel' }
  return { label: 'Scheduled', variant: 'pending', icon: 'schedule' }
}

function hasAppointmentDraft(appointmentId) {
  if (!appointmentId || typeof window === 'undefined' || !window.localStorage) return false

  try {
    return Boolean(window.localStorage.getItem(`${APPOINTMENT_DRAFT_PREFIX}${appointmentId}`))
  } catch {
    return false
  }
}

function getInvoiceStatusMeta(item) {
  const saleStatus = String(item?.sale?.status || '').toUpperCase()

  if (item?.sales_id) {
    if (saleStatus === 'DONE') {
      return { label: 'DONE', variant: 'done', icon: 'receipt_long', noteNumber: item?.sale?.sale_number || '' }
    }

    if (saleStatus === 'DRAFT' || saleStatus === 'PENDING') {
      return { label: 'DRAFT', variant: 'draft', icon: 'schedule', noteNumber: item?.sale?.sale_number || '' }
    }

    return { label: 'DONE', variant: 'done', icon: 'receipt_long', noteNumber: item?.sale?.sale_number || '' }
  }

  if (hasAppointmentDraft(item?.id)) {
    return { label: 'DRAFT', variant: 'draft', icon: 'schedule', noteNumber: '' }
  }

  return { label: 'NONE', variant: 'none', icon: 'remove_circle_outline', noteNumber: '' }
}

function getPayActionMeta(item) {
  const invoiceMeta = getInvoiceStatusMeta(item)
  const isCompleted = String(item?.status || '').toLowerCase() === 'completed'

  if (!item?.patient_id) {
    return { visible: true, disabled: true, tooltip: 'Patient belum tersedia' }
  }

  if (!isCompleted) {
    return { visible: true, disabled: true, tooltip: 'Hanya tersedia untuk appointment completed' }
  }

  if (invoiceMeta.label === 'DONE') {
    return { visible: true, disabled: true, tooltip: 'Invoice sudah selesai' }
  }

  return { visible: true, disabled: false, tooltip: 'Bayar' }
}

function sortAppointments(items) {
  return [...items].sort((left, right) => {
    const leftDateTime = `${formatDate(left.booking_date)} ${formatTime(left.start_time)}`
    const rightDateTime = `${formatDate(right.booking_date)} ${formatTime(right.start_time)}`
    return leftDateTime.localeCompare(rightDateTime)
  })
}

export function Appointment({ onExit, onOpenTool, toolContext = null }) {
  const { auth } = useAuth()
  const token = auth?.token
  const isClinicBusiness = auth?.businessType === 'clinic'

  const [data, setData] = useState([])
  const [localAppointments, setLocalAppointments] = useState(DUMMY_APPOINTMENTS)
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isCalendarLoading, setIsCalendarLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState('calendar')
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
  const tableRef = useRef(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [showSalePreview, setShowSalePreview] = useState(false)
  const [salePreviewData, setSalePreviewData] = useState(null)
  const [salePreviewLoading, setSalePreviewLoading] = useState(false)
  const [salePreviewError, setSalePreviewError] = useState('')
  const [receiptPreviewSettings] = useState(() => loadReceiptSettings())

  const [patients, setPatients] = useState([])
  const [treatments, setTreatments] = useState([])
  const [therapists, setTherapists] = useState([])
  const [patientSearchKeyword, setPatientSearchKeyword] = useState('')
  const [patientResults, setPatientResults] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [isPatientLoading, setIsPatientLoading] = useState(false)
  const [showPatientSearchResults, setShowPatientSearchResults] = useState(false)
  const [showPatientModal, setShowPatientModal] = useState(false)
  const [patientModalMode, setPatientModalMode] = useState('create')
  const [patientModalForm, setPatientModalForm] = useState(DEFAULT_PATIENT_FORM)
  const [patientModalSaving, setPatientModalSaving] = useState(false)
  const [patientModalError, setPatientModalError] = useState('')

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
      setError(err.message || 'Gagal memuat appointment')
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
    if (!token) {
      const localPatients = [
        { id: 'CUST001', name: 'Bpk. Budi', no_rm: 'RM001', no_nik: '3174010101010001', phone: '081234567890', allergies: '-' },
        { id: 'CUST002', name: 'Ibu Sari', no_rm: 'RM002', no_nik: '3174010101010002', phone: '081298765432', allergies: 'Seafood' },
      ].map((item) => normalizePatient(item))
      setPatients(localPatients)
      return
    }

    try {
      const [patientsRes, treatmentsRes, therapistsRes] = await Promise.all([
        listCustomers(token, { limit: 100 }),
        listTreatments(token, { limit: 100 }),
        listDokters(token, { limit: 100 }),
      ])

      setPatients((patientsRes.items || patientsRes || []).map((item) => normalizePatient(item)))
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
    isModalOpen: showForm || showDeleteConfirm || showDateModal,
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
    if (!showForm) return
    if (selectedPatient?.id) return
    if (!patientSearchKeyword.trim()) {
      setPatientResults(patients.slice(0, 5))
    }
  }, [patients, patientSearchKeyword, selectedPatient, showForm])

  useEffect(() => {
    if (!showForm || !form.patient_id || selectedPatient?.id === form.patient_id) return
    const matched = patients.find((item) => item.id === form.patient_id)
    if (matched) setSelectedPatient(matched)
  }, [form.patient_id, patients, selectedPatient, showForm])

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
        onExit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeleteConfirm, showForm, selectedId, data, handlePrevRecord, handleNextRecord])

  useEffect(() => {
    if (!toolContext || toolContext.source !== 'appointment-pos-return') return

    if (toolContext.viewMode) {
      setViewMode(toolContext.viewMode)
    }
    if (toolContext.selectedCalendarDate) {
      setSelectedCalendarDate(toolContext.selectedCalendarDate)
    }
    if (toolContext.selectedId) {
      setSelectedId(toolContext.selectedId)
    }
  }, [toolContext])

  function handleSearchChange(value) {
    pager.reset()
    setSearchKeyword(value)
  }

  function handlePatientSearchChange(value) {
    setPatientSearchKeyword(value)
    if (!value.trim()) {
      setPatientResults([])
      setShowPatientSearchResults(false)
    }
  }

  async function handlePatientSearch() {
    const keyword = patientSearchKeyword.trim()
    setError('')

    if (!keyword) {
      setPatientResults([])
      setShowPatientSearchResults(false)
      return
    }

    setIsPatientLoading(true)
    try {
      if (!token) {
        const filteredItems = patients.filter((item) => matchPatientKeyword(item, keyword)).slice(0, 8)
        setPatientResults(filteredItems)
        if (filteredItems.length === 1) {
          handleSelectPatient(filteredItems[0])
        } else {
          setShowPatientSearchResults(filteredItems.length > 1)
        }
        if (filteredItems.length === 0) {
          setToastType('error')
          setToastMessage('Pasien tidak ditemukan')
          setShowToast(true)
        }
        return
      }

      const result = await listCustomers(token, {
        search: keyword,
        include_inactive: true,
        limit: 8,
        offset: 0,
      })
      const items = (result.items || []).map((item) => normalizePatient(item))
      setPatientResults(items)
      if (items.length === 1) {
        handleSelectPatient(items[0])
      } else {
        setShowPatientSearchResults(items.length > 1)
      }
      if (items.length > 0) {
        setPatients((prev) => {
          const merged = [...prev]
          items.forEach((item) => {
            if (!merged.some((patient) => patient.id === item.id)) merged.push(item)
          })
          return merged
        })
      } else {
        setToastType('error')
        setToastMessage('Pasien tidak ditemukan')
        setShowToast(true)
      }
    } catch (err) {
      setToastType('error')
      setError(err.message || 'Failed to load patients')
      setToastMessage(err.message || 'Gagal memuat data pasien')
      setShowToast(true)
      setPatientResults([])
      setShowPatientSearchResults(false)
    } finally {
      setIsPatientLoading(false)
    }
  }

  function handleSelectPatient(patient) {
    const normalized = normalizePatient(patient)
    setSelectedPatient(normalized)
    setForm((prev) => ({ ...prev, patient_id: normalized.id }))
    setPatientSearchKeyword(normalized.name || '')
    setShowPatientSearchResults(false)
  }

  function handleOpenPatientModal(mode) {
    setPatientModalMode(mode)
    setPatientModalError('')
    setShowPatientSearchResults(false)

    if (mode === 'edit' && selectedPatient) {
      setPatientModalForm(getPatientFormState(selectedPatient))
    } else {
      setPatientModalForm({
        ...DEFAULT_PATIENT_FORM,
        name: patientSearchKeyword.trim(),
      })
    }

    setShowPatientModal(true)
  }

  function handleOpenPatientCreate() {
    handleOpenPatientModal('create')
  }

  function handleOpenPatientDetail() {
    if (!selectedPatient?.id) return
    handleOpenPatientModal('edit')
  }

  function handleClosePatientModal() {
    setShowPatientModal(false)
    setPatientModalError('')
    setPatientModalSaving(false)
  }

  async function handleSavePatientModal() {
    const trimmedName = patientModalForm.name.trim()
    const trimmedNoRM = patientModalForm.no_rm.trim()
    const trimmedNoNIK = patientModalForm.no_nik.trim()

    if (!trimmedName) {
      setPatientModalError('Nama pasien wajib diisi')
      return
    }

    if (trimmedNoNIK && !KTP_PATTERN.test(trimmedNoNIK)) {
      setPatientModalError('KTP harus 16 digit angka')
      return
    }

    setPatientModalSaving(true)
    setPatientModalError('')

    const payload = {
      name: trimmedName,
      no_rm: trimmedNoRM || undefined,
      no_nik: trimmedNoNIK || undefined,
      email: patientModalForm.email,
      phone: patientModalForm.phone,
      address: patientModalForm.address,
      city: patientModalForm.city,
      allergies: patientModalForm.allergies,
      tier: 'BRONZE',
      credit_limit: 0,
      bank_name: '',
      bank_account_number: '',
      bank_account_name: '',
      bank_branch: '',
    }

    try {
      let savedPatient = null

      if (token) {
        const response = patientModalMode === 'create'
          ? await createCustomer(token, payload)
          : await updateCustomer(token, selectedPatient?.id, payload)
        savedPatient = normalizePatient({
          ...(response?.data || response?.item || {}),
          ...payload,
          id: response?.data?.id || response?.item?.id || selectedPatient?.id || '',
        })
      } else if (patientModalMode === 'create') {
        savedPatient = normalizePatient({
          id: `CUST${Date.now()}`,
          ...payload,
          is_active: true,
        })
      } else {
        savedPatient = normalizePatient({
          ...selectedPatient,
          ...payload,
        })
      }

      if (!savedPatient?.id) {
        savedPatient = normalizePatient({
          id: selectedPatient?.id || `CUST${Date.now()}`,
          ...payload,
        })
      }

      setPatients((prev) => {
        const exists = prev.some((item) => item.id === savedPatient.id)
        if (!exists) return [savedPatient, ...prev]
        return prev.map((item) => (item.id === savedPatient.id ? { ...item, ...savedPatient } : item))
      })

      handleSelectPatient(savedPatient)
      setToastType('success')
      setToastMessage(patientModalMode === 'create' ? 'Pasien berhasil ditambahkan' : 'Data pasien berhasil diperbarui')
      setShowToast(true)
      handleClosePatientModal()
    } catch (err) {
      setPatientModalError(err.message || 'Gagal menyimpan data pasien')
    } finally {
      setPatientModalSaving(false)
    }
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

      setToastType('success')
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
    setSelectedPatient(null)
    setPatientSearchKeyword('')
    setPatientResults(patients.slice(0, 5))
    setShowPatientSearchResults(false)
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
    setSelectedPatient(null)
    setPatientSearchKeyword('')
    setPatientResults(patients.slice(0, 5))
    setShowPatientSearchResults(false)
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
    setSelectedPatient(normalizePatient({
      id: target.patient_id,
      name: target.patient_name || target.patient?.name || '',
    }))
    setPatientSearchKeyword(target.patient_name || target.patient?.name || '')
    setShowPatientSearchResults(false)
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
    setSelectedPatient(normalizePatient({
      id: nextItem.patient_id,
      name: nextItem.patient_name || nextItem.patient?.name || '',
    }))
    setPatientSearchKeyword(nextItem.patient_name || nextItem.patient?.name || '')
    setShowPatientSearchResults(false)
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
    setSelectedPatient(normalizePatient({
      id: prevItem.patient_id,
      name: prevItem.patient_name || prevItem.patient?.name || '',
    }))
    setPatientSearchKeyword(prevItem.patient_name || prevItem.patient?.name || '')
    setShowPatientSearchResults(false)
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
      setSelectedPatient(null)
      setPatientSearchKeyword('')
      setPatientResults(patients.slice(0, 5))
      setShowPatientSearchResults(false)
    }
  }

  function handleCloseForm() {
    setShowForm(false)
    setSelectedId(null)
    setCurrentEditIndex(null)
    setForm(DEFAULT_FORM)
    setSelectedPatient(null)
    setPatientSearchKeyword('')
    setPatientResults(patients.slice(0, 5))
    setShowPatientSearchResults(false)
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
    onExit()
  }

  function handleOpenPOSForAppointment(item) {
    if (!isClinicBusiness || !onOpenTool || !item?.id || !item?.patient_id) return

    onOpenTool('pos', 'POS', {
      source: 'appointment',
      businessType: 'clinic',
      customerId: item.patient_id,
      appointmentId: item.id,
      customerName: item.patient_name || item.patient?.name || '',
      returnTo: 'appointment',
      selectedId: item.id,
      selectedCalendarDate,
      viewMode,
    })
  }

  async function handleOpenSalePreview(item) {
    const saleId = item?.sales_id
    if (!saleId || !token) return

    setShowSalePreview(true)
    setSalePreviewLoading(true)
    setSalePreviewError('')

    try {
      const result = await getSaleById(token, saleId)
      let companyInfo = { name: auth.companyName || '', address: '', phone: '' }
      try {
        const companyResult = await getCurrentCompany(token)
        if (companyResult?.data) {
          companyInfo = {
            name: companyResult.data.nama || companyResult.data.name || auth.companyName || '',
            address: companyResult.data.address || '',
            phone: companyResult.data.telp || companyResult.data.phone || '',
          }
        }
      } catch {
        // Keep default company info when company profile fetch fails.
      }

      setSalePreviewData({
        ...(result?.data || {}),
        company_name: result?.data?.company_name || companyInfo.name,
        company_address: result?.data?.company_address || companyInfo.address,
        company_phone: result?.data?.company_phone || companyInfo.phone,
      })
    } catch (err) {
      setSalePreviewData(null)
      setSalePreviewError(err.message || 'Gagal memuat detail nota')
    } finally {
      setSalePreviewLoading(false)
    }
  }

  function handleCloseSalePreview() {
    setShowSalePreview(false)
    setSalePreviewData(null)
    setSalePreviewError('')
    setSalePreviewLoading(false)
  }

  function handlePrintSalePreview() {
    if (!salePreviewData) return

    const settings = receiptPreviewSettings
    const selectedFont = RECEIPT_FONTS.find((font) => font.value === settings.receipt_font) || RECEIPT_FONTS[0]
    const hasLocalFont = selectedFont.filename && selectedFont.filename !== ''
    const googleFontUrl = selectedFont.googleFont
      ? `https://fonts.googleapis.com/css2?family=${selectedFont.googleFont}&display=swap`
      : ''
    const fontSrc = hasLocalFont ? `${window.location.origin}/assets/${selectedFont.filename}` : ''
    const isDotMatrix = settings.printer_type === 'dot_matrix'
    const paperSizeMm = settings.paper_size === '80mm' ? 80 : 58
    const contentWidthMm = paperSizeMm === 80 ? 76 : 56
    const paperClass = getReceiptPaperClass(settings.paper_size)
    const printerClass = isDotMatrix ? 'printer-dot-matrix' : 'printer-thermal'
    const fontFamily = isDotMatrix ? "'Courier New', monospace" : `'${selectedFont.label}', Arial, sans-serif`
    const borderStyle = isDotMatrix ? '1px dotted #94a3b8' : '1px solid #e2e8f0'
    const lineBorder = isDotMatrix ? '1px dotted #cbd5e1' : '1px dashed #cbd5e1'

    const receiptResult = renderReceiptContent(salePreviewData, settings, {
      escapeHtml: (value) => String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;'),
      formatCurrency,
      formatDateTime,
    })

    const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Nota ${salePreviewData.sale_number || ''}</title>${googleFontUrl ? `<link rel="stylesheet" href="${googleFontUrl}">` : ''}${hasLocalFont && !googleFontUrl ? `<style>@font-face { font-family: '${selectedFont.label}'; src: url('${fontSrc}') format('truetype'); }</style>` : ''}<style>@page { size: ${paperSizeMm}mm auto; margin: 0; } * { box-sizing: border-box; } html, body { margin: 0; padding: 0; width: ${paperSizeMm}mm; min-width: ${paperSizeMm}mm; font-family: ${fontFamily}; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; } body { background: #fff; font-size: ${paperSizeMm === 80 ? '12px' : '11px'}; line-height: 1.35; } .receipt-wrap { margin: 0 auto; width: ${contentWidthMm}mm; max-width: ${contentWidthMm}mm; background: white; border: ${borderStyle}; padding: 2mm; overflow: hidden; } .receipt-wrap.printer-dot-matrix { border-color: #6b7280; font-family: 'Courier New', 'Consolas', monospace; letter-spacing: .01em; } .receipt-wrap.printer-dot-matrix .receipt-logo { display: none; } .receipt-wrap.printer-dot-matrix .receipt-header-wrap, .receipt-wrap.printer-dot-matrix .line-items-wrap, .receipt-wrap.printer-dot-matrix .payments-block, .receipt-wrap.printer-dot-matrix .footer, .receipt-wrap.printer-dot-matrix .calibration-block { border-color: #6b7280; border-style: dotted; } .receipt-wrap.paper-58 { font-size: 11px; } .receipt-wrap.paper-80 { font-size: 12px; } .receipt-logo { width: 24px; height: 24px; border-radius: 50%; background: #0ea5e9; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-weight: 700; font-size: 10px; } h1 { margin: 0 0 8px; text-align: center; font-size: 16px; letter-spacing: 0.08em; } .subtitle { text-align: center; margin-bottom: 8px; font-weight: 700; } .receipt-header-wrap { border-bottom: ${lineBorder}; margin-bottom: 8px; padding-bottom: 8px; } .receipt-header-wrap.brand { padding: 8px 0; margin-bottom: 10px; } .meta-row { margin: 2px 0; } .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; } table { width: 100%; border-collapse: collapse; margin-bottom: 8px; } th, td { border-bottom: ${lineBorder}; padding: 4px 2px; } th { text-align: left; } .line-items-wrap { border-bottom: ${lineBorder}; padding: 6px 0; margin: 8px 0; } .line-item { margin-bottom: 6px; } .line-title { font-weight: 700; white-space: normal; overflow-wrap: anywhere; word-break: break-word; } .line-detail { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; } .line-detail span { flex: 1; min-width: 0; } .line-detail strong { flex-shrink: 0; text-align: right; padding-left: 8px; } .summary { margin-top: 8px; } .summary div { display: flex; justify-content: space-between; margin: 2px 0; } .summary .total { padding-top: 4px; margin-top: 4px; font-weight: 700; } .payments-block { margin-top: 8px; border-top: ${lineBorder}; padding-top: 6px; } .pay-row { display: flex; justify-content: space-between; margin: 2px 0; } .footer { margin-top: 8px; text-align: center; border-top: ${lineBorder}; padding-top: 6px; color: #334155; } ${receiptResult.isCustom ? receiptResult.customCss : ''} @media print { html, body { width: ${paperSizeMm}mm; min-width: ${paperSizeMm}mm; background: white; } .receipt-wrap { border: none; width: ${contentWidthMm}mm; max-width: ${contentWidthMm}mm; margin: 0 auto; padding: 2mm 0; } }</style></head><body><div class="receipt-wrap ${paperClass} ${printerClass}">${receiptResult.bodyHtml}</div><script>window.onload = () => { window.print(); setTimeout(() => window.close(), 200); };</script></body></html>`

    const printWindow = window.open('', '_blank', 'width=800,height=900')
    if (!printWindow) {
      setToastType('error')
      setToastMessage('Popup cetak diblokir browser')
      setShowToast(true)
      return
    }

    printWindow.document.write(html)
    printWindow.document.close()
  }

  function canShowPayAction() {
    return Boolean(isClinicBusiness)
  }

  const calendarCells = buildCalendarCells(calendarMonth)
  const appointmentsByDate = calendarData.reduce((accumulator, item) => {
    const key = formatDate(item.booking_date)
    if (!accumulator[key]) accumulator[key] = []
    accumulator[key].push(item)
    return accumulator
  }, {})
  const selectedCalendarItems = sortAppointments(appointmentsByDate[selectedCalendarDate] || [])
  const selectedPatientNoRm = selectedPatient?.no_rm || ''
  const formFields = (
    <>
      <div className="master-form-group appointment-patient-search-group">
        <label className="master-form-label">Pencarian Pasien :</label>
        <div className="appointment-inline-input-shell appointment-patient-search-shell">
          <input
            type="text"
            value={patientSearchKeyword}
            onChange={(e) => handlePatientSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handlePatientSearch()
              }
            }}
            placeholder="Cari Nama / No RM / NIK / HP"
            className="master-form-input appointment-inline-input"
          />
          <div className="appointment-inline-tooltip-wrap appointment-inline-patient-filter-wrap">
            <button
              type="button"
              className="appointment-inline-embedded-btn appointment-inline-patient-filter-btn"
              onClick={handlePatientSearch}
              aria-label="Filter pasien"
            >
              <span className="material-icons-round">filter_alt</span>
            </button>
            <span className="appointment-inline-tooltip" role="tooltip">Filter pasien</span>
          </div>
          <div className="appointment-inline-tooltip-wrap appointment-inline-patient-add-wrap">
            <button
              type="button"
              className="appointment-inline-embedded-btn appointment-inline-patient-add-btn"
              onClick={handleOpenPatientCreate}
              aria-label="Tambah pasien"
            >
              <span className="material-icons-round">person_add</span>
            </button>
            <span className="appointment-inline-tooltip" role="tooltip">Tambah pasien</span>
          </div>
          {showPatientSearchResults && (
            <div className="appointment-inline-patient-dropdown">
              {isPatientLoading ? (
                <div className="appointment-inline-patient-empty">Mencari data pasien...</div>
              ) : (
                patientResults.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    className="appointment-inline-patient-option"
                    onClick={() => handleSelectPatient(patient)}
                  >
                    {`${patient.no_rm || '-'} - ${patient.name}`}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <div className="master-form-group">
        <label className="master-form-label">No RM :</label>
        <div className="appointment-inline-input-shell appointment-inline-readonly-shell">
          <input
            type="text"
            value={selectedPatientNoRm}
            readOnly
            placeholder="Belum pilih pasien"
            className="master-form-input appointment-inline-input appointment-inline-readonly-input"
            title={selectedPatientNoRm || 'Belum pilih pasien'}
          />
          <div className="appointment-inline-tooltip-wrap appointment-inline-patient-edit-wrap">
            <button
              type="button"
              className="appointment-inline-embedded-btn appointment-inline-patient-edit-btn"
              onClick={handleOpenPatientDetail}
              disabled={!selectedPatient}
              aria-label="Edit data pasien"
            >
              <span className="material-icons-round">open_in_new</span>
            </button>
            <span className="appointment-inline-tooltip" role="tooltip">Edit data pasien</span>
          </div>
        </div>
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
        <label className="master-form-label">Jam :</label>
        <div className="appointment-time-range-row">
          <input
            type="time"
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            className="master-form-input"
          />
          <span className="appointment-time-range-separator">-</span>
          <input
            type="time"
            value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            className="master-form-input"
          />
        </div>
      </div>
      <div className="master-form-group appointment-notes-group">
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
          <div key={item.value} className="appointment-arrow-step-wrap">
            <button
              type="button"
              className={`appointment-arrow-step ${isActive ? 'is-active' : 'is-inactive'} ${item.tone === 'cancelled' ? 'appointment-arrow-step-cancelled' : ''}`}
              onClick={() => setForm({ ...form, status: item.value })}
              aria-pressed={isActive}
            >
              {item.label}
            </button>
            <span className="appointment-arrow-tooltip" role="tooltip">{item.tooltip}</span>
          </div>
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
        <div className="master-form-grid appointment-form-grid">
          {formFields}
          {formActions}
        </div>
      </div>
    )
  ) : null

  const patientModalSection = showPatientModal ? (
    <div className="appointment-nested-patient-overlay">
      <div className="appointment-nested-patient-card master-form-card">
        <div className="master-form-header">
          <span className="material-icons-round master-form-icon">groups</span>
          <h2 className="master-form-title">{patientModalMode === 'create' ? 'Isi Data Pasien' : 'Ubah Data Pasien'}</h2>
        </div>

        {patientModalError && <div className="master-error">{patientModalError}</div>}

        <div className="master-form-grid appointment-patient-modal-grid">
          <div className="master-form-group">
            <label className="master-form-label">Nama :</label>
            <input type="text" value={patientModalForm.name} onChange={(e) => setPatientModalForm({ ...patientModalForm, name: e.target.value })} className="master-form-input" />
          </div>
          <div className="master-form-group">
            <label className="master-form-label">NO RM :</label>
            <input type="text" value={patientModalForm.no_rm} onChange={(e) => setPatientModalForm({ ...patientModalForm, no_rm: e.target.value })} className="master-form-input" />
          </div>
          <div className="master-form-group">
            <label className="master-form-label">KTP :</label>
            <input type="text" value={patientModalForm.no_nik} onChange={(e) => setPatientModalForm({ ...patientModalForm, no_nik: e.target.value })} className="master-form-input" maxLength={16} />
          </div>
          <div className="master-form-group">
            <label className="master-form-label">Email :</label>
            <input type="email" value={patientModalForm.email} onChange={(e) => setPatientModalForm({ ...patientModalForm, email: e.target.value })} className="master-form-input" />
          </div>
          <div className="master-form-group">
            <label className="master-form-label">Telepon :</label>
            <input type="text" value={patientModalForm.phone} onChange={(e) => setPatientModalForm({ ...patientModalForm, phone: e.target.value })} className="master-form-input" />
          </div>
          <div className="master-form-group">
            <label className="master-form-label">Kota :</label>
            <input type="text" value={patientModalForm.city} onChange={(e) => setPatientModalForm({ ...patientModalForm, city: e.target.value })} className="master-form-input" />
          </div>
          <div className="master-form-group-wide">
            <label className="master-form-label">Alamat :</label>
            <input type="text" value={patientModalForm.address} onChange={(e) => setPatientModalForm({ ...patientModalForm, address: e.target.value })} className="master-form-input" />
          </div>
          <div className="master-form-group-wide">
            <label className="master-form-label">Alergi :</label>
            <textarea value={patientModalForm.allergies} onChange={(e) => setPatientModalForm({ ...patientModalForm, allergies: e.target.value })} className="master-form-input appointment-patient-modal-textarea" rows={3} />
          </div>
          <FooterFormMaster
            onSave={handleSavePatientModal}
            onClose={handleClosePatientModal}
            isSaving={patientModalSaving}
            onNext={null}
            onPrev={null}
            canNext={false}
            canPrev={false}
          />
        </div>
      </div>
    </div>
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
        {/*    <label htmlFor="appointment-date-filter" className="master-filter-label">Date1</label> */}
            <div className="appointment-date-filter-control"><label htmlFor="appointment-date-filter" className="master-filter-label">Date </label> 
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
                <span className="appointment-disabled-tooltip"  role="tooltip">
                  Date mengikuti bulan kalender
                </span>
              )} 
            </div>
         
           {/*  {viewMode === 'calendar' && (
              <span id="appointment-calendar-date-note" className="appointment-filter-helper-text">
                Date mengikuti bulan kalender
              </span>
            )} */}
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

      {error && (
        <div className="master-error">
          <span>{error}</span>
          <button
            type="button"
            className="master-error-retry"
            onClick={() => {
              setError('')
              fetchData()
            }}
          >
            <span className="material-icons-round">refresh</span>
            Coba Lagi
          </button>
        </div>
      )}

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
              ) : error ? (
                <div className="appointment-calendar-empty-state">Gagal memuat data, klik tombol "Coba Lagi" di atas</div>
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
                      {(() => {
                        const statusMeta = getAppointmentStatusMeta(item.status)
                        const invoiceMeta = getInvoiceStatusMeta(item)
                        const payActionMeta = getPayActionMeta(item)
                        const canShowPrintAction = invoiceMeta.label === 'DONE' && item?.sales_id
                        return (
                      <div className="appointment-calendar-detail-main">
                        <div>
                          <div className="appointment-calendar-detail-time">{formatTime(item.start_time)} - {formatTime(item.end_time)}</div>
                          <div className="appointment-calendar-detail-patient">{item.patient_name || '-'}</div>
                          <div className="appointment-calendar-detail-meta">{item.treatment_name || '-'} • {item.therapist_name || '-'}</div>
                          <div className="appointment-calendar-detail-meta appointment-calendar-invoice-line">
                            <span>Invoice:</span>
                            <span className={`appointment-invoice-pill is-${invoiceMeta.variant}`}>
                              <span className="material-icons-round appointment-invoice-pill-icon">{invoiceMeta.icon}</span>
                              {invoiceMeta.label}
                            </span>
                            {invoiceMeta.noteNumber && (
                              <span className="appointment-invoice-note ">{invoiceMeta.noteNumber}</span>
                            )}
                          </div>
                        </div>
                        <div className="appointment-calendar-detail-actions">
                          <div className="purchase-status-stack">
                            <span className={`purchase-status-pill is-${statusMeta.variant}`}>
                              <span className="material-icons-round purchase-status-icon">{statusMeta.icon}</span>
                              {statusMeta.label}
                            </span>
                          </div>
                          {canShowPayAction(item) && (
                            <div className="appointment-action-icon-row">
                              <button
                                type="button"
                                className="appointment-pay-icon-btn"
                                title={payActionMeta.tooltip}
                                aria-label={payActionMeta.tooltip}
                                disabled={payActionMeta.disabled}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  if (payActionMeta.disabled) return
                                  handleOpenPOSForAppointment(item)
                                }}
                              >
                                <span className="material-icons-round">payments</span>
                              </button>
                              {canShowPrintAction && (
                                <button
                                  type="button"
                                  className="appointment-pay-icon-btn appointment-print-icon-btn"
                                  title="Preview Nota"
                                  aria-label="Preview Nota"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    handleOpenSalePreview(item)
                                  }}
                                >
                                  <span className="material-icons-round">receipt_long</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                        )
                      })()}
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
                      {(() => {
                        const statusMeta = getAppointmentStatusMeta(row.status)
                        return (
                          <div className="purchase-status-stack">
                            <span className={`purchase-status-pill is-${statusMeta.variant}`}>
                              <span className="material-icons-round purchase-status-icon">{statusMeta.icon}</span>
                              {statusMeta.label}
                            </span>
                          </div>
                        )
                      })()}
                    </td>
                    <td>
                      {(() => {
                        const invoiceMeta = getInvoiceStatusMeta(row)
                        return (
                          <div className="purchase-status-stack">
                            <span className={`appointment-invoice-pill is-${invoiceMeta.variant}`}>
                              <span className="material-icons-round appointment-invoice-pill-icon">{invoiceMeta.icon}</span>
                              {invoiceMeta.label}
                            </span>
                         {/*   {invoiceMeta.noteNumber && (
                              <span className="appointment-invoice-note">No Nota: {invoiceMeta.noteNumber}</span>
                            )}   */}
                           </div>
                        )
                      })()}
                    </td>
                  </tr>
                ))}
                {!isLoading && !error && sortedData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center">No data</td>
                  </tr>
                )}
                {!isLoading && error && sortedData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center">
                      <span className="text-muted">Gagal memuat data, klik tombol "Coba Lagi" di atas</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formSection}

      {patientModalSection}

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

      {showSalePreview && (
        <div className="delete-master-overlay" onClick={handleCloseSalePreview}>
          <div className="appointment-receipt-preview-modal" onClick={(event) => event.stopPropagation()}>
            <div className="delete-master-header">
              <span className="material-icons-round material-icon orange">receipt_long</span>
              <h2>Preview Nota</h2>
            </div>
            <div className="appointment-receipt-preview-body">
              {salePreviewLoading && (
                <div className="appointment-calendar-empty-state">Loading preview nota...</div>
              )}
              {!salePreviewLoading && salePreviewError && (
                <div className="appointment-calendar-empty-state">{salePreviewError}</div>
              )}
              {!salePreviewLoading && !salePreviewError && salePreviewData && (
                <div className="appointment-receipt-preview-wrap">
                  <ReceiptPreview
                    sale={salePreviewData}
                    settings={receiptPreviewSettings}
                    formatCurrency={formatCurrency}
                    formatDateTime={formatDateTime}
                  />
                </div>
              )}
            </div>
            <div className="delete-master-footer">
              <button
                type="button"
                className="master-btn-save-primary"
                onClick={handlePrintSalePreview}
                disabled={salePreviewLoading || !salePreviewData}
              >
                <span className="material-icons-round">print</span>
                Cetak
              </button>
              <button
                type="button"
                className="master-btn-cancel-secondary"
                onClick={handleCloseSalePreview}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && <Toast message={toastMessage} type={toastType} isOpen={showToast} onClose={() => setShowToast(false)} />}
    </div>
  )
}
