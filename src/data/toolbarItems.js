export const toolbarItems = {
  master: [
    { key: 'logout', label: 'Logout', mark: 'L', tone: 'slate', backToLogin: true },
    { key: 'divider-1', divider: true },
    { key: 'warehouse', label: 'Warehouse', mark: 'W', tone: 'orange', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
    { key: 'satuan', label: 'Unit', mark: 'U', tone: 'green', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
    { key: 'categori', label: 'Kategori', mark: 'K', tone: 'blue', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
    { key: 'product', label: 'Product', mark: 'P', tone: 'indigo', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
    { key: 'divider-3', divider: true },
    { key: 'customer', label: 'Customer', mark: 'C', tone: 'pink', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
    { key: 'supplier', label: 'Supplier', mark: 'S', tone: 'lime', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
{ key: 'dokter', label: 'Dokter', mark: 'D', tone: 'cyan', filter: { businessType: ['clinic'], moduleCodes: ['clinic_core'] } },
    { key: 'jadwal_dokter', label: 'Jadwal Dokter', mark: 'J', tone: 'teal', filter: { businessType: ['clinic'], moduleCodes: ['clinic_core'] } },
    { key: 'divider-2', divider: true },
    { key: 'paket', label: 'Paket', mark: 'P', tone: 'purple', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
    { key: 'treatment', label: 'Treatment', mark: 'T', tone: 'teal', filter: { businessType: ['clinic'], moduleCodes: ['clinic_core'] } },
    
    

  ],
  transaksi: [
  { key: 'logout', label: 'Logout', mark: 'L', tone: 'slate', backToLogin: true },
    { key: 'divider-1', divider: true },
   { key: 'penjualan', label: 'Penjualan', mark: 'J', tone: 'blue', isPopup: true, subItems: [
    { key: 'promotion', label: 'Promotion', mark: 'M', tone: 'purple', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_advanced', 'clinic_advanced'] } },

    ]},
    { key: 'pembelian', label: 'Pembelian', mark: 'P', tone: 'amber', isPopup: true, subItems: [
 { key: 'beli', label: 'Order Pembelian', mark: 'B', tone: 'orange', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
    { key: 'receive', label: 'Stock Receive', mark: 'S', tone: 'cyan', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
    { key: 'retur', label: 'Retur Pembelian', mark: 'R', tone: 'green', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
    ]},
    
    { key: 'inventory', label: 'Inventory', mark: 'I', tone: 'blue', isPopup: true, subItems: [
    { key: 'opname', label: 'Stock Opname', mark: 'O', tone: 'cyan', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic','clinic_core'] } },
    ]},
    { key: 'appointment', label: 'Appointment', mark: 'A', tone: 'purple', filter: { businessType: ['clinic'], moduleCodes: ['clinic_core'] } },
    // { key: 'divider-2', divider: true },
    // { key: 'jual', label: 'Penjualan', mark: 'J', tone: 'blue' },
    // { key: 'resep', label: 'Resep', mark: 'R', tone: 'pink' },
    // { key: 'divider-3', divider: true },
    // { key: 'hutang', label: 'Hutang', mark: 'H', tone: 'red' },
    // { key: 'piutang', label: 'Piutang', mark: 'U', tone: 'yellow' },
  ],
  laporan: [
    { key: 'logout', label: 'Logout', mark: 'L', tone: 'slate', backToLogin: true },

    
    { key: 'divider-2', divider: true },
    { key: 'penjualan', label: 'Penjualan', mark: 'J', tone: 'blue', isPopup: true, subItems: [
      { key: 'lapjual', label: 'Detail Penjualan', mark: 'D', tone: 'blue', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
      { key: 'lapcashdrawer', label: 'Lap. Cash Drawer', mark: 'D', tone: 'orange', filter: { businessType: ['retail','clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
      { key: 'laphargagrosir', label: 'Lap. Harga Grosir', mark: 'G', tone: 'blue', filter: { businessType: ['retail'], moduleCodes: ['retail_advanced', 'clinic_advanced'] } },
     
       ]
    
     },
    
    { key: 'pembelian', label: 'Pembelian', mark: 'P', tone: 'amber', isPopup: true, subItems: [
  
    { key: 'lapbeli', label: 'Detil Pembelian', mark: 'B', tone: 'orange', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
    ]},
 
{ key: 'lapstok', label: 'Lap. Stok', mark: 'S', tone: 'green', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
     
    { key: 'keuangan', label: 'Keuangan', mark: 'K', tone: 'amber', isPopup: true, subItems: [
      { key: 'laplabarugi', label: 'Laporan Laba Rugi', mark: 'L', tone: 'blue' },
      { key: 'lappengeluaran', label: 'Laporan Pengeluaran', mark: 'P', tone: 'orange' },
    ] },
 
  ],
  setting: [
    { key: 'logout', label: 'Logout', mark: 'L', tone: 'slate', backToLogin: true },
    { key: 'divider-1', divider: true },
     { key: 'theme', label: 'Theme', mark: 'T', tone: 'cyan', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
     { key: 'user', label: 'User', mark: 'U', tone: 'blue', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
     { key: 'company', label: 'Company', mark: 'O', tone: 'red', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
     { key: 'business_type', label: 'Business Type', mark: 'Y', tone: 'amber', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
     { key: 'module_package', label: 'Module Package', mark: 'M', tone: 'indigo', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
     { key: 'report_setting', label: 'Report Settings', mark: 'R', tone: 'purple', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
     { key: 'divider-3', divider: true },
     { key: 'backup', label: 'Backup and Restore', mark: 'B', tone: 'green', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
     { key: 'telegram', label: 'Telegram', mark: 'G', tone: 'blue', filter: { businessType: ['retail', 'clinic'], moduleCodes: ['retail_basic', 'clinic_core'] } },
   ],
  help: [
  { key: 'logout', label: 'Logout', mark: 'L', tone: 'slate', backToLogin: true },
    { key: 'divider-1', divider: true },
    { key: 'about', label: 'About', mark: 'A', tone: 'blue' },
  ],
}
