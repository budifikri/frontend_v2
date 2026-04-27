const ESC = '\x1b'
const GS = '\x1d'
const LF = '\n'

const DOT_MATRIX_LAYOUT_A = `{{company_name}}
{{company_address}}
Telp: {{company_phone}}
{{garis}}
No   : {{sale_number}}
Tgl  : {{sale_date}}
Kasir: {{cashier_name}}
{{garis}}
{{items_rows}}
{{garis}}
Subtotal   : {{subtotal}}
Discount  : {{discount}}
PPN       : {{tax_amount}}
TOTAL     : {{total_amount}}
Bayar     : {{paid_amount}}
Kembali   : {{change_amount}}
{{garis}}
{{footer_text}}
`

const DOT_MATRIX_LAYOUT_B = `{{company_name}}
{{company_address}}
Telp: {{company_phone}}
{{garis}}
No   : {{sale_number}}
Tgl  : {{sale_date}}
Kasir: {{cashier_name}}
Gudang: {{warehouse_name}}
{{garis}}
{{items_rows}}
{{garis}}
Subtotal      : {{subtotal}}
Discount     : {{discount}}
PPN ({{ppn_percentage}}%) : {{tax_amount}}
TOTAL        : {{total_amount}}
{{garis}}
Bayar ({{payment_method}}) : {{paid_amount}}
Kembalian       : {{change_amount}}
{{garis}}
{{payments_rows}}
{{garis}}
{{footer_text}}
`

const DOT_MATRIX_LAYOUT_C = `{{company_name}}
{{company_address}} Telp:{{company_phone}}
{{garis}}
No: {{sale_number}} Tgl: {{sale_date}}
Kasir: {{cashier_name}}
{{items_rows}}
{{garis}}
Total : {{total_amount}}
Bayar : {{paid_amount}}
Kembali: {{change_amount}}
{{footer_text}}
`

const DOT_MATRIX_TOKEN_LIST = [
  '{{company_name}}',
  '{{company_address}}',
  '{{company_phone}}',
  '{{sale_number}}',
  '{{sale_date}}',
  '{{cashier_name}}',
  '{{warehouse_name}}',
  '{{items_rows}}',
  '{{#each items}}',
  '{{/each items}}',
  '{{index}}',
  '{{name}}',
  '{{quantity}}',
  '{{unit_price}}',
  '{{subtotal}}',
  '{{discount}}',
  '{{payments_rows}}',
  '{{subtotal}}',
  '{{original_total}}',
  '{{discount}}',
  '{{tax_amount}}',
  '{{ppn_percentage}}',
  '{{total_amount}}',
  '{{paid_amount}}',
  '{{change_amount}}',
  '{{payment_method}}',
  '{{footer_text}}',
  '{{garis}}',
  '{{ganti_baris}}',
  '[R3]', '[R5]', '[R]',
  '[L3]', '[L5]', '[L]',
  '[C2]', '[C3]', '[C4]', '[C]',
]

const DEFAULT_CUSTOM_TEMPLATE_TEXT_DOT_MATRIX = `{{company_name}}
{{company_address}}
Telp: {{company_phone}}
{{garis}}
No     : {{sale_number}}
Tgl    : {{sale_date}}
Kasir  : {{cashier_name}}
Gudang : {{warehouse_name}}
{{garis}}
{{items_rows}}
{{garis}}
Subtotal : {{subtotal}}
Diskon   : {{discount}}
PPN      : {{tax_amount}}
TOTAL    : {{total_amount}}
Bayar    : {{paid_amount}}
Kembali  : {{change_amount}}
{{garis}}
{{payments_rows}}
{{garis}}
{{footer_text}}
`

function formatCurrency(value) {
  const num = Number(value || 0)
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num).replace('Rp', '').replace(',00', '').trim()
}

function padRight(text, length) {
  const str = String(text)
  if (str.length >= length) return str.substring(0, length)
  return str + ' '.repeat(length - str.length)
}

