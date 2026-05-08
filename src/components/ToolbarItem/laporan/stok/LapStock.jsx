import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../../shared/auth'
import { listInventory, getStockCard } from '../../../../features/laporan/stock/stock.api'
import { listWarehouses } from '../../../../features/master/warehouse/warehouse.api'
import { listCategories } from '../../../../features/master/category/category.api'
import { getCurrentCompany } from '../../../../features/master/company/company.api'
import { openReportPrintWindow } from '../../../../utils/reportPrint'
import { normalizeProductType } from '../../../../utils/productType'
import { useMasterTableSort } from '../../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../../hooks/useMasterPagination'
import { MasterTableHeader } from '../../table/MasterTableHeader'
import { StockCardModal } from './StockCardModal'

const TABLE_COLUMNS = [
  { key: 'no', label: 'NO', sortable: false },
  { key: 'code', label: 'KODE PRODUK' },
  { key: 'name', label: 'NAMA PRODUK' },
  { key: 'category', label: 'KATEGORI' },
  { key: 'warehouse', label: 'GUDANG' },
  { key: 'stock', label: 'STOK' },
  { key: 'unit', label: 'SATUAN' },
]

const DUMMY_STOCKS = [
  {
    id: 'INV001',
    product_id: 'PRD001',
    code: 'PRD001',
    name: 'Kopi Luwak',
    category: 'Minuman',
    category_id: 'CAT001',
    warehouse: 'Gudang Utama',
    warehouse_id: 'GDG001',
    stock: 150,
    unit: 'PCS',
  },
  {
    id: 'INV002',
    product_id: 'PRD002',
    code: 'PRD002',
    name: 'Gula Pasir',
    category: 'Bahan Pokok',
    category_id: 'CAT002',
    warehouse: 'Gudang Utama',
    warehouse_id: 'GDG001',
    stock: 80,
    unit: 'KG',
  },
  {
    id: 'INV003',
    product_id: 'PRD003',
    code: 'PRD003',
    name: 'Susu Bubuk',
    category: 'Minuman',
    category_id: 'CAT001',
    warehouse: 'Gudang Cabang',
    warehouse_id: 'GDG002',
    stock: 0,
    unit: 'PCS',
  },
]

function getUniqueOptions(items, idKey, nameKey) {
  const map = new Map()
  items.forEach((item) => {
    const id = String(item?.[idKey] ?? '').trim()
    const name = String(item?.[nameKey] ?? '').trim()
    if (!id || !name) return
    map.set(id, name)
  })

  return Array.from(map, ([id, name]) => ({ id, name }))
}

