import { useState } from 'react'
import { gudangDummyData } from '../../../data'
import { FooterMaster } from '../footer/FooterMaster'

export function Warehouse() {
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

  const handleEdit = () => {
    if (selectedIndex >= 0) {
      setShowForm(true)
    } else if (data.length > 0) {
      handleSelect(0)
    }
  }

  return (
    <>
      <div className="master-content">
        <h1 className="master-title">warehouse</h1>
        <div className="master-table-wrapper">
          <table className="master-table">
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
          <div className="master-form">
            <h2>Isi Data Gudang</h2>
            <div className="master-form-row">
              <div className="master-form-group">
                <label>Kode :</label>
                <input
                  type="text"
                  value={form.kode}
                  onChange={(e) => setForm({ ...form, kode: e.target.value })}
                  className="master-input"
                />
              </div>
              <div className="master-form-group flex-grow">
                <label>Nama :</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="master-input"
                />
              </div>
              <button type="button" className="master-btn-save" onClick={handleSave}>
                Simpan
              </button>
            </div>
          </div>
        )}
      </div>
      <FooterMaster
        onNew={handleNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        totalRow={data.length}
      />
    </>
  )
}
