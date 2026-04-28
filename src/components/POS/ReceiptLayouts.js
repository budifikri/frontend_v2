import { getDefaultDotMatrixCustomTemplateText } from './DotMatrixFormatter'

export const THERMAL_LAYOUT_OPTIONS = [
  { id: 'layout_a', label: 'Layout A - Simple', description: 'Ringkas, fokus ke item dan total' },
  { id: 'layout_b', label: 'Layout B - Detail Pajak', description: 'Menampilkan subtotal, PPN, dan rincian bayar' },
  { id: 'layout_c', label: 'Layout C - Brand + Footer', description: 'Header brand lebih kuat dan footer promosi' },
]

export const DOT_MATRIX_LAYOUT_OPTIONS = [
  { id: 'layout_a', label: 'DM-A - Continuous', description: 'Format kontinyu, header dan item paling ringkas' },
  { id: 'layout_b', label: 'DM-B - Grid Kasir', description: 'Meta transaksi lebih lengkap untuk audit kasir' },
  { id: 'layout_c', label: 'DM-C - Compact Detail', description: 'Detail qty x harga lebih rapat untuk kertas panjang' },
]

export const RECEIPT_LAYOUT_OPTIONS = THERMAL_LAYOUT_OPTIONS

export const RECEIPT_TEMPLATE_MODE_OPTIONS = [
  { id: 'default', label: 'Default Template' },
  { id: 'custom', label: 'Custom Template' },
]

export const RECEIPT_TEMPLATE_TOKENS = [
  '{{company_name}}',
  '{{company_address}}',
  '{{company_phone}}',
  '{{sale_number}}',
  '{{sale_date}}',
  '{{cashier_name}}',
  '{{warehouse_name}}',
  '{{#each items}}',
  '{{/each items}}',
  '{{index}}',
  '{{name}}',
  '{{quantity}}',
  '{{unit_price}}',
  '{{subtotal}}',
  '{{discount}}',
  '{{discount_row}}',
  '{{items_rows}}',
  '{{payments_rows}}',
  '{{subtotal}}',
  '{{original_total}}',
  '{{discount}}',
  '{{tax_amount}}',
  '{{total_amount}}',
  '{{paid_amount}}',
  '{{change_amount}}',
  '{{footer_text}}',
  '{{garis}}',
    '{{ganti_baris}}',
  ]

export const DEFAULT_CUSTOM_TEMPLATE_HTML_THERMAL = `<div class="tpl-note">
  <div class="tpl-header">
    <h3>{{company_name}}</h3>
    <div class="tpl-sub">{{company_address}}, Telp: {{company_phone}}</div>
    <div>No: {{sale_number}}</div>
    <div>Tgl: {{sale_date}}</div>
    <div>Kasir: {{cashier_name}}</div>
  </div>

  <div class="tpl-items">
    {{#each items}}
    <div class="tpl-item">
      <div class="tpl-item-name">{{name}}</div>
      <div class="tpl-item-detail">
        <span>{{quantity}} x {{unit_price}}</span>
        <strong>{{subtotal}}</strong>
      </div>
      {{discount_row}}
    </div>
    {{/each items}}
  </div>

  <div class="tpl-summary">
    <div><span>Subtotal</span><span>{{original_total}}</span></div>
    <div><span>Total Diskon</span><span>- {{discount}}</span></div>
    {{ppn_row}}
    <div class="is-total"><span>Total</span><span>{{total_amount}}</span></div>
    <div><span>Bayar {{payment_method}}</span><span>{{paid_amount}}</span></div>
    <div><span>Kembali</span><span>{{change_amount}}</span></div>
  </div>

  <div class="tpl-footer">{{footer_text}}</div>
</div>`

