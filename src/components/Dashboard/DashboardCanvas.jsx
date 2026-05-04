import { Warehouse } from '../ToolbarItem/master/Warehouse'
import { Satuan } from '../ToolbarItem/master/Satuan'
import { Category } from '../ToolbarItem/master/Category'
import { Product } from '../ToolbarItem/master/Product'
import { Customer } from '../ToolbarItem/master/Customer'
import { Supplier } from '../ToolbarItem/master/Supplier'
import { Dokter } from '../ToolbarItem/master/Dokter'
import { JadwalDokter } from '../ToolbarItem/master/JadwalDokter'
import { Company } from '../ToolbarItem/master/Company'
import { CompanySetting } from '../ToolbarItem/setting/CompanySetting'
import { StockOpname } from '../ToolbarItem/transaksi/StockOpname'
import { Purchase } from '../ToolbarItem/transaksi/Purchase'
import { StockReceive } from '../ToolbarItem/transaksi/StockReceive'
import { PurchaseReturn } from '../ToolbarItem/transaksi/PurchaseReturn'
import { Promotion } from '../ToolbarItem/transaksi/Promotion'
import { Theme } from '../ToolbarItem/setting/theme/Theme'
import { User } from '../ToolbarItem/setting/user/User'
import { BusinessTypeSetting } from '../ToolbarItem/setting/BusinessTypeSetting'
import { ModulePackageSetting } from '../ToolbarItem/setting/ModulePackageSetting'
import { ModuleSettings } from '../ToolbarItem/setting/ModuleSettings'
import { ReportSetting } from '../ToolbarItem/setting/ReportSetting'
import { LapStock } from '../ToolbarItem/laporan/stok/LapStock'
import { LapHargaGrosir } from '../ToolbarItem/laporan/harga-grosir/LapHargaGrosir'
import { LapCashDrawer } from '../ToolbarItem/laporan/cash-drawer/LapCashDrawer'
import { LapPenjualan } from '../ToolbarItem/laporan/penjualan/LapPenjualan'
import { LapPembelian } from '../ToolbarItem/laporan/pembelian/LapPembelian'
import { LapLabaRugi } from '../ToolbarItem/laporan/laba-rugi/LapLabaRugi'
import { LapPengeluaran } from '../ToolbarItem/laporan/pengeluaran/LapPengeluaran'
import { BackupRestore } from '../ToolbarItem/setting/BackupRestore'
import { Telegram } from '../ToolbarItem/setting/Telegram'

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

  if (activeTool === 'business_type') {
    return (
      <div className="dashboard-canvas">
        <BusinessTypeSetting onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'module_package') {
    return (
      <div className="dashboard-canvas">
        <ModulePackageSetting onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'module') {
    return (
      <div className="dashboard-canvas">
        <ModuleSettings onExit={onExit} />
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

  if (activeTool === 'dokter') {
    return (
      <div className="dashboard-canvas">
        <Dokter onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'jadwal_dokter') {
    return (
      <div className="dashboard-canvas">
        <JadwalDokter onExit={onExit} />
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

  if (activeTool === 'company') {
    return (
      <div className="dashboard-canvas">
        <CompanySetting onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'report_setting') {
    return (
      <div className="dashboard-canvas">
        <ReportSetting onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'dept') {
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

  if (activeTool === 'laphargagrosir') {
    return (
      <div className="dashboard-canvas">
        <LapHargaGrosir onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'lapcashdrawer') {
    return (
      <div className="dashboard-canvas">
        <LapCashDrawer onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'lapjual') {
    return (
      <div className="dashboard-canvas">
        <LapPenjualan onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'lapbeli') {
    return (
      <div className="dashboard-canvas">
        <LapPembelian onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'laplabarugi') {
    return (
      <div className="dashboard-canvas">
        <LapLabaRugi onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'lappengeluaran') {
    return (
      <div className="dashboard-canvas">
        <LapPengeluaran onExit={onExit} />
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

  if (activeTool === 'beli') {
    return (
      <div className="dashboard-canvas">
        <Purchase onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'receive') {
    return (
      <div className="dashboard-canvas">
        <StockReceive onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'retur') {
    return (
      <div className="dashboard-canvas">
        <PurchaseReturn onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'promotion') {
    return (
      <div className="dashboard-canvas">
        <Promotion onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'backup') {
    return (
      <div className="dashboard-canvas">
        <BackupRestore onExit={onExit} />
      </div>
    )
  }

  if (activeTool === 'telegram') {
    return (
      <div className="dashboard-canvas">
        <Telegram onExit={onExit} />
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
