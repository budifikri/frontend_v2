import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import { listCategories } from '../../../features/master/category/category.api'
import { listUnits } from '../../../features/master/unit/unit.api'
import { listWarehouses } from '../../../features/master/warehouse/warehouse.api'
import { createProduct, deleteProduct, listProducts, updateProduct } from '../../../features/master/product/product.api'
import { adjustStock } from '../../../features/laporan/stock/stock.api'
import { getProductStock } from '../../../features/master/stock-opname/stockOpname.api'
import { getPriceTier, updatePriceTier } from '../../../features/master/price-tier/priceTier.api'
import { FooterMaster } from '../footer/FooterMaster'
import { FooterFormMaster } from '../footer/FooterFormMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { MasterStatusToggle } from '../table/MasterStatusToggle'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'

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
  { id: 'CAT001', name: 'Makanan' },
  { id: 'CAT002', name: 'Minuman' },
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

function isActiveProduct(item) {
  if (typeof item?.is_active === 'boolean') return item.is_active
  return String(item?.status ?? 'active').toLowerCase() !== 'inactive'
}

function normalizeProductItem(raw, index) {
  return {
    id: raw?.id || `product-${index}`,
    sku: raw?.sku || raw?.product_sku || raw?.code || raw?.product_code || '-',
    barcode: raw?.barcode || raw?.product_barcode || '',
    name: raw?.name || raw?.product_name || '-',
    description: raw?.description || raw?.product_description || '',
    category_id: raw?.category_id || raw?.category?.id || '',
    category: raw?.category || { id: raw?.category_id || '', name: raw?.category_name || '-' },
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
  const token = auth?.token

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
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [priceTierData, setPriceTierData] = useState(DEFAULT_PRICE_TIER)
  const [adjustForm, setAdjustForm] = useState({
    warehouse_id: '',
    reason: '',
    system_stock: 0,
    physical_stock: 0,
  })
  const [togglingId, setTogglingId] = useState(null)

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
      setCategories(catRes.items || [])
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

  const variance = useMemo(() => {
    return adjustForm.physical_stock - adjustForm.system_stock
  }, [adjustForm.physical_stock, adjustForm.system_stock])

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
  }, [showDeleteConfirm, showForm, selectedItem, data])

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
      cost_price: Number(form.cost_price || 0),
      retail_price: Number(form.retail_price || 0),
      tax_rate: Number(form.tax_rate || 0),
      reorder_point: Number(form.reorder_point || 0),
    }

    try {
      if (token) {
        if (selectedItem) {
          await updateProduct(token, selectedItem.id, payload)
          // Optimistically update local data with the new values
          setData((prev) => prev.map((row) => {
            if (row.id === selectedItem.id) {
              return { 
                ...row, 
                ...payload,
                // Preserve nested objects
                category: row.category || { id: payload.category_id || '', name: '' },
                unit: row.unit || { id: payload.unit_id || '', name: '' },
              }
            }
            return row
          }))
        } else {
          await createProduct(token, payload)
          // For new items, refresh to get the actual ID from server
          await fetchData()
        }
        
        // Handle stock adjustment if on adjustStock tab
        if (activeTab === 'adjustStock' && selectedItem) {
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
        
        // Save price tiers
        const validTiers = priceTierData.filter(t => t.unit_price > 0)
        if (validTiers.length > 0) {
          try {
            const priceTierPayload = {
              product_id: selectedItem?.id,
              tiers: validTiers.map(t => ({
                tier_name: t.tier_name,
                min_quantity: Number(t.min_quantity || 1),
                unit_price: Number(t.unit_price || 0),
              })),
            }
            await updatePriceTier(token, selectedItem.id, priceTierPayload)
          } catch (err) {
            console.error('[Product] Failed to save price tier:', err)
          }
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

      setForm(DEFAULT_FORM)
      setSelectedId(null)
      setShowForm(false)
    } catch (err) {
      setError(err.message || 'Failed to save product')
    } finally {
      setIsSaving(false)
    }
  }

  function handleSelect(row) {
    setSelectedId(row.id)
  }

  function handleNew() {
    setSelectedId(null)
    setForm(DEFAULT_FORM)
    setActiveTab('general')
    setPriceTierData(DEFAULT_PRICE_TIER)
    setShowForm(true)
  }

  function handleEdit() {
    const target = selectedItem || data[0]
    if (!target) return

    setSelectedId(target.id)
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
    
    setShowForm(true)
  }

  async function loadPriceTierData(productId) {
    try {
      const result = await getPriceTier(token, productId)
      if (result.data && Array.isArray(result.data)) {
        const tiers = [...DEFAULT_PRICE_TIER]
        result.data.forEach((tier, idx) => {
          if (idx < 3) {
            tiers[idx] = {
              tier_name: tier.tier_name || `Grosir ${idx + 1}`,
              min_quantity: Number(tier.min_quantity || 1),
              unit_price: Number(tier.unit_price || 0),
            }
          }
        })
        setPriceTierData(tiers)
      }
    } catch (err) {
      console.error('[Product] Failed to load price tier:', err)
      setPriceTierData(DEFAULT_PRICE_TIER)
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


  function handleCancelForm() {
    setShowForm(false)
    setForm(DEFAULT_FORM)
    setActiveTab('general')
    setPriceTierData(DEFAULT_PRICE_TIER)
    setAdjustForm({ warehouse_id: '', reason: '', system_stock: 0, physical_stock: 0 })
  }

  function handlePrint() {
    setShowForm(false)
    window.print()
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

      <div className="master-table-wrapper">
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
        </div>
      </div>

      {showForm && (
        <div className="master-form-card">
          <div className="master-form-header">
            <span className="material-icons-round master-form-icon">inventory_2</span>
            <h2 className="master-form-title">{selectedItem ? 'Ubah Data Product' : 'Isi Data Product'}</h2>
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
                  <button
                    type="button"
                    className={`product-form-tab ${activeTab === 'adjustStock' ? 'active' : ''}`}
                    onClick={() => setActiveTab('adjustStock')}
                  >
                    Adjust Stock
                  </button>
                  <button
                    type="button"
                    className={`product-form-tab ${activeTab === 'hargaGrosir' ? 'active' : ''}`}
                    onClick={() => setActiveTab('hargaGrosir')}
                  >
                    Harga Grosir
                  </button>
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
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="master-form-input">
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
              <div className="master-form-group">
                <label className="master-form-label">Cost :</label>
                <input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })} className="master-form-input" />
              </div>
              <div className="master-form-group">
                <label className="master-form-label">Harga Jual :</label>
                <input type="number" value={form.retail_price} onChange={(e) => setForm({ ...form, retail_price: Number(e.target.value) })} className="master-form-input" />
              </div>
              <div className="master-form-group">
                <label className="master-form-label">Tax Rate :</label>
                <input type="number" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })} className="master-form-input" />
              </div>
              <div className="master-form-group">
                <label className="master-form-label">Reorder :</label>
                <input type="number" value={form.reorder_point} onChange={(e) => setForm({ ...form, reorder_point: Number(e.target.value) })} className="master-form-input" />
              </div>
            </div>
          )}

          {activeTab === 'adjustStock' && (
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

          {activeTab === 'hargaGrosir' && (
            <div className="master-form-grid">   <div className="master-form-group"></div>
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
                      
              <div className="master-form-group">
                <label className="master-form-label">Harga Grosir 1 :</label>
                <div className="price-qty-row">
                  <input
                    type="number"
                    value={priceTierData[0].unit_price}
                    onChange={(e) => {
                      const newData = [...priceTierData]
                      newData[0] = { ...newData[0], unit_price: Number(e.target.value) }
                      setPriceTierData(newData)
                    }}
                    className="master-form-input"
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
                    className="master-form-input"
                    placeholder="Qty..."
                  />
                </div>
              </div>
              <div className="master-form-group">
                <label className="master-form-label">Harga Grosir 2 :</label>
                <div className="price-qty-row">
                  <input
                    type="number"
                    value={priceTierData[1].unit_price}
                    onChange={(e) => {
                      const newData = [...priceTierData]
                      newData[1] = { ...newData[1], unit_price: Number(e.target.value) }
                      setPriceTierData(newData)
                    }}
                    className="master-form-input"
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
                    className="master-form-input"
                    placeholder="Qty..."
                  />
                </div>
              </div>
              <div className="master-form-group">
                <label className="master-form-label">Harga Grosir 3 :</label>
                <div className="price-qty-row">
                  <input
                    type="number"
                    value={priceTierData[2].unit_price}
                    onChange={(e) => {
                      const newData = [...priceTierData]
                      newData[2] = { ...newData[2], unit_price: Number(e.target.value) }
                      setPriceTierData(newData)
                    }}
                    className="master-form-input"
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
                    className="master-form-input"
                    placeholder="Qty..."
                  />
                </div>
              </div>
            </div>
          )}

          <FooterFormMaster
            onSave={handleSave}
            onCancel={handleCancelForm}
            isSaving={isSaving}
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
    </div>
  )
}
