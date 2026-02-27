import { useState } from 'react'
import { gudangDummyData } from '../../data'

export function GudangCRUD() {
  const [data, setData] = useState(gudangDummyData.rows)
  const [form, setForm] = useState({ kode: '', nama: '' })
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showForm, setShowForm] = useState(false)

  const handleSave = () => {
    if (!form.kode || !form.nama) return
    
    if (selectedIndex >= 0) {
      const newData = [...data]
      newData[selectedIndex] = { ...newData[selectedIndex], ...form }
      setData(newData)
    } else {
      const newRow = {
        kode: form.kode,
        nama: form.nama,
        alamat: '',
        telepon: '',
        status: 'Aktif',
      }
      setData([...data, newRow])
    }
    setForm({ kode: '', nama: '' })
    setSelectedIndex(-1)
    setShowForm(false)
  }

  const handleSelect = (index) => {
    setSelectedIndex(index)
    setForm({ kode: data[index].kode, nama: data[index].nama })
    setShowForm(true)
  }

  const handleDelete = () => {
    if (selectedIndex >= 0) {
      const newData = data.filter((_, i) => i !== selectedIndex)
      setData(newData)
      setForm({ kode: '', nama: '' })
      setSelectedIndex(-1)
      setShowForm(false)
    }
  }

  const handleNew = () => {
    setShowForm(!showForm)
    if (!showForm) {
      setForm({ kode: '', nama: '' })
      setSelectedIndex(-1)
    }
  }

  return (
    <div className="gudang-crud">
      <h1 className="gudang-title">warehouse</h1>
      <div className="gudang-table-wrapper">
        <table className="gudang-table">
          <thead>
            <tr>
              <th className="w-16">No</th>
              <th className="w-24">Kode</th>
              <th>Nama</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row.kode}
                className={selectedIndex === index ? 'selected' : ''}
                onClick={() => handleSelect(index)}
              >
                <td>{index + 1}</td>
                <td>{row.kode}</td>
                <td>{row.nama}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className="gudang-form">
          <h2>Isi Data Gudang</h2>
          <div className="gudang-form-row">
            <div className="gudang-form-group">
              <label>Kode :</label>
              <input
                type="text"
                value={form.kode}
                onChange={(e) => setForm({ ...form, kode: e.target.value })}
                className="gudang-input"
              />
            </div>
            <div className="gudang-form-group flex-grow">
              <label>Nama :</label>
              <input
                type="text"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                className="gudang-input"
              />
            </div>
            <button type="button" className="gudang-btn-save" onClick={handleSave}>
              Simpan
            </button>
          </div>
        </div>
      )}
      <div className="gudang-footer">
        <div className="gudang-footer-actions">
          <button type="button" className="gudang-footer-btn" onClick={handleNew}>
            <span className="gudang-footer-icon orange">edit_note</span>
            <span className="gudang-footer-key">F1</span>
          </button>
          <button type="button" className="gudang-footer-btn" onClick={() => handleSelect(selectedIndex >= 0 ? selectedIndex : 0)}>
            <span className="gudang-footer-icon orange">edit_square</span>
            <span className="gudang-footer-key">F2</span>
          </button>
          <button type="button" className="gudang-footer-btn" onClick={handleDelete}>
            <span className="gudang-footer-icon red">remove_circle</span>
            <span className="gudang-footer-key">F3</span>
          </button>
          <button type="button" className="gudang-footer-btn">
            <span className="gudang-footer-icon">print</span>
          </button>
        </div>
        <div className="gudang-footer-search">
          <input type="text" placeholder="Search keyword..." className="gudang-search-input" />
          <button type="button" className="gudang-search-btn">
            <span className="material-icon">search</span>
          </button>
        </div>
        <div className="gudang-footer-pagination">
          <button type="button" className="gudang-page-btn" title="First Page">&lt;&lt;</button>
          <button type="button" className="gudang-page-btn" title="Previous Page">&lt;</button>
          <span className="gudang-page-info">Page 1 of 1</span>
          <button type="button" className="gudang-page-btn" title="Next Page">&gt;</button>
          <button type="button" className="gudang-page-btn" title="Last Page">&gt;&gt;</button>
        </div>
        <div className="gudang-footer-info">
          <span>Total Row: {data.length}</span>
        </div>
        <button type="button" className="gudang-exit-btn">
          <span>EXIT</span>
        </button>
      </div>
    </div>
  )
}
