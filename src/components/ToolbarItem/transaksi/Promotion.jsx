import { useCallback, useEffect, useState, useRef } from 'react'
import { useAuth } from '../../../shared/auth'
import {
  createPromotion,
  deactivatePromotion,
  listPromotions,
  updatePromotion,
} from '../../../features/master/promotion/promotion.api'
import { listCategories } from '../../../features/master/category/category.api'
import { listProducts } from '../../../features/master/product/product.api'
import { FooterMaster } from '../footer/FooterMaster'
import { FooterFormMaster } from '../footer/FooterFormMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { MasterStatusToggle } from '../table/MasterStatusToggle'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'
import { useMasterTableKeyboardNav } from '../../../hooks/useMasterTableKeyboardNav'

const DEFAULT_FORM = {
  code: '',
  name: '',
  promo_type: 'percentage',
  scope_type: 'all',
  category_ids: [],
  product_ids: [],
  discount_value: 0,
  buy_quantity: 1,
  get_quantity: 1,
  start_date: '',
  start_time: '',
  end_date: '',
  end_time: '',
  description: '',
}

const DUMMY_PROMOTIONS = [
  {
    id: 'PROM001',
    code: 'PROM001',
    name: 'Diskon 10%',
    promo_type: 'percentage',
    scope_type: 'all',
    discount_value: 10,
    start_date: '2026-01-01',
    end_date: '2026-01-31',
    is_active: true,
  },
  {
    id: 'PROM002',
    code: 'PROM002',
    name: 'Buy 3 Get 1',
    promo_type: 'buy_x_get_y',
    scope_type: 'all',
    buy_quantity: 3,
    get_quantity: 1,
    start_date: '2026-02-01',
    end_date: '2026-02-28',
    is_active: true,
  },
  {
    id: 'PROM003',
    code: 'PROM003',
    name: 'Diskon Rp 5000',
    promo_type: 'fixed_amount',
    scope_type: 'all',
    discount_value: 5000,
    start_date: '2026-03-01',
    end_date: '2026-03-31',
    is_active: false,
  },
]

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false },
  { key: 'code', label: 'KODE' },
  { key: 'name', label: 'NAMA' },
  { key: 'promo_type', label: 'TIPE' },
  { key: 'scope_type', label: 'SCOPE' },
  { key: 'discount_value', label: 'DISKON' },
  { key: 'start_date', label: 'MULAI' },
  { key: 'end_date', label: 'AKHIR' },
  { key: 'is_active', label: 'STATUS' },
]

const PROMO_TYPE_OPTIONS = [
  { value: 'percentage', label: 'Discount Percentage' },
  { value: 'fixed_amount', label: 'Discount Fixed Amount' },
  { value: 'buy_x_get_y', label: 'Buy X Get Y Free' },
  { value: 'flash_sale', label: 'Flash Sale' },
]

function generatePromotionCode(promoType, dataList = []) {
  const prefixMap = {
    percentage: 'DP',
    fixed_amount: 'DA',
    buy_x_get_y: 'BG',
    flash_sale: 'FL',
  }

  const prefix = prefixMap[promoType] || 'DP'
  const sameTypeCodes = dataList
    .filter((item) => item.promo_type === promoType)
    .map((item) => item.code)
    .filter((code) => code && code.startsWith(prefix))

  let sequence = 1
  while (sameTypeCodes.includes(`${prefix}${String(sequence).padStart(5, '0')}`)) {
    sequence++
  }

  return `${prefix}${String(sequence).padStart(5, '0')}`
}

const SCOPE_TYPE_OPTIONS = [
  { value: 'all', label: 'All Products' },
  { value: 'by_category', label: 'By Category' },
  { value: 'by_product', label: 'By Product' },
]

function isActivePromotion(item) {
  return Boolean(item?.is_active ?? true)
}

function normalizePromoType(type) {
  const typeMap = {
    'percentage': 'percentage',
    'PERCENTAGE': 'percentage',
    'fixed_amount': 'fixed_amount',
    'FIXED_AMOUNT': 'fixed_amount',
    'buy_x_get_y': 'buy_x_get_y',
    'BUY_X_GET_Y': 'buy_x_get_y',
    'flash_sale': 'flash_sale',
    'FLASH_SALE': 'flash_sale',
  }
  return typeMap[type] || type || 'percentage'
}

function normalizeScopeType(scope) {
  const scopeMap = {
    'all': 'all',
    'ALL': 'all',
    'by_category': 'by_category',
    'BY_CATEGORY': 'by_category',
    'by_product': 'by_product',
    'BY_PRODUCT': 'by_product',
  }
  return scopeMap[scope] || scope || 'all'
}

