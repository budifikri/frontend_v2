export const gudangDummyData = {
  title: 'Data Gudang',
  headers: ['Kode', 'Nama Gudang', 'Alamat', 'Telepon', 'Status'],
  rows: [
    { kode: 'GDG001', nama: 'Gudang Utama', alamat: 'Jl. Merdeka No. 10', telepon: '021-1234567', status: 'Aktif' },
    { kode: 'GDG002', nama: 'Gudang Cadangan', alamat: 'Jl. Sudirman No. 25', telepon: '021-2345678', status: 'Aktif' },
    { kode: 'GDG003', nama: 'Gudang Offline', alamat: 'Jl. Thamrin No. 50', telepon: '021-3456789', status: 'Nonaktif' },
  ],
}

export const gudangFormFields = [
  { key: 'kode', label: 'Kode Gudang', type: 'text', placeholder: 'Masukkan kode gudang' },
  { key: 'nama', label: 'Nama Gudang', type: 'text', placeholder: 'Masukkan nama gudang' },
  { key: 'alamat', label: 'Alamat', type: 'text', placeholder: 'Masukkan alamat' },
  { key: 'telepon', label: 'Telepon', type: 'text', placeholder: 'Masukkan nomor telepon' },
]

export const satuanDummyData = {
  title: 'Data Satuan',
  rows: [
    { kode: 'PCS', satuan: 'Pieces' },
    { kode: 'BOX', satuan: 'Box' },
    { kode: 'KG', satuan: 'Kilogram' },
    { kode: 'LTR', satuan: 'Liter' },
    { kode: 'PACK', satuan: 'Pack' },
  ],
}
