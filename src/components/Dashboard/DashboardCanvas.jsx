import { Warehouse } from '../ToolbarItem/master/Warehouse'
import { Satuan } from '../ToolbarItem/master/Satuan'
import { Category } from '../ToolbarItem/master/Category'
import { Product } from '../ToolbarItem/master/Product'
import { Customer } from '../ToolbarItem/master/Customer'
import { Supplier } from '../ToolbarItem/master/Supplier'
import { Company } from '../ToolbarItem/master/Company'
import { StockOpname } from '../ToolbarItem/master/StockOpname'
import { Theme } from '../ToolbarItem/setting/theme/Theme'
import { User } from '../ToolbarItem/setting/user/User'
import { LapStock } from '../ToolbarItem/laporan/stok/LapStock'

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

  if (activeTool === 'theme') {
    return (
      <div className="dashboard-canvas">
        <Theme onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'user') {
    return (
      <div className="dashboard-canvas">
        <User onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'customer') {
    return (
      <div className="dashboard-canvas">
        <Customer onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'supplier') {
    return (
      <div className="dashboard-canvas">
        <Supplier onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'categori') {
    return (
      <div className="dashboard-canvas">
        <Category onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'product') {
    return (
      <div className="dashboard-canvas">
        <Product onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'company' || activeTool === 'dept') {
    return (
      <div className="dashboard-canvas">
        <Company onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'lapstok') {
    return (
      <div className="dashboard-canvas">
        <LapStock onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'opname') {
    return (
      <div className="dashboard-canvas">
        <StockOpname onExit={onExit} />
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
