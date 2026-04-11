import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../shared/auth'
import {
  createPromotion,
  deactivatePromotion,
  listPromotions,
  updatePromotion,
} from '../../../features/master/promotion/promotion.api'
import { FooterMaster } from '../footer/FooterMaster'
import { FooterFormMaster } from '../footer/FooterFormMaster'
import { DeleteMaster } from '../footer/DeleteMaster'
import { MasterTableHeader } from '../table/MasterTableHeader'
import { MasterStatusToggle } from '../table/MasterStatusToggle'
import { useMasterTableSort } from '../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../hooks/useMasterPagination'

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
  min_purchase_amount: 0,
  start_date: '',
  end_date: '',
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
    min_purchase_amount: 0,
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
    min_purchase_amount: 0,
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
    min_purchase_amount: 50000,
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
  { key: 'min_purchase_amount', label: 'MIN BELI' },
  { key: 'start_date', label: 'MULAI' },
  { key: 'end_date', label: 'AKHIR' },
  { key: 'is_active', label: 'STATUS' },
]

const PROMO_TYPE_OPTIONS = [
  { value: 'percentage', label: 'Discount Percentage' },
  { value: 'fixed_amount', label: 'Discount Fixed Amount' },
  { value: 'buy_x_get_y', label: 'Buy X Get Y Free' },
  { value: 'flash_sale', label: 'Flash Sale' },
  { value: 'min_purchase', label: 'Min Purchase Amount' },
]

function generatePromotionCode(promoType, dataList = []) {
  const prefixMap = {
    percentage: 'DP',
    fixed_amount: 'DA',
    buy_x_get_y: 'BG',
    flash_sale: 'FL',
    min_purchase: 'MP',
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

function formatPromoType(type) {
  const found = PROMO_TYPE_OPTIONS.find((opt) => opt.value === type)
  return found ? found.label : type || '-'
}

function formatScopeType(type) {
  const found = SCOPE_TYPE_OPTIONS.find((opt) => opt.value === type)
  return found ? found.label : type || '-'
}

function formatDiscountValue(item) {
  if (item.promo_type === 'percentage') {
    return `${item.discount_value || 0}%`
  }
  if (item.promo_type === 'fixed_amount') {
    return `Rp ${Number(item.discount_value || 0).toLocaleString('id-ID')}`
  }
  if (item.promo_type === 'buy_x_get_y') {
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

export function Promotion({ onExit }) {
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
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
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
        setShowExitConfirm(true)
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
        min_purchase_amount: Number(form.min_purchase_amount || 0),
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
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
      promo_type: target.promo_type || 'percentage',
      scope_type: target.scope_type || 'all',
      category_ids: target.category_ids || [],
      product_ids: target.product_ids || [],
      discount_value: target.discount_value || 0,
      buy_quantity: target.buy_quantity || 1,
      get_quantity: target.get_quantity || 1,
      min_purchase_amount: target.min_purchase_amount || 0,
      start_date: target.start_date || '',
      end_date: target.end_date || '',
      description: target.description || '',
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
    setForm({ ...form, scope_type: value })
  }

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
                  <td>{row.code || '-'}</td>
                  <td>{row.name || '-'}</td>
                  <td>{formatPromoType(row.promo_type)}</td>
                  <td>{formatScopeType(row.scope_type)}</td>
                  <td>{formatDiscountValue(row)}</td>
                  <td>{row.min_purchase_amount ? `Rp ${Number(row.min_purchase_amount).toLocaleString('id-ID')}` : '-'}</td>
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
              <label className="master-form-label">Min Purchase (Rp) :</label>
              <input
                type="number"
                value={form.min_purchase_amount}
                onChange={(e) => setForm({ ...form, min_purchase_amount: e.target.value })}
                className="master-form-input"
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Tanggal Mulai :</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="master-form-input"
              />
            </div>
            <div className="master-form-group">
              <label className="master-form-label">Tanggal Akhir :</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="master-form-input"
              />
            </div>
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