export const DEFAULT_CUSTOM_TEMPLATE_CSS_THERMAL = `.tpl-note { font-family: 'JetBrains Mono', Arial, sans-serif; }
.tpl-header { text-align: center; border-bottom: 1px dashed #94a3b8; padding-bottom: 6px; margin-bottom: 8px; }
.tpl-header h3 { margin: 0 0 4px; font-size: 15px; }
.tpl-sub { margin-bottom: 4px; font-size: 11px; }
.tpl-items { border-bottom: 1px dashed #94a3b8; padding-bottom: 6px; margin-bottom: 6px; }
.tpl-item { margin-bottom: 6px; }
.tpl-item-name { font-weight: 700; word-break: break-word; }
.tpl-item-detail { display: flex; justify-content: space-between; gap: 8px; }
.tpl-summary > div { display: flex; justify-content: space-between; gap: 8px; }
.tpl-summary .is-total { font-weight: 700; margin-top: 4px; }
.tpl-item-diskon { font-size: 11px; margin-left: 10px; }
.tpl-footer { margin-top: 8px; border-top: 1px dashed #94a3b8; padding-top: 6px; text-align: center; white-space: pre-line; }
.tpl-garis { border-top: 1px dashed #94a3b8; margin: 6px 0; }`

export const DEFAULT_CUSTOM_TEMPLATE_HTML_DOT_MATRIX = `<div class="tpl-note tpl-dot">
  <div class="tpl-dot-header">
    <div>{{company_name}}</div>
    <div>{{company_address}}</div>
    <div>Telp: {{company_phone}}</div>
    {{garis}}
    <div>No   : {{sale_number}}</div>
    <div>Tgl  : {{sale_date}}</div>
    <div>Kasir: {{cashier_name}}</div>
  </div>

  <div class="tpl-items tpl-dot-items">
    {{items_rows}}
  </div>

  {{garis}}
  <div class="tpl-summary tpl-dot-summary">
    <div><span>Subtotal</span><span>{{original_total}}</span></div>
    <div><span>Diskon</span><span>- {{discount}}</span></div>
    {{ppn_row}}
    <div class="is-total"><span>TOTAL</span><span>{{total_amount}}</span></div>
    <div><span>Bayar</span><span>{{paid_amount}}</span></div>
    <div><span>Kembali</span><span>{{change_amount}}</span></div>
  </div>

  {{garis}}
  <div class="tpl-footer tpl-dot-footer">{{footer_text}}</div>
</div>`

export const DEFAULT_CUSTOM_TEMPLATE_CSS_DOT_MATRIX = `.tpl-dot { font-family: 'Courier New', Consolas, monospace; letter-spacing: .01em; }
.tpl-dot-header { text-align: left; line-height: 1.4; }
.tpl-dot-items { margin-top: 6px; }
.tpl-dot-summary > div { display: flex; justify-content: space-between; }
.tpl-dot-summary .is-total { font-weight: 700; }
.tpl-dot-footer { text-align: left; white-space: pre-line; }
.tpl-garis { border-top: 1px dotted #6b7280; margin: 6px 0; }`

export const DEFAULT_CUSTOM_TEMPLATE_HTML = DEFAULT_CUSTOM_TEMPLATE_HTML_THERMAL
export const DEFAULT_CUSTOM_TEMPLATE_CSS = DEFAULT_CUSTOM_TEMPLATE_CSS_THERMAL

const RECEIPT_TEMPLATE_MAP_THERMAL = {
  layout_a: {
    title: 'NOTA PENJUALAN',
    subtitle: '',
    headerVariant: 'default',
    itemsVariant: 'line',
    showMetaWarehouse: false,
    showSummarySubtotal: false,
    showSummaryTax: false,
    showPayments: false,
    footerText: 'Terima kasih sudah berbelanja.',
  },
  layout_b: {
    title: 'NOTA PENJUALAN',
    subtitle: '',
    headerVariant: 'grid',
    itemsVariant: 'line',
    showMetaWarehouse: true,
    showSummarySubtotal: true,
    showSummaryTax: true,
    showPayments: true,
    footerText: 'Terima kasih sudah berbelanja.',
  },
  layout_c: {
    title: 'NOTA PENJUALAN - POSXPRESS',
    subtitle: 'Retail Checkout',
    headerVariant: 'brand',
    itemsVariant: 'line',
    showMetaWarehouse: false,
    showSummarySubtotal: true,
    showSummaryTax: false,
    showPayments: true,
    footerText: 'Terima kasih sudah berbelanja. Simpan nota ini untuk klaim retur.',
  },
}

