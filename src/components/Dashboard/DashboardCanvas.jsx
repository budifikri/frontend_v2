import { Warehouse } from '../ToolbarItem/master/Warehouse'
import { Satuan } from '../ToolbarItem/master/Satuan'

export function DashboardCanvas({ activeTool, onExit }) {
  if (activeTool === 'warehouse') {
    return (
      <div className="dashboard-canvas">
        <Warehouse onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'satuan') {
    return (
      <div className="dashboard-canvas">
        <Satuan onExit={onExit} />
      </div>
    )
  }

  return (
    <div className="dashboard-canvas" aria-hidden="true">
      <div className="cash-register">
        <div className="display" />
        <div className="keys" />
        <div className="base" />
      </div>
    </div>
  )
}
