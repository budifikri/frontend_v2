import { useCallback, useEffect, useState, useRef } from 'react'
import { useAuth } from '../../../shared/auth'
import { useModule } from '../../../shared/useModule'
import { createCustomer, deleteCustomer, listCustomers, updateCustomer } from '../../../features/master/customer/customer.api'
import { listAppointments } from '../../../features/transaksi/appointment/appointment.api'
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
      { key: 'history', label: 'HISTORY', sortable: false },
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

const DUMMY_APPOINTMENTS_BY_PATIENT = {
  CUS001: [
    {
      id: 'APT001',
      patient_id: 'CUS001',
      patient_name: 'Andi Wijaya',
      treatment_name: 'Facial',
      therapist_name: 'Dr. Ani',
      booking_date: '2026-05-05',
      start_time: '10:00',
      end_time: '11:00',
      status: 'completed',
      notes: 'Kontrol rutin',
    },
    {
      id: 'APT002',
      patient_id: 'CUS001',
      patient_name: 'Andi Wijaya',
      treatment_name: 'Massage',
      therapist_name: 'Dr. Budi',
      booking_date: '2026-05-03',
      start_time: '14:00',
      end_time: '15:00',
      status: 'scheduled',
      notes: '',
    },
  ],
  CUS002: [
    {
      id: 'APT003',
      patient_id: 'CUS002',
      patient_name: 'Budi Santoso',
      treatment_name: 'Consultation',
      therapist_name: 'Dr. Sari',
      booking_date: '2026-04-28',
      start_time: '09:00',
      end_time: '09:30',
      status: 'confirmed',
      notes: 'Evaluasi lanjutan',
    },
  ],
  CUS003: [],
}

const HISTORY_PAGE_SIZE = 5

function isActiveCustomer(item) {
  if (typeof item?.is_active === 'boolean') return item.is_active
  return String(item?.status ?? 'active').toLowerCase() !== 'inactive'
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatTime(time) {
  if (!time) return ''
  const str = String(time)
  if (str.includes('T')) return str.slice(11, 16)
  return str.slice(0, 5)
}

function getDateRange(filterType) {
  if (filterType === 'all') return { date_from: '', date_to: '' }

  const now = new Date()
  const formatDateISO = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  if (filterType === 'today') {
    const today = formatDateISO(now)
    return { date_from: today, date_to: today }
  }

  if (filterType === 'this_year') {
    return {
      date_from: formatDateISO(new Date(now.getFullYear(), 0, 1)),
      date_to: formatDateISO(new Date(now.getFullYear(), 11, 31)),
    }
  }

  return {
    date_from: formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1)),
    date_to: formatDateISO(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  }
}

function getAppointmentStatusMeta(status) {
  const value = String(status || '').toLowerCase()
  if (value === 'confirmed') return { label: 'Confirmed', variant: 'approve', icon: 'check_circle' }
  if (value === 'completed') return { label: 'Completed', variant: 'receive', icon: 'task_alt' }
  if (value === 'cancelled') return { label: 'Cancelled', variant: 'void', icon: 'cancel' }
  return { label: 'Scheduled', variant: 'pending', icon: 'schedule' }
}

function normalizeAppointment(item = {}) {
  return {
    ...item,
    treatment_name: item.treatment_name || item.treatment?.name || '-',
    therapist_name: item.therapist_name || item.therapist?.nama || '-',
    booking_date: String(item.booking_date || '').slice(0, 10),
    start_time: formatTime(item.start_time),
    end_time: formatTime(item.end_time),
  }
}

function matchAppointmentKeyword(item, keyword) {
  const normalizedKeyword = String(keyword || '').trim().toLowerCase()
  if (!normalizedKeyword) return true

  return [item.treatment_name, item.therapist_name, item.notes]
    .some((value) => String(value || '').toLowerCase().includes(normalizedKeyword))
}

