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
  '[SP10]', '[SP12]', '[SP14]',
  '[R3]', '[R5]', '[R10]', '[R12]', '[R14]', '[R]',
  '[L3]', '[L5]', '[L10]', '[L12]', '[L14]', '[L]',
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

function applyAlignment(text, alignment, width) {
  const str = String(text)
  if (width <= 0) return str
  if (str.length >= width) return str.substring(0, width)
  switch (alignment) {
    case 'R': return str.padStart(width, ' ')
    case 'L': return str.padEnd(width, ' ')
    case 'C': {
      const left = Math.floor((width - str.length) / 2)
      return str.padStart(left + str.length, ' ').padEnd(width, ' ')
    }
    default: return str
  }
}

function renderInlineTokens(segment, tokenDefs) {
  return segment.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, tokenName) => {
    return tokenDefs[tokenName] ? String(tokenDefs[tokenName]()) : ''
  })
}

function findNextControlIndex(text) {
  const markerIndex = text.search(/\[([RLC])(\d+)?\]/i)
  const spacerIndex = text.search(/\[SP\d+\]/i)

  if (markerIndex !== -1 && spacerIndex !== -1) return Math.min(markerIndex, spacerIndex)
  if (markerIndex !== -1) return markerIndex
  if (spacerIndex !== -1) return spacerIndex
  return -1
}

