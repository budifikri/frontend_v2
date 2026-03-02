export function FooterMaster({
  onNew,
  onEdit,
  onDelete,
  totalRow,
  onSearch,
  onPrint,
  onExit,
  filter = 'all',
  onFilterChange,
  onRefresh,
  isLoading = false,
  page = 1,
  totalPages = 1,
  canPrev = false,
  canNext = false,
  onFirstPage,
  onPrevPage,
  onNextPage,
  onLastPage,
}) {
  return (
    <div className="master-footer">
      <div className="master-footer-actions">
        <button type="button" className="master-footer-btn" onClick={onNew}>
          <span className="material-icons-round master-footer-icon orange">add_box</span>
          <span className="master-footer-key">+</span>
        </button>
        <button type="button" className="master-footer-btn" onClick={onEdit}>
          <span className="material-icons-round master-footer-icon orange">edit</span>
          <span className="master-footer-key">F2</span>
        </button>
        <button type="button" className="master-footer-btn" onClick={onDelete}>
          <span className="material-icons-round master-footer-icon red">remove_circle</span>
          <span className="master-footer-key">DEL</span>
        </button>
        <button type="button" className="master-footer-btn" onClick={onPrint}>
          <span className="material-icons-round master-footer-icon">print</span>
        </button>
        {onRefresh && (
          <button type="button" className="master-footer-btn" onClick={onRefresh} disabled={isLoading}>
            <span className="material-icons-round master-footer-icon">refresh</span>
          </button>
        )}
      </div>
      {onFilterChange && (
        <div className="master-filter-wrap">
          <label htmlFor="master-status-filter" className="master-filter-label">Status</label>
          <select
            id="master-status-filter"
            className="master-filter-select"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </select>
        </div>
      )}
      <div className="master-footer-search">
        <input 
          type="text" 
          placeholder="Search keyword..." 
          className="master-search-input"
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
        <button type="button" className="master-search-btn">
          <span className="material-icons-round material-icon">search</span>
        </button>
      </div>
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
      <div className="master-footer-info">
        <span>Total Row: {totalRow}</span>
      </div>
      <button type="button" className="master-exit-btn" onClick={onExit}>
        <span>EXIT</span>
      </button>
    </div>
  )
}