export function Customer({ onExit, toolContext = null }) {
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
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyPatient, setHistoryPatient] = useState(null)
  const [historyData, setHistoryData] = useState([])
  const [historyPagination, setHistoryPagination] = useState({ total: 0, has_more: false })
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyFilter, setHistoryFilter] = useState({
    dateRange: 'this_month',
    status: '',
    keyword: '',
  })
  const tableRef = useRef(null)

  const enrichCustomersWithAppointmentCount = useCallback(async (items) => {
    if (!isClinic) return items

    if (!token) {
      return items.map((item) => ({
        ...item,
        appointment_count: (DUMMY_APPOINTMENTS_BY_PATIENT[item.id] || []).length,
      }))
    }

    const counts = await Promise.all(items.map(async (item) => {
      try {
        const result = await listAppointments(token, {
          patient_id: item.id,
          limit: 1,
          offset: 0,
        })

        return [item.id, Number(result.pagination?.total ?? 0)]
      } catch {
        return [item.id, 0]
      }
    }))

    const countMap = new Map(counts)
    return items.map((item) => ({
      ...item,
      appointment_count: countMap.get(item.id) ?? 0,
    }))
  }, [isClinic, token])

  const fetchHistoryData = useCallback(async (patient, filter = historyFilter) => {
    if (!patient?.id) return

    setHistoryLoading(true)
    setHistoryError('')

    if (!token) {
      const { date_from, date_to } = getDateRange(filter.dateRange)
      const filtered = (DUMMY_APPOINTMENTS_BY_PATIENT[patient.id] || [])
        .map((item) => normalizeAppointment(item))
        .filter((item) => {
          if (filter.status && item.status !== filter.status) return false
          if (date_from && item.booking_date < date_from) return false
          if (date_to && item.booking_date > date_to) return false
          return matchAppointmentKeyword(item, filter.keyword)
        })

      setHistoryData(filtered)
      setHistoryPagination({ total: filtered.length, has_more: false })
      setHistoryPage(1)
      setHistoryLoading(false)
      return
    }

    try {
      const { date_from, date_to } = getDateRange(filter.dateRange)
      const result = await listAppointments(token, {
        patient_id: patient.id,
        date_from: date_from || undefined,
        date_to: date_to || undefined,
        status: filter.status || undefined,
        limit: 100,
        offset: 0,
      })

      const items = (result.items || [])
        .map((item) => normalizeAppointment(item))
        .filter((item) => matchAppointmentKeyword(item, filter.keyword))

      setHistoryData(items)
      setHistoryPagination({
        total: Number(result.pagination?.total ?? items.length),
        has_more: Boolean(result.pagination?.has_more),
      })
      setHistoryPage(1)
    } catch (err) {
      setHistoryError(err.message || 'Failed to load appointment history')
      setHistoryData([])
      setHistoryPagination({ total: 0, has_more: false })
      setHistoryPage(1)
    } finally {
      setHistoryLoading(false)
    }
  }, [historyFilter, token])

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

      const rows = await enrichCustomersWithAppointmentCount(filtered.slice(offset, offset + limit))
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

      const enrichedItems = await enrichCustomersWithAppointmentCount(result.items || [])
      setData(enrichedItems)
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
  }, [token, searchKeyword, tierFilter, isActiveFilter, limit, offset, enrichCustomersWithAppointmentCount])

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
    if (!toolContext) return

    if (toolContext.searchKeyword !== undefined) {
      pager.reset()
      setSearchKeyword(toolContext.searchKeyword)
    }

    if (toolContext.action === 'create') {
      setSelectedId(null)
      setCurrentEditIndex(null)
      setForm(DEFAULT_FORM)
      setIsNewMode(true)
      setShowForm(true)
    }

    if (toolContext.selectedId) {
      setSelectedId(toolContext.selectedId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolContext])

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

  function handleOpenHistory(row) {
    if ((row.appointment_count || 0) === 0) return
    setHistoryPatient(row)
    setHistoryPage(1)
    setHistoryFilter({ dateRange: 'this_month', status: '', keyword: '' })
    setShowHistoryModal(true)
    fetchHistoryData(row, { dateRange: 'this_month', status: '', keyword: '' })
  }

  function handleCloseHistory() {
    setShowHistoryModal(false)
    setHistoryPatient(null)
    setHistoryData([])
    setHistoryError('')
    setHistoryPagination({ total: 0, has_more: false })
    setHistoryPage(1)
  }

  function handleHistoryFilterChange(key, value) {
    const nextFilter = { ...historyFilter, [key]: value }
    setHistoryFilter(nextFilter)
    if (historyPatient?.id) fetchHistoryData(historyPatient, nextFilter)
  }

  const historyTotalPages = Math.max(1, Math.ceil(historyData.length / HISTORY_PAGE_SIZE))
  const safeHistoryPage = Math.min(historyPage, historyTotalPages)
  const historyPageStart = (safeHistoryPage - 1) * HISTORY_PAGE_SIZE
  const pagedHistoryData = historyData.slice(historyPageStart, historyPageStart + HISTORY_PAGE_SIZE)

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
              value={searchKeyword}
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
                  {isClinic && (
                    <td className="patient-history-cell">
                      <button
                        type="button"
                        className={`patient-history-btn ${(row.appointment_count || 0) === 0 ? 'is-empty' : ''}`}
                        disabled={(row.appointment_count || 0) === 0}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenHistory(row)
                        }}
                        title={(row.appointment_count || 0) === 0 ? 'Belum ada appointment' : `Lihat history appointment ${row.name || ''}`}
                      >
                        <span className="material-icons-round patient-history-btn-icon">history</span>
                        <span className="patient-history-btn-count">{row.appointment_count || 0}</span>
                      </button>
                    </td>
                  )}
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
                  <td colSpan={isClinic ? 10 : 8} className="text-center">No data</td>
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

      {showHistoryModal && (
        <div className="delete-master-overlay" onClick={handleCloseHistory}>
          <div className="patient-history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="patient-history-modal-header">
              <div className="patient-history-modal-title-wrap">
                <span className="material-icons-round patient-history-modal-icon">history</span>
                <div>
                  <h2 className="patient-history-modal-title">History Appointment</h2>
                  <p className="patient-history-modal-subtitle">{historyPatient?.name || '-'} • {historyPatient?.no_rm || 'No RM belum ada'}</p>
                </div>
              </div>
              <button type="button" className="patient-history-modal-close" onClick={handleCloseHistory} aria-label="Tutup history appointment">
                <span className="material-icons-round">close</span>
              </button>
            </div>

            <div className="patient-history-modal-filters">
              <div className="master-filter-wrap">
                <label htmlFor="patient-history-date-filter" className="master-filter-label">Tanggal</label>
                <select
                  id="patient-history-date-filter"
                  className="master-filter-select"
                  value={historyFilter.dateRange}
                  onChange={(e) => handleHistoryFilterChange('dateRange', e.target.value)}
                >
                  <option value="today">Hari Ini</option>
                  <option value="this_month">Bulan Ini</option>
                  <option value="this_year">Tahun Ini</option>
                  <option value="all">Semua</option>
                </select>
              </div>
              <div className="master-filter-wrap">
                <label htmlFor="patient-history-status-filter" className="master-filter-label">Status</label>
                <select
                  id="patient-history-status-filter"
                  className="master-filter-select"
                  value={historyFilter.status}
                  onChange={(e) => handleHistoryFilterChange('status', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="master-footer-search patient-history-search-wrap">
                <input
                  type="text"
                  placeholder="Cari treatment / therapist / catatan"
                  className="master-search-input"
                  value={historyFilter.keyword}
                  onChange={(e) => handleHistoryFilterChange('keyword', e.target.value)}
                />
                <button type="button" className="master-search-btn" tabIndex={-1}>
                  <span className="material-icons-round material-icon">search</span>
                </button>
              </div>
            </div>

            {historyError && <div className="master-error patient-history-modal-error">{historyError}</div>}

            <div className="patient-history-modal-body">
              <div className="master-table-container patient-history-table-container">
                <table className="master-table patient-history-table">
                  <thead>
                    <tr>
                      <th>NO</th>
                      <th>TANGGAL</th>
                      <th>WAKTU</th>
                      <th>TREATMENT</th>
                      <th>THERAPIST</th>
                      <th>STATUS</th>
                      <th>CATATAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center">Loading history...</td>
                      </tr>
                    ) : historyData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center">Belum ada appointment untuk pasien ini</td>
                      </tr>
                    ) : pagedHistoryData.map((item, index) => {
                      const statusMeta = getAppointmentStatusMeta(item.status)
                      return (
                        <tr key={item.id || `${item.booking_date}-${index}`} className="master-row">
                          <td>{historyPageStart + index + 1}</td>
                          <td>{formatDate(item.booking_date)}</td>
                          <td>{`${item.start_time || '-'}${item.end_time ? ` - ${item.end_time}` : ''}`}</td>
                          <td>{item.treatment_name || '-'}</td>
                          <td>{item.therapist_name || '-'}</td>
                          <td>
                            <div className="purchase-status-stack">
                              <span className={`purchase-status-pill is-${statusMeta.variant}`}>
                                <span className="material-icons-round purchase-status-icon">{statusMeta.icon}</span>
                                {statusMeta.label}
                              </span>
                            </div>
                          </td>
                          <td>{item.notes || '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="patient-history-modal-footer">
              <div className="patient-history-modal-footer-left">
                <span className="patient-history-modal-total">Total Appointment: {historyPagination.total}</span>
                {historyData.length > 0 && (
                  <span className="patient-history-modal-page-info">Halaman {safeHistoryPage} / {historyTotalPages}</span>
                )}
              </div>
              <div className="patient-history-modal-footer-actions">
                <button
                  type="button"
                  className="patient-history-pagination-btn"
                  onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeHistoryPage <= 1 || historyLoading || historyData.length === 0}
                >
                  <span className="material-icons-round">chevron_left</span>
                  Prev
                </button>
                <button
                  type="button"
                  className="patient-history-pagination-btn"
                  onClick={() => setHistoryPage((prev) => Math.min(historyTotalPages, prev + 1))}
                  disabled={safeHistoryPage >= historyTotalPages || historyLoading || historyData.length === 0}
                >
                  Next
                  <span className="material-icons-round">chevron_right</span>
                </button>
                <button type="button" className="master-btn-cancel-secondary" onClick={handleCloseHistory}>Tutup</button>
              </div>
            </div>
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

      {showToast && <Toast message={toastMessage} type="success" isOpen={showToast} onClose={() => setShowToast(false)} />}
    </div>
  )
}
