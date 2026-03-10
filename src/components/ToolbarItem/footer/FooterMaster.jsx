export function FooterMaster({
  onNew,
  onEdit,
  onDelete,
  totalRow,
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
}) {
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
        {extraActions}
        <button type="button" className="master-footer-btn" onClick={onExit} title="Exit" aria-label="Exit">
          <span className="material-icons-round master-footer-icon red">exit_to_app</span>
        </button>
      </div>

      <div className="master-footer-info">
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

        <span>Total Row: {totalRow}</span>
      </div>
    </div>
  )
}
