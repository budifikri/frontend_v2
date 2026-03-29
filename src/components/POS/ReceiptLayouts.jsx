export const RECEIPT_LAYOUT_OPTIONS = [
  { id: 'layout_a', label: 'Layout A - Simple', description: 'Ringkas, fokus ke item dan total' },
  { id: 'layout_b', label: 'Layout B - Detail Pajak', description: 'Menampilkan subtotal, PPN, dan rincian bayar' },
  { id: 'layout_c', label: 'Layout C - Brand + Footer', description: 'Header brand lebih kuat dan footer promosi' },
]

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

export function getReceiptPaperClass(paperSize) {
  return paperSize === '80mm' ? 'paper-80' : 'paper-58'
}

export function getReceiptWidth(paperSize) {
  return paperSize === '80mm' ? '300px' : '220px'
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
  }
}

function renderHtmlHeader(model, helpers) {
  const { escapeHtml, formatDateTime } = helpers
  const logoHtml = model.showLogo ? '<div class="receipt-logo">PX</div>' : ''
  const companyAddressHtml = model.company.address ? `<div class="subtitle">${escapeHtml(model.company.address)}</div>` : ''
  const companyPhoneHtml = model.company.phone ? `<div class="subtitle">Telp: ${escapeHtml(model.company.phone)}</div>` : ''

  if (model.template.headerVariant === 'grid') {
    return `
      <div class="receipt-header-wrap">
        ${logoHtml}
        <h1>${escapeHtml(model.company.name)}</h1>
        ${companyAddressHtml}
        ${companyPhoneHtml}
        <div class="meta-grid">
          <span>No</span><strong>${escapeHtml(model.meta.number)}</strong>
          <span>Tgl</span><span>${escapeHtml(formatDateTime(model.meta.date))}</span>
          <span>Kasir</span><span>${escapeHtml(model.meta.cashier)}</span>
          <span>Gudang</span><span>${escapeHtml(model.meta.warehouse)}</span>
        </div>
      </div>
    `
  }

  const brandClass = model.template.headerVariant === 'brand' ? ' brand' : ''
  return `
    <div class="receipt-header-wrap${brandClass}">
      ${logoHtml}
      <h1>${escapeHtml(model.company.name)}</h1>
      ${companyAddressHtml}
      ${companyPhoneHtml}
      ${model.subtitle ? `<div class="subtitle">${escapeHtml(model.subtitle)}</div>` : ''}
      <div class="meta-row">No Nota: <strong>${escapeHtml(model.meta.number)}</strong></div>
      <div class="meta-row">Tanggal: ${escapeHtml(formatDateTime(model.meta.date))}</div>
      <div class="meta-row">Kasir: ${escapeHtml(model.meta.cashier)}</div>
      ${model.template.showMetaWarehouse ? `<div class="meta-row">Gudang: ${escapeHtml(model.meta.warehouse)}</div>` : ''}
    </div>
  `
}

function renderHtmlItems(model, helpers) {
  const { escapeHtml, formatCurrency } = helpers

  const renderLineItems = (showIndex = false) => {
    const lineItems = model.itemRows.map((item) => `
      <div class="line-item">
        <div class="line-title">${showIndex ? `${item.index}. ` : ''}${escapeHtml(item.name)}</div>
        <div class="line-detail">
          <span>${item.quantity} x ${formatCurrency(item.unitPrice)}</span>
          <strong>${formatCurrency(item.subtotal)}</strong>
        </div>
      </div>
    `).join('')

    return `
      <div class="line-items-wrap">
        ${lineItems || '<div class="line-item"><div class="line-title">Tidak ada item</div></div>'}
      </div>
    `
  }

  if (model.template.itemsVariant === 'line') {
    return renderLineItems(false)
  }

  if (model.template.itemsVariant === 'table_detail') {
    return renderLineItems(false)
  }

  return renderLineItems(true)
}

function renderHtmlSummary(model, helpers) {
  const { formatCurrency } = helpers
  return `
    <div class="summary">
      ${model.template.showSummarySubtotal ? `<div><span>Subtotal</span><span>${formatCurrency(model.summary.subtotal)}</span></div>` : ''}
      ${model.template.showSummaryTax ? `<div><span>PPN</span><span>${formatCurrency(model.summary.tax)}</span></div>` : ''}
      <div class="total"><span>Total</span><span>${formatCurrency(model.summary.total)}</span></div>
      <div><span>Dibayar</span><span>${formatCurrency(model.summary.paid)}</span></div>
      <div><span>Kembalian</span><span>${formatCurrency(model.summary.change)}</span></div>
    </div>
  `
}

function renderHtmlPayments(model, helpers) {
  const { escapeHtml, formatCurrency } = helpers
  const rows = model.paymentRows.map((payment) => `
    <div class="pay-row"><span>${escapeHtml(payment.method)}</span><span>${formatCurrency(payment.amount)}</span></div>
  `).join('')

  return `
    <div class="payments-block">
      <strong>Pembayaran</strong>
      ${rows || '<div class="pay-row"><span>-</span><span>-</span></div>'}
    </div>
  `
}

function renderHtmlFooter(model, helpers) {
  const { escapeHtml } = helpers
  const footerHtml = escapeHtml(model.footerText).replaceAll('\n', '<br />')
  return `<div class="footer">${footerHtml}</div>`
}

export function renderReceiptHtml(sale, settings, helpers) {
  const model = buildReceiptTemplateModel(sale, settings)
  return model.blocks.map((block) => {
    if (block === 'header') return renderHtmlHeader(model, helpers)
    if (block === 'items') return renderHtmlItems(model, helpers)
    if (block === 'summary') return renderHtmlSummary(model, helpers)
    if (block === 'payments') return renderHtmlPayments(model, helpers)
    if (block === 'footer') return renderHtmlFooter(model, helpers)
    return ''
  }).join('')
}
