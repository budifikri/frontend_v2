import { GudangCRUD } from './GudangCRUD'

export function DashboardCanvas({ activeTool }) {
  if (activeTool === 'gudang') {
    return (
      <div className="dashboard-canvas">
        <GudangCRUD />
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
