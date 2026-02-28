import { useState, useEffect } from 'react'
import { satuanDummyData } from '../../../data'
import { FooterMaster } from '../footer/FooterMaster'
import { DeleteMaster } from '../footer/DeleteMaster'

export function Satuan({ onExit }) {
  const [data, setData] = useState(satuanDummyData.rows)
  const [form, setForm] = useState({ kode: '', satuan: '' })
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
      row.satuan.toLowerCase().includes(keyword)
    )
  })

  const handleSave = () => {
    if (!form.kode || !form.satuan) return
    
    if (selectedIndex >= 0) {
      const newData = [...data]
      newData[selectedIndex] = { ...newData[selectedIndex], ...form }
      setData(newData)
    } else {
      const newRow = {
        kode: form.kode,
        satuan: form.satuan,
      }
      setData([...data, newRow])
    }
    setForm({ kode: '', satuan: '' })
    setSelectedIndex(-1)
    setShowForm(false)
  }

  const handleSelect = (index) => {
    setSelectedIndex(index)
    setForm({ kode: data[index].kode, satuan: data[index].satuan })
  }

  const handleDeleteClick = () => {
    if (selectedIndex >= 0) {
      setShowDeleteConfirm(true)
    }
  }

  const handleConfirmDelete = () => {
    const newData = data.filter((_, i) => i !== selectedIndex)
    setData(newData)
    setForm({ kode: '', satuan: '' })
    setSelectedIndex(-1)
    setShowForm(false)
    setShowDeleteConfirm(false)
  }

  const handleNew = () => {
    setShowForm(true)
    setForm({ kode: '', satuan: '' })
    setSelectedIndex(-1)
  }

  const handleEdit = () => {
    if (selectedIndex >= 0) {
      setShowForm(true)
    } else if (data.length > 0) {
      setSelectedIndex(0)
      setForm({ kode: data[0].kode, satuan: data[0].satuan })
      setShowForm(true)
    }
  }

  const handleExitClick = () => {
    setShowExitConfirm(true)
  }

  const handleConfirmExit = () => {
    setShowExitConfirm(false)
    onExit()
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
    <div className="master-content with-wallpaper frame-color-primary">
      <h1 className="master-title no-print">satuan</h1>
      <div className="master-table-wrapper">
        <div className="master-table-title print-only">Data Satuan</div>
        <table className="master-table">
          <thead>
            <tr>
              <th className="w-16">No</th>
              <th className="w-24">Kode</th>
              <th>Satuan</th>
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
                <td>{row.satuan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className="master-form">
          <h2>{selectedIndex >= 0 ? 'Ubah Data Satuan' : 'Isi Data Satuan'}</h2>
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
              <label>Satuan :</label>
              <input
                type="text"
                value={form.satuan}
                onChange={(e) => setForm({ ...form, satuan: e.target.value })}
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
          itemName={data[selectedIndex]?.satuan}
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
