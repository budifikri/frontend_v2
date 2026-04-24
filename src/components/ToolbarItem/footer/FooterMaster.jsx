import { useState } from 'react'

export function FooterMaster({
  onNew,
  onEdit,
  onDelete,
  onDuplicate,
  totalAmount: _totalAmount,
  totalAmountLabel: _totalAmountLabel,
  onPrint,
  onExit,
  onRefresh,
  showNew = true,
  showDelete = true,
  duplicateDisabled = false,
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
  isAllRecords = false,
  onToggleAllRecords,
}) {
  const _formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }
  const [showExcelMenu, setShowExcelMenu] = useState(false)
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
        {onDuplicate && (
          <button type="button" className="master-footer-btn" onClick={onDuplicate} disabled={duplicateDisabled} title="Duplicate" aria-label="Duplicate">
            <span className="material-icons-round master-footer-icon blue">content_copy</span>
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
          <div style={{ position: 'relative' }} className="excel-menu-container">
            <button
              type="button"
              className="master-footer-btn"
              onClick={() => setShowExcelMenu(!showExcelMenu)}
              title="Import/Export"
              aria-label="Import/Export"
            >
              <span className="material-icons-round master-footer-icon purple">expand_less</span>
              <span className="master-footer-key">XLS</span>
            </button>
            {showExcelMenu && (
              <div className="excel-dropdown-menu">
                <button type="button" className="excel-dropdown-item" onClick={() => { onGenerateTemplate(); setShowExcelMenu(false) }} title="Download Template">
                  <span className="material-icons-round">table_chart</span>
                  <span>Template</span>
                </button>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && onImportExcel) onImportExcel(file)
                    e.target.value = ''
                    setShowExcelMenu(false)
                  }}
                  style={{ display: 'none' }}
                  id="excel-import-input"
                />
                <label htmlFor="excel-import-input" className="excel-dropdown-item">
                  <span className="material-icons-round">file_upload</span>
                  <span>Import</span>
                </label>
                <button type="button" className="excel-dropdown-item" onClick={() => { onExportExcel(); setShowExcelMenu(false) }} title="Export to Excel">
                  <span className="material-icons-round">file_download</span>
                  <span>Export</span>
                </button>
              </div>
            )}
          </div>
        )}
        {extraActions}
        <button type="button" className="master-footer-btn" onClick={onExit} title="Exit" aria-label="Exit">
          <span className="material-icons-round master-footer-icon red">exit_to_app</span>
        </button>
      </div>

      <div className="master-footer-info">
        {onToggleAllRecords && (
          <label className="checkbox-all-records">
            <input
              type="checkbox"
              checked={isAllRecords}
              onChange={(e) => onToggleAllRecords(e.target.checked)}
            />
            <span>All Records</span>
          </label>
        )}
        <div className="master-footer-pagination" style={{ opacity: isAllRecords ? 0.5 : 1 }}>
          <button type="button" className="master-page-btn" title="First Page" onClick={onFirstPage} disabled={isAllRecords || !canPrev}>
            <span className="material-icons-round master-page-icon">first_page</span>
          </button>
          <button type="button" className="master-page-btn" title="Previous Page" onClick={onPrevPage} disabled={isAllRecords || !canPrev}>
            <span className="material-icons-round master-page-icon">chevron_left</span>
          </button>
          <span className="master-page-info">Page {page} of {totalPages}</span>
          <button type="button" className="master-page-btn" title="Next Page" onClick={onNextPage} disabled={isAllRecords || !canNext}>
            <span className="material-icons-round master-page-icon">chevron_right</span>
          </button>
          <button type="button" className="master-page-btn" title="Last Page" onClick={onLastPage} disabled={isAllRecords || !canNext}>
            <span className="material-icons-round master-page-icon">last_page</span>
          </button>
        </div>

       
      </div>
    </div>
  )
}