export function LapStock({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('available')

  const [warehouseOptions, setWarehouseOptions] = useState([])
  const [categoryOptions, setCategoryOptions] = useState([])
  const [categoryTypeById, setCategoryTypeById] = useState({})
  const [categoryTypeByName, setCategoryTypeByName] = useState({})

  const [selectedId, setSelectedId] = useState(null)

  const [showStockCardModal, setShowStockCardModal] = useState(false)
  const [stockCardData, setStockCardData] = useState([])
  const [stockCardError, setStockCardError] = useState('')
  const [isLoadingCard, setIsLoadingCard] = useState(false)
  const [stockCardFilter, setStockCardFilter] = useState({ dateFilter: 'this_month', date_from: '', date_to: '' })
  const [currentStockCardRow, setCurrentStockCardRow] = useState(null)

  const pager = useMasterPagination({ initialLimit: 10, total: pagination.total, hasMore: pagination.has_more })
  const { limit, offset } = pager

  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'code',
    valueGetters: {
      stock: (row) => Number(row?.stock ?? 0),
    },
  })

  const refreshLookups = useCallback(async () => {
    if (!token) {
      setWarehouseOptions(getUniqueOptions(DUMMY_STOCKS, 'warehouse_id', 'warehouse'))
      setCategoryOptions(getUniqueOptions(DUMMY_STOCKS, 'category_id', 'category'))
      setCategoryTypeById({})
      setCategoryTypeByName({})
      return
    }

    try {
      const [warehouseRes, categoryRes] = await Promise.all([
        listWarehouses(token, { limit: 200, offset: 0, include_inactive: true }),
        listCategories(token, { limit: 200, offset: 0, include_inactive: true }),
      ])

      const warehouses = (warehouseRes.items || []).map((item) => ({
        id: String(item.id || ''),
        name: item.name || item.code || '-',
      }))
      const categories = (categoryRes.items || []).map((item) => ({
        id: String(item.id || ''),
        name: item.name || item.code || '-',
        product_type: normalizeProductType(item?.product_type),
      }))
      const nextCategoryTypeById = categories.reduce((acc, item) => {
        if (item.id) acc[item.id] = item.product_type
        return acc
      }, {})
      const nextCategoryTypeByName = categories.reduce((acc, item) => {
        const name = String(item.name || '').trim().toLowerCase()
        if (name) acc[name] = item.product_type
        return acc
      }, {})

      setWarehouseOptions(warehouses.filter((item) => item.id && item.name))
      setCategoryOptions(categories.filter((item) => item.id && item.name && item.product_type === 'stockable'))
      setCategoryTypeById(nextCategoryTypeById)
      setCategoryTypeByName(nextCategoryTypeByName)
    } catch {
      setWarehouseOptions([])
      setCategoryOptions([])
      setCategoryTypeById({})
      setCategoryTypeByName({})
    }
  }, [token])

  const isStockableInventoryItem = useCallback((item) => {
    const categoryId = String(item?.category_id || item?.product?.category_id || '')
    const categoryType = categoryTypeById[categoryId]
    const categoryName = String(item?.category || item?.category_name || item?.product?.category_name || '').trim().toLowerCase()
    const productType = normalizeProductType(
      categoryType
      || categoryTypeByName[categoryName]
      || item?.product_type
      || item?.category?.product_type,
    )
    return productType === 'stockable'
  }, [categoryTypeById, categoryTypeByName])

  const fetchData = useCallback(async () => {
    setError('')
    setIsLoading(true)

    if (!token) {
      const keyword = searchKeyword.trim().toLowerCase()
      const filtered = DUMMY_STOCKS.filter((item) => {
        if (!isStockableInventoryItem(item)) return false
        if (warehouseFilter && String(item.warehouse_id || '') !== warehouseFilter) return false
        if (categoryFilter && String(item.category_id || '') !== categoryFilter) return false
        const stockValue = Number(item.stock || 0)
        if (stockFilter === 'available' && stockValue <= 0) return false
        if (stockFilter === 'minus' && stockValue >= 0) return false
        if (stockFilter === 'empty' && stockValue !== 0) return false
        if (!keyword) return true

        return (
          String(item.code || '').toLowerCase().includes(keyword) ||
          String(item.name || '').toLowerCase().includes(keyword)
        )
      })

      setData(filtered.slice(offset, offset + limit))
      setPagination({ total: filtered.length, has_more: offset + limit < filtered.length })
      setIsLoading(false)
      return
    }

    try {
      const result = await listInventory(token, {
        search: searchKeyword.trim() || undefined,
        stock: stockFilter,
        warehouse_id: warehouseFilter || undefined,
        limit: pager.isAllRecords ? 5000 : Math.max(offset + limit + 200, 500),
        offset: 0,
      })

      const serverItems = result.items || []
      const filteredItems = serverItems.filter((item) => {
        if (!isStockableInventoryItem(item)) return false
        if (categoryFilter && String(item.category_id || '') !== categoryFilter) return false
        const stockValue = Number(item.stock || 0)
        if (stockFilter === 'available' && stockValue <= 0) return false
        if (stockFilter === 'minus' && stockValue >= 0) return false
        if (stockFilter === 'empty' && stockValue !== 0) return false
        return true
      })

      const items = pager.isAllRecords
        ? filteredItems
        : filteredItems.slice(offset, offset + limit)

      setData(items)
      setPagination({
        total: filteredItems.length,
        has_more: offset + limit < filteredItems.length,
      })
    } catch {
      setData([])
      setPagination({ total: 0, has_more: false })
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, warehouseFilter, categoryFilter, stockFilter, limit, offset, pager.isAllRecords, isStockableInventoryItem])

  useEffect(() => {
    refreshLookups()
  }, [refreshLookups])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (sortedData.length > 0 && !selectedId) {
      setSelectedId(sortedData[0].id)
    }
  }, [sortedData, selectedId])

  const warehouseSelectOptions = useMemo(() => (
    warehouseOptions.length > 0
      ? warehouseOptions
      : getUniqueOptions(data, 'warehouse_id', 'warehouse')
  ), [warehouseOptions, data])

  const categorySelectOptions = useMemo(() => (
    categoryOptions.length > 0
      ? categoryOptions
      : getUniqueOptions(data, 'category_id', 'category')
  ), [categoryOptions, data])

  const handleSearchChange = (value) => {
    pager.reset()
    setSearchKeyword(value)
  }

  const handleWarehouseFilter = (value) => {
    pager.reset()
    setWarehouseFilter(value)
  }

  const handleCategoryFilter = (value) => {
    pager.reset()
    setCategoryFilter(value)
  }

  const handleStockFilter = (value) => {
    pager.reset()
    setStockFilter(value)
  }

  const handleRowClick = (row) => {
    setSelectedId(row.id)
  }

  const handleStockCard = async (overrides = {}) => {
    const selectedRow = currentStockCardRow || sortedData.find((row) => row.id === selectedId)
    console.log('[LapStock] handleStockCard - selectedRow:', selectedRow)
    console.log('[LapStock] handleStockCard - selectedId:', selectedId)
    console.log('[LapStock] handleStockCard - sortedData:', sortedData)
    
    if (!selectedRow) {
      console.log('[LapStock] No selectedRow, cannot fetch stock card')
      return
    }

    setShowStockCardModal(true)
    setStockCardError('')
    setStockCardData([])
    setIsLoadingCard(true)

    const filter = { ...stockCardFilter, ...overrides.filter }

    try {
      const result = await getStockCard(token, {
        product_id: selectedRow.product_id,
        warehouse_id: selectedRow.warehouse_id,
        date_from: filter.date_from,
        date_to: filter.date_to,
      })

      console.log('[LapStock] getStockCard result:', result)
      setStockCardData(result.items || [])
    } catch (err) {
      console.log('[LapStock] getStockCard error:', err)
      setStockCardError(err.message || 'Failed to load stock card')
    } finally {
      setIsLoadingCard(false)
    }
  }

  const handleRowDoubleClick = (row) => {
    setSelectedId(row.id)
    setCurrentStockCardRow(row)
    setStockCardFilter({ dateFilter: 'this_month', date_from: '', date_to: '' })
    handleStockCard()
  }

  const handlePrint = async () => {
    try {
      const companyInfo = { name: '', address: '', phone: '' };
      if (token) {
        const res = await getCurrentCompany(token);
        if (res?.data) {
          companyInfo.name = res.data.nama || res.data.name || auth.companyName || '';
          companyInfo.address = res.data.address || '';
          companyInfo.phone = res.data.telp || res.data.phone || '';
        }
      }

      const printColumns = [
        { key: 'no', label: 'NO', align: 'text-center', formatter: (_, __, index) => index + 1 },
        { key: 'code', label: 'KODE PRODUK' },
        { key: 'name', label: 'NAMA PRODUK' },
        { key: 'category', label: 'KATEGORI' },
        { key: 'warehouse', label: 'GUDANG' },
        { key: 'stock', label: 'STOK', align: 'text-right', formatter: (v) => Number(v || 0) },
        { key: 'unit', label: 'SATUAN', align: 'text-center' },
      ];

      const printData = sortedData.map((item, index) => ({
        ...item,
        no: index + 1
      }));

      openReportPrintWindow({
        title: 'Laporan Stok Produk',
        company: companyInfo,
        meta: { 
          date: new Date().toLocaleString('id-ID'), 
          user: auth.username || 'Admin' 
        },
        columns: printColumns,
        data: printData,
        footerText: `Laporan Stok per tanggal ${new Date().toLocaleDateString('id-ID')}`,
      });
    } catch (err) {
      console.error('Print error:', err);
      alert('Gagal mencetak laporan: ' + err.message);
    }
  }

  const handleStockCardFilterChange = (filter) => {
    setStockCardFilter(filter)
    handleStockCard({ filter })
  }

  const handleCloseStockCardModal = () => {
    setShowStockCardModal(false)
    setStockCardData([])
    setStockCardError('')
    setCurrentStockCardRow(null)
  }

  const selectedRow = sortedData.find((row) => row.id === selectedId)

  return (
    <div className="master-content">
      <div className="master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Laporan Stok</h1>
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
          <select
            className="master-filter-select"
            value={warehouseFilter}
            onChange={(e) => handleWarehouseFilter(e.target.value)}
          >
            <option value="">All Warehouse</option>
            {warehouseSelectOptions.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <select
            className="master-filter-select"
            value={categoryFilter}
            onChange={(e) => handleCategoryFilter(e.target.value)}
          >
            <option value="">All Category</option>
            {categorySelectOptions.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <select
            className="master-filter-select"
            value={stockFilter}
            onChange={(e) => handleStockFilter(e.target.value)}
          >
            <option value="available">Stock Available</option>
            <option value="all">Stock All</option>
            <option value="minus">Stock Minus</option>
            <option value="empty">Stock Empty</option>
          </select>
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
                  onClick={() => handleRowClick(row)}
                  onDoubleClick={() => handleRowDoubleClick(row)}
                >
                  <td>{offset + index + 1}</td>
                  <td>{row.code || '-'}</td>
                  <td>{row.name || '-'}</td>
                  <td>{row.category || '-'}</td>
                  <td>{row.warehouse || '-'}</td>
                  <td>{Number(row.stock || 0)}</td>
                  <td>{row.unit || '-'}</td>
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

      <div className="master-footer">
        <div className="master-footer-actions">
           <button type="button" className="master-footer-btn" onClick={handlePrint} title="Print" aria-label="Print">
             <span className="material-icons-round master-footer-icon blue">print</span>
           </button>

          <button type="button" className="master-footer-btn" onClick={handleStockCard} disabled={!selectedRow} title="Stock Card" aria-label="Stock Card">
            <span className="material-icons-round master-footer-icon orange">assignment</span>
          </button>

          <button type="button" className="master-footer-btn" onClick={fetchData} disabled={isLoading} title="Refresh" aria-label="Refresh">
            <span className="material-icons-round master-footer-icon green">refresh</span>
          </button>

          <button type="button" className="master-footer-btn" onClick={onExit} title="Exit" aria-label="Exit">
            <span className="material-icons-round master-footer-icon red">exit_to_app</span>
          </button>
        </div>

        <div className="master-footer-info">
          <label className="checkbox-all-records">
            <input
              type="checkbox"
              checked={pager.isAllRecords}
              onChange={(e) => pager.toggleAllRecords(e.target.checked)}
            />
            <span>All Records</span>
          </label>
          <span className="footer-divider">|</span>
          <span className="report-total-row">Total Row: {pagination.total}</span>
          {!pager.isAllRecords && (
            <div className="master-footer-pagination">
              <button type="button" className="master-page-btn" onClick={pager.goFirst} disabled={!pager.canPrev}>|&lt;</button>
              <button type="button" className="master-page-btn" onClick={pager.goPrev} disabled={!pager.canPrev}>&lt;</button>
              <span className="master-page-info">Page {pager.page} of {pager.totalPages}</span>
              <button type="button" className="master-page-btn" onClick={pager.goNext} disabled={!pager.canNext}>&gt;</button>
              <button type="button" className="master-page-btn" onClick={pager.goLast} disabled={!pager.canNext}>&gt;|</button>
            </div>
          )}
        </div>
      </div>

      <StockCardModal
        isOpen={showStockCardModal}
        onClose={handleCloseStockCardModal}
        data={stockCardData}
        productName={selectedRow?.name}
        isLoading={isLoadingCard}
        error={stockCardError}
        onFilterChange={handleStockCardFilterChange}
      />
    </div>
  )
}
