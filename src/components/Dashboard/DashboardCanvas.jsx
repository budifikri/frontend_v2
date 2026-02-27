import { Warehouse } from '../ToolbarItem/master/Warehouse'
import { Satuan } from '../ToolbarItem/master/Satuan'

export function DashboardCanvas({ activeTool }) {
  if (activeTool === 'warehouse') {
    return (
      <div className="dashboard-canvas">
        <Warehouse />
      </div>
    )
  }

  if (activeTool === 'satuan') {
    return (
      <div className="dashboard-canvas">
        <Satuan />
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
