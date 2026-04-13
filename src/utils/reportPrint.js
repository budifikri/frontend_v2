/**
 * Utility for printing professional reports with multiple layout support
 */
import { loadReportSettings } from '../features/setting/reportSetting.storage';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const LAYOUT_RENDERERS = {
  LAYOUT_A: (company, title, date, user, tableHtml, footerText) => {
    return `
      <div class="report-container">
        <div class="report-header">
          <h1>${escapeHtml(company.name)}</h1>
          <div class="company-info">
            ${company.address ? `<div>${escapeHtml(company.address)}</div>` : ''}
            ${company.phone ? `<div>Telp: ${escapeHtml(company.phone)}</div>` : ''}
          </div>
          <div class="report-title">${escapeHtml(title)}</div>
        </div>
        <div class="report-meta">
          <div>Dicetak pada: ${escapeHtml(date)}</div>
          <div>Operator: ${escapeHtml(user)}</div>
        </div>
        ${tableHtml}
        <div class="report-footer">
          <div class="footer-note">${escapeHtml(footerText)}</div>
          <div class="signature-area">
            <div>Dicetak Oleh,</div>
            <div class="signature-line">${escapeHtml(user)}</div>
          </div>
        </div>
      </div>
    `;
  },
  LAYOUT_B: (company, title, date, user, tableHtml, footerText) => {
    return `
      <div class="report-container modern">
        <div class="report-header-modern">
          <div class="company-brand">
            <h1>${escapeHtml(company.name)}</h1>
            <div class="company-details">${escapeHtml(company.address)} | ${escapeHtml(company.phone)}</div>
          </div>
          <div class="report-title-modern">${escapeHtml(title)}</div>
        </div>
        <div class="report-meta-modern">
          <span><strong>Tanggal:</strong> ${escapeHtml(date)}</span>
          <span><strong>Operator:</strong> ${escapeHtml(user)}</span>
        </div>
        ${tableHtml}
        <div class="report-footer-modern">
          <div class="footer-note">${escapeHtml(footerText)}</div>
          <div class="signature-area">
            <div>Dicetak Oleh,</div>
            <div class="signature-line">${escapeHtml(user)}</div>
          </div>
        </div>
      </div>
    `;
  },
  LAYOUT_C: (company, title, date, user, tableHtml, footerText) => {
    return `
      <div class="report-container compact">
        <div class="report-header-compact">
          <div class="header-left">
            <h1>${escapeHtml(company.name)}</h1>
            <div class="company-info">${escapeHtml(company.address)}</div>
          </div>
          <div class="header-right">
            <div class="report-title-compact">${escapeHtml(title)}</div>
            <div class="meta-compact">Op: ${escapeHtml(user)} | ${escapeHtml(date)}</div>
          </div>
        </div>
        ${tableHtml}
        <div class="report-footer-compact">
          <div class="footer-note">${escapeHtml(footerText)}</div>
          <div class="signature-area-compact">
            <div class="signature-line">${escapeHtml(user)}</div>
          </div>
        </div>
      </div>
    `;
  }
};

