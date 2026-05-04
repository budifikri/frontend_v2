export function MasterDefaultToggle({ active, loading = false, onClick }) {
  const statusLabel = active ? 'Yes' : 'No'
  const handleClick = (event) => {
    if (loading) return
    onClick?.(event)
  }

  const handleKeyDown = (event) => {
    if (loading) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick?.(event)
    }
  }

  return (
    <div
      className={`master-status-toggle ${active ? 'is-active' : 'is-inactive'} ${loading ? 'is-loading' : ''}`}
      role="button"
      tabIndex={loading ? -1 : 0}
      aria-pressed={active}
      aria-label={`Set default ${active ? 'No' : 'Yes'}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {loading ? (
        '...'
      ) : (
        <>
          <span className="material-icons-round master-status-toggle-icon" aria-hidden="true">
            {active ? 'toggle_on' : 'toggle_off'}
          </span>
          <span>{statusLabel}</span>
        </>
      )}
    </div>
  )
}