function padLeft(text, length) {
  const str = String(text)
  if (str.length >= length) return str.substring(0, length)
  return ' '.repeat(length - str.length) + str
}

function centerText(text, length) {
  const str = String(text)
  if (str.length >= length) return str.substring(0, length)
  const left = Math.floor((length - str.length) / 2)
  return ' '.repeat(left) + str + ' '.repeat(length - left - str.length)
}

function processAlignmentTags(text, charsPerLine) {
  const lines = text.split('\n')
  return lines.map(line => {
    const widthPattern = /\[([RLC])(\d+)\]/i
    const widthMatch = line.match(widthPattern)
    if (widthMatch) {
      const align = widthMatch[1].toUpperCase()
      const width = parseInt(widthMatch[2], 10)
      const content = line.replace(widthMatch[0], '')
      return applyAlignment(content, align, width)
    }
    if (line.startsWith('[C]') || line.startsWith('[c]')) {
      return centerText(line.substring(3), charsPerLine)
    }
    if (line.startsWith('[R]') || line.startsWith('[r]')) {
      return padLeft(line.substring(3), charsPerLine)
    }
    return line
  }).join('\n')
}

function applyAlignment(text, alignment, width) {
  const str = String(text)
  if (str.length >= width) return str.substring(0, width)
  switch (alignment) {
    case 'R': return str.padStart(width, ' ')
    case 'L': return str.padEnd(width, ' ')
    case 'C':
      const left = Math.floor((width - str.length) / 2)
      return str.padStart(left + str.length, ' ').padEnd(width, ' ')
    default: return str
  }
}

function parseAlignmentMarker(line) {
  const widthPattern = /\[([RLC])(\d+)\]/i
  const widthMatch = line.match(widthPattern)
  if (widthMatch) {
    return {
      alignment: widthMatch[1].toUpperCase(),
      width: parseInt(widthMatch[2], 10),
      cleanedLine: line.replace(widthMatch[0], ''),
    }
  }
  const simplePattern = /\[([RLC])\]/i
  const simpleMatch = line.match(simplePattern)
  if (simpleMatch) {
    return {
      alignment: simpleMatch[1].toUpperCase(),
      width: 0,
      cleanedLine: line.replace(simpleMatch[0], ''),
    }
  }
  return { alignment: 'L', width: 0, cleanedLine: line }
}

function replaceItemTokens(blockContent, item, charsPerLine) {
  const tokenDefs = {
    index: () => String(item.index),
    name: () => item.name,
    quantity: () => String(item.quantity),
    unit_price: () => formatCurrency(item.unitPrice),
    subtotal: () => formatCurrency(item.subtotal),
    discount: () => formatCurrency(item.discount),
  }

  const lines = blockContent.split('\n')
  return lines.map(line => {
    if (!line.trim()) return ''
    return processLineWithTokens(line, tokenDefs)
  }).join('\n')
}

function processLineWithTokens(line, tokenDefs) {
  let result = ''
  let remaining = line.trim()

  while (remaining.length > 0) {
    const markerMatch = remaining.match(/^\[([RLC])(\d*)\]/i)

    if (markerMatch) {
      const align = markerMatch[1].toUpperCase()
      const width = markerMatch[2] ? parseInt(markerMatch[2], 10) : 0
      remaining = remaining.substring(markerMatch[0].length)

      const tokenMatch = remaining.match(/^\{\{\s*(\w+)\s*\}\}/)
      if (tokenMatch) {
        const tokenName = tokenMatch[1]
        remaining = remaining.substring(tokenMatch[0].length)
        const value = tokenDefs[tokenName] ? tokenDefs[tokenName]() : ''
        if (width > 0) {
          result += applyAlignment(value, align, width)
        } else if (align === 'R') {
          result += value
        } else if (align === 'L') {
          result += value
        } else {
          result += value
        }
      }
    } else {
      const nextMarker = remaining.search(/\[([RLC])(\d*)\]/i)
      const nextToken = remaining.search(/\{\{\s*\w+\s*\}\}/)

      if (nextMarker === -1 && nextToken === -1) {
        result += remaining
        break
      }

      let segmentEnd = remaining.length
      if (nextMarker !== -1 && nextToken !== -1) {
        segmentEnd = Math.min(nextMarker, nextToken)
      } else if (nextMarker !== -1) {
        segmentEnd = nextMarker
      } else {
        segmentEnd = nextToken
      }

      result += remaining.substring(0, segmentEnd)
      remaining = remaining.substring(segmentEnd)
    }
  }

  return result
}

