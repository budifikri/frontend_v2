import { renderReceiptContent, getReceiptPaperClass } from './ReceiptLayouts'
import { RECEIPT_FONTS } from '../../features/setting/receiptSetting.storage'

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

  const selectedFont = RECEIPT_FONTS.find(f => f.value === settings.receipt_font) || RECEIPT_FONTS[0]
  const hasLocalFont = selectedFont.filename && selectedFont.filename !== ''
  const googleFontUrl = selectedFont.googleFont 
    ? `https://fonts.googleapis.com/css2?family=${selectedFont.googleFont}&display=swap`
    : ''
  const fontStyle = hasLocalFont && !googleFontUrl ? `
    @font-face {
      font-family: '${selectedFont.label}';
      src: url('/assets/${selectedFont.filename}') format('truetype');
    }
  ` : ''

  const result = renderReceiptContent(sale, settings, { escapeHtml, formatCurrency, formatDateTime }, { withSamples: true })
  const model = result.model

  if (result.isCustom) {
    return (
      <div 
        className={`receipt-preview ${getReceiptPaperClass(settings.paper_size)} ${settings.printer_type === 'dot_matrix' ? 'printer-dot-matrix' : 'printer-thermal'}`}
        style={{ fontFamily: `'${selectedFont.label}', Arial, sans-serif` }}
      >
        {googleFontUrl && <link rel="stylesheet" href={googleFontUrl} />}
        <style>{fontStyle + result.customCss}</style>
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
    <div 
      className={`receipt-preview ${getReceiptPaperClass(settings.paper_size)} ${settings.printer_type === 'dot_matrix' ? 'printer-dot-matrix' : 'printer-thermal'}`}
      style={{ fontFamily: `'${selectedFont.label}', Arial, sans-serif` }}
    >
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
            <div className="receipt-preview-item-main">
              <span>{item.quantity} x {formatCurrency(item.originalPrice || item.unitPrice)}</span>
              <span>{formatCurrency((item.originalPrice || item.unitPrice) * item.quantity)}</span>
            </div>
            {item.discount > 0 && item.quantity > 0 && (
              <div className="receipt-preview-item-diskon">
                <span>Diskon {item.tierLabel || 'promo'}</span>
                <span>(- {formatCurrency(item.discount * item.quantity)})</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="receipt-preview-summary">
        <div className="receipt-preview-row"><span>Subtotal ({model.itemCount} Item)</span><span>{formatCurrency(model.summary.originalTotal)}</span></div>
        {model.summary.discount > 0 && (
          <div className="receipt-preview-row diskon"><span>Total Diskon</span><span>- {formatCurrency(model.summary.discount)}</span></div>
        )}
        <div className="receipt-preview-row"><span>PPN (11%)</span><span>{formatCurrency(model.summary.tax)}</span></div>
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
