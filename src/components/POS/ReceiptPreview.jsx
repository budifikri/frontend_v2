import { buildReceiptPreviewData, getReceiptPaperClass, getReceiptLayoutLabel } from './ReceiptLayouts'

export function ReceiptPreview({ sale, settings, formatCurrency, formatDateTime }) {
  const preview = buildReceiptPreviewData(sale, settings)

  return (
    <div className={`receipt-preview ${getReceiptPaperClass(settings.paper_size)}`}>
      <div className="receipt-preview-top">
        {preview.showLogo && <div className="receipt-preview-logo">PX</div>}
        <h4>{preview.title}</h4>
        {preview.subtitle && <div className="receipt-preview-subtitle">{preview.subtitle}</div>}
        <div className="receipt-preview-meta">No: {preview.meta.number}</div>
        <div className="receipt-preview-meta">Tgl: {formatDateTime(preview.meta.date)}</div>
        <div className="receipt-preview-meta">Kasir: {preview.meta.cashier}</div>
        <div className="receipt-preview-layout">{getReceiptLayoutLabel(preview.layoutType)}</div>
      </div>

      <div className="receipt-preview-items">
        {preview.itemRows.length === 0 ? (
          <div className="receipt-preview-empty">Tidak ada item</div>
        ) : (
          preview.itemRows.slice(0, 6).map((item) => (
            <div key={`${item.index}-${item.name}`} className="receipt-preview-item">
              <div className="receipt-preview-item-name">{item.name}</div>
              <div className="receipt-preview-item-detail">
                <span>{item.quantity} x {formatCurrency(item.unitPrice)}</span>
                <strong>{formatCurrency(item.subtotal)}</strong>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="receipt-preview-summary">
        {(preview.layoutType === 'layout_b' || preview.layoutType === 'layout_c') && (
          <div className="receipt-preview-row"><span>Subtotal</span><span>{formatCurrency(preview.summary.subtotal)}</span></div>
        )}
        {preview.layoutType === 'layout_b' && (
          <div className="receipt-preview-row"><span>PPN</span><span>{formatCurrency(preview.summary.tax)}</span></div>
        )}
        <div className="receipt-preview-row total"><span>Total</span><span>{formatCurrency(preview.summary.total)}</span></div>
        <div className="receipt-preview-row"><span>Dibayar</span><span>{formatCurrency(preview.summary.paid)}</span></div>
        <div className="receipt-preview-row"><span>Kembalian</span><span>{formatCurrency(preview.summary.change)}</span></div>
      </div>

      {preview.layoutType !== 'layout_a' && (
        <div className="receipt-preview-payments">
          <strong>Pembayaran</strong>
          {preview.paymentRows.length === 0 ? (
            <div className="receipt-preview-row"><span>-</span><span>-</span></div>
          ) : (
            preview.paymentRows.map((payment, idx) => (
              <div key={`${payment.method}-${idx}`} className="receipt-preview-row">
                <span>{payment.method}</span>
                <span>{formatCurrency(payment.amount)}</span>
              </div>
            ))
          )}
        </div>
      )}

      {preview.showFooter && (
        <div className="receipt-preview-footer">{preview.footerText}</div>
      )}
    </div>
  )
}