function estimateRenderedLength(line, tokenDefs) {
  let length = 0
  let remaining = line
  const maxIterations = 100
  let iterations = 0

  while (remaining.length > 0 && iterations < maxIterations) {
    iterations++

    const spacerMatch = remaining.match(/^\[SP(\d+)\]/i)

    if (spacerMatch) {
      const spacerCount = parseInt(spacerMatch[1], 10)
      remaining = remaining.substring(spacerMatch[0].length)
      length += spacerCount
      continue
    }

    const markerMatch = remaining.match(/^\[([RLC])(\d+)\]/i)
    const simpleMatch = !markerMatch ? remaining.match(/^\[([RLC])\]/i) : null
    if (markerMatch || simpleMatch) {
      const match = markerMatch || simpleMatch
      const fixedWidth = markerMatch ? parseInt(match[2], 10) : null
      remaining = remaining.substring(match[0].length)

      const tokenMatch = remaining.match(/^\{\{\s*(\w+)\s*\}\}/)
      let renderedSegment = ''

      if (tokenMatch) {
        const tokenName = tokenMatch[1]
        renderedSegment = tokenDefs[tokenName] ? String(tokenDefs[tokenName]()) : ''
        remaining = remaining.substring(tokenMatch[0].length)
      } else {
        const nextControlIndex = findNextControlIndex(remaining)
        const segment = nextControlIndex === -1 ? remaining : remaining.substring(0, nextControlIndex)
        remaining = nextControlIndex === -1 ? '' : remaining.substring(nextControlIndex)
        renderedSegment = renderInlineTokens(segment, tokenDefs)
      }

      length += fixedWidth ?? renderedSegment.length
      continue
    }

    const tokenMatch = remaining.match(/^\{\{\s*(\w+)\s*\}\}/)
    if (tokenMatch) {
      const tokenName = tokenMatch[1]
      remaining = remaining.substring(tokenMatch[0].length)
      const value = tokenDefs[tokenName] ? String(tokenDefs[tokenName]()) : ''
      length += value.length
      continue
    }

    const nextControlIndex = findNextControlIndex(remaining)
    const nextToken = remaining.search(/\{\{/)

    let nextPos = -1
    if (nextControlIndex !== -1 && nextToken !== -1) nextPos = Math.min(nextControlIndex, nextToken)
    else if (nextControlIndex !== -1) nextPos = nextControlIndex
    else if (nextToken !== -1) nextPos = nextToken

    if (nextPos === -1) {
      length += renderInlineTokens(remaining, tokenDefs).length
      break
    }

    length += renderInlineTokens(remaining.substring(0, nextPos), tokenDefs).length
    remaining = remaining.substring(nextPos)
  }

  return length
}

function resolveAutoAlignmentWidth(value, currentResult, remaining, charsPerLine, tokenDefs) {
  const naturalWidth = String(value).length
  if (!Number.isFinite(charsPerLine) || charsPerLine <= 0) return naturalWidth

  const suffixLength = estimateRenderedLength(remaining, tokenDefs)
  const availableWidth = charsPerLine - currentResult.length - suffixLength
  return Math.max(naturalWidth, availableWidth)
}

function normalizeEachBlockContent(blockContent) {
  return blockContent
    .replace(/^\r?\n+/, '')
    .replace(/\r?\n+$/, '')
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

  const lines = blockContent.split(/\r?\n/)
  return lines.map(line => {
    if (!line.trim()) return ''
    return processLineWithTokens(line, tokenDefs, charsPerLine)
  }).join('\n')
}

function processLineWithTokens(line, tokenDefs, charsPerLine) {
  let result = ''
  let remaining = line
  const maxIterations = 100
  let iterations = 0

  while (remaining.length > 0 && iterations < maxIterations) {
    iterations++

    const spacerMatch = remaining.match(/^\[SP(\d+)\]/i)

    if (spacerMatch) {
      const spacerCount = parseInt(spacerMatch[1], 10)
      remaining = remaining.substring(spacerMatch[0].length)
      result += ' '.repeat(spacerCount)
      continue
    }

    const markerMatch = remaining.match(/^\[([RLC])(\d+)\]/i)
    const simpleMatch = !markerMatch ? remaining.match(/^\[([RLC])\]/i) : null

    if (markerMatch || simpleMatch) {
      const match = markerMatch || simpleMatch
      const align = match[1].toUpperCase()
      const fixedWidth = markerMatch ? parseInt(match[2], 10) : null
      remaining = remaining.substring(match[0].length)

      const tokenMatch = remaining.match(/^\{\{\s*(\w+)\s*\}\}/)
      let renderedSegment = ''

      if (tokenMatch) {
        const tokenName = tokenMatch[1]
        renderedSegment = tokenDefs[tokenName] ? String(tokenDefs[tokenName]()) : ''
        remaining = remaining.substring(tokenMatch[0].length)
      } else {
        const nextControlIndex = findNextControlIndex(remaining)
        const segment = nextControlIndex === -1 ? remaining : remaining.substring(0, nextControlIndex)
        remaining = nextControlIndex === -1 ? '' : remaining.substring(nextControlIndex)
        renderedSegment = renderInlineTokens(segment, tokenDefs)
      }

      const width = fixedWidth ?? resolveAutoAlignmentWidth(renderedSegment, result, remaining, charsPerLine, tokenDefs)
      result += applyAlignment(renderedSegment, align, width)
    } else if (remaining.startsWith('{{')) {
      const tokenMatch = remaining.match(/^\{\{\s*(\w+)\s*\}\}/)
      if (tokenMatch) {
        const tokenName = tokenMatch[1]
        remaining = remaining.substring(tokenMatch[0].length)
        const value = tokenDefs[tokenName] ? tokenDefs[tokenName]() : ''
        result += value
      } else {
        const nextClose = remaining.indexOf('}}')
        if (nextClose !== -1) {
          result += remaining.substring(0, nextClose + 2)
          remaining = remaining.substring(nextClose + 2)
        } else {
          result += remaining
          break
        }
      }
    } else {
      const nextControlIndex = findNextControlIndex(remaining)
      const nextToken = remaining.search(/\{\{/)

      let nextPos = -1
      if (nextControlIndex !== -1 && nextToken !== -1) nextPos = Math.min(nextControlIndex, nextToken)
      else if (nextControlIndex !== -1) nextPos = nextControlIndex
      else if (nextToken !== -1) nextPos = nextToken

      if (nextPos === -1) {
        result += renderInlineTokens(remaining, tokenDefs)
        break
      }

      const segment = remaining.substring(0, nextPos)
      result += renderInlineTokens(segment, tokenDefs)
      remaining = remaining.substring(nextPos)
    }
  }

  return result
}

function parseEachItemsBlock(template, itemRows, charsPerLine) {
  const eachPattern = /\{\{#each\s+items\}\}([\s\S]*?)\{\{\/each\s+items\}\}/gi
  try {
    return template.replace(eachPattern, (match, blockContent) => {
      if (!itemRows || itemRows.length === 0) return '-'
      const normalizedBlock = normalizeEachBlockContent(blockContent)
      return itemRows.map(item => replaceItemTokens(normalizedBlock, item, charsPerLine)).join('\n')
    })
  } catch (err) {
    console.error('parseEachItemsBlock error:', err)
    return template
  }
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
  const charsPerLine = Number.isFinite(model?.charsPerLine) ? model.charsPerLine : 38
  
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
  
  try {
    result = parseEachItemsBlock(result, model.itemRows, charsPerLine)
  } catch (err) {
    console.error('parseEachItemsBlock in replaceDotMatrixToken:', err)
  }
  
  Object.entries(tokenValues).forEach(([token, value]) => {
    result = result.replace(new RegExp(`{{\\s*${token}\\s*}}`, 'g'), value)
  })
  
  result = result.replace(/{{[^}]+}}/g, '')
  
  try {
    const lines = result.split('\n')
    const processedLines = lines.map(line => processLineWithTokens(line, {}, charsPerLine))
    result = processedLines.join('\n')
  } catch (err) {
    console.error('processLineWithTokens in replaceDotMatrixToken:', err)
  }
  
  return result
}

function buildDotMatrixPrintModel(sale, settings, helpers) {
  try {
    const charsPerLine = resolveCharsPerLine(settings)
    const ppnPercentage = settings.ppn_percentage || 11
    const showPpn = settings.show_ppn !== false
  
  const itemRows = (sale?.items || []).map((item, idx) => {
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
  
  const paymentRows = (sale?.payments || []).map(p => ({
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
  } catch (err) {
    console.error('buildDotMatrixPrintModel error:', err)
    return {
      charsPerLine: 38,
      company: { name: '-', address: '', phone: '' },
      meta: { number: '-', dateFormatted: '-', cashier: '-', warehouse: '-' },
      itemRows: [],
      paymentRows: [],
      summary: { subtotal: 0, originalTotal: 0, discount: 0, tax: 0, total: 0, paid: 0, change: 0 },
      showPpn: false,
      ppnPercentage: 11,
      footerText: 'Terima kasih.',
    }
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

  try {
    const safeModel = {
      ...model,
      charsPerLine: Number.isFinite(model?.charsPerLine) ? model.charsPerLine : resolveCharsPerLine(settings),
    }
    return replaceDotMatrixToken(template, safeModel)
  } catch (err) {
    console.error('renderDotMatrixPlainText error:', err)
    return template
  }
}

function getDefaultDotMatrixCustomTemplateText() {
  return DEFAULT_CUSTOM_TEMPLATE_TEXT_DOT_MATRIX
}

export { DOT_MATRIX_TOKEN_LIST, renderDotMatrixReceipt, renderDotMatrixPlainText, getDefaultDotMatrixCustomTemplateText, buildDotMatrixPrintModel }
