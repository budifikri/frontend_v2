import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../../shared/auth'
import { listCategories } from '../../../../features/master/category/category.api'
import { getCurrentCompany } from '../../../../features/master/company/company.api'
import { openReportPrintWindow } from '../../../../utils/reportPrint'
import { listPriceTierReportByProduct } from '../../../../features/master/price-tier/priceTier.api'
import { useMasterTableSort } from '../../../../hooks/useMasterTableSort'
import { useMasterPagination } from '../../../../hooks/useMasterPagination'
import { MasterTableHeader } from '../../table/MasterTableHeader'

const TABLE_COLUMNS = [
  { key: 'sku', label: 'SKU' },
  { key: 'product_name', label: 'NAMA PRODUK' },
  { key: 'unit_name', label: 'SATUAN' },
  { key: 'category_name', label: 'KATEGORI' },
  { key: 'retail_price', label: 'HARGA RETAIL' },
  { key: 'grosir_1_price', label: 'GROSIR 1' },
  { key: 'grosir_1_qty', label: 'QTY1' },
  { key: 'grosir_2_price', label: 'GROSIR 2' },
  { key: 'grosir_2_qty', label: 'QTY2' },
  { key: 'grosir_3_price', label: 'GROSIR 3' },
  { key: 'grosir_3_qty', label: 'QTY3' },
]

function formatNumber(value) {
  return Number(value || 0).toLocaleString('id-ID')
}

function formatPrice(value) {
  const amount = Number(value || 0)
  if (amount <= 0) return '-'
  return formatNumber(amount)
}

function formatQty(value) {
  const qty = Number(value || 0)
  if (qty <= 0) return '-'
  return qty
}