export function openReportPrintWindow({
  title,
  company = { name: '', address: '', phone: '' },
  meta = { date: new Date().toLocaleString('id-ID'), user: '' },
  columns = [],
  data = [],
  footerTextOverride = null,
}) {
  const settings = loadReportSettings();
  const { date, user } = meta;
  
  const companyData = {
    name: company.name || settings.company_name,
    address: company.address || settings.company_address,
    phone: company.phone || settings.company_phone,
  };

  const tableHeader = '<thead><tr>' + columns.map(col => '<th class="' + (col.align || '') + '">' + col.label + '</th>').join('') + '</tr></thead>';
  const tableRows = data.map((row, rowIndex) => {
    const cells = columns.map((col) => {
      const value = row[col.key];
      const formattedValue = col.formatter ? col.formatter(value, row, rowIndex) : value ?? '-';
      return '<td class="' + (col.align || '') + '">' + formattedValue + '</td>';
    }).join('');
    return '<tr>' + cells + '</tr>';
  }).join('');

  const fullTableHtml = '<table>' + tableHeader + '<tbody>' + (tableRows || '<tr><td colspan="' + columns.length + '" class="text-center">Tidak ada data</td></tr>') + '</tbody></table>';

  let finalHtml = '';
  let finalCss = '';
  const fontFamily = settings.report_font || 'Arial';

  if (settings.layout_type === 'CUSTOM') {
    let html = settings.custom_template_html;
    const tokens = {
      '{{company_name}}': escapeHtml(companyData.name),
      '{{company_address}}': escapeHtml(companyData.address),
      '{{company_phone}}': escapeHtml(companyData.phone),
      '{{report_title}}': escapeHtml(title),
      '{{print_date}}': escapeHtml(date),
      '{{operator}}': escapeHtml(user),
      '{{footer_text}}': escapeHtml(footerTextOverride || settings.footer_text),
      '{{table_data}}': fullTableHtml,
    };
    Object.entries(tokens).forEach(([token, value]) => {
      html = html.split(token).join(value);
    });
    finalHtml = html;
    finalCss = settings.custom_template_css || '';
  } else {
    const renderer = LAYOUT_RENDERERS[settings.layout_type] || LAYOUT_RENDERERS.LAYOUT_A;
    finalHtml = renderer(companyData, title, date, user, fullTableHtml, footerTextOverride || settings.footer_text);
    
    finalCss = `
      @page { size: A4; margin: 20mm; }
      body { font-family: '${fontFamily}', Arial, sans-serif; color: #333; line-height: 1.5; margin: 0; padding: 0; }
      .report-container { width: 100%; }
      
      /* Layout A - Classic */
      .report-header { text-align: center; margin-bottom: 30px; border-bottom: 3px double #333; padding-bottom: 10px; }
      .report-header h1 { margin: 0; font-size: 20pt; text-transform: uppercase; }
      .company-info { font-size: 10pt; margin-bottom: 10px; }
      .report-title { margin-top: 15px; font-size: 14pt; font-weight: bold; text-decoration: underline; }
      .report-meta { display: flex; justify-content: space-between; font-size: 9pt; margin-bottom: 20px; }
      
      /* Layout B - Modern */
      .report-header-modern { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
      .company-brand h1 { margin: 0; font-size: 18pt; }
      .company-details { font-size: 9pt; color: #666; }
      .report-title-modern { font-size: 16pt; font-weight: bold; text-transform: uppercase; color: #222; }
      .report-meta-modern { font-size: 9pt; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
      
      /* Layout C - Compact */
      .report-header-compact { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
      .report-header-compact h1 { margin: 0; font-size: 14pt; }
      .report-title-compact { font-weight: bold; font-size: 11pt; text-align: right; }
      .meta-compact { font-size: 8pt; text-align: right; color: #666; }
      
      table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      th, td { border: 1px solid #333; padding: 8px; text-align: left; font-size: 10pt; }
      th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; }
      tr:nth-child(even) { background-color: #fafafa; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      
      .report-footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
      .report-footer-modern { margin-top: 40px; display: flex; justify-content: space-between; }
      .report-footer-compact { margin-top: 20px; display: flex; justify-content: space-between; }
      .footer-note { font-size: 9pt; font-style: italic; color: #666; }
      .signature-area { text-align: center; width: 200px; }
      .signature-area-compact { text-align: right; }
      .signature-line { margin-top: 60px; border-top: 1px solid #333; font-weight: bold; font-size: 10pt; }
      .signature-line-compact { margin-top: 30px; border-top: 1px solid #333; display: inline-block; min-width: 150px; }
    `;
  }

  const html = '<!doctype html><html><head><meta charset="utf-8"/><title>' + title + '</title><style>' + finalCss + '</style></head><body>' + finalHtml + '<script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 200); }</script></body></html>';

  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) {
    throw new Error('Popup cetak diblokir oleh browser');
  }
  printWindow.document.write(html);
  printWindow.document.close();
}
