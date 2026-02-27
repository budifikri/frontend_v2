import { Warehouse } from '../ToolbarItem/master/Warehouse'

export function DashboardCanvas({ activeTool }) {
  if (activeTool === 'warehouse') {
    return (
      <div className="dashboard-canvas">
        <Warehouse />
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