function parseEachItemsBlock(template, itemRows, charsPerLine) {
  const eachPattern = /\{\{#each\s+items\}\}([\s\S]*?)\{\{\/each\s+items\}\}/gi
  return template.replace(eachPattern, (match, blockContent) => {
    if (!itemRows || itemRows.length === 0) return '-'
    return itemRows.map(item => replaceItemTokens(blockContent, item, charsPerLine)).join('\n')
  })
}

function resolveCharsPerLine(settings) {
  const value = Number(settings?.chars_per_line)
  if (!Number.isFinite(value)) {
    return 38
  }

  return Math.max(20, Math.min(80, Math.round(value)))
}

function renderDotMatrixItemLine(item, charsPerLine) {
  const amountText = formatCurrency(item.subtotal)
  const qtyPrice = `${item.quantity} x ${formatCurrency(item.unitPrice)}`
  const trailingText = `${qtyPrice} ${amountText}`
  const maxNameLength = Math.max(8, charsPerLine - trailingText.length - 1)
  const namePart = item.name.length > maxNameLength
    ? item.name.substring(0, Math.max(5, maxNameLength - 3)) + '...'
    : item.name

  return `${padRight(namePart, charsPerLine - trailingText.length)} ${trailingText}`
}

function renderDotMatrixItemsRows(itemRows, charsPerLine = 42) {
  if (!itemRows || itemRows.length === 0) return '-'
  return itemRows.map(item => renderDotMatrixItemLine(item, charsPerLine)).join('\n')
}

function renderDotMatrixPaymentsRows(paymentRows) {
  if (!paymentRows || paymentRows.length === 0) return '-'
  return paymentRows.map(p => `${padRight(p.method, 10)} ${formatCurrency(p.amount)}`).join('\n')
}

function getSeparator(charsPerLine) {
  return '='.repeat(charsPerLine)
}

function replaceDotMatrixToken(template, model) {
  const charsPerLine = model.charsPerLine
  
  const itemLines = renderDotMatrixItemsRows(model.itemRows, charsPerLine)
  const paymentLines = renderDotMatrixPaymentsRows(model.paymentRows)
  const ppnPct = model.ppnPercentage || 11
  
  const tokenValues = {
    company_name: model.company.name,
    company_address: model.company.address,
    company_phone: model.company.phone,
    sale_number: model.meta.number,
    sale_date: model.meta.dateFormatted,
    cashier_name: model.meta.cashier,
    warehouse_name: model.meta.warehouse,
    items_rows: itemLines,
    payments_rows: paymentLines,
    subtotal: formatCurrency(model.summary.subtotal),
    original_total: formatCurrency(model.summary.originalTotal),
    discount: formatCurrency(model.summary.discount),
    tax_amount: model.showPpn ? formatCurrency(model.summary.tax) : '-',
    ppn_percentage: String(ppnPct),
    total_amount: formatCurrency(model.summary.total),
    paid_amount: formatCurrency(model.summary.paid),
    change_amount: formatCurrency(model.summary.change),
    payment_method: (model.paymentRows[0]?.method || '-').toUpperCase(),
    footer_text: model.footerText,
    garis: getSeparator(charsPerLine),
    ganti_baris: '\n',
  }

  let result = template
  
  result = parseEachItemsBlock(result, model.itemRows, charsPerLine)
  
  Object.entries(tokenValues).forEach(([token, value]) => {
    result = result.replace(new RegExp(`{{\\s*${token}\\s*}}`, 'g'), value)
  })
  
  result = result.replace(/{{[^}]+}}/g, '')
  
  result = processAlignmentTags(result, charsPerLine)
  
  return result
}

function buildDotMatrixPrintModel(sale, settings, helpers) {
  const charsPerLine = resolveCharsPerLine(settings)
  const ppnPercentage = settings.ppn_percentage || 11
  const showPpn = settings.show_ppn !== false
  
  const itemRows = (sale.items || []).map((item, idx) => {
    const quantity = item.quantity || item.qty || 0
    const unitPrice = item.unit_price || item.price || 0
    const originalPrice = item.original_price || unitPrice
    const subtotal = quantity * unitPrice
    const originalSubtotal = originalPrice * quantity
    const itemDiscount = originalSubtotal - subtotal
    return {
      index: idx + 1,
      name: item.product_name || item.name || '-',
      quantity,
      unitPrice,
      originalPrice,
      subtotal,
      discount: itemDiscount,
    }
  })
  
  const paymentRows = (sale.payments || []).map(p => ({
    method: p.payment_method || p.method || '-',
    amount: p.amount || 0,
  }))
  
  const subtotal = itemRows.reduce((sum, i) => sum + i.subtotal, 0)
  const originalTotal = itemRows.reduce((sum, i) => sum + (i.originalPrice * i.quantity), 0)
  const discount = originalTotal - subtotal
  const tax = showPpn ? Math.round((subtotal - discount) * (ppnPercentage / 100)) : 0
  const total = subtotal + tax
  const paid = sale.paid_amount || sale.total_amount || total
  const change = Math.max(0, paid - total)
  
  return {
    paperSize: settings.paper_size,
    charsPerLine,
    company: {
      name: sale.company_name || '-',
      address: settings.company_address || sale.company_address || '',
      phone: settings.company_phone || sale.company_phone || '',
    },
    meta: {
      number: sale.sale_number || sale.invoice_number || '-',
      date: sale.sale_date || sale.created_at,
      dateFormatted: helpers.formatDateTime(sale.sale_date || sale.created_at),
      cashier: sale.cashier_name || '-',
      warehouse: sale.warehouse_name || '-',
    },
    itemRows,
    paymentRows,
    summary: {
      subtotal,
      originalTotal,
      discount,
      tax,
      total,
      paid,
      change,
    },
    showPpn,
    ppnPercentage,
    footerText: settings.footer_text || 'Terima kasih.',
  }
}

function getDotMatrixTemplate(layoutType) {
  switch (layoutType) {
    case 'layout_b':
      return DOT_MATRIX_LAYOUT_B
    case 'layout_c':
      return DOT_MATRIX_LAYOUT_C
    case 'layout_a':
    default:
      return DOT_MATRIX_LAYOUT_A
  }
}

function renderDotMatrixReceipt(sale, settings, helpers) {
  const model = buildDotMatrixPrintModel(sale, settings, helpers)
  const text = renderDotMatrixPlainText(model, settings)
  
  let output = ''
  output += ESC + '@'
  output += ESC + '!' + String.fromCharCode(0x00)
  output += text
  output += LF + LF + LF + LF
  
  return output
}

function renderDotMatrixPlainText(model, settings) {
  let template

  if (settings.template_mode === 'custom' && settings.custom_template_text_dot_matrix?.trim()) {
    template = settings.custom_template_text_dot_matrix
  } else {
    template = getDotMatrixTemplate(settings.layout_type || 'layout_a')
  }

  return replaceDotMatrixToken(template, model)
}

function getDefaultDotMatrixCustomTemplateText() {
  return DEFAULT_CUSTOM_TEMPLATE_TEXT_DOT_MATRIX
}

export { DOT_MATRIX_TOKEN_LIST, renderDotMatrixReceipt, renderDotMatrixPlainText, getDefaultDotMatrixCustomTemplateText, buildDotMatrixPrintModel }