const RECEIPT_TEMPLATE_MAP_DOT_MATRIX = {
  layout_a: {
    title: 'NOTA PENJUALAN',
    subtitle: 'DOT MATRIX',
    headerVariant: 'dot',
    itemsVariant: 'dot_compact',
    showMetaWarehouse: false,
    showSummarySubtotal: true,
    showSummaryTax: false,
    showPayments: false,
    footerText: 'Terima kasih sudah berbelanja.',
  },
  layout_b: {
    title: 'NOTA PENJUALAN',
    subtitle: 'DOT MATRIX',
    headerVariant: 'dot',
    itemsVariant: 'dot_compact',
    showMetaWarehouse: true,
    showSummarySubtotal: true,
    showSummaryTax: true,
    showPayments: true,
    footerText: 'Simpan nota untuk arsip transaksi.',
  },
  layout_c: {
    title: 'NOTA PENJUALAN',
    subtitle: 'DOT MATRIX COMPACT',
    headerVariant: 'dot',
    itemsVariant: 'dot_dense',
    showMetaWarehouse: false,
    showSummarySubtotal: true,
    showSummaryTax: true,
    showPayments: true,
    footerText: 'Terima kasih.',
  },
}

const SAMPLE_ITEM_ROWS = [
  { index: 1, name: 'Contoh Produk A', quantity: 2, unitPrice: 7500, subtotal: 15000 },
  { index: 2, name: 'Contoh Produk B', quantity: 1, unitPrice: 12000, subtotal: 12000 },
]

const SAMPLE_PAYMENT_ROWS = [
  { method: 'CASH', amount: 30000 },
]

function safeString(value) {
  return String(value ?? '')
}

