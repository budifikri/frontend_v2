import { renderReceiptContent, getReceiptPaperClass } from './ReceiptLayouts'

export function ReceiptPreview({ sale, settings, formatCurrency, formatDateTime }) {
  const escapeHtml = (value) => {
    const text = String(value ?? '')
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  }

  const result = renderReceiptContent(sale, settings, { escapeHtml, formatCurrency, formatDateTime }, { withSamples: true })
  const model = result.model

  if (result.isCustom) {
    return (
      <div className={`receipt-preview ${getReceiptPaperClass(settings.paper_size)} ${settings.printer_type === 'dot_matrix' ? 'printer-dot-matrix' : 'printer-thermal'}`}>
        <style>{result.customCss}</style>
        <div dangerouslySetInnerHTML={{ __html: result.bodyHtml }} />

        {settings.calibration_mode && (
          <div className="receipt-preview-calibration">
            <div className="receipt-preview-calibration-label">Calibration 50mm</div>
            <div className="receipt-preview-calibration-line" />
            <div className="receipt-preview-calibration-scale">
              <span>0</span>
              <span>50mm</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  const companyAddressLine = model.company.address || 'Alamat company'
  const companyPhoneLine = model.company.phone || '-'

  return (
    <div className={`receipt-preview ${getReceiptPaperClass(settings.paper_size)} ${settings.printer_type === 'dot_matrix' ? 'printer-dot-matrix' : 'printer-thermal'}`}>
      <div className={`receipt-preview-top ${model.template.headerVariant === 'brand' ? 'brand' : ''}`}>
        {model.showLogo && <div className="receipt-preview-logo">PX</div>}
        <h4>{model.company.name}</h4>
        <div className="receipt-preview-subtitle">{companyAddressLine}, Telp: {companyPhoneLine}</div>
        <div className="receipt-preview-meta">No: {model.meta.number}</div>
        <div className="receipt-preview-meta">Tgl: {formatDateTime(model.meta.date)}</div>
        <div className="receipt-preview-meta">Kasir: {model.meta.cashier}</div>
        {model.template.showMetaWarehouse && <div className="receipt-preview-meta">Gudang: {model.meta.warehouse}</div>}
      </div>

      <div className="receipt-preview-items">
        {model.itemRows.slice(0, 6).map((item) => (
          <div key={`${item.index}-${item.name}`} className="receipt-preview-item">
            <div className="receipt-preview-item-name">{item.name}</div>
            <div className="receipt-preview-item-detail">
              <span>{item.quantity} x {formatCurrency(item.unitPrice)}</span>
              <strong>{formatCurrency(item.subtotal)}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="receipt-preview-summary">
        {model.template.showSummarySubtotal && (
          <div className="receipt-preview-row"><span>Subtotal</span><span>{formatCurrency(model.summary.subtotal)}</span></div>
        )}
        {model.template.showSummaryTax && (
          <div className="receipt-preview-row"><span>PPN</span><span>{formatCurrency(model.summary.tax)}</span></div>
        )}
        <div className="receipt-preview-row total"><span>Total</span><span>{formatCurrency(model.summary.total)}</span></div>
        <div className="receipt-preview-row"><span>Dibayar</span><span>{formatCurrency(model.summary.paid)}</span></div>
        <div className="receipt-preview-row"><span>Kembalian</span><span>{formatCurrency(model.summary.change)}</span></div>
      </div>

      {model.template.showPayments && (
        <div className="receipt-preview-payments">
          <strong>Pembayaran</strong>
          {model.paymentRows.length === 0 ? (
            <div className="receipt-preview-row"><span>-</span><span>-</span></div>
          ) : (
            model.paymentRows.map((payment, idx) => (
              <div key={`${payment.method}-${idx}`} className="receipt-preview-row">
                <span>{payment.method}</span>
                <span>{formatCurrency(payment.amount)}</span>
              </div>
            ))
          )}
        </div>
      )}

      {model.showFooter && (
        <div className="receipt-preview-footer">{model.footerText}</div>
      )}

      {settings.calibration_mode && (
        <div className="receipt-preview-calibration">
          <div className="receipt-preview-calibration-label">Calibration 50mm</div>
          <div className="receipt-preview-calibration-line" />
          <div className="receipt-preview-calibration-scale">
            <span>0</span>
            <span>50mm</span>
          </div>
        </div>
      )}
    </div>
  )
}
