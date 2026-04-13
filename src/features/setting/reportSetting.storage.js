export const DEFAULT_REPORT_SETTINGS = {
  layout_type: 'LAYOUT_A', // 'LAYOUT_A', 'LAYOUT_B', 'LAYOUT_C', 'CUSTOM'
  report_font: 'Arial',
  header_text: 'LAPORAN DATA MASTER',
  footer_text: 'Dicetak otomatis oleh sistem POS.',
  company_name: '',
  company_address: '',
  company_phone: '',
  custom_template_html: `<div class="report-custom">
  <div class="report-header">
    <h1>{{company_name}}</h1>
    <p>{{company_address}}<br/>Telp: {{company_phone}}</p>
    <hr/>
    <h2>{{report_title}}</h2>
  </div>
  
  <div class="report-meta">
    <span>Dicetak pada: {{print_date}}</span>
    <span>Operator: {{operator}}</span>
  </div>

  <div class="report-body">
    {{table_data}}
  </div>

  <div class="report-footer">
    <p>{{footer_text}}</p>
    <div class="signature">
      <p>Dicetak Oleh,</p>
      <br/><br/>
      <p><strong>{{operator}}</strong></p>
    </div>
  </div>
</div>
`,
  custom_template_css: `.report-custom { font-family: Arial, sans-serif; color: #333; }
.report-header { text-align: center; margin-bottom: 20px; }
.report-header h1 { margin: 0; font-size: 22pt; }
.report-header h2 { margin: 10px 0; font-size: 16pt; text-decoration: underline; }
.report-meta { display: flex; justify-content: space-between; font-size: 10pt; margin-bottom: 20px; }
.report-body { margin-bottom: 30px; }
.report-footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
.signature { text-align: center; width: 200px; }
`,
}

export function loadReportSettings() {
  const saved = localStorage.getItem('pos_report_settings');
  return saved ? JSON.parse(saved) : DEFAULT_REPORT_SETTINGS;
}

export function saveReportSettings(settings) {
  localStorage.setItem('pos_report_settings', JSON.stringify(settings));
  return settings;
}

export function resetReportSettings() {
  localStorage.removeItem('pos_report_settings');
  return DEFAULT_REPORT_SETTINGS;
}
