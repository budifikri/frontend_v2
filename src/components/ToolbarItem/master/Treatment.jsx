import { useCallback, useEffect, useState, useRef, useMemo } from 'react'
import { useAuth } from '../../../shared/auth'
import { listTreatments, createTreatment, updateTreatment, deleteTreatment, listTreatmentTags, createTreatmentTag, deleteTreatmentTag } from '../../../features/master/treatment/treatment.api'
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

const DEFAULT_FORM = {
  name: '',
  duration: 60,
  price: 0,
  description: '',
  tag_ids: [],
}

const DUMMY_TAGS = [
  { id: 'TAG001', name: 'wajah' },
  { id: 'TAG002', name: 'badan' },
  { id: 'TAG003', name: 'rambut' },
]

const DUMMY_TREATMENTS = [
  {
    id: 'TRT001',
    name: 'Facial',
    duration: 60,
    price: 150000,
    description: 'Perawatan wajah basic',
    is_active: true,
    tags: [{ id: 'TAG001', name: 'wajah' }],
  },
  {
    id: 'TRT002',
    name: 'Massage',
    duration: 90,
    price: 200000,
    description: 'Pijat relaksasi',
    is_active: true,
    tags: [{ id: 'TAG002', name: 'badan' }],
  },
  {
    id: 'TRT003',
    name: 'Refleksi',
    duration: 45,
    price: 120000,
    description: 'Pijat refleksi kaki',
    is_active: false,
    tags: [{ id: 'TAG002', name: 'badan' }],
  },
]

function createDefaultForm() {
  return {
    ...DEFAULT_FORM,
    tag_ids: [...DEFAULT_FORM.tag_ids],
  }
}

function normalizeTag(item, index) {
  return {
    id: item?.id || item?.tag_id || `tag-${index}`,
    name: item?.name || item?.tag_name || '-',
    created_at: item?.created_at || item?.createdAt || '',
  }
}

function normalizeTreatment(item, index) {
  return {
    id: item?.id || `treatment-${index}`,
    name: item?.name || item?.treatment_name || '-',
    duration: Number(item?.duration ?? 60),
    price: Number(item?.price ?? 0),
    description: item?.description || '',
    is_active: item?.is_active ?? (String(item?.status || 'active').toLowerCase() !== 'inactive'),
    status: item?.status || (item?.is_active === false ? 'inactive' : 'active'),
    tags: Array.isArray(item?.tags) ? item.tags.map((tag, tagIndex) => normalizeTag(tag, tagIndex)) : [],
  }
}

function isActiveTreatment(item) {
  if (typeof item?.is_active === 'boolean') return item.is_active
  return String(item?.status ?? 'active').toLowerCase() !== 'inactive'
}

function getTagsString(tags) {
  if (!tags || !Array.isArray(tags)) return '-'
  return tags.map(tag => tag.name).join(', ')
}

function getTableColumns() {
  return [
    { key: 'no', label: 'NO', sortable: false },
    { key: 'name', label: 'NAME' },
    { key: 'duration', label: 'DURASI (min)' },
    { key: 'price', label: 'HARGA' },
    { key: 'tags', label: 'TAGS' },
    { key: 'is_active', label: 'STATUS' },
  ]
}

function getExcelColumns() {
  return [
    { key: 'name', label: 'NAME' },
    { key: 'duration', label: 'DURATION' },
    { key: 'price', label: 'PRICE' },
    { key: 'description', label: 'DESCRIPTION' },
    { key: 'tags', label: 'TAGS' },
  ]
}

