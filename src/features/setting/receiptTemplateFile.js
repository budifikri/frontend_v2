const TEMPLATE_VERSION = 1
const TEMPLATE_KIND = 'receipt-template'

export function createTemplatePayload(printerType, customTemplate) {
  const payload = {
    version: TEMPLATE_VERSION,
    kind: TEMPLATE_KIND,
    printer_type: printerType,
  }

  if (printerType === 'dot_matrix') {
    payload.custom_template_text_dot_matrix = customTemplate?.custom_template_text_dot_matrix || ''
  } else {
    payload.custom_template_html = customTemplate?.custom_template_html || ''
    payload.custom_template_css = customTemplate?.custom_template_css || ''
  }

  return payload
}

export function validateTemplatePayload(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Format file tidak valid' }
  }

  if (data.kind !== TEMPLATE_KIND) {
    return { valid: false, error: 'File bukan template receipt yang valid' }
  }

  if (typeof data.version !== 'number' || data.version !== TEMPLATE_VERSION) {
    return { valid: false, error: 'Versi template tidak didukung' }
  }

  if (data.printer_type !== 'dot_matrix' && data.printer_type !== 'thermal') {
    return { valid: false, error: 'Jenis printer tidak valid' }
  }

  return { valid: true }
}

export function extractTemplateFromPayload(data) {
  if (data.printer_type === 'dot_matrix') {
    return {
      printer_type: 'dot_matrix',
      custom_template_text_dot_matrix: data.custom_template_text_dot_matrix || '',
    }
  }

  return {
    printer_type: 'thermal',
    custom_template_html: data.custom_template_html || '',
    custom_template_css: data.custom_template_css || '',
  }
}

export function downloadTemplateJson(data, suggestedFileName) {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = suggestedFileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

export async function saveTemplateNative(data, suggestedFileName) {
  const jsonString = JSON.stringify(data, null, 2)
  
  // Cek support File System Access API
  if ('showSaveFilePicker' in window) {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: suggestedFileName,
        types: [{
          description: 'Receipt Template',
          accept: { 'application/json': ['.json'] }
        }]
      })
      const writable = await fileHandle.createWritable()
      await writable.write(jsonString)
      await writable.close()
      return { success: true, fileName: fileHandle.name }
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'Dibatalkan pengguna' }
      }
      console.error('Save As error:', err)
      return { success: false, error: err.message }
    }
  }
  
  // Fallback ke blob download
  downloadTemplateJson(data, suggestedFileName)
  return { success: true, fileName: suggestedFileName }
}

export function readTemplateFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result)
        resolve(data)
      } catch {
        reject(new Error('Gagal membaca file template'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Gagal membaca file template'))
    }

    reader.readAsText(file)
  })
}