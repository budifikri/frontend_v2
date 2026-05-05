import { useCallback, useEffect, useState, useRef } from 'react'
import { useAuth } from '../../../shared/auth'
import { listPaket, getPaket, createPaket, updatePaket, deletePaket } from '../../../features/master/paket/paket.api'
import { listProducts } from '../../../features/master/product/product.api'
import { getCurrentCompany } from '../../../features/master/company/company.api'
import { openReportPrintWindow } from '../../../utils/reportPrint'
import { FooterMaster } from '../footer/FooterMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { ImportConfirmMaster } from '../footer/ImportConfirmMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { MasterStatusToggle } from '../table/MasterStatusToggle'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'
import { useMasterTableKeyboardNav } from '../../../hooks/useMasterTableKeyboardNav'
import { exportToExcel, generateTemplate, validateImportFile } from '../../../utils/excelUtils'
import { Toast } from '../../../components/Toast'
import '../transaksi/PurchaseDetail.css'

const DEFAULT_FORM = {
  kodepaket: '',
  nm_paket: '',
  deskripsi: '',
  is_active: true,
  harga_paket: 0,
}

const DUMMY_PAKET = [
  { id: 'PKT001', kodepaket: 'PKT001', nm_paket: 'Paket Hemat', deskripsi: 'Paket promo hemat', is_active: true, harga_paket: 50000 },
  { id: 'PKT002', kodepaket: 'PKT002', nm_paket: 'Paket Spesial', deskripsi: 'Paket spesial member', is_active: true, harga_paket: 75000 },
]

const DUMMY_PRODUCTS = [
  { id: 'PRD001', sku: 'PRD-001', name: 'Kopi Luwak', retail_price: 25000 },
  { id: 'PRD002', sku: 'PRD-002', name: 'Teh Botol', retail_price: 15000 },
  { id: 'PRD003', sku: 'PRD-003', name: 'Gula 1kg', retail_price: 10000 },
]

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false },
  { key: 'kodepaket', label: 'KODE' },
  { key: 'nm_paket', label: 'NAMA PAKET' },
  { key: 'harga_paket', label: 'HARGA' },
  { key: 'is_active', label: 'STATUS' },
]

const EXCEL_COLUMNS = [
  { key: 'kodepaket', label: 'KODE' },
  { key: 'nm_paket', label: 'NAMA' },
  { key: 'deskripsi', label: 'DESKRIPSI' },
]

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

function isActivePaket(item) {
  return Boolean(item?.is_active ?? true)
}

