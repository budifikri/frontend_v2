import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import { useModule } from '../../../shared/useModule'
import { listCategories } from '../../../features/master/category/category.api'
import { listUnits } from '../../../features/master/unit/unit.api'
import { listWarehouses } from '../../../features/master/warehouse/warehouse.api'
import { createProduct, deleteProduct, getProductHppTrace, listProducts, updateProduct } from '../../../features/master/product/product.api'
import { adjustStock } from '../../../features/laporan/stock/stock.api'
import { getProductStock } from '../../../features/master/stock-opname/stockOpname.api'
import { createPriceTier, getPriceTier, updatePriceTier } from '../../../features/master/price-tier/priceTier.api'
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
  sku: '',
  barcode: '',
  name: '',
  description: '',
  category_id: '',
  unit_id: '',
  cost_price: 0,
  retail_price: 0,
  tax_rate: 0,
  reorder_point: 0,
}

const DEFAULT_PRICE_TIER = [
  { tier_name: 'Grosir 1', min_quantity: 1, unit_price: 0 },
  { tier_name: 'Grosir 2', min_quantity: 1, unit_price: 0 },
  { tier_name: 'Grosir 3', min_quantity: 1, unit_price: 0 },
]

const DUMMY_CATEGORIES = [
  { id: 'CAT001', name: 'Makanan', product_type: 'stockable' },
  { id: 'CAT002', name: 'Minuman', product_type: 'stockable' },
]

const DUMMY_UNITS = [
  { id: 'PCS', name: 'Pieces' },
  { id: 'BOX', name: 'Box' },
]

const DUMMY_WAREHOUSES = [
  { id: 'WH001', name: 'Main Warehouse', code: 'WH01' },
  { id: 'WH002', name: 'Branch Warehouse', code: 'WH02' },
]

const DUMMY_PRODUCTS = [
  {
    id: 'PRD001',
    sku: 'PRD-001',
    barcode: '8991234567001',
    name: 'Biskuit Coklat',
    description: '',
    category_id: 'CAT001',
    unit_id: 'PCS',
    cost_price: 5000,
    retail_price: 7000,
    tax_rate: 11,
    reorder_point: 20,
    is_active: true,
  },
  {
    id: 'PRD002',
    sku: 'PRD-002',
    barcode: '8991234567002',
    name: 'Teh Botol',
    description: '',
    category_id: 'CAT002',
    unit_id: 'PCS',
    cost_price: 3500,
    retail_price: 5000,
    tax_rate: 11,
    reorder_point: 30,
    is_active: true,
  },
]

const ADJUST_REASON_OPTIONS = [
  { value: 'broken', label: 'Broken' },
  { value: 'expired', label: 'Expired' },
  { value: 'lost/stolen', label: 'Lost/Stolen' },
  { value: 'inventory_mismatch', label: 'Inventory Mismatch' },
  { value: 'other', label: 'Other' },
]

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false },
  { key: 'sku', label: 'SKU' },
  { key: 'name', label: 'NAME' },
  { key: 'category_name', label: 'CATEGORY' },
  { key: 'unit_name', label: 'UNIT' },
  { key: 'retail_price', label: 'RETAIL' },
  { key: 'is_active', label: 'STATUS' },
]

const EXCEL_COLUMNS = [
  { key: 'sku', label: 'SKU' },
  { key: 'barcode', label: 'BARCODE' },
  { key: 'name', label: 'NAME' },
  { key: 'description', label: 'DESCRIPTION' },
  { key: 'category_id', label: 'CATEGORY_ID' },
  { key: 'unit_id', label: 'UNIT_ID' },
  { key: 'cost_price', label: 'COST_PRICE' },
  { key: 'retail_price', label: 'RETAIL_PRICE' },
]

function isActiveProduct(item) {
  if (typeof item?.is_active === 'boolean') return item.is_active
  return String(item?.status ?? 'active').toLowerCase() !== 'inactive'
}

function normalizeProductType(value) {
  if (value === 'service' || value === 'consumable') return value
  return 'stockable'
}

function normalizeProductItem(raw, index) {
  return {
    id: raw?.id || `product-${index}`,
    sku: raw?.sku || raw?.product_sku || raw?.code || raw?.product_code || '-',
    barcode: raw?.barcode || raw?.product_barcode || '',
    name: raw?.name || raw?.product_name || '-',
    description: raw?.description || raw?.product_description || '',
    category_id: raw?.category_id || raw?.category?.id || '',
    category: raw?.category
      ? { ...raw.category, product_type: normalizeProductType(raw?.category?.product_type) }
      : { id: raw?.category_id || '', name: raw?.category_name || '-', product_type: normalizeProductType(raw?.category?.product_type || raw?.category_type) },
    category_name: raw?.category_name || raw?.category?.name || '-',
    unit_id: raw?.unit_id || raw?.unit?.id || '',
    unit: raw?.unit || { id: raw?.unit_id || '', name: raw?.unit_name || '-' },
    unit_name: raw?.unit_name || raw?.unit?.name || '-',
    cost_price: Number(raw?.cost_price ?? raw?.cost ?? 0),
    retail_price: Number(raw?.retail_price ?? raw?.price ?? raw?.sale_price ?? 0),
    tax_rate: Number(raw?.tax_rate ?? raw?.tax ?? 0),
    reorder_point: Number(raw?.reorder_point ?? raw?.min_stock ?? 0),
    is_active: raw?.is_active ?? (raw?.status === 'active'),
    status: raw?.status || (raw?.is_active ? 'active' : 'inactive'),
  }
}

