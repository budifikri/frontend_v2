export function FooterMaster({ onNew, onEdit, onDelete, totalRow, onSearch, onPrint, onExit }) {
  return (
    <div className="master-footer">
      <div className="master-footer-actions">
        <button type="button" className="master-footer-btn" onClick={onNew}>
          <span className="master-footer-icon orange">edit_note</span>
          <span className="master-footer-key">F1</span>
        </button>
        <button type="button" className="master-footer-btn" onClick={onEdit}>
          <span className="master-footer-icon orange">edit_square</span>
          <span className="master-footer-key">F2</span>
        </button>
        <button type="button" className="master-footer-btn" onClick={onDelete}>
          <span className="master-footer-icon red">remove_circle</span>
          <span className="master-footer-key">F3</span>
        </button>
        <button type="button" className="master-footer-btn" onClick={onPrint}>
          <span className="master-footer-icon">print</span>
        </button>
      </div>
      <div className="master-footer-search">
        <input 
          type="text" 
          placeholder="Search keyword..." 
          className="master-search-input"
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
        <button type="button" className="master-search-btn">
          <span className="material-icon">search</span>
        </button>
      </div>
      <div className="master-footer-pagination">
        <button type="button" className="master-page-btn" title="First Page">&lt;&lt;</button>
        <button type="button" className="master-page-btn" title="Previous Page">&lt;</button>
        <span className="master-page-info">Page 1 of 1</span>
        <button type="button" className="master-page-btn" title="Next Page">&gt;</button>
        <button type="button" className="master-page-btn" title="Last Page">&gt;&gt;</button>
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
