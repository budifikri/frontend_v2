import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../../shared/auth'
import { listInventory } from '../../../../features/laporan/stock/stock.api'
import { listWarehouses } from '../../../../features/master/warehouse/warehouse.api'
import { listCategories } from '../../../../features/master/category/category.api'
import { useMasterTableSort } from '../../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../../hooks/useMasterPagination'
import { MasterTableHeader } from '../../table/MasterTableHeader'

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

  const [warehouseOptions, setWarehouseOptions] = useState([])
  const [categoryOptions, setCategoryOptions] = useState([])

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
      }))

      setWarehouseOptions(warehouses.filter((item) => item.id && item.name))
      setCategoryOptions(categories.filter((item) => item.id && item.name))
    } catch {
      setWarehouseOptions([])
      setCategoryOptions([])
    }
  }, [token])

  const fetchData = useCallback(async () => {
    setError('')
    setIsLoading(true)

    if (!token) {
      const keyword = searchKeyword.trim().toLowerCase()
      const filtered = DUMMY_STOCKS.filter((item) => {
        if (warehouseFilter && String(item.warehouse_id || '') !== warehouseFilter) return false
        if (categoryFilter && String(item.category_id || '') !== categoryFilter) return false
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
        warehouse_id: warehouseFilter || undefined,
        limit,
        offset,
      })

      const serverItems = result.items || []
      const items = categoryFilter
        ? serverItems.filter((item) => String(item.category_id || '') === categoryFilter)
        : serverItems

      setData(items)

      const nextPagination = result.pagination || {}
      setPagination({
        total: categoryFilter ? items.length : Number(nextPagination.total ?? 0),
        has_more: categoryFilter ? false : Boolean(nextPagination.has_more),
      })
    } catch (err) {
      // setError(err.message || 'Failed to load inventory report')
      setData([])
      setPagination({ total: 0, has_more: false })
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, warehouseFilter, categoryFilter, limit, offset])

  useEffect(() => {
    refreshLookups()
  }, [refreshLookups])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

  return (
    <div className="master-content">
      <div className="master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Laporan Stok</h1>
      </div>

      {error && <div className="master-error">{error}</div>}

      <div className="master-table-wrapper">
        <div className="master-table-container">
          <table className="master-table">
            <MasterTableHeader columns={TABLE_COLUMNS} sortConfig={sortConfig} onSort={handleSort} />
            <tbody>
              {sortedData.map((row, index) => (
                <tr key={row.id || index} className="master-row">
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
 
              
      <div className="master-footer-search ">
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



           <button type="button" className="master-footer-btn" onClick={() => window.print()}>
              <span className="material-icons-round master-footer-icon blue ">print</span>          
          </button>

          
      <button type="button" className="master-footer-btn" onClick={onStockCard}>
              <span className="material-icons-round master-footer-icon orange">assignment</span>
           </button>


            <button type="button" className="master-footer-btn" onClick={fetchData} disabled={isLoading}>
                       <span className="material-icons-round master-footer-icon green ">refresh</span>
             </button>


       
         
           <button type="button" className="master-footer-btn" onClick={onExit}>
              <span className="material-icons-round master-footer-icon red">exit_to_app</span>
           </button>
    </div>


           

              <div className="master-footer-info">
          <div className="master-footer-pagination">
            <button type="button" className="master-page-btn" onClick={pager.goFirst} disabled={!pager.canPrev}>|&lt;</button>
            <button type="button" className="master-page-btn" onClick={pager.goPrev} disabled={!pager.canPrev}>&lt;</button>
            <span className="master-page-info">Page {pager.page} of {pager.totalPages}</span>
            <button type="button" className="master-page-btn" onClick={pager.goNext} disabled={!pager.canNext}>&gt;</button>
            <button type="button" className="master-page-btn" onClick={pager.goLast} disabled={!pager.canNext}>&gt;|</button>
          </div>
          <span className="report-total-row">Total Row: {pagination.total}</span>
    
        </div>
        
    
      </div>
    </div>
  )
}