export function Product({ onExit }) {
  const { auth } = useAuth()
  const { companyConfig } = useModule()
  const token = auth?.token
  const isClinic = companyConfig?.businessType === 'clinic'

  const [data, setData] = useState([])
  const [categories, setCategories] = useState([])
  const [units, setUnits] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
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
  const [showHppHistoryModal, setShowHppHistoryModal] = useState(false)
  const [hppHistoryData, setHppHistoryData] = useState(null)
  const [isLoadingHppHistory, setIsLoadingHppHistory] = useState(false)
  const [hppHistoryError, setHppHistoryError] = useState('')
  const [pendingImportData, setPendingImportData] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [activeTab, setActiveTab] = useState('general')
  const [priceTierData, setPriceTierData] = useState(DEFAULT_PRICE_TIER)
  const [adjustForm, setAdjustForm] = useState({
    warehouse_id: '',
    reason: '',
    system_stock: 0,
    physical_stock: 0,
  })
  const [togglingId, setTogglingId] = useState(null)
  const tableRef = useRef(null)

  const categoryNameById = useMemo(() => {
    const map = new Map()
    categories.forEach((item) => {
      if (item?.id) map.set(String(item.id), item.name || '-')
    })
    return map
  }, [categories])

  const unitNameById = useMemo(() => {
    const map = new Map()
    units.forEach((item) => {
      if (item?.id) map.set(String(item.id), item.name || '-')
    })
    return map
  }, [units])

  const selectedCategory = useMemo(() => {
    if (!form.category_id) return null
    return categories.find((item) => String(item?.id || '') === String(form.category_id)) || null
  }, [categories, form.category_id])

  const selectedCategoryType = normalizeProductType(selectedCategory?.product_type)
  const isServiceCategory = selectedCategoryType === 'service'
  const isConsumableCategory = selectedCategoryType === 'consumable'
  const isStockManagedCategory = selectedCategoryType !== 'service'

  const fetchWarehouses = useCallback(async () => {
    if (!token) {
      setWarehouses(DUMMY_WAREHOUSES)
      return
    }

    try {
      const res = await listWarehouses(token, { limit: 200, offset: 0 })
      setWarehouses(res.items || [])
    } catch (err) {
      console.error('[Product] Failed to load warehouses:', err)
      // Keep existing warehouses or set empty? We'll keep whatever was there
    }
  }, [token])

  const fetchLookups = useCallback(async () => {
    if (!token) {
      setCategories(DUMMY_CATEGORIES)
      setUnits(DUMMY_UNITS)
      setWarehouses(DUMMY_WAREHOUSES)
      return
    }

    try {
      const [catRes, unitRes, warehouseRes] = await Promise.all([
        listCategories(token, { limit: 200, offset: 0, include_inactive: true }),
        listUnits(token, { limit: 200, offset: 0, include_inactive: true }),
        listWarehouses(token, { limit: 200, offset: 0 }),
      ])
      setCategories((catRes.items || []).map((item) => ({
        ...item,
        product_type: normalizeProductType(item?.product_type),
      })))
      setUnits(unitRes.items || [])
      setWarehouses(warehouseRes.items || [])
    } catch {
      setCategories(DUMMY_CATEGORIES)
      setUnits(DUMMY_UNITS)
      setWarehouses(DUMMY_WAREHOUSES)
    }
  }, [token])

  const fetchData = useCallback(async () => {
    setError('')
    setIsLoading(true)

    if (!token) {
      const keyword = searchKeyword.trim().toLowerCase()
      const filtered = DUMMY_PRODUCTS.filter((item) => {
        const active = isActiveProduct(item)
        if (isActiveFilter === 'active' && !active) return false
        if (isActiveFilter === 'inactive' && active) return false
        if (categoryFilter && String(item.category_id || '') !== categoryFilter) return false
        if (!keyword) return true

        return (
          String(item.sku || '').toLowerCase().includes(keyword) ||
          String(item.name || '').toLowerCase().includes(keyword) ||
          String(item.barcode || '').toLowerCase().includes(keyword)
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
      const result = await listProducts(token, {
        search: searchKeyword.trim() || undefined,
        category_id: categoryFilter || undefined,
        is_active: isActiveFilter === 'all' ? undefined : isActiveFilter === 'active',
        include_inactive: isActiveFilter === 'all' ? true : undefined,
        limit,
        offset,
      })

      const normalizedItems = (result.items || []).map((item, index) => normalizeProductItem(item, index))
      setData(normalizedItems)
      const nextPagination = result.pagination || {}
      setPagination({
        total: Number(nextPagination.total ?? 0),
        has_more: Boolean(nextPagination.has_more),
      })
    } catch (err) {
      setError(err.message || 'Failed to load products')
      setData([])
      setPagination({ total: 0, has_more: false })
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, categoryFilter, isActiveFilter, limit, offset])

  useEffect(() => {
    fetchLookups()
  }, [fetchLookups])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const selectedItem = selectedId == null ? null : data.find((row) => row.id === selectedId) || null
  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'sku',
    valueGetters: {
      category_name: (row) => row?.category?.name || row?.categoryName || categoryNameById.get(String(row?.category_id || '')) || '',
      unit_name: (row) => row?.unit?.name || row?.unitName || unitNameById.get(String(row?.unit_id || '')) || '',
      retail_price: (row) => Number(row?.retail_price || 0),
      is_active: (row) => (isActiveProduct(row) ? 1 : 0),
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

  const tableContainerRef = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)

  const ROW_HEIGHT = 40
  const VISIBLE_ROWS = 20

  const virtualOffset = useMemo(() => {
    return Math.floor(scrollTop / ROW_HEIGHT)
  }, [scrollTop])

  const visibleRows = useMemo(() => {
    if (!sortedData || sortedData.length === 0) return []
    const start = virtualOffset
    const end = Math.min(start + VISIBLE_ROWS + 2, sortedData.length)
    return sortedData.slice(start, end)
  }, [sortedData, virtualOffset])

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop)
  }, [])

  const variance = useMemo(() => {
    return adjustForm.physical_stock - adjustForm.system_stock
  }, [adjustForm.physical_stock, adjustForm.system_stock])

  const selectedProductForHistory = useMemo(() => {
    if (selectedItem) return selectedItem
    if (!isNewMode && selectedId) return data.find((row) => row.id === selectedId) || null
    return null
  }, [data, isNewMode, selectedId, selectedItem])

  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0)
  }, [])

  const formatDateTime = useCallback((value) => {
    if (!value) return '-'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

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
  }, [showDeleteConfirm, showForm, selectedItem, data, handlePrevRecord, handleNextRecord])

  const fetchSystemStock = useCallback(async (productId, warehouseId) => {
    if (!token || !productId || !warehouseId) {
      setAdjustForm((prev) => ({ ...prev, system_stock: 0 }))
      return
    }

    try {
      const result = await getProductStock(token, {
        product_id: productId,
        warehouse_id: warehouseId,
      })
      const stock = Number(result.current_stock || 0)
      setAdjustForm((prev) => ({ ...prev, system_stock: stock }))
    } catch (err) {
      console.warn('Failed to fetch system stock:', err.message)
      setAdjustForm((prev) => ({ ...prev, system_stock: 0 }))
    }
  }, [token])

  useEffect(() => {
    if (activeTab === 'adjustStock' && token && warehouses.length === 0) {
      fetchWarehouses()
    }
  }, [activeTab, token, warehouses.length, fetchWarehouses])

  useEffect(() => {
    if (activeTab === 'adjustStock' && selectedItem && token) {
      const warehouseId = adjustForm.warehouse_id || warehouses[0]?.id
      if (warehouseId) {
        fetchSystemStock(selectedItem.id, warehouseId)
      }
    }
  }, [activeTab, selectedItem, token, adjustForm.warehouse_id, warehouses, fetchSystemStock])

  function handleSearchChange(value) {
    pager.reset()
    setSearchKeyword(value)
  }

  function handleCategoryFilter(value) {
    pager.reset()
    setCategoryFilter(value)
  }

  function handleStatusFilter(value) {
    pager.reset()
    setIsActiveFilter(value)
  }

  function handleToggleAllRecords(value) {
    pager.toggleAllRecords(value)
  }

  function validatePriceTiers(tiers, retailPrice) {
    const errors = []
    
    const validTiers = tiers.filter(t => t.unit_price > 0)
    
    for (let i = 0; i < validTiers.length; i++) {
      const tier = validTiers[i]
      const tierNum = i + 1
      
      if (tier.min_quantity <= 1) {
        errors.push(`Grosir ${tierNum}: Qty minimum harus lebih dari 1`)
      }

      if (i > 0) {
        const prevQty = Number(validTiers[i - 1].min_quantity || 0)
        if (tier.min_quantity <= prevQty) {
          errors.push(`Grosir ${tierNum}: Qty harus lebih besar dari Grosir ${i}`)
        }
      }
      
      const prevPrice = i === 0 ? retailPrice : validTiers[i - 1].unit_price
      if (tier.unit_price >= prevPrice) {
        const prevLabel = i === 0 ? 'harga retail' : `Grosir ${i}`
        errors.push(`Grosir ${tierNum}: Harga harus lebih kecil dari ${prevLabel}`)
      }
    }
    
    return errors
  }

  async function handleSave() {
    if (!form.sku || !form.name || !form.unit_id) return

    setIsSaving(true)
    setError('')

    const payload = {
      sku: form.sku,
      barcode: form.barcode || undefined,
      name: form.name,
      description: form.description || undefined,
      category_id: form.category_id || undefined,
      unit_id: form.unit_id || undefined,
      cost_price: isServiceCategory ? 0 : Number(form.cost_price || 0),
      retail_price: isConsumableCategory ? 0 : Number(form.retail_price || 0),
      tax_rate: Number(form.tax_rate || 0),
      reorder_point: isServiceCategory ? 0 : Number(form.reorder_point || 0),
    }

    try {
      if (token) {
        if (isNewMode) {
          await createProduct(token, payload)
          await fetchData()
        } else {
          await updateProduct(token, selectedItem.id, payload)
          setData((prev) => prev.map((row) => {
            if (row.id === selectedItem.id) {
              return { 
                ...row, 
                ...payload,
                category: row.category || { id: payload.category_id || '', name: '' },
                unit: row.unit || { id: payload.unit_id || '', name: '' },
              }
            }
            return row
          }))
        }
        
        if (activeTab === 'adjustStock' && !isNewMode && selectedItem) {
          if (!adjustForm.warehouse_id) {
            setError('Warehouse is required for stock adjustment')
            setIsSaving(false)
            return
          }
          if (!adjustForm.reason) {
            setError('Reason is required for stock adjustment')
            setIsSaving(false)
            return
          }
          if (adjustForm.physical_stock < 0) {
            setError('Physical stock cannot be negative')
            setIsSaving(false)
            return
          }
          const adjustmentType = variance > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT'
          await adjustStock(token, {
            product_id: selectedItem.id,
            warehouse_id: adjustForm.warehouse_id,
            adjustment_type: adjustmentType,
            quantity: Math.abs(variance),
            reason: adjustForm.reason,
          })
          setAdjustForm({ warehouse_id: '', reason: '', system_stock: 0, physical_stock: 0 })
        }
        
        // Save price tiers - check if exists first, then create or update
        try {
          const priceTierPayload = priceTierData
            .filter(t => t.unit_price > 0)
            .map(t => ({
              tier_name: t.tier_name,
              min_quantity: Number(t.min_quantity || 1),
              unit_price: Number(t.unit_price || 0),
            }))
          console.log('[Product] Saving price tiers:', priceTierPayload)
          
          if (!isConsumableCategory && priceTierPayload.length > 0) {
            const validationErrors = validatePriceTiers(priceTierPayload, Number(form.retail_price || 0))
            if (validationErrors.length > 0) {
              setToastMessage(validationErrors.join('\n'))
              setShowToast(true)
              setTimeout(() => setShowToast(false), 4000)
              setIsSaving(false)
              return
            }
            
            let priceTierExists = false
            try {
              await getPriceTier(token, selectedItem.id)
              priceTierExists = true
            } catch (err) {
              if (err?.status === 404) {
                priceTierExists = false
              } else {
                throw err
              }
            }
            
            const priceTierPayloadWrapped = { product_id: selectedItem.id, tiers: priceTierPayload }
            if (priceTierExists) {
              await updatePriceTier(token, selectedItem.id, priceTierPayloadWrapped)
            } else {
              await createPriceTier(token, priceTierPayloadWrapped)
            }
          }
        } catch (err) {
          console.error('[Product] Failed to save price tier:', err)
        }
        
        // For update: skip fetchData to preserve optimistic updates
        // For create: already called fetchData above
      } else {
        // Offline mode
        if (selectedItem) {
          setData((prev) => prev.map((row) => (row.id === selectedItem.id ? { ...row, ...payload } : row)))
        } else {
          setData((prev) => [{ id: `PRD${Date.now()}`, ...payload, is_active: true }, ...prev])
        }
      }

      setToastMessage('Data tersimpan')
      setShowToast(true)
    } catch (err) {
      setError(err.message || 'Failed to save product')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleOpenHppHistory() {
    const target = selectedProductForHistory
    if (!target?.id || isNewMode) return

    setIsLoadingHppHistory(true)
    setShowHppHistoryModal(true)
    setHppHistoryError('')
    setHppHistoryData(null)

    try {
      if (!token) {
        setHppHistoryData({
          product_id: target.id,
          sku: target.sku || '',
          name: target.name || '',
          current_cost_price: Number(target.cost_price || 0),
          events: Number(target.cost_price || 0) > 0 ? [{
            seq: 1,
            event_date: new Date().toISOString(),
            event_type: 'OPENING_STOCK',
            reference_id: target.id,
            reference_number: 'DUMMY-OPENING',
            warehouse_id: '',
            warehouse_name: '-',
            qty: 0,
            unit_cost: Number(target.cost_price || 0),
            hpp: Number(target.cost_price || 0),
            notes: 'Dummy history HPP',
          }] : [],
        })
      } else {
        const result = await getProductHppTrace(token, target.id)
        setHppHistoryData(result)
      }
    } catch (err) {
      setHppHistoryError(err.message || 'Failed to load History Hpp')
    } finally {
      setIsLoadingHppHistory(false)
    }
  }

  function handleSelect(row) {
    setSelectedId(row.id)
  }

  function handleCategoryChange(categoryId) {
    const nextCategory = categories.find((item) => String(item?.id || '') === String(categoryId)) || null
    const nextType = normalizeProductType(nextCategory?.product_type)

    setForm((prev) => ({
      ...prev,
      category_id: categoryId,
      cost_price: nextType === 'service' ? 0 : prev.cost_price,
      retail_price: nextType === 'consumable' ? 0 : prev.retail_price,
      reorder_point: nextType === 'service' ? 0 : prev.reorder_point,
    }))

    if ((nextType === 'service' && activeTab === 'adjustStock') || (nextType === 'consumable' && activeTab === 'hargaGrosir')) {
      setActiveTab('general')
    }
  }

  function handleNew() {
    setSelectedId(null)
    setCurrentEditIndex(null)
    setForm(DEFAULT_FORM)
    setActiveTab('general')
    setPriceTierData(DEFAULT_PRICE_TIER)
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
      sku: target.sku || '',
      barcode: target.barcode || '',
      name: target.name || '',
      description: target.description || '',
      category_id: target.category?.id || target.category_id || '',
      unit_id: target.unit?.id || target.unit_id || '',
      cost_price: Number(target.cost_price || 0),
      retail_price: Number(target.retail_price || 0),
      tax_rate: Number(target.tax_rate || 0),
      reorder_point: Number(target.reorder_point || 0),
    })
    setActiveTab('general')
    setPriceTierData(DEFAULT_PRICE_TIER)

    if (token && target.id) {
      loadPriceTierData(target.id)
    }

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
      sku: nextItem.sku || '',
      barcode: nextItem.barcode || '',
      name: nextItem.name || '',
      description: nextItem.description || '',
      category_id: nextItem.category?.id || nextItem.category_id || '',
      unit_id: nextItem.unit?.id || nextItem.unit_id || '',
      cost_price: Number(nextItem.cost_price || 0),
      retail_price: Number(nextItem.retail_price || 0),
      tax_rate: Number(nextItem.tax_rate || 0),
      reorder_point: Number(nextItem.reorder_point || 0),
    })
    setActiveTab('general')
    setPriceTierData(DEFAULT_PRICE_TIER)
    if (token && nextItem.id) {
      loadPriceTierData(nextItem.id)
    }
  }

  function handlePrevRecord() {
    if (currentEditIndex === null || currentEditIndex <= 0) return
    const prevItem = sortedData[currentEditIndex - 1]
    if (!prevItem) return
    setSelectedId(prevItem.id)
    setCurrentEditIndex(currentEditIndex - 1)
    setForm({
      sku: prevItem.sku || '',
      barcode: prevItem.barcode || '',
      name: prevItem.name || '',
      description: prevItem.description || '',
      category_id: prevItem.category?.id || prevItem.category_id || '',
      unit_id: prevItem.unit?.id || prevItem.unit_id || '',
      cost_price: Number(prevItem.cost_price || 0),
      retail_price: Number(prevItem.retail_price || 0),
      tax_rate: Number(prevItem.tax_rate || 0),
      reorder_point: Number(prevItem.reorder_point || 0),
    })
    setActiveTab('general')
    setPriceTierData(DEFAULT_PRICE_TIER)
    if (token && prevItem.id) {
      loadPriceTierData(prevItem.id)
    }
  }

  async function loadPriceTierData(productId) {
    try {
      const result = await getPriceTier(token, productId)
      console.log('[Product] Load price tier result:', JSON.stringify(result))
      
      let tiersArray = null
      
      // Try to find tiers array in various possible locations
      if (Array.isArray(result)) {
        tiersArray = result
      } else if (result?.data) {
        if (Array.isArray(result.data)) {
          tiersArray = result.data
        } else if (Array.isArray(result.data.tiers)) {
          tiersArray = result.data.tiers
        } else if (Array.isArray(result.data.data)) {
          tiersArray = result.data.data
        }
      } else if (result?.tiers) {
        tiersArray = result.tiers
      }
      
      console.log('[Product] Parsed tiers array:', tiersArray)
      
      if (tiersArray && tiersArray.length > 0) {
        const tiers = [...DEFAULT_PRICE_TIER]
        tiersArray.forEach((tier, idx) => {
          if (idx < 3) {
            tiers[idx] = {
              tier_name: tier.tier_name || tier.name || `Grosir ${idx + 1}`,
              min_quantity: Number(tier.min_quantity || tier.quantity || tier.min_qty || 1),
              unit_price: Number(tier.unit_price || tier.price || tier.unit_price || 0),
            }
          }
        })
        setPriceTierData(tiers)
        console.log('[Product] Price tier data loaded:', tiers)
      } else {
        console.log('[Product] No price tiers found, using defaults')
        setPriceTierData(DEFAULT_PRICE_TIER)
      }
    } catch (err) {
      if (err?.status === 404 || err?.message?.includes('not found')) {
        console.log('[Product] Price tier not found, using defaults')
        setPriceTierData(DEFAULT_PRICE_TIER)
      } else {
        console.error('[Product] Failed to load price tier:', err)
        setPriceTierData(DEFAULT_PRICE_TIER)
      }
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
        await deleteProduct(token, selectedItem.id)
        await fetchData()
      } else {
        setData((prev) => prev.filter((row) => row.id !== selectedItem.id))
      }
    } catch (err) {
      setError(err.message || 'Failed to delete product')
    } finally {
      setShowDeleteConfirm(false)
      setShowForm(false)
      setSelectedId(null)
      setForm(DEFAULT_FORM)
    }
  }

  async function handleToggleStatus(row) {
    if (!row?.id || togglingId) return

    const nextIsActive = !isActiveProduct(row)
    if (token) {
      setTogglingId(row.id)
      try {
        await updateProduct(token, row.id, { is_active: nextIsActive })
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
    setForm(DEFAULT_FORM)
    setActiveTab('general')
    setPriceTierData(DEFAULT_PRICE_TIER)
    setAdjustForm({ warehouse_id: '', reason: '', system_stock: 0, physical_stock: 0 })
    setIsNewMode(false)
  }

  function handlePrint() {
    setShowForm(false)
    const printColumns = [
      { key: 'no', label: 'NO', align: 'text-center', formatter: (_, __, index) => index + 1 },
      { key: 'sku', label: 'SKU' },
      { key: 'barcode', label: 'BARCODE' },
      { key: 'name', label: 'NAMA PRODUK' },
      { key: 'category_id', label: 'KATEGORI', align: 'text-center' },
      { key: 'unit_id', label: 'SATUAN', align: 'text-center' },
      { key: 'retail_price', label: 'HARGA JUAL', align: 'text-right', formatter: (v) => v ? Number(v).toLocaleString('id-ID') : '-' },
      { key: 'cost_price', label: 'HARGA BELI', align: 'text-right', formatter: (v) => v ? Number(v).toLocaleString('id-ID') : '-' },
      { key: 'stock', label: 'STOK', align: 'text-right' },
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
          title: 'Daftar Master Produk',
          company: companyInfo,
          meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
          columns: printColumns,
          data: printData,
          footerTextOverride: `Laporan Produk dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
        });
      }).catch(() => {
        openReportPrintWindow({
          title: 'Daftar Master Produk',
          company: companyInfo,
          meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
          columns: printColumns,
          data: printData,
          footerTextOverride: `Laporan Produk dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
        });
      });
    } else {
      openReportPrintWindow({
        title: 'Daftar Master Produk',
        company: companyInfo,
        meta: { date: new Date().toLocaleString('id-ID'), user: auth.username || 'Admin' },
        columns: printColumns,
        data: printData,
        footerTextOverride: `Laporan Produk dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
      });
    }
  }

  const handleExportExcel = () => {
    const exportData = data.map(row => ({
      SKU: row.sku || '',
      BARCODE: row.barcode || '',
      NAME: row.name || '',
      DESCRIPTION: row.description || '',
      CATEGORY_ID: row.category_id || '',
      UNIT_ID: row.unit_id || '',
      COST_PRICE: row.cost_price || 0,
      RETAIL_PRICE: row.retail_price || 0,
    }))
    exportToExcel(exportData, 'product')
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
      const sku = row.SKU || row.sku
      if (!sku) continue

      const existingIndex = newData.findIndex(item => item.sku === sku)
      const itemData = {
        sku,
        barcode: row.BARCODE || row.barcode || '',
        name: row.NAME || row.name || '',
        description: row.DESCRIPTION || row.description || '',
        category_id: row.CATEGORY_ID || row.category_id || '',
        unit_id: row.UNIT_ID || row.unit_id || '',
        cost_price: Number(row.COST_PRICE) || Number(row.cost_price) || 0,
        retail_price: Number(row.RETAIL_PRICE) || Number(row.retail_price) || 0,
        is_active: true,
      }

      if (existingIndex >= 0) {
        if (token) {
          try {
            await updateProduct(token, sku, itemData)
          } catch (err) {
            console.warn('Update failed:', err.message)
          }
        }
        newData[existingIndex] = { ...newData[existingIndex], ...itemData }
        updatedCount++
      } else {
        if (token) {
          try {
            await createProduct(token, itemData)
          } catch (err) {
            console.warn('Create failed:', err.message)
          }
        }
        newData.push({ id: sku, ...itemData })
        addedCount++
      }
    }

    setData(newData)
    setPagination({ ...pagination, total: newData.length })
    setShowImportConfirm(false)
    setPendingImportData(null)
    setToastMessage(`Imported: ${addedCount} new, ${updatedCount} updated`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleCancelImport = () => {
    setShowImportConfirm(false)
    setPendingImportData(null)
  }

  const handleGenerateTemplate = () => {
    generateTemplate(EXCEL_COLUMNS, 'product_template')
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
        <h1 className="master-title">Daftar Product</h1>
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
            <label htmlFor="product-category-filter" className="master-filter-label">Category</label>
            <select
              id="product-category-filter"
              className="master-filter-select"
              value={categoryFilter}
              onChange={(e) => handleCategoryFilter(e.target.value)}
            >
              <option value="">All Category</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="master-filter-wrap">
            <label htmlFor="product-status-filter" className="master-filter-label">Status</label>
            <select
              id="product-status-filter"
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

      {showToast && (
        <div className="toast-notification toast-error">
          <span className="material-icons-round">warning</span>
          <span className="toast-message">{toastMessage}</span>
        </div>
      )}

      <div className="master-table-wrapper" ref={tableRef} tabIndex={0}>
        <div className="master-table-container">
          {pager.isAllRecords && sortedData.length > 100 ? (
            <div 
              className="virtual-table-container" 
              ref={tableContainerRef} 
              onScroll={handleScroll} 
              style={{ overflow: 'auto', maxHeight: '60vh' }}
            >
              <table className="master-table">
                <MasterTableHeader columns={TABLE_COLUMNS} sortConfig={sortConfig} onSort={handleSort} />
                <tbody style={{ display: 'block', height: `${sortedData.length * ROW_HEIGHT}px`, position: 'relative' }}>
                  {visibleRows.map((row, index) => (
                    <tr
                      key={row.id || index}
                      style={{ position: 'absolute', top: `${(virtualOffset + index) * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px`, display: 'table', width: '100%', tableLayout: 'fixed' }}
                      className={selectedId === row.id ? 'master-row-selected' : 'master-row'}
                      onClick={() => handleSelect(row)}
                      onDoubleClick={() => handleEdit()}
                    >
                      <td>{virtualOffset + index + 1}</td>
                      <td>{row.sku || '-'}</td>
                      <td>{row.name || '-'}</td>
                      <td>{row.category?.name || row.categoryName || categoryNameById.get(String(row.category_id || '')) || '-'}</td>
                      <td>{row.unit?.name || row.unitName || unitNameById.get(String(row.unit_id || '')) || '-'}</td>
                      <td>{Number(row.retail_price || 0).toLocaleString()}</td>
                      <td>
                        <MasterStatusToggle
                          active={isActiveProduct(row)}
                          loading={togglingId === row.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleStatus(row)
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
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
                    <td>{row.sku || '-'}</td>
                    <td>{row.name || '-'}</td>
                    <td>{row.category?.name || row.categoryName || categoryNameById.get(String(row.category_id || '')) || '-'}</td>
                    <td>{row.unit?.name || row.unitName || unitNameById.get(String(row.unit_id || '')) || '-'}</td>
                    <td>{Number(row.retail_price || 0).toLocaleString()}</td>
                    <td>
                      <MasterStatusToggle
                        active={isActiveProduct(row)}
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
          )}
        </div>
      </div>

      {showForm && (
        <div className="master-form-card">
   
          <div className="master-form-header">
            <span className="material-icons-round master-form-icon">inventory_2</span>
            <h2 className="master-form-title">{isNewMode ? 'Isi Data Product' : 'Ubah Data Product'}</h2>
            <div className="product-form-tabs">
              <button
                type="button"
                className={`product-form-tab ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                General
              </button>
              {selectedItem && (
                <>
                  {isStockManagedCategory && (
                    <button
                      type="button"
                      className={`product-form-tab ${activeTab === 'adjustStock' ? 'active' : ''}`}
                      onClick={() => setActiveTab('adjustStock')}
                    >
                      Adjust Stock
                    </button>
                  )}
                  {!isConsumableCategory && !isClinic && (
                    <button
                      type="button"
                      className={`product-form-tab ${activeTab === 'hargaGrosir' ? 'active' : ''}`}
                      onClick={() => setActiveTab('hargaGrosir')}
                    >
                      Harga Grosir
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          {activeTab === 'general' && (
            <div className="master-form-grid">
              <div className="master-form-group">
                <label className="master-form-label">SKU :</label>
                <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="master-form-input" />
              </div>
              <div className="master-form-group">
                <label className="master-form-label">Barcode :</label>
                <input type="text" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="master-form-input" />
              </div>
              <div className="master-form-group-wide">
                <label className="master-form-label">Nama :</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="master-form-input" />
              </div>
              <div className="master-form-group-wide">
                <label className="master-form-label">Deskripsi :</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="master-form-input" />
              </div>
              <div className="master-form-group">
                <label className="master-form-label">Category :</label>
                <select value={form.category_id} onChange={(e) => handleCategoryChange(e.target.value)} className="master-form-input">
                  <option value="">(none)</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div className="master-form-group">
                <label className="master-form-label">Unit :</label>
                <select value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: e.target.value })} className="master-form-input">
                  <option value="">Select unit...</option>
                  {units.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              {!isServiceCategory && (
                <div className="master-form-group">
                  <label className="master-form-label">Cost :</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="number" value={form.cost_price} readOnly className="master-form-input master-form-input-readonly" />
                    <button
                      type="button"
                      className="master-search-btn"
                      title="History Hpp"
                      onClick={handleOpenHppHistory}
                      disabled={isNewMode || !selectedProductForHistory?.id}
                      style={{ minWidth: 40, opacity: isNewMode || !selectedProductForHistory?.id ? 0.55 : 1 }}
                    >
                      <span className="material-icons-round material-icon">history</span>
                    </button>
                  </div>
                </div>
              )}
              {!isConsumableCategory && (
                <div className="master-form-group">
                  <label className="master-form-label">Harga Jual :</label>
                  <input type="number" value={form.retail_price} onChange={(e) => setForm({ ...form, retail_price: Number(e.target.value) })} className="master-form-input" />
                </div>
              )}
              <div className="master-form-group">
                <label className="master-form-label">Tax Rate :</label>
                <input type="number" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })} className="master-form-input" />
              </div>
              {isStockManagedCategory && (
                <div className="master-form-group">
                  <label className="master-form-label">Reorder :</label>
                  <input type="number" value={form.reorder_point} onChange={(e) => setForm({ ...form, reorder_point: Number(e.target.value) })} className="master-form-input" />
                </div>
              )}
            </div>
          )}

          {activeTab === 'adjustStock' && isStockManagedCategory && (
            <div className="master-form-grid">
             <div className="master-form-group"></div>
              <div className="master-form-group">
                <label className="master-form-label">SKU :</label>
                <input type="text" value={form.sku} readOnly className="master-form-input master-form-input-readonly" />
              </div>
              <div className="master-form-group">
                <label className="master-form-label">Nama Product :</label>
                <input type="text" value={form.name} readOnly className="master-form-input master-form-input-readonly" />
              </div>
                <div className="master-form-group"></div>
                <div className="master-form-group"></div>
                <div className="master-form-group"></div>
               
              <div className="master-form-group-wide">
                <label className="master-form-label">Warehouse *:      {adjustForm.warehouse_id && (
                  <span className="master-form-info-text">
                    System Stock: <span className="text-blue">{adjustForm.system_stock} {selectedItem?.unit_name || selectedItem?.unit?.name || '-'}</span>
                  </span>
                )}</label>
                <select
                  value={adjustForm.warehouse_id}
                  onChange={(e) => {
                    setAdjustForm({ ...adjustForm, warehouse_id: e.target.value, system_stock: 0, physical_stock: 0 })
                    if (selectedItem && token) {
                      fetchSystemStock(selectedItem.id, e.target.value)
                    }
                  }}
                  className="master-form-input"
                >
                  <option value="">Select warehouse...</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name || warehouse.code || '-'}
                    </option>
                  ))}
                </select>
           
              </div>
              <div className="master-form-group-wide">
                <label className="master-form-label">Physical Stock *: {adjustForm.physical_stock > 0 && (
                  <span className="master-form-info-text">
                    Variance: <span className={`text-orange ${variance < 0 ? 'text-red' : ''}`}>{variance} {selectedItem?.unit_name || selectedItem?.unit?.name || '-'}</span>
                  </span>
                )}</label>
                <input
                  type="number"
                  value={adjustForm.physical_stock}
                  onChange={(e) => setAdjustForm({ ...adjustForm, physical_stock: Number(e.target.value) })}
                  className="master-form-input"
                  placeholder="Enter physical stock..."
                />
               
              </div>
              <div className="master-form-group">
                <label className="master-form-label">Reason *:</label>
                <select
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="master-form-input"
                >
                  <option value="">Select reason...</option>
                  {ADJUST_REASON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
      

            
          )}

          {activeTab === 'hargaGrosir' && !isConsumableCategory && !isClinic && (
            <div className="master-form-grid">   <div className="master-form-group"></div>
              <div className="master-form-group">
                <label className="master-form-label">SKU :</label>
                <input type="text" value={form.sku} readOnly className="master-form-input master-form-input-readonly" />
              </div>
              <div className="master-form-group">
                <label className="master-form-label">Nama Product :</label>
                <input type="text" value={form.name} readOnly className="master-form-input master-form-input-readonly" />
              </div>
                  <div className="master-form-group">

                     <label className="master-form-label">Harga Jual :</label>
                <input type="number" value={form.retail_price} readOnly className="master-form-input master-form-input-readonly" />

        
           
                  </div>
                      <div className="master-form-group"></div>
                         <div className="master-form-group"></div>
                      
              <div className="master-form-group">
                <label className="master-form-label">Harga Grosir 1 / Qty :</label>
                <div className="price-qty-row">Rp.
                  <input
                    type="number"
                    value={priceTierData[0].unit_price}
                    onChange={(e) => {
                      const newData = [...priceTierData]
                      newData[0] = { ...newData[0], unit_price: Number(e.target.value) }
                      setPriceTierData(newData)
                    }}
                    className="master-form-input price-input"
                    placeholder="Harga..."
                  />
                  <span className="price-qty-separator">/</span>
                  <input
                    type="number"
                    value={priceTierData[0].min_quantity}
                    onChange={(e) => {
                      const newData = [...priceTierData]
                      newData[0] = { ...newData[0], min_quantity: Number(e.target.value) }
                      setPriceTierData(newData)
                    }}
                    className="master-form-input qty-input"
                    placeholder="Qty..."
                  />
                </div>
              </div>
              <div className="master-form-group">
                <label className="master-form-label">Harga Grosir 2 / Qty :</label>
                <div className="price-qty-row">Rp.
                  <input
                    type="number"
                    value={priceTierData[1].unit_price}
                    onChange={(e) => {
                      const newData = [...priceTierData]
                      newData[1] = { ...newData[1], unit_price: Number(e.target.value) }
                      setPriceTierData(newData)
                    }}
                    className="master-form-input price-input"
                    placeholder="Harga..."
                  />
                  <span className="price-qty-separator">/</span>
                  <input
                    type="number"
                    value={priceTierData[1].min_quantity}
                    onChange={(e) => {
                      const newData = [...priceTierData]
                      newData[1] = { ...newData[1], min_quantity: Number(e.target.value) }
                      setPriceTierData(newData)
                    }}
                    className="master-form-input qty-input"
                    placeholder="Qty..."
                  />
                </div>
              </div>
              <div className="master-form-group">
                <label className="master-form-label">Harga Grosir 3 / Qty :</label>
                <div className="price-qty-row">Rp.
                  <input
                    type="number"
                    value={priceTierData[2].unit_price}
                    onChange={(e) => {
                      const newData = [...priceTierData]
                      newData[2] = { ...newData[2], unit_price: Number(e.target.value) }
                      setPriceTierData(newData)
                    }}
                    className="master-form-input price-input"
                    placeholder="Harga..."
                  />
                  <span className="price-qty-separator">/</span>
                  <input
                    type="number"
                    value={priceTierData[2].min_quantity}
                    onChange={(e) => {
                      const newData = [...priceTierData]
                      newData[2] = { ...newData[2], min_quantity: Number(e.target.value) }
                      setPriceTierData(newData)
                    }}
                    className="master-form-input qty-input"
                    placeholder="Qty..."
                  />
                </div>
              </div>
            </div>
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
        excelFilename="product"
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

      {showHppHistoryModal && (
        <div className="delete-master-overlay" onClick={() => setShowHppHistoryModal(false)}>
          <div className="stock-card-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-master-header">
              <div className="stock-card-header-left">
                <span className="material-icons-round material-icon orange">history</span>
                <h2>History Hpp</h2>
              </div>
              <div className="stock-card-header-right">
                <div className="sale-detail-meta">
                  <div className="sale-detail-meta-item">
                    <span className="sale-detail-meta-label">Product</span>
                    <span className="sale-detail-meta-value">{hppHistoryData?.name || selectedProductForHistory?.name || '-'}</span>
                  </div>
                  <div className="sale-detail-meta-item">
                    <span className="sale-detail-meta-label">SKU</span>
                    <span className="sale-detail-meta-value">{hppHistoryData?.sku || selectedProductForHistory?.sku || '-'}</span>
                  </div>
                  <div className="sale-detail-meta-item">
                    <span className="sale-detail-meta-label">Current HPP</span>
                    <span className="sale-detail-meta-value">{formatCurrency(hppHistoryData?.current_cost_price ?? form.cost_price)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stock-card-body">
              {isLoadingHppHistory && (
                <div className="stock-card-loading">
                  <span className="material-icons-round animate-spin">sync</span>
                  <span>Memuat History Hpp...</span>
                </div>
              )}

              {hppHistoryError && !isLoadingHppHistory && !hppHistoryData && (
                <div className="stock-card-error">
                  <span className="material-icons-round material-icon red">error</span>
                  <span>{hppHistoryError}</span>
                </div>
              )}

              {!isLoadingHppHistory && (hppHistoryData || !hppHistoryError) && (
                <div className="master-table-container">
                  <table className="master-table">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Event</th>
                        <th>Referensi</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Unit Cost</th>
                        <th className="text-right">HPP</th>
                        <th>Warehouse</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(hppHistoryData?.events || []).map((event, index) => (
                        <tr key={`${event.reference_id}-${event.seq}`} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                          <td>{formatDateTime(event.event_date)}</td>
                          <td>{event.event_type === 'OPENING_STOCK' ? 'Opening Stock' : 'Purchase Receive'}</td>
                          <td>{event.reference_number || '-'}</td>
                          <td className="text-right">{Number(event.qty || 0).toLocaleString('id-ID')}</td>
                          <td className="text-right">{formatCurrency(event.unit_cost)}</td>
                          <td className="text-right">{formatCurrency(event.hpp)}</td>
                          <td>{event.warehouse_name || '-'}</td>
                          <td>{event.notes || '-'}</td>
                        </tr>
                      ))}
                      {!isLoadingHppHistory && (hppHistoryData?.events || []).length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center">Belum ada histori HPP untuk product ini</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="stock-card-footer">
              <div className="stock-card-footer-left">
                <button type="button" className="master-footer-btn" onClick={() => setShowHppHistoryModal(false)}>
                  <span className="material-icons-round master-footer-icon red">exit_to_app</span>
                </button>
              </div>
              <div className="stock-card-footer-right">
                <span className="stock-card-total-row">Total Row: {(hppHistoryData?.events || []).length}</span>
                <span className="stock-card-total-row sale-detail-footer-total">Current HPP: {formatCurrency(hppHistoryData?.current_cost_price ?? form.cost_price)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <Toast message={toastMessage} type="success" onClose={() => setShowToast(false)} />
      )}
    </div>
  )
}