function formatPromoType(type) {
  const normalized = normalizePromoType(type)
  const found = PROMO_TYPE_OPTIONS.find((opt) => opt.value === normalized)
  return found ? found.label : type || '-'
}

function formatScopeType(type) {
  const normalized = normalizeScopeType(type)
  const found = SCOPE_TYPE_OPTIONS.find((opt) => opt.value === normalized)
  return found ? found.label : type || '-'
}

function formatDiscountValue(item) {
  const promoType = normalizePromoType(item.promo_type)
  if (promoType === 'percentage') {
    return `${item.discount_value || 0}%`
  }
  if (promoType === 'fixed_amount') {
    return `Rp ${Number(item.discount_value || 0).toLocaleString('id-ID')}`
  }
  if (promoType === 'buy_x_get_y') {
    return `Buy ${item.buy_quantity || 1} Get ${item.get_quantity || 1}`
  }
  return '-'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateForInput(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function Promotion({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [categorySearch, setCategorySearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
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
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const tableRef = useRef(null)
  const [togglingId, setTogglingId] = useState(null)

  const fetchData = useCallback(async () => {
    setError('')
    setIsLoading(true)

    if (!token) {
      const keyword = searchKeyword.trim().toLowerCase()
      const filtered = DUMMY_PROMOTIONS.filter((item) => {
        const active = isActivePromotion(item)
        if (isActiveFilter === 'active' && !active) return false
        if (isActiveFilter === 'inactive' && active) return false
        if (!keyword) return true

        return (
          String(item.code || '').toLowerCase().includes(keyword) ||
          String(item.name || '').toLowerCase().includes(keyword) ||
          String(item.promo_type || '').toLowerCase().includes(keyword)
        )
      })

      const rows = filtered.slice(offset, offset + limit)
      setData(rows)
      setPagination({ total: filtered.length, has_more: offset + limit < filtered.length })
      setIsLoading(false)
      return
    }

    try {
      const result = await listPromotions(token, {
        search: searchKeyword.trim() || undefined,
        limit,
        offset,
        is_active: isActiveFilter === 'all' ? undefined : isActiveFilter === 'active',
        include_inactive: isActiveFilter === 'all' ? true : undefined,
      })
      const items = result.items || []
      const nextPagination = result.pagination || {}

      setData(items)
      setPagination({
        total: Number(nextPagination.total ?? 0),
        has_more: Boolean(nextPagination.has_more),
      })
    } catch (err) {
      setError(err.message || 'Failed to load promotions')
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
    initialKey: 'code',
    valueGetters: {
      is_active: (row) => (isActivePromotion(row) ? 1 : 0),
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
        onExit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeleteConfirm, showForm, selectedItem, data])

  async function handleSave() {
    if (!form.code || !form.name) return
    setIsSaving(true)
    setError('')

    try {
      const payload = {
        code: form.code,
        name: form.name,
        promo_type: form.promo_type,
        scope_type: form.scope_type,
        category_ids: form.scope_type === 'by_category' ? form.category_ids : undefined,
        product_ids: form.scope_type === 'by_product' ? form.product_ids : undefined,
        discount_value: Number(form.discount_value || 0),
        buy_quantity: Number(form.buy_quantity || 1),
        get_quantity: Number(form.get_quantity || 1),
        start_date: form.start_date || undefined,
        start_time: form.promo_type === 'flash_sale' ? form.start_time || undefined : undefined,
        end_date: form.end_date || undefined,
        end_time: form.promo_type === 'flash_sale' ? form.end_time || undefined : undefined,
        description: form.description || undefined,
      }

      if (token) {
        if (selectedItem) await updatePromotion(token, selectedItem.id, payload)
        else await createPromotion(token, payload)
        await fetchData()
      } else {
        if (selectedItem) {
          setData((prev) => prev.map((row) => (row.id === selectedItem.id ? { ...row, ...payload } : row)))
        } else {
          setData((prev) => [{ id: form.code, ...payload, is_active: true }, ...prev])
        }
      }

      setForm(DEFAULT_FORM)
      setSelectedId(null)
      setShowForm(false)
    } catch (err) {
      setError(err.message || 'Failed to save promotion')
    } finally {
      setIsSaving(false)
    }
  }

  function handleSelect(row) {
    setSelectedId(row.id)
  }

  function handleNew() {
    const autoCode = generatePromotionCode(DEFAULT_FORM.promo_type, data)
    setSelectedId(null)
    setForm({ ...DEFAULT_FORM, code: autoCode })
    setShowForm(true)
  }

  function handleEdit() {
    const target = selectedItem || data[0]
    if (!target) return
    setSelectedId(target.id)
    setForm({
      code: target.code || '',
      name: target.name || '',
      promo_type: normalizePromoType(target.promo_type) || 'percentage',
      scope_type: normalizeScopeType(target.scope_type) || 'all',
      category_ids: target.category_ids || [],
      product_ids: target.product_ids || [],
      discount_value: target.discount_value || 0,
      buy_quantity: target.buy_quantity || 1,
      get_quantity: target.get_quantity || 1,
      start_date: formatDateForInput(target.start_date) || '',
      start_time: target.start_time || '',
      end_date: formatDateForInput(target.end_date) || '',
      end_time: target.end_time || '',
      description: target.description || '',
    })
    setShowForm(true)
  }

  function handleDeleteClick() {
    if (selectedItem) setShowDeleteConfirm(true)
  }

  useMasterTableKeyboardNav({
    data: sortedData,
    selectedId,
    setSelectedId,
    handleEdit,
    tableRef,
    isModalOpen: showForm || showDeleteConfirm,
  })

  async function handleConfirmDelete() {
    if (!selectedItem) {
      setShowDeleteConfirm(false)
      return
    }

    try {
      if (token) {
        await deactivatePromotion(token, selectedItem.id)
        await fetchData()
      } else {
        setData((prev) => prev.filter((row) => row.id !== selectedItem.id))
      }
    } catch (err) {
      setError(err.message || 'Failed to delete promotion')
    } finally {
      setShowDeleteConfirm(false)
      setShowForm(false)
      setSelectedId(null)
      setForm(DEFAULT_FORM)
    }
  }

  async function handleToggleStatus(row) {
    if (!row?.id || togglingId) return
    const nextIsActive = !isActivePromotion(row)

    if (token) {
      setTogglingId(row.id)
      try {
        await updatePromotion(token, row.id, { is_active: nextIsActive })
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

  function handlePrint() {
    setShowForm(false)
    window.print()
  }

  function handleExitClick() {
    onExit()
  }

  function handleCancelForm() {
    setShowForm(false)
    setForm(DEFAULT_FORM)
  }

  function handlePromoTypeChange(value) {
    if (selectedItem) {
      setForm({ ...form, promo_type: value })
    } else {
      const newCode = generatePromotionCode(value, data)
      setForm({ ...form, promo_type: value, code: newCode })
    }
  }

  function handleScopeTypeChange(value) {
    setForm({ ...form, scope_type: value, category_ids: value === 'by_category' ? form.category_ids : [], product_ids: value === 'by_product' ? form.product_ids : [] })
  }

  const fetchLookups = useCallback(async () => {
    if (!token) return
    try {
      const [catRes, prodRes] = await Promise.all([
        listCategories(token, { limit: 1000, is_active: true }),
        listProducts(token, { limit: 1000, is_active: true }),
      ])
      setCategories(catRes.items || [])
      setProducts(prodRes.items || [])
    } catch (err) {
      console.error('Failed to fetch lookups:', err)
    }
  }, [token])

  useEffect(() => {
    fetchLookups()
  }, [fetchLookups])

  return (
    <div className="master-content">
      <div className="master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Daftar Promotion</h1>
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
            <label htmlFor="promotion-status-filter" className="master-filter-label">Status</label>
            <select
              id="promotion-status-filter"
              className="master-filter-select"
              value={isActiveFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="master-filter-wrap">
            <label className="checkbox-all-records">
              <input
                type="checkbox"
                checked={pager.isAllRecords}
                onChange={(e) => pager.toggleAllRecords(e.target.checked)}
              />
              <span>All Records</span>
            </label>
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
                  <td>{row.code || '-'}</td>
                  <td>{row.name || '-'}</td>
                  <td>{formatPromoType(row.promo_type)}</td>
                  <td>{formatScopeType(row.scope_type)}</td>
                  <td>{formatDiscountValue(row)}</td>
                  <td>{formatDate(row.start_date)}</td>
                  <td>{formatDate(row.end_date)}</td>
                  <td>
                    <MasterStatusToggle
                      active={isActivePromotion(row)}
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
                  <td colSpan={10} className="text-center">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="master-form-card">
          <div className="master-form-header">
            <span className="material-icons-round master-form-icon">local_offer</span>
            <h2 className="master-form-title">
              {selectedItem ? 'Ubah Data Promotion' : 'Isi Data Promotion'}
            </h2>
          </div>
          <div className="master-form-grid">
            <div className="master-form-group">
              <label className="master-form-label">Kode :</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="master-form-input"
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Nama :</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="master-form-input"
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Tipe Promotion :</label>
              <select
                value={form.promo_type}
                onChange={(e) => handlePromoTypeChange(e.target.value)}
                className="master-form-input"
              >
                {PROMO_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Scope/Target :</label>
              <select
                value={form.scope_type}
                onChange={(e) => handleScopeTypeChange(e.target.value)}
                className="master-form-input"
              >
                {SCOPE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {(form.promo_type === 'percentage' || form.promo_type === 'fixed_amount' || form.promo_type === 'flash_sale') && (
              <div className="master-form-group">
                <label className="master-form-label">
                  {form.promo_type === 'percentage' ? 'Nilai Diskon (%) :' : 'Nilai Diskon (Rp) :'}
                </label>
                <input
                  type="number"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  className="master-form-input"
                />
              </div>
            )}
            {form.scope_type === 'by_category' && (
              <div className="master-form-group">
                <label className="master-form-label">Pilih Kategori :</label>
                <input
                  type="text"
                  list="category-list"
                  placeholder="Cari kategori..."
                  value={categorySearch}
                  onChange={(e) => {
                    const found = categories.find((c) => c.name === e.target.value)
                    setCategorySearch(e.target.value)
                    setForm({ ...form, category_ids: found ? [found.id] : [] })
                  }}
                  onBlur={(e) => setCategorySearch(e.target.value)}
                  className="master-form-input"
                />
                <datalist id="category-list">
                  {categories
                    .filter((cat) => !categorySearch || (cat.name || '').toLowerCase().includes(categorySearch.toLowerCase()))
                    .map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                </datalist>
              </div>
            )}
            {form.scope_type === 'by_product' && (
              <div className="master-form-group">
                <label className="master-form-label">Pilih Produk :</label>
                <input
                  type="text"
                  list="product-list"
                  placeholder="Cari produk..."
                  value={productSearch}
                  onChange={(e) => {
                    const found = products.find((p) => p.name === e.target.value)
                    setProductSearch(e.target.value)
                    setForm({ ...form, product_ids: found ? [found.id] : [] })
                  }}
                  onBlur={(e) => setProductSearch(e.target.value)}
                  className="master-form-input"
                />
                <datalist id="product-list">
                  {products
                    .filter((prod) => !productSearch || (prod.name || '').toLowerCase().includes(productSearch.toLowerCase()))
                    .map((prod) => (
                      <option key={prod.id} value={prod.name}>
                        {prod.name}
                      </option>
                    ))}
                </datalist>
              </div>
            )}
            {form.promo_type === 'buy_x_get_y' && (
              <>
                <div className="master-form-group">
                  <label className="master-form-label">Buy Quantity :</label>
                  <input
                    type="number"
                    value={form.buy_quantity}
                    onChange={(e) => setForm({ ...form, buy_quantity: e.target.value })}
                    className="master-form-input"
                  />
                </div>
                <div className="master-form-group">
                  <label className="master-form-label">Get Quantity Free :</label>
                  <input
                    type="number"
                    value={form.get_quantity}
                    onChange={(e) => setForm({ ...form, get_quantity: e.target.value })}
                    className="master-form-input"
                  />
                </div>
              </>
            )}
            <div className="master-form-group">
              <label className="master-form-label">
                {form.promo_type === 'flash_sale' ? 'Tanggal Sale :' : 'Tanggal Mulai :'}
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value, end_date: e.target.value })}
                className="master-form-input"
              />
            </div>
            {form.promo_type === 'flash_sale' && (
              <div className="master-form-group">
                <label className="master-form-label">Waktu :</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="time"
                    value={form.start_time || ''}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="master-form-input"
                  />
                  <span style={{ fontWeight: 'bold' }}>s/d</span>
                  <input
                    type="time"
                    value={form.end_time || ''}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="master-form-input"
                  />
                </div>
              </div>
            )}
            {form.promo_type !== 'flash_sale' && (
              <div className="master-form-group">
                <label className="master-form-label">Tanggal Akhir :</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="master-form-input"
                />
              </div>
            )}
            <div className="master-form-group-wide">
              <label className="master-form-label">Deskripsi :</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="master-form-input"
              />
            </div>
            <FooterFormMaster onSave={handleSave} onCancel={handleCancelForm} isSaving={isSaving} />
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

    </div>
  )
}
