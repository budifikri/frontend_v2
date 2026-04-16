export const toolbarItems = {
  master: [
    { key: 'logout', label: 'Logout', mark: 'L', tone: 'slate', backToLogin: true },
    { key: 'divider-1', divider: true },
    { key: 'warehouse', label: 'Warehouse', mark: 'W', tone: 'orange' },
    { key: 'satuan', label: 'Unit', mark: 'U', tone: 'green' },
    { key: 'categori', label: 'Kategori', mark: 'K', tone: 'blue' },
    { key: 'product', label: 'Product', mark: 'P', tone: 'indigo' },
    { key: 'divider-3', divider: true },
    { key: 'customer', label: 'Customer', mark: 'C', tone: 'pink' },
    { key: 'supplier', label: 'Supplier', mark: 'S', tone: 'lime' },
 

  ],
  transaksi: [
  { key: 'logout', label: 'Logout', mark: 'L', tone: 'slate', backToLogin: true },
    { key: 'divider-1', divider: true },
   { key: 'penjualan', label: 'Penjualan', mark: 'J', tone: 'blue', isPopup: true, subItems: [
    { key: 'promotion', label: 'Promotion', mark: 'M', tone: 'purple' },

    ]},
    { key: 'pembelian', label: 'Pembelian', mark: 'P', tone: 'amber', isPopup: true, subItems: [
 { key: 'beli', label: 'Order Pembelian', mark: 'P', tone: 'orange' },
    { key: 'receive', label: 'Stock Receive', mark: 'S', tone: 'cyan' },
    { key: 'retur', label: 'Retur Pembelian', mark: 'R', tone: 'green' },
    ]},
    
    { key: 'inventory', label: 'Inventory', mark: 'I', tone: 'blue', isPopup: true, subItems: [
    { key: 'opname', label: 'Stock Opname', mark: 'O', tone: 'cyan' },
    ]},
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
      { key: 'lapjual', label: 'Detail Penjualan', mark: 'D', tone: 'blue' },
      { key: 'lapcashdrawer', label: 'Lap. Cash Drawer', mark: 'D', tone: 'orange' },
      { key: 'laphargagrosir', label: 'Lap. Harga Grosir', mark: 'G', tone: 'blue' },
    
      ]
    
     },
    
    { key: 'pembelian', label: 'Pembelian', mark: 'P', tone: 'amber', isPopup: true, subItems: [
  
    { key: 'lapbeli', label: 'Detil Pembelian', mark: 'B', tone: 'orange' },
    ]},
 
{ key: 'lapstok', label: 'Lap. Stok', mark: 'S', tone: 'green' },
     
    { key: 'keuangan', label: 'Keuangan', mark: 'K', tone: 'amber', isPopup: true, subItems: [
      { key: 'laplabarugi', label: 'Laporan Laba Rugi', mark: 'L', tone: 'blue' },
      { key: 'lappengeluaran', label: 'Laporan Pengeluaran', mark: 'P', tone: 'orange' },
    ] },
 
  ],
  setting: [
    { key: 'logout', label: 'Logout', mark: 'L', tone: 'slate', backToLogin: true },
    { key: 'divider-1', divider: true },
    { key: 'theme', label: 'Theme', mark: 'T', tone: 'cyan' },
    { key: 'user', label: 'User', mark: 'U', tone: 'blue' },
    { key: 'company', label: 'Company', mark: 'O', tone: 'red' },
    { key: 'report_setting', label: 'Report Settings', mark: 'R', tone: 'purple' },
    { key: 'divider-3', divider: true },
    { key: 'backup', label: 'Backup and Restore', mark: 'B', tone: 'green' },
  ],
  help: [
  { key: 'logout', label: 'Logout', mark: 'L', tone: 'slate', backToLogin: true },
    { key: 'divider-1', divider: true },
    { key: 'about', label: 'About', mark: 'A', tone: 'blue' },
  ],
}