export function Treatment({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [tags, setTags] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState('active')
  const pager = useMasterPagination({ initialLimit: 10, total: pagination.total, hasMore: pagination.has_more })
  const { limit, offset } = pager

  const [form, setForm] = useState(() => createDefaultForm())
  const [selectedId, setSelectedId] = useState(null)
  const [currentEditIndex, setCurrentEditIndex] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [isNewMode, setIsNewMode] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [pendingImportData, setPendingImportData] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [togglingId, setTogglingId] = useState(null)
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false)
  const [tagDropdownDirection, setTagDropdownDirection] = useState('down')
  const [tagSearch, setTagSearch] = useState('')
  const tableRef = useRef(null)
  const tagSelectorRef = useRef(null)

  const fetchTags = useCallback(async () => {
    if (!token) {
      setTags(DUMMY_TAGS)
      return
    }

    try {
       const result = await listTreatmentTags(token)
       setTags((result || []).map((item, index) => normalizeTag(item, index)))
    } catch (err) {
      console.error('[Treatment] Failed to load tags:', err)
      setTags(DUMMY_TAGS)
    }
  }, [token])

  const fetchData = useCallback(async () => {
    setError('')
    setIsLoading(true)

    if (!token) {
      const keyword = searchKeyword.trim().toLowerCase()
      const filtered = DUMMY_TREATMENTS.filter((item) => {
        const active = isActiveTreatment(item)
        if (isActiveFilter === 'active' && !active) return false
        if (isActiveFilter === 'inactive' && active) return false
        if (!keyword) return true

        return (
          String(item.name || '').toLowerCase().includes(keyword) ||
          String(item.description || '').toLowerCase().includes(keyword)
        )
      })

      setData(filtered.slice(offset, offset + limit))
      setPagination({
        total: filtered.length,
        has_more: offset + limit < filtered.length,
      })
      setIsLoading(false)
      return
    }

    try {
      const result = await listTreatments(token, {
        search: searchKeyword.trim() || undefined,
        is_active: isActiveFilter === 'all' ? undefined : isActiveFilter === 'active',
        include_inactive: isActiveFilter === 'all' ? true : undefined,
        limit,
        offset,
      })

       setData((result.items || []).map((item, index) => normalizeTreatment(item, index)))
      const nextPagination = result.pagination || {}
      setPagination({
        total: Number(nextPagination.total ?? 0),
        has_more: Boolean(nextPagination.has_more),
      })
    } catch (err) {
      setError(err.message || 'Failed to load treatments')
      setData([])
      setPagination({ total: 0, has_more: false })
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, isActiveFilter, limit, offset])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const selectedItem = selectedId == null ? null : data.find((row) => row.id === selectedId) || null
  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'name',
    valueGetters: {
      price: (row) => Number(row?.price || 0),
      duration: (row) => Number(row?.duration || 0),
      is_active: (row) => (isActiveTreatment(row) ? 1 : 0),
    },
  })

  useMasterTableKeyboardNav({
    data: sortedData,
    selectedId,
    setSelectedId,
    handleEdit,
    tableRef,
    isModalOpen: showForm || showDeleteConfirm || showImportConfirm,
  })

  const tagsById = useMemo(() => {
    const map = new Map()
    tags.forEach((item) => {
      if (item?.id) map.set(String(item.id), item.name || '-')
    })
    return map
  }, [tags])

  const selectedTags = useMemo(() => {
    const selectedTagIds = form.tag_ids || []
    return selectedTagIds.map((id) => ({
      id,
      name: tagsById.get(String(id)) || '-',
    }))
  }, [form.tag_ids, tagsById])

  const visibleSelectedTags = selectedTags.slice(0, 2)
  const hiddenSelectedTagCount = Math.max(0, selectedTags.length - visibleSelectedTags.length)

  const filteredTags = useMemo(() => {
    const keyword = tagSearch.trim().toLowerCase()
    if (!keyword) return tags
    return tags.filter((tag) => String(tag?.name || '').toLowerCase().includes(keyword))
  }, [tagSearch, tags])

  useEffect(() => {
    if (!isTagDropdownOpen) return undefined

    const handleClickOutside = (event) => {
      if (!tagSelectorRef.current?.contains(event.target)) {
        setIsTagDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isTagDropdownOpen])

  useEffect(() => {
    if (!isTagDropdownOpen) return undefined

    const updateDropdownDirection = () => {
      const triggerBounds = tagSelectorRef.current?.getBoundingClientRect()
      if (!triggerBounds) return

      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
      const estimatedDropdownHeight = 320
      const spaceBelow = viewportHeight - triggerBounds.bottom
      const spaceAbove = triggerBounds.top

      if (spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow) {
        setTagDropdownDirection('up')
        return
      }

      setTagDropdownDirection('down')
    }

    updateDropdownDirection()
    window.addEventListener('resize', updateDropdownDirection)
    window.addEventListener('scroll', updateDropdownDirection, true)

    return () => {
      window.removeEventListener('resize', updateDropdownDirection)
      window.removeEventListener('scroll', updateDropdownDirection, true)
    }
  }, [isTagDropdownOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showDeleteConfirm) {
        if (e.key === 'Escape') {
          e.preventDefault()
          if (showDeleteConfirm) setShowDeleteConfirm(false)
        }
        return
      }

      if (showForm) {
        if (isTagDropdownOpen) {
          if (e.key === 'Escape') {
            e.preventDefault()
            setIsTagDropdownOpen(false)
            return
          }

          if (e.key === 'Backspace' && !tagSearch) {
            const lastTagId = form.tag_ids?.[form.tag_ids.length - 1]
            if (lastTagId) {
              e.preventDefault()
              handleToggleTag(lastTagId)
            }
          }
          return
        }

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
  }, [showDeleteConfirm, showForm, selectedId, data, handlePrevRecord, handleNextRecord, isTagDropdownOpen, tagSearch, form.tag_ids])

  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0)
  }, [])

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

  async function handleSave() {
    if (!form.name) return

    setIsSaving(true)
    setError('')

    const payload = {
      name: form.name,
      duration: Number(form.duration || 60),
      price: Number(form.price || 0),
      description: form.description || undefined,
      tag_ids: form.tag_ids || [],
    }

    try {
      if (token) {
        if (isNewMode) {
          await createTreatment(token, payload)
          await fetchData()
        } else {
          await updateTreatment(token, selectedItem.id, payload)
          await fetchData()
        }
      } else {
        const nextTags = (payload.tag_ids || []).map((id) => ({
          id,
          name: tagsById.get(String(id)) || '',
        }))

        if (isNewMode) {
          const newItem = {
            id: `TRT${Date.now()}`,
            ...payload,
            is_active: true,
            tags: nextTags,
          }
          setData((prev) => [newItem, ...prev])
        } else {
          setData((prev) => prev.map((row) => (
            row.id === selectedItem.id ? { ...row, ...payload, tags: nextTags } : row
          )))
        }
      }

      setToastMessage('Data tersimpan')
      setShowToast(true)
    } catch (err) {
      setError(err.message || 'Failed to save treatment')
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
    setForm(createDefaultForm())
    setIsNewMode(true)
    setIsTagDropdownOpen(false)
    setTagSearch('')
    setShowForm(true)
  }

  function handleEdit() {
    const target = selectedItem || sortedData[0]
    if (!target) return
    const idx = sortedData.findIndex((item) => item.id === target.id)
    setSelectedId(target.id)
    setCurrentEditIndex(idx)
    setForm({
      name: target.name || '',
      duration: Number(target.duration || 60),
      price: Number(target.price || 0),
      description: target.description || '',
      tag_ids: target.tags ? target.tags.map(tag => tag.id) : [],
    })
    setIsNewMode(false)
    setIsTagDropdownOpen(false)
    setTagSearch('')
    setShowForm(true)
  }

  function handleNextRecord() {
    if (currentEditIndex === null || currentEditIndex >= sortedData.length - 1) return
    const nextItem = sortedData[currentEditIndex + 1]
    if (!nextItem) return
    setSelectedId(nextItem.id)
    setCurrentEditIndex(currentEditIndex + 1)
    setForm({
      name: nextItem.name || '',
      duration: Number(nextItem.duration || 60),
      price: Number(nextItem.price || 0),
      description: nextItem.description || '',
      tag_ids: nextItem.tags ? nextItem.tags.map(tag => tag.id) : [],
    })
  }

  function handlePrevRecord() {
    if (currentEditIndex === null || currentEditIndex <= 0) return
    const prevItem = sortedData[currentEditIndex - 1]
    if (!prevItem) return
    setSelectedId(prevItem.id)
    setCurrentEditIndex(currentEditIndex - 1)
    setForm({
      name: prevItem.name || '',
      duration: Number(prevItem.duration || 60),
      price: Number(prevItem.price || 0),
      description: prevItem.description || '',
      tag_ids: prevItem.tags ? prevItem.tags.map(tag => tag.id) : [],
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
        await deleteTreatment(token, selectedItem.id)
        await fetchData()
      } else {
        setData((prev) => prev.filter((row) => row.id !== selectedItem.id))
      }
    } catch (err) {
      setError(err.message || 'Failed to delete treatment')
    } finally {
      setShowDeleteConfirm(false)
      setShowForm(false)
      setSelectedId(null)
      setForm(createDefaultForm())
    }
  }

  async function handleToggleStatus(row) {
    if (!row?.id || togglingId) return

    const nextIsActive = !isActiveTreatment(row)
    if (token) {
      setTogglingId(row.id)
      try {
        await updateTreatment(token, row.id, { is_active: nextIsActive })
        await fetchData()
      } catch (err) {
        setError(err.message || 'Failed to update status')
      } finally {
        setTogglingId(null)
      }
      return
    }

    setData((prev) => prev.map((item) => (item.id === row.id ? { ...item, is_active: nextIsActive } : item)))
  }

  function handleCloseForm() {
    setShowForm(false)
    setSelectedId(null)
    setCurrentEditIndex(null)
    setForm(createDefaultForm())
    setIsNewMode(false)
    setIsTagDropdownOpen(false)
    setTagSearch('')
  }

  async function handleCreateTagFromSearch() {
    const name = tagSearch.trim()
    if (!name) return

    const existingTag = tags.find((tag) => String(tag?.name || '').toLowerCase() === name.toLowerCase())
    if (existingTag) {
      const alreadySelected = (form.tag_ids || []).includes(existingTag.id)
      if (!alreadySelected) {
        handleToggleTag(existingTag.id)
      }
      setTagSearch('')
      return
    }

    try {
      let createdTag = null

      if (token) {
        const result = await createTreatmentTag(token, name)
        createdTag = normalizeTag(result?.data || result, tags.length)
      } else {
        createdTag = normalizeTag({ id: `TAG${Date.now()}`, name }, tags.length)
      }

      setTags((prev) => [...prev, createdTag])
      setForm((prev) => ({
        ...prev,
        tag_ids: [...(prev.tag_ids || []), createdTag.id],
      }))
      setTagSearch('')
      setToastMessage(`Tag "${createdTag.name}" ditambahkan`)
      setShowToast(true)
    } catch (err) {
      setError(err.message || 'Failed to create treatment tag')
    }
  }

  function handlePrint() {
    setShowForm(false)
    const printColumns = [
      { key: 'no', label: 'NO', align: 'text-center', formatter: (_, __, index) => index + 1 },
      { key: 'name', label: 'NAMA TREATMENT' },
      { key: 'duration', label: 'DURASI (min)', align: 'text-right' },
      { key: 'price', label: 'HARGA', align: 'text-right', formatter: (v) => formatCurrency(v) },
      { key: 'tags', label: 'TAGS', formatter: (v) => getTagsString(v) },
      { key: 'is_active', label: 'STATUS', align: 'text-center', formatter: (v) => v ? 'Aktif' : 'Non-Aktif' },
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
          title: 'Daftar Master Treatment',
          company: companyInfo,
          meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
          columns: printColumns,
          data: printData,
          footerTextOverride: `Laporan Treatment dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
        })
      }).catch(() => {
        openReportPrintWindow({
          title: 'Daftar Master Treatment',
          company: companyInfo,
          meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
          columns: printColumns,
          data: printData,
          footerTextOverride: `Laporan Treatment dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
        })
      })
    } else {
      openReportPrintWindow({
        title: 'Daftar Master Treatment',
        company: companyInfo,
        meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
        columns: printColumns,
        data: printData,
        footerTextOverride: `Laporan Treatment dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
      })
    }
  }

  const handleExportExcel = () => {
    const exportData = data.map(row => ({
      NAME: row.name || '',
      DURATION: row.duration || 0,
      PRICE: row.price || 0,
      DESCRIPTION: row.description || '',
      TAGS: getTagsString(row.tags),
    }))
    exportToExcel(exportData, 'treatment')
  }

  const handleImportExcel = async (file) => {
    try {
      const result = await validateImportFile(file, getExcelColumns())
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
      const name = row.NAME || row.name
      if (!name) continue

      const existingIndex = newData.findIndex(item => item.name === name)
      const importedTagNames = String(row.TAGS || row.tags || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      const importedTagIds = importedTagNames
        .map((tagName) => tags.find((item) => item.name.toLowerCase() === tagName.toLowerCase())?.id)
        .filter(Boolean)
      const itemData = {
        name: name,
        duration: Number(row.DURATION || row.duration || 60),
        price: Number(row.PRICE || row.price || 0),
        description: row.DESCRIPTION || row.description || '',
        tag_ids: importedTagIds,
        is_active: true,
      }

      if (existingIndex >= 0) {
        if (token) {
          try {
            await updateTreatment(token, newData[existingIndex].id, itemData)
          } catch (err) {
            console.warn('Update failed:', err.message)
          }
        }
        newData[existingIndex] = {
          ...newData[existingIndex],
          ...itemData,
          tags: importedTagIds.map((id) => ({ id, name: tagsById.get(String(id)) || '' })),
        }
        updatedCount++
      } else {
        if (token) {
          try {
            await createTreatment(token, itemData)
          } catch (err) {
            console.warn('Create failed:', err.message)
          }
        }
        newData.push({
          id: `TRT${Date.now()}-${addedCount}`,
          ...itemData,
          tags: importedTagIds.map((id) => ({ id, name: tagsById.get(String(id)) || '' })),
        })
        addedCount++
      }
    }

    setData(newData)
    setPagination({ ...pagination, total: newData.length })
    setShowImportConfirm(false)
    setPendingImportData(null)
    setToastMessage(`Imported: ${addedCount} new, ${updatedCount} updated`)
    setShowToast(true)
  }

  const handleCancelImport = () => {
    setShowImportConfirm(false)
    setPendingImportData(null)
  }

  const handleGenerateTemplate = () => {
    generateTemplate(getExcelColumns(), 'treatment_template')
  }

  function handleExitClick() {
    onExit()
  }

  function handleToggleTag(tagId) {
    const currentTagIds = form.tag_ids || []
    const index = currentTagIds.indexOf(tagId)
    if (index >= 0) {
      setForm({ ...form, tag_ids: currentTagIds.filter(id => id !== tagId) })
    } else {
      setForm({ ...form, tag_ids: [...currentTagIds, tagId] })
    }
  }

  function handleRemoveSelectedTag(tagId, event) {
    event.stopPropagation()
    handleToggleTag(tagId)
  }

  async function handleDeleteMasterTag(tag, event) {
    event.stopPropagation()

    if (!tag?.id) return
    if (!window.confirm(`Hapus master tag "${tag.name}"?`)) return

    try {
      if (token) {
        await deleteTreatmentTag(token, tag.id)
      }

      setTags((prev) => prev.filter((item) => item.id !== tag.id))
      setForm((prev) => ({
        ...prev,
        tag_ids: (prev.tag_ids || []).filter((item) => item !== tag.id),
      }))
      setData((prev) => prev.map((item) => ({
        ...item,
        tags: Array.isArray(item.tags) ? item.tags.filter((itemTag) => itemTag.id !== tag.id) : [],
      })))
      setToastMessage(`Tag "${tag.name}" dihapus`)
      setShowToast(true)
    } catch (err) {
      setError(err.message || 'Failed to delete treatment tag')
    }
  }

  return (
    <div className="master-content">
      <div className="master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Daftar Treatment</h1>
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
            <label htmlFor="treatment-status-filter" className="master-filter-label">Status</label>
            <select
              id="treatment-status-filter"
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
            <MasterTableHeader columns={getTableColumns()} sortConfig={sortConfig} onSort={handleSort} />
            <tbody>
              {sortedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={selectedId === row.id ? 'master-row-selected' : 'master-row'}
                  onClick={() => handleSelect(row)}
                  onDoubleClick={() => handleEdit()}
                >
                  <td>{offset + index + 1}</td>
                  <td>{row.name || '-'}</td>
                  <td>{row.duration || 0}</td>
                  <td>{formatCurrency(row.price || 0)}</td>
                  <td>
                    {Array.isArray(row.tags) && row.tags.length > 0 ? (
                      <div className="treatment-table-tag-list">
                        {row.tags.map((tag) => (
                          <span key={tag.id} className="treatment-table-tag-chip">
                            <span className="treatment-table-tag-text">{tag.name}</span>
                          </span>
                        ))}
                      </div>
                    ) : '-'}
                  </td>
                  <td>
                    <MasterStatusToggle
                      active={isActiveTreatment(row)}
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
            <span className="material-icons-round master-form-icon">spa</span>
            <h2 className="master-form-title">{isNewMode ? 'Isi Data Treatment' : 'Ubah Data Treatment'}</h2>
          </div>
          <div className="master-form-grid">
            <div className="master-form-group-wide">
              <label className="master-form-label">Nama Treatment :</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Durasi (menit) :</label>
              <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} className="master-form-input" />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Harga :</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="master-form-input" />
            </div>
            <div className="master-form-group-wide">
              <label className="master-form-label">Deskripsi :</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="master-form-input" rows={3} />
            </div>
            <div className="master-form-group-wide">
              <label className="master-form-label">Tags :</label>
              <div className="treatment-tag-selector" ref={tagSelectorRef}>
                <div
                  role="button"
                  tabIndex={0}
                  className={`treatment-tag-trigger${isTagDropdownOpen ? ' is-open' : ''}`}
                  onClick={() => setIsTagDropdownOpen((prev) => !prev)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setIsTagDropdownOpen((prev) => !prev)
                    }
                  }}
                >
                  <div className="treatment-tag-chip-list">
                    {selectedTags.length === 0 && <span className="treatment-tag-placeholder">Pilih tag treatment...</span>}
                    {visibleSelectedTags.map((tag) => (
                      <span key={tag.id} className="treatment-tag-chip">
                        <span className="treatment-tag-chip-text">{tag.name}</span>
                        <button
                          type="button"
                          className="treatment-tag-chip-remove"
                          onClick={(event) => handleRemoveSelectedTag(tag.id, event)}
                          aria-label={`Hapus tag ${tag.name}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {hiddenSelectedTagCount > 0 && (
                      <span className="treatment-tag-chip treatment-tag-chip-summary">+{hiddenSelectedTagCount}</span>
                    )}
                  </div>
                  <span className="material-icons-round treatment-tag-trigger-icon">
                    {isTagDropdownOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
                {isTagDropdownOpen && (
                  <div className={`treatment-tag-dropdown treatment-tag-dropdown-${tagDropdownDirection}`}>
                    <input
                      type="text"
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          handleCreateTagFromSearch()
                        }
                      }}
                      className="treatment-tag-search"
                      placeholder="Cari tag, lalu Enter jika belum ada..."
                      title="Tekan Enter untuk menambah tag baru jika belum ditemukan"
                      autoFocus
                    />
                    <div className="treatment-tag-options">
                      {filteredTags.length > 0 ? filteredTags.map((tag) => {
                        const isSelected = (form.tag_ids || []).includes(tag.id)
                        return (
                          <div key={tag.id} className={`treatment-tag-option${isSelected ? ' is-selected' : ''}`}>
                            <button
                              type="button"
                              className="treatment-tag-option-main"
                              onClick={() => handleToggleTag(tag.id)}
                            >
                              <span className="material-icons-round treatment-tag-option-check">{isSelected ? 'check' : 'add'}</span>
                              <span className="treatment-tag-option-label">{tag.name}</span>
                            </button>
                            <button
                              type="button"
                              className="treatment-tag-option-delete"
                              onClick={(event) => handleDeleteMasterTag(tag, event)}
                              title={`Hapus master tag ${tag.name}`}
                              aria-label={`Hapus master tag ${tag.name}`}
                            >
                              <span className="material-icons-round">delete</span>
                            </button>
                          </div>
                        )
                      }) : (
                        <div className="treatment-tag-empty">Tag tidak ditemukan. Tekan Enter untuk menambah.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
        excelColumns={getExcelColumns()}
        excelFilename="treatment"
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
