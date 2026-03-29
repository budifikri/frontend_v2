export const RECEIPT_LAYOUT_OPTIONS = [
  { id: 'layout_a', label: 'Layout A - Simple', description: 'Ringkas, fokus ke item dan total' },
  { id: 'layout_b', label: 'Layout B - Detail Pajak', description: 'Menampilkan subtotal, PPN, dan rincian bayar' },
  { id: 'layout_c', label: 'Layout C - Brand + Footer', description: 'Header brand lebih kuat dan footer promosi' },
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

export function buildReceiptPreviewData(sale, settings) {
  const layoutType = settings.layout_type || 'layout_a'
  const itemRows = buildItemRows(sale)
  const paymentRows = buildPaymentRows(sale)

  return {
    layoutType,
    showLogo: Boolean(settings.show_logo),
    showFooter: Boolean(settings.show_footer),
    title: layoutType === 'layout_c' ? 'NOTA PENJUALAN - POSXPRESS' : 'NOTA PENJUALAN',
    subtitle: layoutType === 'layout_c' ? 'Retail Checkout' : '',
    meta: {
      number: sale.sale_number || sale.invoice_number || '-',
      date: sale.sale_date || sale.created_at,
      cashier: sale.cashier_name || '-',
      warehouse: sale.warehouse_name || '-',
    },
    itemRows,
    summary: {
      subtotal: sale.subtotal || 0,
      tax: sale.tax_amount || 0,
      total: sale.total_amount || 0,
      paid: sale.paid_amount || 0,
      change: sale.change_amount || 0,
    },
    paymentRows,
    footerText: layoutType === 'layout_c'
      ? 'Terima kasih sudah berbelanja. Simpan nota ini untuk klaim retur.'
      : 'Terima kasih sudah berbelanja.',
  }
}

export function renderReceiptLayoutA(data, helpers) {
  const { escapeHtml, formatCurrency, formatDateTime } = helpers
  const itemsHtml = data.itemRows.map((item) => `
    <tr>
      <td>${item.index}</td>
      <td>${escapeHtml(item.name)}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('')

  return `
    <div class="receipt-header-wrap">
      <h1>${escapeHtml(data.title)}</h1>
      <div class="meta-row">No Nota: <strong>${escapeHtml(data.meta.number)}</strong></div>
      <div class="meta-row">Tanggal: ${escapeHtml(formatDateTime(data.meta.date))}</div>
      <div class="meta-row">Kasir: ${escapeHtml(data.meta.cashier)}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:28px">No</th>
          <th>Produk</th>
          <th style="width:52px;text-align:center">Qty</th>
          <th style="width:80px;text-align:right">Jumlah</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml || '<tr><td colspan="4" style="text-align:center">Tidak ada item</td></tr>'}
      </tbody>
    </table>
    <div class="summary">
      <div><span>Total</span><span>${formatCurrency(data.summary.total)}</span></div>
      <div><span>Dibayar</span><span>${formatCurrency(data.summary.paid)}</span></div>
      <div><span>Kembalian</span><span>${formatCurrency(data.summary.change)}</span></div>
    </div>
  `
}

export function renderReceiptLayoutB(data, helpers) {
  const { escapeHtml, formatCurrency, formatDateTime } = helpers
  const itemsHtml = data.itemRows.map((item) => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td style="text-align:right">${item.quantity} x ${formatCurrency(item.unitPrice)}</td>
      <td style="text-align:right">${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('')

  const paymentsHtml = data.paymentRows.map((payment) => `
    <div class="pay-row"><span>${escapeHtml(payment.method)}</span><span>${formatCurrency(payment.amount)}</span></div>
  `).join('')

  return `
    <div class="receipt-header-wrap">
      <h1>${escapeHtml(data.title)}</h1>
      <div class="meta-grid">
        <span>No</span><strong>${escapeHtml(data.meta.number)}</strong>
        <span>Tgl</span><span>${escapeHtml(formatDateTime(data.meta.date))}</span>
        <span>Kasir</span><span>${escapeHtml(data.meta.cashier)}</span>
        <span>Gudang</span><span>${escapeHtml(data.meta.warehouse)}</span>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Produk</th>
          <th style="width:110px;text-align:right">Qty x Harga</th>
          <th style="width:90px;text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml || '<tr><td colspan="3" style="text-align:center">Tidak ada item</td></tr>'}
      </tbody>
    </table>
    <div class="summary">
      <div><span>Subtotal</span><span>${formatCurrency(data.summary.subtotal)}</span></div>
      <div><span>PPN</span><span>${formatCurrency(data.summary.tax)}</span></div>
      <div class="total"><span>Total</span><span>${formatCurrency(data.summary.total)}</span></div>
      <div><span>Dibayar</span><span>${formatCurrency(data.summary.paid)}</span></div>
      <div><span>Kembalian</span><span>${formatCurrency(data.summary.change)}</span></div>
    </div>
    <div class="payments-block">
      <strong>Pembayaran</strong>
      ${paymentsHtml || '<div class="pay-row"><span>-</span><span>-</span></div>'}
    </div>
  `
}

export function renderReceiptLayoutC(data, helpers) {
  const { escapeHtml, formatCurrency, formatDateTime } = helpers
  const itemsHtml = data.itemRows.map((item) => `
    <div class="line-item">
      <div class="line-title">${escapeHtml(item.name)}</div>
      <div class="line-detail">
        <span>${item.quantity} x ${formatCurrency(item.unitPrice)}</span>
        <strong>${formatCurrency(item.subtotal)}</strong>
      </div>
    </div>
  `).join('')

  const paymentsHtml = data.paymentRows.map((payment) => `
    <div class="pay-row"><span>${escapeHtml(payment.method)}</span><span>${formatCurrency(payment.amount)}</span></div>
  `).join('')

  return `
    <div class="receipt-header-wrap brand">
      <h1>${escapeHtml(data.title)}</h1>
      <div class="subtitle">${escapeHtml(data.subtitle)}</div>
      <div class="meta-row">No Nota: <strong>${escapeHtml(data.meta.number)}</strong></div>
      <div class="meta-row">Tanggal: ${escapeHtml(formatDateTime(data.meta.date))}</div>
      <div class="meta-row">Kasir: ${escapeHtml(data.meta.cashier)}</div>
    </div>
    <div class="line-items-wrap">
      ${itemsHtml || '<div class="line-item"><div class="line-title">Tidak ada item</div></div>'}
    </div>
    <div class="summary">
      <div><span>Total</span><span>${formatCurrency(data.summary.total)}</span></div>
      <div><span>Dibayar</span><span>${formatCurrency(data.summary.paid)}</span></div>
      <div><span>Kembalian</span><span>${formatCurrency(data.summary.change)}</span></div>
    </div>
    <div class="payments-block">
      <strong>Pembayaran</strong>
      ${paymentsHtml || '<div class="pay-row"><span>-</span><span>-</span></div>'}
    </div>
  `
}

export function renderReceiptHtml(sale, settings, helpers) {
  const data = buildReceiptPreviewData(sale, settings)
  if (data.layoutType === 'layout_b') return renderReceiptLayoutB(data, helpers)
  if (data.layoutType === 'layout_c') return renderReceiptLayoutC(data, helpers)
  return renderReceiptLayoutA(data, helpers)
}
