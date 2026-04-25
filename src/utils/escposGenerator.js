const ESC = '\x1b'
const GS = '\x1d'
const LF = '\n'

export function generateEscposFromHtml(htmlContent, settings) {
  const charsPerLine = settings.paper_size === '58mm' ? 32 : 42

  const text = stripHtmlToText(htmlContent)
  const lines = text.split('\n').filter(l => l.trim())

  let escpos = ''

  escpos += ESC + '@'
  escpos += ESC + '!' + String.fromCharCode(0x00)

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (trimmedLine === '') {
      escpos += LF
      continue
    }

    if (isCenterLine(trimmedLine, charsPerLine)) {
      escpos += ESC + 'a' + '\x01'
      escpos += padCenter(trimmedLine, charsPerLine) + LF
      escpos += ESC + 'a' + '\x00'
    } else if (isDoubleHeight(trimmedLine)) {
      escpos += ESC + '!' + '\x10'
      escpos += trimmedLine.substring(0, charsPerLine) + LF
      escpos += ESC + '!' + '\x00'
    } else {
      escpos += trimmedLine.substring(0, charsPerLine) + LF
    }
  }

  for (let i = 0; i < 4; i++) {
    escpos += LF
  }

  return escpos
}

function stripHtmlToText(html) {
  let text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<html[^>]*>[\s\S]*?<\/html>/gi, '')
    .replace(/<body[^>]*>[\s\S]*?<\/body>/gi, '')
    .replace(/<div[^>]*class="[^"]*receipt-wrap[^"]*"[^>]*>/gi, '\n')
    .replace(/<div[^>]*class="[^"]*receipt-header[^"]*"[^>]*>/gi, '\n')
    .replace(/<div[^>]*class="[^"]*receipt-footer[^"]*"[^>]*>/gi, '\n')
    .replace(/<div[^>]*class="[^"]*receipt-summary[^"]*"[^>]*>/gi, '\n')
    .replace(/<div[^>]*class="[^"]*receipt-items[^"]*"[^>]*>/gi, '\n')
    .replace(/<h[1-6][^>]*>/gi, '==')
    .replace(/<\/h[1-6]>/gi, '==\n')
    .replace(/<strong[^>]*>/gi, '')
    .replace(/<\/strong>/gi, '')
    .replace(/<b[^>]*>/gi, '')
    .replace(/<\/b>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr[^>]*>/gi, '================================')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ ]+/g, ' ')

  return text
}

function isCenterLine(line, charsPerLine) {
  if (line.length > charsPerLine) return false
  if (line.startsWith('==') && line.endsWith('==')) return true
  if (line.startsWith('TOKO') || line.startsWith('STORE') || line.startsWith('SHOP')) return true
  if (line.startsWith('NOTA') || line.startsWith('RECEIPT') || line.startsWith('STRUK')) return true
  if (line.startsWith('TERIMA') || line.startsWith('THANK')) return true
  if (line === '================================' || line === '--------------------------------') return true
  return false
}

function isDoubleHeight(line) {
  if (line.length > 20) return false
  if (line.startsWith('TOTAL') || line.startsWith('GRAND')) return true
  if (line.startsWith('BAYAR') || line.startsWith('PAY')) return true
  if (line.startsWith('KEMBALI') || line.startsWith('CHANGE')) return true
  return false
}

function padCenter(text, width) {
  const trimmed = text.trim()
  if (trimmed.length >= width) return trimmed.substring(0, width)
  const pad = Math.floor((width - trimmed.length) / 2)
  return ' '.repeat(pad) + trimmed
}