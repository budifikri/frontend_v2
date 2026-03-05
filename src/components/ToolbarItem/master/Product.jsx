import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import { listCategories } from '../../../features/master/category/category.api'
import { listUnits } from '../../../features/master/unit/unit.api'
import { listWarehouses } from '../../../features/master/warehouse/warehouse.api'
import { createProduct, deleteProduct, listProducts, updateProduct } from '../../../features/master/product/product.api'
import { adjustStock } from '../../../features/laporan/stock/stock.api'
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
  const [showAdjustStock, setShowAdjustStock] = useState(false)
  const [adjustForm, setAdjustForm] = useState({ warehouse_id: '', reason: '', quantity: 0, notes: '' })
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

      setData(result.items || [])
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

  useEffect(() => {
    if (showAdjustStock && token && warehouses.length === 0) {
      fetchWarehouses()
    }
  }, [showAdjustStock, token, warehouses.length, fetchWarehouses])

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
        if (selectedItem) await updateProduct(token, selectedItem.id, payload)
        else await createProduct(token, payload)
        await fetchData()

      if (showAdjustStock && selectedItem && adjustForm.quantity !== 0) {
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
        const adjustmentType = adjustForm.quantity > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT'
        const warehouseId = selectedItem.warehouse_id || selectedItem.warehouse?.id
        await adjustStock(token, {
          product_id: selectedItem.id,
          warehouse_id: warehouseId || adjustForm.warehouse_id,
          adjustment_type: adjustmentType,
          quantity: Math.abs(adjustForm.quantity),
          reason: adjustForm.reason,
          notes: adjustForm.notes,
        })
        setShowAdjustStock(false)
        setAdjustForm({ warehouse_id: '', reason: '', quantity: 0, notes: '' })
        setError('')
      }
      } else {
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
    setShowForm(true)
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
    setShowAdjustStock(false)
    setAdjustForm({ warehouse_id: '', reason: '', quantity: 0, notes: '' })
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
          </div>
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
              <label className="master-form-label">Retail :</label>
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
            {showAdjustStock && (
              <div className="master-form-section">
                <div className="master-form-group">
                  <label className="master-form-label">Stock Difference :</label>
                  <input
                    type="number"
                    value={adjustForm.quantity}
                    onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
                    className="master-form-input"
                    placeholder="Jumlah stok"
                  />
                </div>
                <div className="master-form-group">
                  <label className="master-form-label">Warehouse :</label>
                  <select
                    value={adjustForm.warehouse_id}
                    onChange={(e) => setAdjustForm({ ...adjustForm, warehouse_id: e.target.value })}
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
                <div className="master-form-group">
                  <label className="master-form-label">Reason :</label>
                  <input
                    type="text"
                    value={adjustForm.reason}
                    onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                    className="master-form-input"
                    placeholder="Alasan penyesuaian"
                  />
                </div>
                <div className="master-form-group">
                  <label className="master-form-label">Notes :</label>
                  <input
                    type="text"
                    value={adjustForm.notes}
                    onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                    className="master-form-input"
                    placeholder="Catatan (opsional)"
                  />
                </div>
              </div>
            )}

            <FooterFormMaster
              onSave={handleSave}
              onCancel={handleCancelForm}
              isSaving={isSaving}
              leftButtons={
                selectedItem && (
                <button
                  type="button"
                  className={`user-password-toggle ${showAdjustStock ? 'is-on' : 'is-off'}`}
                  onClick={() => {
                    setShowAdjustStock((prev) => {
                      const next = !prev
                      if (next && token) {
                        fetchWarehouses()
                      }
                      return next
                    })
                  }}
                  title="Adjust Stock"
                >
                  Adjust Stock
                </button>
                )
              }
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
