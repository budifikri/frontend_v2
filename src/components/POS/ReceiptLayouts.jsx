export const RECEIPT_LAYOUT_OPTIONS = [
  { id: 'layout_a', label: 'Layout A - Simple', description: 'Ringkas, fokus ke item dan total' },
  { id: 'layout_b', label: 'Layout B - Detail Pajak', description: 'Menampilkan subtotal, PPN, dan rincian bayar' },
  { id: 'layout_c', label: 'Layout C - Brand + Footer', description: 'Header brand lebih kuat dan footer promosi' },
]

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
  '{{items_rows}}',
  '{{payments_rows}}',
  '{{subtotal}}',
  '{{tax_amount}}',
  '{{total_amount}}',
  '{{paid_amount}}',
  '{{change_amount}}',
  '{{footer_text}}',
  '{{garis}}',
  '{{ganti_baris}}',
]

export const DEFAULT_CUSTOM_TEMPLATE_HTML = `<div class="tpl-note">
  <div class="tpl-header">
    <h3>{{company_name}}</h3>
    <div class="tpl-sub">{{company_address}}, Telp: {{company_phone}}</div>
    <div>No: {{sale_number}}</div>
    <div>Tgl: {{sale_date}}</div>
    <div>Kasir: {{cashier_name}}</div>
  </div>

  <div class="tpl-items">
    {{items_rows}}
  </div>

  <div class="tpl-summary">
    <div><span>Subtotal</span><span>{{subtotal}}</span></div>
    <div><span>PPN</span><span>{{tax_amount}}</span></div>
    <div class="is-total"><span>Total</span><span>{{total_amount}}</span></div>
    <div><span>Dibayar</span><span>{{paid_amount}}</span></div>
    <div><span>Kembalian</span><span>{{change_amount}}</span></div>
  </div>

  <div class="tpl-payments">
    <strong>Pembayaran</strong>
    {{payments_rows}}
  </div>

  <div class="tpl-footer">{{footer_text}}</div>
</div>`

export const DEFAULT_CUSTOM_TEMPLATE_CSS = `.tpl-note { font-family: Arial, sans-serif; }
.tpl-header { text-align: center; border-bottom: 1px dashed #94a3b8; padding-bottom: 6px; margin-bottom: 8px; }
.tpl-header h3 { margin: 0 0 4px; font-size: 15px; }
.tpl-sub { margin-bottom: 4px; font-size: 11px; }
.tpl-items { border-bottom: 1px dashed #94a3b8; padding-bottom: 6px; margin-bottom: 6px; }
.tpl-item { margin-bottom: 6px; }
.tpl-item-name { font-weight: 700; word-break: break-word; }
.tpl-item-detail { display: flex; justify-content: space-between; gap: 8px; }
.tpl-summary > div, .tpl-pay-row { display: flex; justify-content: space-between; gap: 8px; }
.tpl-summary .is-total { font-weight: 700; margin-top: 4px; }
.tpl-payments { margin-top: 6px; border-top: 1px dashed #94a3b8; padding-top: 6px; }
.tpl-footer { margin-top: 8px; border-top: 1px dashed #94a3b8; padding-top: 6px; text-align: center; white-space: pre-line; }
.tpl-garis { border-top: 1px dashed #94a3b8; margin: 6px 0; }`

