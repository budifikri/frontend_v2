import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls']
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]

export function validateImportFile(file, expectedColumns = []) {
  return new Promise((resolve, reject) => {
    const fileName = file.name.toLowerCase()
    const extension = '.' + fileName.split('.').pop()
    const isValidExtension = ALLOWED_EXTENSIONS.includes(extension)

    if (!isValidExtension) {
      reject(new Error('Format data / tipe file Tidak Sesuai'))
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          reject(new Error('File Excel tidak memiliki sheet'))
          return
        }

        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length === 0) {
          reject(new Error('File Excel kosong'))
          return
        }

        const headers = jsonData[0]
        const allRows = jsonData.slice(1)

        const isRowEmpty = (row) => {
          return !row || row.every(cell => cell === null || cell === undefined || cell === '')
        }

        const rows = allRows.filter(row => !isRowEmpty(row))

        if (expectedColumns.length > 0) {
          const missingColumns = expectedColumns.filter(
            col => !headers.some(h => h && h.toString().toUpperCase() === col.label.toUpperCase())
          )

          if (missingColumns.length > 0) {
            reject(new Error(`Kolom tidak lengkap. Kolom yang diharapkan: ${missingColumns.map(c => c.label).join(', ')}`))
            return
          }
        }

        const result = rows.map((row) => {
          const obj = {}
          headers.forEach((header, index) => {
            obj[header] = row[index]
          })
          return obj
        })

        resolve({
          data: result,
          fileName: file.name,
          recordCount: result.length,
          isValid: true,
        })
      } catch (error) {
        reject(new Error(`Gagal membaca file: ${error.message}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Gagal membaca file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

export function exportToExcel(data, filename) {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' })

  saveAs(dataBlob, `${filename}.xlsx`)
}

export function importFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length === 0) {
          reject(new Error('Empty Excel file'))
          return
        }

        const headers = jsonData[0]
        const allRows = jsonData.slice(1)

        const isRowEmpty = (row) => {
          return !row || row.every(cell => cell === null || cell === undefined || cell === '')
        }

        const rows = allRows.filter(row => !isRowEmpty(row))

        const result = rows.map((row) => {
          const obj = {}
          headers.forEach((header, index) => {
            obj[header] = row[index]
          })
          return obj
        })

        resolve(result)
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

export function generateTemplate(columns, filename) {
  const headers = columns.map((col) => col.label || col.key)

  const emptyRow = {}
  columns.forEach((col) => {
    emptyRow[col.key] = ''
  })

  const data = [emptyRow]

  const ws = XLSX.utils.json_to_sheet(data)

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C })
    if (!ws[address]) continue
    ws[address].v = headers[C]
    ws[address].t = 's'
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' })

  saveAs(dataBlob, `${filename}.xlsx`)
}