import { useState, useCallback } from 'react'
import { useAuth } from '../../../shared/auth'
import { loadReportSettings, saveReportSettings, resetReportSettings } from '../../../features/setting/reportSetting.storage'
import { getCurrentCompany } from '../../../features/master/company/company.api'

const REPORT_FONTS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
]

const SAMPLE_DATA = [
  { no: '1', kode: 'WH001', nama: 'Toko Pusat', tipe: 'MAIN', kota: 'Jakarta', status: 'Aktif' },
  { no: '2', kode: 'WH002', nama: 'Cabang A', tipe: 'BRANCH', kota: 'Bandung', status: 'Aktif' },
  { no: '3', kode: 'WH003', nama: 'Gudang B', tipe: 'STORAGE', kota: 'Surabaya', status: 'Non-Aktif' },
]

export function ReportSetting({ onExit }) {
  const { auth } = useAuth()
  const token = auth?.token

  const [settings, setSettings] = useState(loadReportSettings())
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState({ name: 'Company Name', address: 'Jl. Example No. 123', phone: '021-123456' })
  const [error, setError] = useState('')

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const loadCompanyInfo = useCallback(async () => {
    if (token) {
      try {
        const res = await getCurrentCompany(token)
        if (res?.data) {
          setPreviewData({
            name: res.data.nama || res.data.name || 'Company Name',
            address: res.data.address || '',
            phone: res.data.telp || res.data.phone || '',
          })
        }
      } catch (err) {
        console.error('Failed to load company:', err)
      }
    }
  }, [token])

  const handlePreview = async () => {
    await loadCompanyInfo()

    const columns = [
      { key: 'no', label: 'NO', align: 'text-center' },
      { key: 'kode', label: 'KODE' },
      { key: 'nama', label: 'NAMA' },
      { key: 'tipe', label: 'TIPE', align: 'text-center' },
      { key: 'kota', label: 'KOTA' },
      { key: 'status', label: 'STATUS', align: 'text-center' },
    ]

    // Build simplified preview HTML
    const tableRows = SAMPLE_DATA.map((row) => {
      const cells = columns.map((col) => {
        const value = row[col.key]
        return '<td class="' + (col.align || '') + '">' + (value ?? '-') + '</td>'
      }).join('')
      return '<tr>' + cells + '</tr>'
    }).join('')

    const tableHeader = '<thead><tr>' + columns.map(col => '<th class="' + (col.align || '') + '">' + col.label + '</th>').join('') + '</tr></thead>'
    const fullTableHtml = '<table>' + tableHeader + '<tbody>' + tableRows + '</tbody></table>'

    const previewTitle = settings.header_text || 'PREVIEW LAPORAN'
    const safeName = previewData.name
    const safeAddress = previewData.address
    const safePhone = previewData.phone
    const safeDate = new Date().toLocaleString('id-ID')
    const safeUser = auth?.username || 'Admin'
    const safeFooter = settings.footer_text

    let finalHtml = ''
    let finalCss = ''

    const fontFamily = settings.report_font || 'Arial'

    if (settings.template_mode === 'custom') {
      let html = settings.custom_template_html
      const tokens = {
        '{{company_name}}': safeName,
        '{{company_address}}': safeAddress,
        '{{company_phone}}': safePhone,
        '{{report_title}}': previewTitle,
        '{{print_date}}': safeDate,
        '{{operator}}': safeUser,
        '{{footer_text}}': safeFooter,
        '{{table_data}}': fullTableHtml,
      }

      Object.entries(tokens).forEach(([token, value]) => {
        html = html.split(token).join(value)
      })

      finalHtml = html
      finalCss = settings.custom_template_css || ''
    } else {
      finalCss = `
        @page { size: A4; margin: 15mm; }
        body { font-family: '${fontFamily}', Arial, sans-serif; color: #333; line-height: 1.5; margin: 0; padding: 0; }
        .report-container { width: 100%; }
        .report-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .report-header h1 { margin: 0; font-size: 18pt; text-transform: uppercase; }
        .company-info { font-size: 9pt; margin-bottom: 8px; }
        .report-title { margin-top: 10px; font-size: 12pt; font-weight: bold; text-decoration: underline; }
        .report-meta { display: flex; justify-content: space-between; font-size: 8pt; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #333; padding: 6px; text-align: left; font-size: 9pt; }
        th { background-color: #f0f0f0; font-weight: bold; }
        tr:nth-child(even) { background-color: #fafafa; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .report-footer { margin-top: 30px; display: flex; justify-content: space-between; }
        .footer-note { font-size: 8pt; font-style: italic; color: #666; }
        .signature-area { text-align: center; width: 150px; }
        .signature-line { margin-top: 40px; border-top: 1px solid #333; }
      `

      const addressHtml = safeAddress ? '<div>' + safeAddress + '</div>' : ''
      const phoneHtml = safePhone ? '<div>Telp: ' + safePhone + '</div>' : ''

      finalHtml = '<div class="report-container">' +
        '<div class="report-header">' +
          '<h1>' + safeName + '</h1>' +
          '<div class="company-info">' + addressHtml + phoneHtml + '</div>' +
          '<div class="report-title">' + previewTitle + '</div>' +
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
      '</div>'
    }

    const html = '<!doctype html><html><head><meta charset="utf-8"/><title>Preview - ' + previewTitle + '</title><style>' + finalCss + '</style></head><body>' + finalHtml + '</body></html>'

    const previewWindow = window.open('', '_blank', 'width=800,height=900')
    if (previewWindow) {
      previewWindow.document.write(html)
      previewWindow.document.close()
    }

    setShowPreview(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    try {
      saveReportSettings(settings)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } catch (err) {
      setError('Gagal menyimpan pengaturan: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (window.confirm('Kembalikan pengaturan cetak ke default?')) {
      const defaults = resetReportSettings()
      setSettings(defaults)
    }
  }

  const [showToast, setShowToast] = useState(false)

  return (
    <div className="master-content">
      {error && <div className="master-error">{error}</div>}
      {showToast && (
        <div className="toast-notification">
          <span className="material-icons-round">check_circle</span>
          Pengaturan laporan disimpan
        </div>
      )}

      <div className="master-form-card" style={{ marginTop: '16px' }}>
        <div className="master-form-header">
          <span className="material-icons-round master-form-icon">print</span>
          <h2 className="master-form-title">Pengaturan Cetak Laporan</h2>
        </div>
        <div className="master-form-grid">
          <div className="master-form-group">
            <label className="master-form-label">Mode Template :</label>
            <select
              value={settings.template_mode}
              onChange={(e) => handleInputChange('template_mode', e.target.value)}
              className="master-form-input"
            >
              <option value="standard">Standard (Profesional A4)</option>
              <option value="custom">Custom (HTML/CSS)</option>
            </select>
          </div>

          <div className="master-form-group">
            <label className="master-form-label">Font :</label>
            <select
              value={settings.report_font || 'Arial'}
              onChange={(e) => handleInputChange('report_font', e.target.value)}
              className="master-form-input"
            >
              {REPORT_FONTS.map((font) => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </select>
          </div>

          <div className="master-form-group">
            <label className="master-form-label">Judul Default :</label>
            <input
              type="text"
              value={settings.header_text}
              onChange={(e) => handleInputChange('header_text', e.target.value)}
              className="master-form-input"
              placeholder="Contoh: LAPORAN DATA MASTER"
            />
          </div>

          <div className="master-form-group-wide">
            <label className="master-form-label">Catatan Kaki (Footer) :</label>
            <input
              type="text"
              value={settings.footer_text}
              onChange={(e) => handleInputChange('footer_text', e.target.value)}
              className="master-form-input"
              placeholder="Teks yang muncul di bawah laporan..."
            />
          </div>

          {settings.template_mode === 'custom' && (
            <>
              <div className="master-form-group-wide">
                <label className="master-form-label">Custom HTML Template :</label>
                <textarea
                  value={settings.custom_template_html}
                  onChange={(e) => handleInputChange('custom_template_html', e.target.value)}
                  className="master-form-input"
                  style={{ height: '180px', fontFamily: 'monospace', fontSize: '12px' }}
                />
                <div className="report-token-help" style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                  Tokens: {{company_name}}, {{company_address}}, {{company_phone}}, {{report_title}}, {{print_date}}, {{operator}}, {{footer_text}}, {{table_data}}
                </div>
              </div>

              <div className="master-form-group-wide">
                <label className="master-form-label">Custom CSS :</label>
                <textarea
                  value={settings.custom_template_css}
                  onChange={(e) => handleInputChange('custom_template_css', e.target.value)}
                  className="master-form-input"
                  style={{ height: '120px', fontFamily: 'monospace', fontSize: '12px' }}
                />
              </div>
            </>
          )}

          <div className="master-form-actions">
            <button
              type="button"
              className="master-btn-save-primary"
              onClick={handlePreview}
              style={{ backgroundColor: '#0ea5e9' }}
            >
              <span className="material-icons-round">visibility</span>
              PREVIEW
            </button>
            <button
              type="button"
              className="master-btn-save-primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              <span className="material-icons-round">save</span>
              SIMPAN
            </button>
            <button 
              type="button" 
              className="master-footer-btn" 
              onClick={handleReset}
            >
              Reset Default
            </button>
            <button type="button" className="master-footer-btn" onClick={onExit} title="Exit" aria-label="Exit">
              <span className="material-icons-round master-footer-icon red">exit_to_app</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}