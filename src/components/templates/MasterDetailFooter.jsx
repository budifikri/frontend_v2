export function MasterDetailFooter({ summary }) {
  if (!summary || Object.keys(summary).length === 0) return null

  return (
    <div className="master-detail-summary">
      <div className="summary-bar">
        <span className="summary-title">Summary:</span>
        {Object.entries(summary).map(([key, value]) => (
          <span key={key} className="summary-item">
            {key.replace(/_/g, ' ').toUpperCase()}: <strong>{value}</strong>
          </span>
        ))}
      </div>
    </div>
  )
}
