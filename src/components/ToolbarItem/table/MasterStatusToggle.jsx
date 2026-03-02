export function MasterStatusToggle({ active, loading = false, onClick }) {
  return (
    <button
      type="button"
      className={`master-status-toggle ${active ? 'is-active' : 'is-inactive'}`}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? '...' : (active ? 'ACTIVE' : 'INACTIVE')}
    </button>
  )
}
