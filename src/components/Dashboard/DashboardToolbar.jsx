import { toolbarItems } from '../../data'

export function DashboardToolbar({ onLoginClick }) {
  return (
    <div className="dashboard-toolbar">
      {toolbarItems.map((tool) => {
        if (tool.divider) {
          return <span key={tool.key} className="toolbar-divider" aria-hidden="true" />
        }

        return (
          <button
            key={tool.key}
            type="button"
            className="toolbar-item"
            onClick={tool.backToLogin ? onLoginClick : undefined}
          >
            <span className={`icon tone-${tool.tone}`}>{tool.mark}</span>
            <span>{tool.label}</span>
          </button>
        )
      })}
    </div>
  )
}