export function LapHargaGrosir({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ has_more: false, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [scopeFilter, setScopeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categoryOptions, setCategoryOptions] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const pager = useMasterPagination({ initialLimit: 10, total: pagination.total, hasMore: pagination.has_more })
  const { limit, offset } = pager

  const { sortConfig, sortedData, handleSort } = useMasterTableSort(data, {
    initialKey: 'product_name',
    valueGetters: {
      retail_price: (row) => Number(row?.retail_price ?? 0),
      grosir_1_price: (row) => Number(row?.grosir_1_price ?? 0),
      grosir_1_qty: (row) => Number(row?.grosir_1_qty ?? 0),
      grosir_2_price: (row) => Number(row?.grosir_2_price ?? 0),
      grosir_2_qty: (row) => Number(row?.grosir_2_qty ?? 0),
      grosir_3_price: (row) => Number(row?.grosir_3_price ?? 0),
      grosir_3_qty: (row) => Number(row?.grosir_3_qty ?? 0),
    },
  })

  const fetchData = useCallback(async () => {
    setError('')
    setIsLoading(true)

    if (!token) {
      setData([])
      setPagination({ total: 0, has_more: false })
      setIsLoading(false)
      return
    }

    try {
      const result = await listPriceTierReportByProduct(token, {
        search: searchKeyword.trim() || undefined,
        scope: scopeFilter,
        category_id: categoryFilter || undefined,
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
      setData([])
      setPagination({ total: 0, has_more: false })
      setError(err.message || 'Failed to load laporan harga grosir')
    } finally {
      setIsLoading(false)
    }
  }, [token, searchKeyword, scopeFilter, categoryFilter, limit, offset])

  const fetchCategories = useCallback(async () => {
    if (!token) {
      setCategoryOptions([])
      return
    }

    try {
      const result = await listCategories(token, { limit: 200, offset: 0, include_inactive: true })
      const options = (result.items || [])
        .map((item) => ({
          id: String(item.id || ''),
          name: item.name || item.code || '-',
        }))
        .filter((item) => item.id && item.name)
      setCategoryOptions(options)
    } catch {
      setCategoryOptions([])
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    if (sortedData.length > 0 && !selectedId) {
      setSelectedId(sortedData[0].id)
    }
  }, [sortedData, selectedId])

  const handleSearchChange = (value) => {
    pager.reset()
    setSearchKeyword(value)
  }

  const handleScopeChange = (value) => {
    pager.reset()
    setScopeFilter(value)
  }

  const handleCategoryChange = (value) => {
    pager.reset()
    setCategoryFilter(value)
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
        { key: 'sku', label: 'SKU' },
        { key: 'product_name', label: 'NAMA PRODUK' },
        { key: 'unit_name', label: 'SATUAN', align: 'text-center' },
        { key: 'category_name', label: 'KATEGORI' },
        { key: 'retail_price', label: 'HARGA RETAIL', align: 'text-right', formatter: (v) => formatNumber(v) },
        { key: 'grosir_1_price', label: 'GROSIR 1', align: 'text-right', formatter: (v) => formatPrice(v) },
        { key: 'grosir_1_qty', label: 'QTY 1', align: 'text-center', formatter: (v) => formatQty(v) },
        { key: 'grosir_2_price', label: 'GROSIR 2', align: 'text-right', formatter: (v) => formatPrice(v) },
        { key: 'grosir_2_qty', label: 'QTY 2', align: 'text-center', formatter: (v) => formatQty(v) },
        { key: 'grosir_3_price', label: 'GROSIR 3', align: 'text-right', formatter: (v) => formatPrice(v) },
        { key: 'grosir_3_qty', label: 'QTY 3', align: 'text-center', formatter: (v) => formatQty(v) },
      ];

      const printData = sortedData.map((item, index) => ({
        ...item,
        no: index + 1
      }));

      openReportPrintWindow({
        title: 'Laporan Harga Grosir Produk',
        company: companyInfo,
        meta: { 
          date: new Date().toLocaleString('id-ID'), 
          user: auth.username || 'Admin' 
        },
        columns: printColumns,
        data: printData,
        footerText: `Laporan Harga Grosir per tanggal ${new Date().toLocaleDateString('id-ID')}`,
      });
    } catch (err) {
      console.error('Print error:', err);
      alert('Gagal mencetak laporan: ' + err.message);
    }
  }

  return (
    <div className="master-content">
      <div className="master-header">
        <div className="master-header-accent"></div>
        <h1 className="master-title">Laporan Harga Grosir</h1>
        <div className="master-header-filters">
          <div className="master-footer-search">
            <input
              type="text"
              placeholder="Search product / sku / tier..."
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
            value={scopeFilter}
            onChange={(e) => handleScopeChange(e.target.value)}
          >
            <option value="all">All Product</option>
            <option value="grosir">Harga Grosir</option>
          </select>
          <select
            className="master-filter-select"
            value={categoryFilter}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="">All Category</option>
            {categoryOptions.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
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
                  onClick={() => setSelectedId(row.id)}
                >
                  <td>{row.sku || '-'}</td>
                  <td>{row.product_name || '-'}</td>
                  <td>{row.unit_name || '-'}</td>
                  <td>{row.category_name || '-'}</td>
                  <td>{formatNumber(row.retail_price)}</td>
                  <td>{formatPrice(row.grosir_1_price)}</td>
                  <td>{formatQty(row.grosir_1_qty)}</td>
                  <td>{formatPrice(row.grosir_2_price)}</td>
                  <td>{formatQty(row.grosir_2_qty)}</td>
                  <td>{formatPrice(row.grosir_3_price)}</td>
                  <td>{formatQty(row.grosir_3_qty)}</td>
                </tr>
              ))}
              {!isLoading && sortedData.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center">No data</td>
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

          <button type="button" className="master-footer-btn" onClick={fetchData} disabled={isLoading} title="Refresh" aria-label="Refresh">
            <span className="material-icons-round master-footer-icon green">refresh</span>
          </button>

          <button type="button" className="master-footer-btn" onClick={onExit} title="Exit" aria-label="Exit">
            <span className="material-icons-round master-footer-icon red">exit_to_app</span>
          </button>
        </div>

        <div className="master-footer-info">
          <span className="report-total-row">Total Row: {pagination.total}</span>
          <div className="master-footer-pagination" style={{ visibility: pager.isAllRecords ? 'hidden' : 'visible' }}>
            <button type="button" className="master-page-btn" onClick={pager.goFirst} disabled={!pager.canPrev}>|&lt;</button>
            <button type="button" className="master-page-btn" onClick={pager.goPrev} disabled={!pager.canPrev}>&lt;</button>
            <span className="master-page-info">Page {pager.page} of {pager.totalPages}</span>
            <button type="button" className="master-page-btn" onClick={pager.goNext} disabled={!pager.canNext}>&gt;</button>
            <button type="button" className="master-page-btn" onClick={pager.goLast} disabled={!pager.canNext}>&gt;|</button>
          </div>
        </div>
      </div>
    </div>
  )
}