export function Paket({ onExit }) {
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
  const [showDetailDeleteConfirm, setShowDetailDeleteConfirm] = useState(false)
  const [pendingDetailDeleteIndex, setPendingDetailDeleteIndex] = useState(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [pendingImportData, setPendingImportData] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [togglingId, setTogglingId] = useState(null)
  
  // Detail items state
  const [detailItems, setDetailItems] = useState([])
  const [selectedDetailIndex, setSelectedDetailIndex] = useState(null)
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])
  const [showProductPopup, setShowProductPopup] = useState(false)
  const [showActionPopup, setShowActionPopup] = useState(false)
  const [actionPopupIndex, setActionPopupIndex] = useState(0)
  const [selectedProductIndex, setSelectedProductIndex] = useState(0)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const searchInputRef = useRef(null)
  const tableRef = useRef(null)
  const detailTableWrapperRef = useRef(null)
  const popupTableWrapperRef = useRef(null)
  const actionPopupRef = useRef(null)

  const currentProductOptions = productSearch.trim() ? productResults : DUMMY_PRODUCTS

  const fetchData = useCallback(async () => {
    setError('')
    setIsLoading(true)

    if (!token) {
      const keyword = searchKeyword.trim().toLowerCase()
      const filtered = DUMMY_PAKET.filter((item) => {
        const active = isActivePaket(item)
        if (isActiveFilter === 'active' && !active) return false
        if (isActiveFilter === 'inactive' && active) return false
        if (!keyword) return true
        return (
          String(item.kodepaket || '').toLowerCase().includes(keyword) ||
          String(item.nm_paket || '').toLowerCase().includes(keyword)
        )
      })

      setData(filtered.slice(offset, offset + limit))
      setPagination({ total: filtered.length, has_more: offset + limit < filtered.length })
      setIsLoading(false)
      return
    }

    try {
      const result = await listPaket(token, {
        search: searchKeyword.trim() || undefined,
        is_active: isActiveFilter === 'all' ? undefined : isActiveFilter === 'active',
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
      setError(err.message || 'Failed to load paket')
      setData([])
      setPagination({ total: 0, has_more: false })
    } finally {
      setIsLoading(false)
    }
  }, [token, limit, offset, isActiveFilter, searchKeyword])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const selectedItem = selectedId == null ? null : data.find((row) => row.id === selectedId) || null
  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'kodepaket',
    valueGetters: {
      is_active: (row) => (isActivePaket(row) ? 1 : 0),
      harga_paket: (row) => Number(row?.harga_paket || 0),
    },
  })

  useMasterTableKeyboardNav({
    data: sortedData,
    selectedId,
    setSelectedId,
    handleEdit,
    tableRef,
    isModalOpen: showForm || showDeleteConfirm || showDetailDeleteConfirm || showExitConfirm || showImportConfirm || showProductPopup,
  })

  // Fetch product search
  useEffect(() => {
    if (!productSearch.trim() || !token) {
      setIsLoadingProducts(false)
      setProductResults(DUMMY_PRODUCTS)
      return
    }
    const delayDebounce = setTimeout(async () => {
      setIsLoadingProducts(true)
      try {
        const result = await listProducts(token, { search: productSearch, limit: 10, offset: 0 })
        setProductResults(result.items || DUMMY_PRODUCTS)
      } catch {
        setProductResults(DUMMY_PRODUCTS)
      } finally {
        setIsLoadingProducts(false)
      }
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [productSearch, token])

  async function handleSave() {
    if (!form.kodepaket || !form.nm_paket) return
    setIsSaving(true)
    setError('')

    try {
      let savedResult = null
      const payload = {
        kodepaket: form.kodepaket,
        nm_paket: form.nm_paket,
        deskripsi: form.deskripsi || undefined,
        is_active: form.is_active,
        items: detailItems.map(item => ({ id_produk: item.id_produk }))
      }

      if (token) {
        if (isNewMode) {
          savedResult = await createPaket(token, payload)
        } else {
          savedResult = await updatePaket(token, selectedItem.id, payload)
        }

        const savedData = savedResult?.data ?? null
        if (savedData) {
          setSelectedId(savedData.id || selectedId)
          setForm({
            kodepaket: savedData.kodepaket || payload.kodepaket,
            nm_paket: savedData.nm_paket || payload.nm_paket,
            deskripsi: savedData.deskripsi || payload.deskripsi || '',
            is_active: Boolean(savedData.is_active ?? payload.is_active),
            harga_paket: Number(savedData.harga_paket || 0),
          })
          const nextDetails = (savedData.details || []).map((detail) => ({
            id: detail.id,
            id_produk: detail.id_produk,
            kode: detail.produk?.sku || '-',
            nama: detail.produk?.name || '-',
            harga: Number(detail.produk?.retail_price || 0),
          }))
          if (nextDetails.length > 0) {
            setDetailItems(nextDetails)
          }
        }
        await fetchData()
      } else {
        if (isNewMode) {
          setData((prev) => [{ id: form.kodepaket, ...payload, harga_paket: 0, is_active: true }, ...prev])
        } else {
          setData((prev) => prev.map((row) => (row.id === selectedItem.id ? { ...row, ...payload } : row)))
        }
      }

      setToastMessage('Data tersimpan')
      setToastType('success')
      setShowToast(true)
      handleCloseForm()
    } catch (err) {
      setError(err.message || 'Failed to save paket')
      setToastMessage(err.message || 'Failed to save paket')
      setToastType('error')
      setShowToast(true)
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
    setDetailItems([])
    setSelectedDetailIndex(null)
    setIsNewMode(true)
    setShowForm(true)
    // Focus search input after render
    setTimeout(() => {
      if (searchInputRef.current) searchInputRef.current.focus()
    }, 100)
  }

  function handleEdit() {
    const target = selectedItem || sortedData[0]
    if (!target) return
    const idx = sortedData.findIndex((item) => item.id === target.id)
    setSelectedId(target.id)
    setCurrentEditIndex(idx)
    setForm({
      kodepaket: target.kodepaket || '',
      nm_paket: target.nm_paket || '',
      deskripsi: target.deskripsi || '',
      is_active: isActivePaket(target),
      harga_paket: Number(target.harga_paket || 0),
    })
    // Load details
    if (token && target.id) {
      loadPaketDetails(target.id)
    } else {
      setDetailItems([])
    }
    setSelectedDetailIndex(null)
    setIsNewMode(false)
    setShowForm(true)
  }

  async function loadPaketDetails(paketId) {
    try {
      const result = await getPaket(token, paketId)
      const paketData = result.data || result
      const details = (paketData.details || []).map(d => ({
        id: d.id,
        id_produk: d.id_produk,
        kode: d.produk?.sku || '-',
        nama: d.produk?.name || '-',
        harga: Number(d.produk?.retail_price || 0),
      }))
      setDetailItems(details)
    } catch {
      setDetailItems([])
    }
  }

  function handleNextRecord() {
    if (currentEditIndex === null || currentEditIndex >= sortedData.length - 1) return
    const nextItem = sortedData[currentEditIndex + 1]
    if (!nextItem) return
    setSelectedId(nextItem.id)
    setCurrentEditIndex(currentEditIndex + 1)
    setForm({
      kodepaket: nextItem.kodepaket || '',
      nm_paket: nextItem.nm_paket || '',
      deskripsi: nextItem.deskripsi || '',
      is_active: isActivePaket(nextItem),
      harga_paket: Number(nextItem.harga_paket || 0),
    })
    if (token && nextItem.id) {
      loadPaketDetails(nextItem.id)
    }
  }

  function handlePrevRecord() {
    if (currentEditIndex === null || currentEditIndex <= 0) return
    const prevItem = sortedData[currentEditIndex - 1]
    if (!prevItem) return
    setSelectedId(prevItem.id)
    setCurrentEditIndex(currentEditIndex - 1)
    setForm({
      kodepaket: prevItem.kodepaket || '',
      nm_paket: prevItem.nm_paket || '',
      deskripsi: prevItem.deskripsi || '',
      is_active: isActivePaket(prevItem),
      harga_paket: Number(prevItem.harga_paket || 0),
    })
    if (token && prevItem.id) {
      loadPaketDetails(prevItem.id)
    }
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
        await deletePaket(token, selectedItem.id)
        await fetchData()
      } else {
        setData((prev) => prev.filter((row) => row.id !== selectedItem.id))
      }
    } catch (err) {
      setError(err.message || 'Failed to delete paket')
    } finally {
      setShowDeleteConfirm(false)
      setShowForm(false)
      setSelectedId(null)
      setForm(DEFAULT_FORM)
      setDetailItems([])
    }
  }

  async function handleToggleStatus(row) {
    if (!row?.id || togglingId) return
    const nextIsActive = !isActivePaket(row)

    if (token) {
      setTogglingId(row.id)
      try {
        await updatePaket(token, row.id, { is_active: nextIsActive })
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

  function handleSearchChange(value) {
    pager.reset()
    setSearchKeyword(value)
  }

  function handleStatusChange(value) {
    pager.reset()
    setIsActiveFilter(value)
  }

  function handleToggleAllRecords(value) {
    pager.toggleAllRecords(value)
  }

  function handleAddProduct(product) {
    // Check duplicate
    if (detailItems.some(item => item.id_produk === product.id)) {
      setToastMessage('Produk sudah ada dalam paket')
      setToastType('error')
      setShowToast(true)
      return
    }
    setDetailItems([...detailItems, {
      id_produk: product.id,
      kode: product.sku || '-',
      nama: product.name || '-',
      harga: Number(product.retail_price || 0),
    }])
    setShowProductPopup(false)
    setProductSearch('')
    setSelectedProductIndex(0)
    // Focus back to search input
    setTimeout(() => {
      if (searchInputRef.current) searchInputRef.current.focus()
    }, 100)
  }

  const handleRemoveProduct = useCallback((index) => {
    setDetailItems(detailItems.filter((_, idx) => idx !== index))
    setSelectedDetailIndex((prev) => {
      if (detailItems.length <= 1) return null
      if (prev === null) return null
      if (prev > index) return prev - 1
      if (prev === index) return Math.max(0, prev - 1)
      return prev
    })
  }, [detailItems])

  const handleRequestRemoveProduct = useCallback((index) => {
    if (index == null || index < 0 || index >= detailItems.length) return
    setPendingDetailDeleteIndex(index)
    setShowDetailDeleteConfirm(true)
  }, [detailItems])

  function handleConfirmRemoveProduct() {
    if (pendingDetailDeleteIndex == null) {
      setShowDetailDeleteConfirm(false)
      return
    }

    handleRemoveProduct(pendingDetailDeleteIndex)
    setPendingDetailDeleteIndex(null)
    setShowDetailDeleteConfirm(false)
  }

  function handleCancelRemoveProduct() {
    setPendingDetailDeleteIndex(null)
    setShowDetailDeleteConfirm(false)
  }

  function calculateTotal() {
    return detailItems.reduce((sum, item) => sum + item.harga, 0)
  }

  // Keyboard handler for detail items
  const handleDetailKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (detailItems.length === 0) return
      setSelectedDetailIndex(prev => {
        if (prev === null || prev >= detailItems.length - 1) return 0
        return prev + 1
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (detailItems.length === 0) return
      setSelectedDetailIndex(prev => {
        if (prev === null || prev <= 0) return detailItems.length - 1
        return prev - 1
      })
    } else if (e.key === 'Delete' && selectedDetailIndex !== null) {
      e.preventDefault()
      handleRequestRemoveProduct(selectedDetailIndex)
    }
  }, [detailItems, selectedDetailIndex, handleRequestRemoveProduct])

  // Keyboard handler for product search
  function handleSearchKeyDown(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Delete') {
      handleDetailKeyDown(e)
      return
    }

    if (e.key === 'Enter' && !productSearch.trim()) {
      e.preventDefault()
      setActionPopupIndex(0)
      setShowActionPopup(true)
      return
    }

    if (e.key === 'Enter' && productSearch.trim()) {
      e.preventDefault()
      const results = currentProductOptions
      if (results.length === 1) {
        handleAddProduct(results[0])
      } else if (results.length > 1) {
        setShowProductPopup(true)
      }
    }
  }

  async function handleActionSelect(index) {
    setShowActionPopup(false)
    setProductSearch('')

    if (index === 0) {
      await handleSave()
      return
    }

    if (index === 1) {
      handleCloseForm()
      return
    }
  }

  function handleActionPopupKeyDown(e) {
    if (!showActionPopup) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActionPopupIndex((prev) => (prev >= 1 ? 0 : prev + 1))
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActionPopupIndex((prev) => (prev <= 0 ? 1 : prev - 1))
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      handleActionSelect(actionPopupIndex)
    }
  }

  function handleProductPopupKeyDown(e) {
    if (!showProductPopup) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (currentProductOptions.length === 0) return
      setSelectedProductIndex((prev) => (prev >= currentProductOptions.length - 1 ? 0 : prev + 1))
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (currentProductOptions.length === 0) return
      setSelectedProductIndex((prev) => (prev <= 0 ? currentProductOptions.length - 1 : prev - 1))
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      const selectedProduct = currentProductOptions[selectedProductIndex]
      if (selectedProduct) {
        handleAddProduct(selectedProduct)
      }
    }
  }

  function handlePrint() {
    setShowForm(false)
    const printColumns = [
      { key: 'no', label: 'NO', align: 'text-center', formatter: (_, __, index) => index + 1 },
      { key: 'kodepaket', label: 'KODE' },
      { key: 'nm_paket', label: 'NAMA PAKET' },
      { key: 'harga_paket', label: 'HARGA', align: 'text-right', formatter: (v) => v ? Number(v).toLocaleString('id-ID') : '-' },
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
          title: 'Daftar Master Paket',
          company: companyInfo,
          meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
          columns: printColumns,
          data: printData,
          footerTextOverride: `Laporan Paket dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
        });
      }).catch(() => {
        openReportPrintWindow({
          title: 'Daftar Master Paket',
          company: companyInfo,
          meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
          columns: printColumns,
          data: printData,
          footerTextOverride: `Laporan Paket dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
        });
      });
    } else {
      openReportPrintWindow({
        title: 'Daftar Master Paket',
        company: companyInfo,
        meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
        columns: printColumns,
        data: printData,
        footerTextOverride: `Laporan Paket dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
      });
    }
  }

  const handleExportExcel = () => {
    const exportData = data.map(row => ({
      KODE: row.kodepaket || '',
      NAMA: row.nm_paket || '',
      DESKRIPSI: row.deskripsi || '',
      HARGA: row.harga_paket || 0,
    }))
    exportToExcel(exportData, 'paket')
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
      const kode = row.KODE || row.kodepaket
      if (!kode) continue

      const existingIndex = newData.findIndex(item => item.kodepaket === kode)
      const itemData = {
        kodepaket: kode,
        nm_paket: row.NAMA || row.nm_paket || '',
        deskripsi: row.DESKRIPSI || row.deskripsi || '',
        is_active: true,
      }

      if (existingIndex >= 0) {
        if (token) {
          try {
            await updatePaket(token, kode, itemData)
          } catch (err) {
            console.warn('Update failed:', err.message)
          }
        }
        newData[existingIndex] = { ...newData[existingIndex], ...itemData }
        updatedCount++
      } else {
        if (token) {
          try {
            await createPaket(token, itemData)
          } catch (err) {
            console.warn('Create failed:', err.message)
          }
        }
        newData.push({ id: kode, ...itemData, harga_paket: 0 })
        addedCount++
      }
    }

    setData(newData)
    setPagination({ ...pagination, total: newData.length })
    setShowImportConfirm(false)
    setPendingImportData(null)
    setToastMessage(`Berhasil import: ${addedCount} baru, ${updatedCount} diperbarui`)
    setToastType('success')
    setShowToast(true)
  }

  const handleCancelImport = () => {
    setShowImportConfirm(false)
    setPendingImportData(null)
  }

  const handleGenerateTemplate = () => {
    generateTemplate(EXCEL_COLUMNS, 'paket_template')
  }

  function handleExitClick() {
    setShowExitConfirm(true)
  }

  function handleConfirmExit() {
    setShowExitConfirm(false)
    onExit()
  }

  function handleCloseForm() {
    setShowForm(false)
    setSelectedId(null)
    setCurrentEditIndex(null)
    setForm(DEFAULT_FORM)
    setDetailItems([])
    setSelectedDetailIndex(null)
    setIsNewMode(false)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showDeleteConfirm || showDetailDeleteConfirm || showProductPopup || showActionPopup) {
        if (e.key === 'Escape') {
          e.preventDefault()
          if (showDeleteConfirm) setShowDeleteConfirm(false)
          if (showDetailDeleteConfirm) handleCancelRemoveProduct()
          if (showProductPopup) setShowProductPopup(false)
          if (showActionPopup) setShowActionPopup(false)
        }
        return
      }

      if (showForm) {
        const activeTag = document.activeElement?.tagName
        const isTypingInField = document.activeElement === searchInputRef.current || activeTag === 'INPUT' || activeTag === 'TEXTAREA'

        if (!isTypingInField && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Delete')) {
          handleDetailKeyDown(e)
          return
        }

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
  }, [
    showDeleteConfirm,
    showDetailDeleteConfirm,
    showForm,
    showProductPopup,
    showActionPopup,
    selectedItem,
    data,
    handlePrevRecord,
    handleNextRecord,
    detailItems,
    selectedDetailIndex,
  ])

  useEffect(() => {
    if (!showProductPopup) return
    setSelectedProductIndex(0)
  }, [showProductPopup, productSearch])

  useEffect(() => {
    if (!showForm || detailItems.length === 0 || selectedDetailIndex !== null) return
    setSelectedDetailIndex(0)
  }, [showForm, detailItems, selectedDetailIndex])

  useEffect(() => {
    if (!showProductPopup || !popupTableWrapperRef.current) return

    popupTableWrapperRef.current.focus()
    const selectedRow = popupTableWrapperRef.current.querySelector('tr.selected')
    if (selectedRow) {
      selectedRow.scrollIntoView({ block: 'nearest' })
    }
  }, [showProductPopup, selectedProductIndex, currentProductOptions])

  useEffect(() => {
    if (!showActionPopup || !actionPopupRef.current) return
    actionPopupRef.current.focus()
  }, [showActionPopup, actionPopupIndex])

  useEffect(() => {
    const element = detailTableWrapperRef.current
    if (!showForm || !element) return undefined

    const nativeKeyHandler = (event) => {
      handleDetailKeyDown(event)
    }

    element.addEventListener('keydown', nativeKeyHandler)
    return () => {
      element.removeEventListener('keydown', nativeKeyHandler)
    }
  }, [showForm, handleDetailKeyDown])

  return (
    <div className="master-content">
      <Toast message={toastMessage} type={toastType} isOpen={showToast} onClose={() => setShowToast(false)} duration={5000} />

      {error && <div className="master-error">{error}</div>}

      {!showForm && (
        <>
          <div className="master-header">
            <div className="master-header-accent"></div>
            <h1 className="master-title">Daftar Paket</h1>
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
                <label htmlFor="paket-status-filter" className="master-filter-label">Status</label>
                <select
                  id="paket-status-filter"
                  className="master-filter-select"
                  value={isActiveFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
          </div>

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
                      <td>{row.kodepaket || '-'}</td>
                      <td>{row.nm_paket || '-'}</td>
                      <td>{formatCurrency(row.harga_paket)}</td>
                      <td>
                        <MasterStatusToggle
                          active={isActivePaket(row)}
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
            excelFilename="paket"
            onExportExcel={handleExportExcel}
            onImportExcel={handleImportExcel}
            onGenerateTemplate={handleGenerateTemplate}
            isAllRecords={pager.isAllRecords}
            onToggleAllRecords={handleToggleAllRecords}
          />
        </>
      )}

      {showForm && (
        <div className="po-layout-container">
          {/* LEFT: Main Content - Detail Produk */}
          <div className="po-main-content">
            <div
              ref={detailTableWrapperRef}
              className="po-items-wrapper"
              onKeyDown={handleDetailKeyDown}
              onMouseDown={() => detailTableWrapperRef.current?.focus()}
              onClick={() => detailTableWrapperRef.current?.focus()}
              tabIndex={0}
              style={{ outline: 'none' }}
            >
              {detailItems.length === 0 ? (
                <div className="po-empty-items">
                  <span className="material-icons">inventory_2</span>
                  <p>Belum ada produk. Ketik nama produk di bawah untuk menambah.</p>
                </div>
              ) : (
                <table className="po-items-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Produk</th>
                      <th>Harga</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailItems.map((item, index) => (
                      <tr 
                        key={item.id_produk || index} 
                        className={selectedDetailIndex === index ? 'selected' : ''} 
                        onClick={() => {
                          setSelectedDetailIndex(index)
                          detailTableWrapperRef.current?.focus()
                        }}
                      >
                        <td>{index + 1}</td>
                        <td>
                          <div className="po-product-name">{item.nama}</div>
                          <div className="po-product-sku">{item.kode}</div>
                        </td>
                        <td>{formatCurrency(item.harga)}</td>
                        <td>
                          <button 
                            className="po-delete-btn" 
                            onClick={(e) => { e.stopPropagation(); handleRequestRemoveProduct(index) }}
                          >
                            <span className="material-icons" style={{ fontSize: 18 }}>delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bottom: Search + Buttons */}
            <div className="po-footer-input">
              <div className="po-search-container">
                <span className="material-icons">search</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  inputMode="text"
                  className="po-search-input"
                  placeholder="Ketik nama produk..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  autoFocus={showForm}
                  autoComplete="off"
                />
              </div>
              <div className="po-action-buttons">
                <button
                  type="button"
                  className="po-btn po-btn-exit"
                  onClick={handleCloseForm}
                  disabled={isSaving}
                >
                  <span className="material-icons">exit_to_app</span>
                  KELUAR
                </button>
                <button
                  type="button"
                  className="po-btn po-btn-print"
                  onClick={handlePrint}
                  disabled={detailItems.length === 0}
                >
                  <span className="material-icons">print</span>
                  CETAK
                </button>
                <button 
                  type="button" 
                  className="po-btn po-btn-save" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <span className="material-icons">save</span>
                  {isSaving ? 'SAVING...' : 'SIMPAN'}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Sidebar - Header Form */}
          <aside className="po-sidebar">
            <div className="po-header-section">
              <h1 className="po-title">PAKET PRODUK</h1>
              <div className="po-arrow-status-bar" aria-label="Paket status">
                <button
                  type="button"
                  className={`po-arrow-step ${form.is_active ? 'is-active' : 'is-inactive'}`}
                  onClick={() => setForm((prev) => ({ ...prev, is_active: true }))}
                >
                  Active
                </button>
                <button
                  type="button"
                  className={`po-arrow-step po-arrow-step-void ${!form.is_active ? 'is-active' : 'is-inactive'}`}
                  onClick={() => setForm((prev) => ({ ...prev, is_active: false }))}
                >
                  Inactive
                </button>
              </div>
            </div>

            <div className="po-form-panel">
              <div className="form-group">
                <label className="form-label">Kode Paket *</label>
                <input 
                  type="text" 
                  value={form.kodepaket} 
                  onChange={(e) => setForm({ ...form, kodepaket: e.target.value })} 
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nama Paket *</label>
                <input 
                  type="text" 
                  value={form.nm_paket} 
                  onChange={(e) => setForm({ ...form, nm_paket: e.target.value })} 
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea
                  value={form.deskripsi} 
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} 
                  className="form-input form-textarea po-notes-textarea"
                  rows={3}
                />
              </div>
            </div>

            <div className="po-summary-section">
              <div className="po-summary-row">
                <span>Jumlah Item:</span>
                <span>{detailItems.length} produk</span>
              </div>
              <div className="po-summary-total-label">GRAND TOTAL</div>
              <div className="po-summary-total-value">{formatCurrency(form.harga_paket || calculateTotal())}</div>
            </div>
          </aside>
        </div>
      )}

      {showDeleteConfirm && (
        <DeleteMaster
          itemName={selectedItem?.nm_paket}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showDetailDeleteConfirm && (
        <DeleteMaster
          itemName={detailItems[pendingDetailDeleteIndex]?.nama || 'item detail'}
          onConfirm={handleConfirmRemoveProduct}
          onCancel={handleCancelRemoveProduct}
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

      {/* Product Search Popup */}
      {showProductPopup && (
        <div className="popup-overlay" onClick={() => setShowProductPopup(false)}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>DAFTAR PRODUK</h3>
              <button type="button" className="popup-close" onClick={() => setShowProductPopup(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div
              ref={popupTableWrapperRef}
              className="popup-table-wrapper"
              onKeyDown={handleProductPopupKeyDown}
              tabIndex={0}
              style={{ outline: 'none' }}
            >
              <table className="popup-table">
                <thead>
                  <tr><th>No</th><th>Nama Produk</th><th>Satuan</th><th>Harga</th></tr>
                </thead>
                <tbody>
                  {isLoadingProducts ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>Memuat...</td></tr>
                  ) : currentProductOptions.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>Produk tidak ditemukan</td></tr>
                  ) : (
                    currentProductOptions.map((product, idx) => (
                      <tr
                        key={product.id}
                        className={selectedProductIndex === idx ? 'selected' : ''}
                        onClick={() => handleAddProduct(product)}
                        onMouseEnter={() => setSelectedProductIndex(idx)}
                      >
                        <td>{idx + 1}</td>
                        <td>{product.name || '-'}</td>
                        <td>{product.unit || product.unit_name || '-'}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(product.retail_price)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="popup-footer">
              <span>↑↓ Navigasi</span>
              <span>Enter: Pilih | Esc: Tutup</span>
            </div>
          </div>
        </div>
      )}

      {showActionPopup && (
        <div className="popup-overlay" onClick={() => setShowActionPopup(false)}>
          <div className="popup action-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header"><h3>PILIH AKSI</h3></div>
            <div ref={actionPopupRef} className="action-popup-list" onKeyDown={handleActionPopupKeyDown} tabIndex={0} style={{ outline: 'none' }}>
              <div
                className={`action-popup-item ${actionPopupIndex === 0 ? 'is-selected' : ''}`}
                onClick={() => handleActionSelect(0)}
              >
                <span className="material-icons">save</span>
                <span>Simpan</span>
              </div>
              <div
                className={`action-popup-item ${actionPopupIndex === 1 ? 'is-selected' : ''}`}
                onClick={() => handleActionSelect(1)}
              >
                <span className="material-icons">exit_to_app</span>
                <span>Keluar</span>
              </div>
            </div>
            <div className="popup-footer">
              <span>↑↓ Pilih</span>
              <span>Enter: OK | Esc: Tutup</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