function escapeHtml(value) {
  return safeString(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function sanitizeHtmlTemplate(html) {
  return safeString(html)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
}

function sanitizeCssTemplate(css) {
  return safeString(css)
    .replace(/@import[^;]+;/gi, '')
    .replace(/expression\s*\([^)]*\)/gi, '')
}

function replaceTemplateToken(template, token, value) {
  return template.replace(new RegExp(`{{\\s*${token}\\s*}}`, 'g'), value)
}

function normalizeEachBlockContent(blockContent) {
  return safeString(blockContent)
    .replace(/^\r?\n+/, '')
    .replace(/\r?\n+$/, '')
}

function normalizePrinterType(printerType) {
  return printerType === 'dot_matrix' ? 'dot_matrix' : 'thermal'
}

function getTemplateMapByPrinter(printerType) {
  return normalizePrinterType(printerType) === 'dot_matrix'
    ? RECEIPT_TEMPLATE_MAP_DOT_MATRIX
    : RECEIPT_TEMPLATE_MAP_THERMAL
}

function getDefaultTemplateBundle(printerType) {
  if (normalizePrinterType(printerType) === 'dot_matrix') {
    return {
      html: DEFAULT_CUSTOM_TEMPLATE_HTML_DOT_MATRIX,
      css: DEFAULT_CUSTOM_TEMPLATE_CSS_DOT_MATRIX,
      text: getDefaultDotMatrixCustomTemplateText(),
      layoutType: DOT_MATRIX_LAYOUT_OPTIONS[0].id,
    }
  }

  return {
    html: DEFAULT_CUSTOM_TEMPLATE_HTML_THERMAL,
    css: DEFAULT_CUSTOM_TEMPLATE_CSS_THERMAL,
    text: '',
    layoutType: THERMAL_LAYOUT_OPTIONS[0].id,
  }
}

export function getDefaultCustomTemplate(printerType) {
  return getDefaultTemplateBundle(printerType)
}

export function getDefaultCustomTemplateHtml(printerType) {
  return getDefaultTemplateBundle(printerType).html
}

export function getDefaultCustomTemplateCss(printerType) {
  return getDefaultTemplateBundle(printerType).css
}

export function getReceiptLayoutOptions(printerType) {
  return normalizePrinterType(printerType) === 'dot_matrix'
    ? DOT_MATRIX_LAYOUT_OPTIONS
    : THERMAL_LAYOUT_OPTIONS
}

export function normalizeReceiptDraftForPrinter(draft, printerType) {
  const normalizedType = normalizePrinterType(printerType)
  const defaults = getDefaultTemplateBundle(normalizedType)
  const validLayouts = getReceiptLayoutOptions(normalizedType).map((item) => item.id)

  return {
    ...draft,
    printer_type: normalizedType,
    layout_type: validLayouts.includes(draft?.layout_type) ? draft.layout_type : defaults.layoutType,
    custom_template_html: typeof draft?.custom_template_html === 'string' && draft.custom_template_html.trim() !== ''
      ? draft.custom_template_html
      : defaults.html,
    custom_template_css: typeof draft?.custom_template_css === 'string' && draft.custom_template_css.trim() !== ''
      ? draft.custom_template_css
      : defaults.css,
    custom_template_text_dot_matrix: normalizedType === 'dot_matrix'
      ? (typeof draft?.custom_template_text_dot_matrix === 'string' && draft.custom_template_text_dot_matrix.trim() !== ''
        ? draft.custom_template_text_dot_matrix
        : defaults.text)
      : (typeof draft?.custom_template_text_dot_matrix === 'string' ? draft.custom_template_text_dot_matrix : ''),
  }
}

export function getReceiptPaperClass(paperSize) {
  return paperSize === '80mm' ? 'paper-80' : 'paper-58'
}

export function getReceiptLayoutLabel(layoutType, printerType = 'thermal') {
  const layoutOptions = getReceiptLayoutOptions(printerType)
  const found = layoutOptions.find((item) => item.id === layoutType)
  return found?.label || layoutOptions[0].label
}

function buildItemRows(sale) {
  return (sale.items || []).map((item, index) => {
    const quantity = item.quantity || item.qty || 0
    const unitPrice = item.unit_price || item.price || 0
    const originalPrice = item.original_price || unitPrice
    const discount = originalPrice - unitPrice
    const tierLabel = item.notes || ''
    return {
      index: index + 1,
      name: item.product_name || item.name || '-',
      quantity,
      unitPrice,
      originalPrice,
      discount,
      tierLabel,
      subtotal: quantity * unitPrice,
    }
  })
}

function buildPaymentRows(sale) {
  return (sale.payments || []).map((payment) => ({
    method: payment.payment_method || payment.method || '-',
    amount: payment.amount || 0,
  }))
}

function getReceiptTemplate(layoutType, printerType) {
  const templateMap = getTemplateMapByPrinter(printerType)
  return templateMap[layoutType] || templateMap.layout_a
}

function computeSummaryFromItems(itemRows, fallbackSummary, ppnPercentage = 11) {
  const subtotal = itemRows.reduce((sum, item) => sum + item.subtotal, 0)
  const originalTotal = itemRows.reduce((sum, item) => sum + ((item.originalPrice || item.unitPrice) * item.quantity), 0)
  const totalDiscount = itemRows.reduce((sum, item) => sum + (item.discount * item.quantity), 0)
  if (subtotal <= 0) return fallbackSummary

  const afterDiscount = originalTotal - totalDiscount
  const taxRate = ppnPercentage / 100
  const tax = Math.round(afterDiscount * taxRate)
  const total = subtotal + tax
  const paid = fallbackSummary.paid || total
  const change = Math.max(0, paid - total)

  return {
    subtotal,
    originalTotal,
    discount: totalDiscount,
    tax,
    total,
    paid,
    change,
    taxRate,
  }
}

function resolvePreviewCharsPerLine(settings) {
  const value = Number(settings?.chars_per_line)
  if (!Number.isFinite(value)) return 38
  return Math.max(20, Math.min(80, Math.round(value)))
}

export function buildReceiptTemplateModel(sale, settings, options = {}) {
  const printerType = normalizePrinterType(settings.printer_type)
  const normalizedSettings = normalizeReceiptDraftForPrinter(settings, printerType)
  const layoutType = normalizedSettings.layout_type || 'layout_a'
  const template = getReceiptTemplate(layoutType, printerType)
  const withSamples = Boolean(options.withSamples)

  const rawItemRows = buildItemRows(sale)
  const itemRows = rawItemRows.length > 0 || !withSamples ? rawItemRows : SAMPLE_ITEM_ROWS

  const rawPaymentRows = buildPaymentRows(sale)
  const paymentRows = rawPaymentRows.length > 0 || !withSamples ? rawPaymentRows : SAMPLE_PAYMENT_ROWS

  const ppnPercentage = normalizedSettings.ppn_percentage || 11
  const showPpn = normalizedSettings.show_ppn !== false

  const baseSummary = {
    subtotal: sale.subtotal || 0,
    originalTotal: sale.original_total || sale.subtotal || 0,
    discount: sale.discount_amount || 0,
    tax: sale.tax_amount || 0,
    total: sale.total_amount || 0,
    paid: sale.paid_amount || 0,
    change: sale.change_amount || 0,
  }

  const summary = itemRows.length > 0
    ? computeSummaryFromItems(itemRows, baseSummary, showPpn ? ppnPercentage : 0)
    : baseSummary

  return {
    printerType,
    layoutType,
    template,
    templateMode: normalizedSettings.template_mode || 'default',
    showLogo: Boolean(normalizedSettings.show_logo),
    showFooter: Boolean(normalizedSettings.show_footer),
    showPpn,
    ppnPercentage,
    charsPerLine: resolvePreviewCharsPerLine(normalizedSettings),
    taxRate: showPpn ? ppnPercentage / 100 : 0,
    company: {
      name: sale.company_name || '-',
      address: normalizedSettings.company_address?.trim() || sale.company_address || '',
      phone: normalizedSettings.company_phone?.trim() || sale.company_phone || '',
    },
    title: template.title,
    subtitle: template.subtitle,
    meta: {
      number: sale.sale_number || sale.invoice_number || '-',
      date: sale.sale_date || sale.created_at,
      cashier: sale.cashier_name || '-',
      warehouse: sale.warehouse_name || '-',
    },
    itemRows,
    paymentRows,
    summary,
    itemCount: itemRows.reduce((sum, item) => sum + item.quantity, 0),
    blocks: [
      'header',
      'items',
      'summary',
      template.showPayments ? 'payments' : null,
      normalizedSettings.show_footer ? 'footer' : null,
    ].filter(Boolean),
    footerText: normalizedSettings.footer_text?.trim() || template.footerText,
    customTemplateHtml: normalizedSettings.custom_template_html,
    customTemplateCss: normalizedSettings.custom_template_css,
  }
}

function renderHtmlHeader(model, helpers) {
  if (model.template.headerVariant === 'dot') {
    return `
      <div class="receipt-header-wrap dot">
        <div class="meta-row">${helpers.escapeHtml(model.company.name)}</div>
        ${model.company.address ? `<div class="meta-row">${helpers.escapeHtml(model.company.address)}</div>` : ''}
        ${model.company.phone ? `<div class="meta-row">Telp: ${helpers.escapeHtml(model.company.phone)}</div>` : ''}
        <div class="meta-row">No: ${helpers.escapeHtml(model.meta.number)}</div>
        <div class="meta-row">Tgl: ${helpers.escapeHtml(helpers.formatDateTime(model.meta.date))}</div>
        <div class="meta-row">Kasir: ${helpers.escapeHtml(model.meta.cashier)}</div>
        ${model.template.showMetaWarehouse ? `<div class="meta-row">Gudang: ${helpers.escapeHtml(model.meta.warehouse)}</div>` : ''}
      </div>
    `
  }

  const logoHtml = model.showLogo ? '<div class="receipt-logo">PX</div>' : ''
  const companyAddressHtml = model.company.address ? `<div class="subtitle">${helpers.escapeHtml(model.company.address)}</div>` : ''
  const companyPhoneHtml = model.company.phone ? `<div class="subtitle">Telp: ${helpers.escapeHtml(model.company.phone)}</div>` : ''

  if (model.template.headerVariant === 'grid') {
    return `
      <div class="receipt-header-wrap">
        ${logoHtml}
        <h1>${helpers.escapeHtml(model.company.name)}</h1>
        ${companyAddressHtml}
        ${companyPhoneHtml}
        <div class="meta-grid">
          <span>No</span><strong>${helpers.escapeHtml(model.meta.number)}</strong>
          <span>Tgl</span><span>${helpers.escapeHtml(helpers.formatDateTime(model.meta.date))}</span>
          <span>Kasir</span><span>${helpers.escapeHtml(model.meta.cashier)}</span>
          <span>Gudang</span><span>${helpers.escapeHtml(model.meta.warehouse)}</span>
        </div>
      </div>
    `
  }

  const brandClass = model.template.headerVariant === 'brand' ? ' brand' : ''
  return `
    <div class="receipt-header-wrap${brandClass}">
      ${logoHtml}
      <h1>${helpers.escapeHtml(model.company.name)}</h1>
      ${companyAddressHtml}
      ${companyPhoneHtml}
      ${model.subtitle ? `<div class="subtitle">${helpers.escapeHtml(model.subtitle)}</div>` : ''}
      <div class="meta-row">No Nota: <strong>${helpers.escapeHtml(model.meta.number)}</strong></div>
      <div class="meta-row">Tanggal: ${helpers.escapeHtml(helpers.formatDateTime(model.meta.date))}</div>
      <div class="meta-row">Kasir: ${helpers.escapeHtml(model.meta.cashier)}</div>
      ${model.template.showMetaWarehouse ? `<div class="meta-row">Gudang: ${helpers.escapeHtml(model.meta.warehouse)}</div>` : ''}
    </div>
  `
}

function renderDotMatrixItems(model, helpers) {
  const rows = model.itemRows.map((item) => {
    const unitText = `${item.quantity} x ${helpers.formatCurrency(item.unitPrice)}`
    return `
      <div class="dot-item-row">
        <div class="dot-item-name">${helpers.escapeHtml(item.name)}</div>
        <div class="dot-item-detail">
          <span>${helpers.escapeHtml(unitText)}</span>
          <strong>${helpers.formatCurrency(item.subtotal)}</strong>
        </div>
      </div>
    `
  }).join('')

  return `
    <div class="line-items-wrap dot">
      ${rows || '<div class="dot-item-row"><div class="dot-item-name">-</div></div>'}
    </div>
  `
}

function renderLineItems(model, helpers) {
  const lineItems = model.itemRows.map((item) => `
    <div class="line-item">
      <div class="line-title">${helpers.escapeHtml(item.name)}</div>
      <div class="line-detail">
        <span>${item.quantity} x ${helpers.formatCurrency(item.unitPrice)}</span>
        <strong>${helpers.formatCurrency(item.subtotal)}</strong>
      </div>
    </div>
  `).join('')

  return `
    <div class="line-items-wrap">
      ${lineItems || '<div class="line-item"><div class="line-title">Tidak ada item</div></div>'}
    </div>
  `
}

function renderHtmlItems(model, helpers) {
  if (model.template.itemsVariant === 'dot_compact' || model.template.itemsVariant === 'dot_dense') {
    return renderDotMatrixItems(model, helpers)
  }

  return renderLineItems(model, helpers)
}

function renderHtmlSummary(model, helpers) {
  const itemCount = model.itemRows.reduce((sum, item) => sum + item.quantity, 0)
  return `
    <div class="summary ${model.printerType === 'dot_matrix' ? 'dot' : ''}">
      ${model.template.showSummarySubtotal ? `<div><span>Subtotal (${itemCount} Item)</span><span>${helpers.formatCurrency(model.summary.originalTotal)}</span></div>` : ''}
      ${model.summary.discount > 0 ? `<div class="discount"><span>Total Diskon</span><span>- ${helpers.formatCurrency(model.summary.discount)}</span></div>` : ''}
      ${model.showPpn ? `<div><span>PPN (${model.ppnPercentage}%)</span><span>${helpers.formatCurrency(model.summary.tax)}</span></div>` : ''}
      <div class="total"><span>Total</span><span>${helpers.formatCurrency(model.summary.total)}</span></div>
      <div><span>Dibayar</span><span>${helpers.formatCurrency(model.summary.paid)}</span></div>
      <div><span>Kembalian</span><span>${helpers.formatCurrency(model.summary.change)}</span></div>
    </div>
  `
}

function renderHtmlPayments(model, helpers) {
  const rows = model.paymentRows.map((payment) => `
    <div class="pay-row"><span>${helpers.escapeHtml(payment.method)}</span><span>${helpers.formatCurrency(payment.amount)}</span></div>
  `).join('')

  return `
    <div class="payments-block ${model.printerType === 'dot_matrix' ? 'dot' : ''}">
      <strong>Pembayaran</strong>
      ${rows || '<div class="pay-row"><span>-</span><span>-</span></div>'}
    </div>
  `
}

function renderHtmlFooter(model, helpers) {
  const footerHtml = helpers.escapeHtml(model.footerText).replaceAll('\n', '<br />')
  return `<div class="footer ${model.printerType === 'dot_matrix' ? 'dot' : ''}">${footerHtml}</div>`
}

function renderDefaultReceiptHtml(model, helpers) {
  return model.blocks.map((block) => {
    if (block === 'header') return renderHtmlHeader(model, helpers)
    if (block === 'items') return renderHtmlItems(model, helpers)
    if (block === 'summary') return renderHtmlSummary(model, helpers)
    if (block === 'payments') return renderHtmlPayments(model, helpers)
    if (block === 'footer') return renderHtmlFooter(model, helpers)
    return ''
  }).join('')
}

function renderCustomItemsRows(model, helpers) {
  const rows = model.itemRows.map((item) => `
    <div class="tpl-item">
      <div class="tpl-item-name">${helpers.escapeHtml(item.name)}</div>
      <div class="tpl-item-detail">
        <span>${item.quantity} x ${helpers.formatCurrency(item.originalPrice || item.unitPrice)}</span>
        <strong>${helpers.formatCurrency((item.originalPrice || item.unitPrice) * item.quantity)}</strong>
      </div>
      ${item.discount > 0 && item.quantity > 0 ? `
      <div class="tpl-item-diskon">
        <span>*Diskon ${item.tierLabel || 'promo'}</span>
        <span>(- ${helpers.formatCurrency(item.discount * item.quantity)})</span>
      </div>
      ` : ''}
    </div>
  `).join('')

  return rows || '<div class="tpl-item">-</div>'
}

function buildThermalItemLoopTokenValues(item, helpers) {
  const baseUnitPrice = item.originalPrice || item.unitPrice
  const baseSubtotal = baseUnitPrice * item.quantity
  const discountTotal = item.discount * item.quantity

  return {
    index: helpers.escapeHtml(item.index),
    name: helpers.escapeHtml(item.name),
    quantity: helpers.escapeHtml(item.quantity),
    unit_price: helpers.escapeHtml(helpers.formatCurrency(baseUnitPrice)),
    subtotal: helpers.escapeHtml(helpers.formatCurrency(baseSubtotal)),
    discount: helpers.escapeHtml(helpers.formatCurrency(discountTotal)),
    discount_row: item.discount > 0 && item.quantity > 0
      ? `
      <div class="tpl-item-diskon">
        <span>*Diskon ${helpers.escapeHtml(item.tierLabel || 'promo')}</span>
        <span>(- ${helpers.escapeHtml(helpers.formatCurrency(discountTotal))})</span>
      </div>
      `
      : '',
  }
}

function renderThermalEachItemsBlock(blockContent, model, helpers) {
  if (model.itemRows.length === 0) return '<div class="tpl-item">-</div>'

  const normalizedBlock = normalizeEachBlockContent(blockContent)
  return model.itemRows.map((item) => {
    let renderedBlock = normalizedBlock
    const tokenValues = buildThermalItemLoopTokenValues(item, helpers)

    Object.entries(tokenValues).forEach(([token, value]) => {
      renderedBlock = replaceTemplateToken(renderedBlock, token, value)
    })

    return renderedBlock
  }).join('')
}

function replaceThermalEachItemsBlocks(template, model, helpers) {
  return safeString(template).replace(/\{\{#each\s+items\}\}([\s\S]*?)\{\{\/each\s+items\}\}/gi, (_, blockContent) => {
    return renderThermalEachItemsBlock(blockContent, model, helpers)
  })
}

function renderCustomPaymentsRows(model, helpers) {
  const rows = model.paymentRows.map((payment) => `
    <div class="tpl-pay-row">
      <span>${helpers.escapeHtml(payment.method)}</span>
      <span>${helpers.formatCurrency(payment.amount)}</span>
    </div>
  `).join('')

  return rows || '<div class="tpl-pay-row"><span>-</span><span>-</span></div>'
}

function renderCustomReceiptHtml(model, helpers) {
  const templateHtml = sanitizeHtmlTemplate(model.customTemplateHtml)
  const customCss = sanitizeCssTemplate(model.customTemplateCss)
  const footerToken = helpers.escapeHtml(model.footerText).replaceAll('\n', '<br />')

  const tokenValues = {
    company_name: helpers.escapeHtml(model.company.name),
    company_address: helpers.escapeHtml(model.company.address),
    company_phone: helpers.escapeHtml(model.company.phone),
    sale_number: helpers.escapeHtml(model.meta.number),
    sale_date: helpers.escapeHtml(helpers.formatDateTime(model.meta.date)),
    cashier_name: helpers.escapeHtml(model.meta.cashier),
    warehouse_name: helpers.escapeHtml(model.meta.warehouse),
    subtotal: helpers.formatCurrency(model.summary.subtotal),
    original_total: helpers.formatCurrency(model.summary.originalTotal),
    discount: helpers.formatCurrency(model.summary.discount),
    tax_amount: model.showPpn ? helpers.formatCurrency(model.summary.tax) : '-',
    tax_label: model.showPpn ? `PPN (${model.ppnPercentage}%)` : '',
    ppn_row: model.showPpn ? `<div><span>PPN (${model.ppnPercentage}%)</span><span>${helpers.formatCurrency(model.summary.tax)}</span></div>` : '',
    total_amount: helpers.formatCurrency(model.summary.total),
    paid_amount: helpers.formatCurrency(model.summary.paid),
    change_amount: helpers.formatCurrency(model.summary.change),
    payment_method: (model.paymentRows[0]?.method || '').toUpperCase(),
    footer_text: footerToken,
    items_rows: renderCustomItemsRows(model, helpers),
    payments_rows: renderCustomPaymentsRows(model, helpers),
    garis: '<div class="tpl-garis"></div>',
    ganti_baris: '<br />',
  }

  let html = replaceThermalEachItemsBlocks(templateHtml, model, helpers)
  Object.entries(tokenValues).forEach(([token, value]) => {
    html = replaceTemplateToken(html, token, value)
  })

  return {
    html,
    css: customCss,
  }
}

export function renderReceiptContent(sale, settings, helpers, options = {}) {
  const model = buildReceiptTemplateModel(sale, settings, options)
  const helperSet = {
    escapeHtml: helpers.escapeHtml || escapeHtml,
    formatCurrency: helpers.formatCurrency,
    formatDateTime: helpers.formatDateTime,
  }

  if (model.templateMode === 'custom') {
    const custom = renderCustomReceiptHtml(model, helperSet)
    return {
      model,
      bodyHtml: custom.html,
      customCss: custom.css,
      isCustom: true,
    }
  }

  return {
    model,
    bodyHtml: renderDefaultReceiptHtml(model, helperSet),
    customCss: '',
    isCustom: false,
  }
}

export function renderReceiptHtml(sale, settings, helpers) {
  return renderReceiptContent(sale, settings, helpers).bodyHtml
}