const RECEIPT_TEMPLATE_MAP = {
  layout_a: {
    title: 'NOTA PENJUALAN',
    subtitle: '',
    headerVariant: 'default',
    itemsVariant: 'table_simple',
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
    itemsVariant: 'table_detail',
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

export function getReceiptPaperClass(paperSize) {
  return paperSize === '80mm' ? 'paper-80' : 'paper-58'
}

export function getReceiptLayoutLabel(layoutType) {
  const found = RECEIPT_LAYOUT_OPTIONS.find((item) => item.id === layoutType)
  return found?.label || RECEIPT_LAYOUT_OPTIONS[0].label
}

function buildItemRows(sale) {
  return (sale.items || []).map((item, index) => ({
    index: index + 1,
    name: item.product_name || item.name || '-',
    quantity: item.quantity || item.qty || 0,
    unitPrice: item.unit_price || item.price || 0,
    subtotal: (item.quantity || item.qty || 0) * (item.unit_price || item.price || 0),
  }))
}

function buildPaymentRows(sale) {
  return (sale.payments || []).map((payment) => ({
    method: payment.payment_method || payment.method || '-',
    amount: payment.amount || 0,
  }))
}

function getReceiptTemplate(layoutType) {
  return RECEIPT_TEMPLATE_MAP[layoutType] || RECEIPT_TEMPLATE_MAP.layout_a
}

function computeSummaryFromItems(itemRows, fallbackSummary) {
  const subtotal = itemRows.reduce((sum, item) => sum + item.subtotal, 0)
  if (subtotal <= 0) return fallbackSummary

  const tax = Math.round(subtotal * 0.11)
  const total = subtotal + tax
  return {
    subtotal,
    tax,
    total,
    paid: total,
    change: 0,
  }
}

export function buildReceiptTemplateModel(sale, settings, options = {}) {
  const layoutType = settings.layout_type || 'layout_a'
  const template = getReceiptTemplate(layoutType)
  const withSamples = Boolean(options.withSamples)

  const rawItemRows = buildItemRows(sale)
  const itemRows = rawItemRows.length > 0 || !withSamples ? rawItemRows : SAMPLE_ITEM_ROWS

  const rawPaymentRows = buildPaymentRows(sale)
  const paymentRows = rawPaymentRows.length > 0 || !withSamples ? rawPaymentRows : SAMPLE_PAYMENT_ROWS

  const baseSummary = {
    subtotal: sale.subtotal || 0,
    tax: sale.tax_amount || 0,
    total: sale.total_amount || 0,
    paid: sale.paid_amount || 0,
    change: sale.change_amount || 0,
  }

  const summary = withSamples ? computeSummaryFromItems(itemRows, baseSummary) : baseSummary

  return {
    layoutType,
    template,
    templateMode: settings.template_mode || 'default',
    showLogo: Boolean(settings.show_logo),
    showFooter: Boolean(settings.show_footer),
    company: {
      name: sale.company_name || '-',
      address: settings.company_address?.trim() || sale.company_address || '',
      phone: settings.company_phone?.trim() || sale.company_phone || '',
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
    blocks: [
      'header',
      'items',
      'summary',
      template.showPayments ? 'payments' : null,
      settings.show_footer ? 'footer' : null,
    ].filter(Boolean),
    footerText: settings.footer_text?.trim() || template.footerText,
    customTemplateHtml: settings.custom_template_html || DEFAULT_CUSTOM_TEMPLATE_HTML,
    customTemplateCss: settings.custom_template_css || DEFAULT_CUSTOM_TEMPLATE_CSS,
  }
}

function renderHtmlHeader(model, helpers) {
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

function renderHtmlItems(model, helpers) {
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

function renderHtmlSummary(model, helpers) {
  return `
    <div class="summary">
      ${model.template.showSummarySubtotal ? `<div><span>Subtotal</span><span>${helpers.formatCurrency(model.summary.subtotal)}</span></div>` : ''}
      ${model.template.showSummaryTax ? `<div><span>PPN</span><span>${helpers.formatCurrency(model.summary.tax)}</span></div>` : ''}
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
    <div class="payments-block">
      <strong>Pembayaran</strong>
      ${rows || '<div class="pay-row"><span>-</span><span>-</span></div>'}
    </div>
  `
}

function renderHtmlFooter(model, helpers) {
  const footerHtml = helpers.escapeHtml(model.footerText).replaceAll('\n', '<br />')
  return `<div class="footer">${footerHtml}</div>`
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
        <span>${item.quantity} x ${helpers.formatCurrency(item.unitPrice)}</span>
        <strong>${helpers.formatCurrency(item.subtotal)}</strong>
      </div>
    </div>
  `).join('')
  return rows || '<div class="tpl-item">-</div>'
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
  const templateHtml = sanitizeHtmlTemplate(model.customTemplateHtml || DEFAULT_CUSTOM_TEMPLATE_HTML)
  const customCss = sanitizeCssTemplate(model.customTemplateCss || DEFAULT_CUSTOM_TEMPLATE_CSS)
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
    tax_amount: helpers.formatCurrency(model.summary.tax),
    total_amount: helpers.formatCurrency(model.summary.total),
    paid_amount: helpers.formatCurrency(model.summary.paid),
    change_amount: helpers.formatCurrency(model.summary.change),
    footer_text: footerToken,
    items_rows: renderCustomItemsRows(model, helpers),
    payments_rows: renderCustomPaymentsRows(model, helpers),
    garis: '<div class="tpl-garis"></div>',
    ganti_baris: '<br />',
  }

  let html = templateHtml
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
