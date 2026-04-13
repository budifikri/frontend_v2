/**
 * Utility for printing professional reports with template support
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

export function openReportPrintWindow({
  title,
  company = { name: '', address: '', phone: '' },
  meta = { date: new Date().toLocaleString('id-ID'), user: '' },
  columns = [],
  data = [],
  footerTextOverride = null,
}) {
  const settings = loadReportSettings();
  const { name, address, phone } = company;
  const { date, user } = meta;

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

  const safeName = escapeHtml(name || settings.company_name);
  const safeAddress = escapeHtml(address || settings.company_address);
  const safePhone = escapeHtml(phone || settings.company_phone);
  const safeTitle = escapeHtml(title);
  const safeDate = escapeHtml(date);
  const safeUser = escapeHtml(user);
  const safeFooter = escapeHtml(footerTextOverride || settings.footer_text);

  if (settings.template_mode === 'custom') {
    let html = settings.custom_template_html;
    const tokens = {
      '{{company_name}}': safeName,
      '{{company_address}}': safeAddress,
      '{{company_phone}}': safePhone,
      '{{report_title}}': safeTitle,
      '{{print_date}}': safeDate,
      '{{operator}}': safeUser,
      '{{footer_text}}': safeFooter,
      '{{table_data}}': fullTableHtml,
    };

    Object.entries(tokens).forEach(([token, value]) => {
      html = html.split(token).join(value);
    });

    finalHtml = html;
    finalCss = settings.custom_template_css;
  } else {
    const fontFamily = settings.report_font || 'Arial'
    
    finalCss = `
      @page { size: A4; margin: 20mm; }
      body { font-family: '${fontFamily}', Arial, sans-serif; color: #333; line-height: 1.5; margin: 0; padding: 0; }
      .report-container { width: 100%; }
      .report-header { text-align: center; margin-bottom: 30px; border-bottom: 3px double #333; padding-bottom: 10px; }
      .report-header h1 { margin: 0; font-size: 20pt; text-transform: uppercase; }
      .company-info { font-size: 10pt; margin-bottom: 10px; }
      .report-title { margin-top: 15px; font-size: 14pt; font-weight: bold; text-decoration: underline; }
      .report-meta { display: flex; justify-content: space-between; font-size: 9pt; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      th, td { border: 1px solid #333; padding: 8px; text-align: left; font-size: 10pt; }
      th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; }
      tr:nth-child(even) { background-color: #fafafa; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .report-footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
      .footer-note { font-size: 9pt; font-style: italic; color: #666; }
      .signature-area { text-align: center; width: 200px; }
      .signature-line { margin-top: 60px; border-top: 1px solid #333; font-weight: bold; font-size: 10pt; }
    `;
    
    const addressHtml = safeAddress ? '<div>' + safeAddress + '</div>' : '';
    const phoneHtml = safePhone ? '<div>Telp: ' + safePhone + '</div>' : '';
    
    finalHtml = '<div class="report-container">' +
      '<div class="report-header">' +
        '<h1>' + safeName + '</h1>' +
        '<div class="company-info">' + addressHtml + phoneHtml + '</div>' +
        '<div class="report-title">' + safeTitle + '</div>' +
      '</div>' +
      '<div class="report-meta">' +
        '<div>Dicetak pada: ' + safeDate + '</div>' +
        '<div>Operator: ' + safeUser + '</div>' +
      '</div>' +
      fullTableHtml +
      '<div class="report-footer">' +
        '<div class="footer-note">' + safeFooter + '</div>' +
        '<div class="signature-area">' +
          '<div>Dicetak Oleh,</div>' +
          '<div class="signature-line">' + safeUser + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  const html = '<!doctype html><html><head><meta charset="utf-8"/><title>' + safeTitle + '</title><style>' + finalCss + '</style></head><body>' + finalHtml + '<script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 200); }</script></body></html>';

  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) {
    throw new Error('Popup cetak diblokir oleh browser');
  }
  printWindow.document.write(html);
  printWindow.document.close();
}