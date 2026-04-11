export function FooterMaster({
  onNew,
  onEdit,
  onDelete,
  totalRow,
  totalAmount: _totalAmount,
  totalAmountLabel: _totalAmountLabel,
  onPrint,
  onExit,
  onRefresh,
  showNew = true,
  showDelete = true,
  isLoading = false,
  page = 1,
  totalPages = 1,
  canPrev = false,
  canNext = false,
  onFirstPage,
  onPrevPage,
  onNextPage,
  onLastPage,
  extraActions,
  excelColumns,
  excelFilename,
  onExportExcel,
  onImportExcel,
  onGenerateTemplate,
}) {
  const _formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }
  void _totalAmount
  void _totalAmountLabel
  void _formatCurrency

  return (
    <div className="master-footer">
      <div className="master-footer-actions">
        {showNew && (
          <button type="button" className="master-footer-btn" onClick={onNew} title="New" aria-label="New">
            <span className="material-icons-round master-footer-icon orange">add_box</span>
            <span className="master-footer-key">+</span>
          </button>
        )}
        <button type="button" className="master-footer-btn" onClick={onEdit} title="Edit" aria-label="Edit">
          <span className="material-icons-round master-footer-icon orange">edit</span>
          <span className="master-footer-key">F2</span>
        </button>
        {showDelete && (
          <button type="button" className="master-footer-btn" onClick={onDelete} title="Delete" aria-label="Delete">
            <span className="material-icons-round master-footer-icon orange">remove_circle</span>
            <span className="master-footer-key">DEL</span>
          </button>
        )}
        <button type="button" className="master-footer-btn" onClick={onPrint} title="Print" aria-label="Print">
          <span className="material-icons-round master-footer-icon blue">print</span>
        </button>
        {onRefresh && (
          <button type="button" className="master-footer-btn" onClick={onRefresh} disabled={isLoading} title="Refresh" aria-label="Refresh">
            <span className="material-icons-round master-footer-icon green">refresh</span>
          </button>
        )}
        {excelColumns && excelFilename && (
          <>
            <button type="button" className="master-footer-btn" onClick={onGenerateTemplate} title="Download Template" aria-label="Download Template">
              <span className="material-icons-round master-footer-icon purple">table_chart</span>
              <span className="master-footer-key">TMP</span>
            </button>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file && onImportExcel) onImportExcel(file)
                e.target.value = ''
              }}
              style={{ display: 'none' }}
              id="excel-import-input"
            />
            <label htmlFor="excel-import-input">
              <button type="button" className="master-footer-btn" onClick={() => document.getElementById('excel-import-input')?.click()} title="Import from Excel" aria-label="Import from Excel">
                <span className="material-icons-round master-footer-icon purple">file_upload</span>
                <span className="master-footer-key">IMP</span>
              </button>
            </label>
            <button type="button" className="master-footer-btn" onClick={onExportExcel} title="Export to Excel" aria-label="Export to Excel">
              <span className="material-icons-round master-footer-icon purple">file_download</span>
              <span className="master-footer-key">EXP</span>
            </button>
          </>
        )}
        {extraActions}
        <button type="button" className="master-footer-btn" onClick={onExit} title="Exit" aria-label="Exit">
          <span className="material-icons-round master-footer-icon red">exit_to_app</span>
        </button>
      </div>

      <div className="master-footer-info">
        <span>Total Row: {totalRow}</span>
        <div className="master-footer-pagination">
          <button type="button" className="master-page-btn" title="First Page" onClick={onFirstPage} disabled={!canPrev}>
            <span className="material-icons-round master-page-icon">first_page</span>
          </button>
          <button type="button" className="master-page-btn" title="Previous Page" onClick={onPrevPage} disabled={!canPrev}>
            <span className="material-icons-round master-page-icon">chevron_left</span>
          </button>
          <span className="master-page-info">Page {page} of {totalPages}</span>
          <button type="button" className="master-page-btn" title="Next Page" onClick={onNextPage} disabled={!canNext}>
            <span className="material-icons-round master-page-icon">chevron_right</span>
          </button>
          <button type="button" className="master-page-btn" title="Last Page" onClick={onLastPage} disabled={!canNext}>
            <span className="material-icons-round master-page-icon">last_page</span>
          </button>
        </div>

       
      </div>
    </div>
  )
}
