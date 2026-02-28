import { useState, useEffect } from 'react'
import { gudangDummyData } from '../../../data'
import { FooterMaster } from '../footer/FooterMaster'
import { DeleteMaster } from '../footer/DeleteMaster'

export function Warehouse({ onExit }) {
  const [data, setData] = useState(gudangDummyData.rows)
  const [form, setForm] = useState({ kode: '', nama: '' })
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showDeleteConfirm) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setShowDeleteConfirm(false)
        }
        return
      }

      if (showForm) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setShowForm(false)
        }
        return
      }

      if (e.key === 'F2') {
        e.preventDefault()
        handleEdit()
      } else if (e.key === 'Delete') {
        e.preventDefault()
        handleDeleteClick()
      } else if (e.key === '+') {
        e.preventDefault()
        handleNew()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setShowExitConfirm(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showForm, showDeleteConfirm, showExitConfirm, selectedIndex, data])

  const filteredData = data.filter((row) => {
    const keyword = searchKeyword.toLowerCase()
    return (
      row.kode.toLowerCase().includes(keyword) ||
      row.nama.toLowerCase().includes(keyword)
    )
  })

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
    // No longer auto-showing form here
  }

  const handleDeleteClick = () => {
    if (selectedIndex >= 0) {
      setShowDeleteConfirm(true)
    }
  }

  const handleConfirmDelete = () => {
    const newData = data.filter((_, i) => i !== selectedIndex)
    setData(newData)
    setForm({ kode: '', nama: '' })
    setSelectedIndex(-1)
    setShowForm(false)
    setShowDeleteConfirm(false)
  }

  const handleNew = () => {
    setShowForm(true)
    setForm({ kode: '', nama: '' })
    setSelectedIndex(-1)
  }

  const handleEdit = () => {
    if (selectedIndex >= 0) {
      setShowForm(true)
    } else if (data.length > 0) {
      setSelectedIndex(0)
      setForm({ kode: data[0].kode, nama: data[0].nama })
      setShowForm(true)
    }
  }

  const handlePrint = () => {
    setShowForm(false)
    window.print()
  }

  const handleExitClick = () => {
    setShowExitConfirm(true)
  }

  const handleConfirmExit = () => {
    setShowExitConfirm(false)
    onExit()
  }

  return (
    <div className="master-content">
      <h1 className="master-title">warehouse</h1>
      <div className="master-table-wrapper">
          <div className="master-table-title print-only">
  Data Warehouse
</div>
        
        <table className="master-table">
          <thead>
            <tr>
              <th className="w-16">No</th>
              <th className="w-24">Kode</th>
              <th>Nama</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
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
          <h2>{selectedIndex >= 0 ? 'Ubah Data Warehouse' : 'Isi Data Warehouse'}</h2>
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
            <button type="button" className="master-btn-cancel" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <FooterMaster
        onNew={handleNew}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        totalRow={filteredData.length}
        onSearch={setSearchKeyword}
        onPrint={handlePrint}
        onExit={handleExitClick}
      />
      {showDeleteConfirm && (
        <DeleteMaster
          itemName={data[selectedIndex]?.nama}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
      {showExitConfirm && (
        <DeleteMaster
          itemName="keluar dari halaman ini"
          title="Konfirmasi Keluar"
          confirmText="Ya"
          cancelText="Tidak"
          isExit={true}
          onConfirm={handleConfirmExit}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
    </div>
  )
}
