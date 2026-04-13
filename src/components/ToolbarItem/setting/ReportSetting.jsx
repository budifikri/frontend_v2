import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '../../../shared/auth'
import { loadReportSettings, saveReportSettings, resetReportSettings, DEFAULT_REPORT_SETTINGS } from '../../../features/setting/reportSetting.storage'
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

const LAYOUT_OPTIONS = [
  { id: 'LAYOUT_A', label: 'Classic A', description: 'Header terpusat, garis ganda' },
  { id: 'LAYOUT_B', label: 'Modern B', description: 'Header sejajar, clean look' },
  { id: 'LAYOUT_C', label: 'Compact C', description: 'Hemat ruang, data padat' },
]

const REPORT_TEMPLATE_TOKENS = [
  '{{company_name}}',
  '{{company_address}}',
  '{{company_phone}}',
  '{{report_title}}',
  '{{print_date}}',
  '{{operator}}',
  '{{footer_text}}',
  '{{table_data}}',
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
  const [showToast, setShowToast] = useState(false)
  const [error, setError] = useState('')
  const [companyData, setCompanyData] = useState({ name: '', address: '', phone: '' })
  const [showTemplateCode, setShowTemplateCode] = useState(false)
  const [templateCodeHtml, setTemplateCodeHtml] = useState('')
  
  const wysiwygEditorRef = useRef(null)
  const codeEditorRef = useRef(null)

  useEffect(() => {
    const loadCompany = async () => {
      if (token) {
        try {
          const res = await getCurrentCompany(token)
          if (res?.data) {
            setCompanyData({
              name: res.data.nama || res.data.name || 'Company Name',
              address: res.data.address || '',
              phone: res.data.telp || res.data.phone || '',
            })
          }
        } catch (err) {
          console.error('Failed to load company:', err)
        }
      }
    }
    loadCompany()
  }, [token])

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleLayoutSelect = (layoutId) => {
    setSettings(prev => ({ ...prev, layout_type: layoutId }))
  }

  const generatePreviewHtml = useCallback(() => {
    const columns = [
      { key: 'no', label: 'NO', align: 'text-center' },
      { key: 'kode', label: 'KODE' },
      { key: 'nama', label: 'NAMA' },
      { key: 'tipe', label: 'TIPE', align: 'text-center' },
      { key: 'kota', label: 'KOTA' },
      { key: 'status', label: 'STATUS', align: 'text-center' },
    ]

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
    const safeDate = new Date().toLocaleString('id-ID')
    const safeUser = auth?.username || 'Admin'
    const safeFooter = settings.footer_text
    const fontFamily = settings.report_font || 'Arial'

    let finalHtml = ''
    let finalCss = ''

    if (settings.layout_type === 'CUSTOM') {
      let html = settings.custom_template_html
      const tokens = {
        '{{company_name}}': companyData.name,
        '{{company_address}}': companyData.address,
        '{{company_phone}}': companyData.phone,
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
      const renderers = {
        LAYOUT_A: () => `
          <div class="report-container">
            <div class="report-header">
              <h1>${companyData.name}</h1>
              <div class="company-info">${companyData.address}${companyData.phone ? '<br/>Telp: ' + companyData.phone : ''}</div>
              <div class="report-title">${previewTitle}</div>
            </div>
            <div class="report-meta">
              <div>Dicetak pada: ${safeDate}</div>
              <div>Operator: ${safeUser}</div>
            </div>
            ${fullTableHtml}
            <div class="report-footer">
              <div class="footer-note">${safeFooter}</div>
              <div class="signature-area"><div>Dicetak Oleh,</div><div class="signature-line">${safeUser}</div></div>
            </div>
          </div>
        `,
        LAYOUT_B: () => `
          <div class="report-container modern">
            <div class="report-header-modern">
              <div class="company-brand">
                <h1>${companyData.name}</h1>
                <div class="company-details">${companyData.address} | ${companyData.phone}</div>
              </div>
              <div class="report-title-modern">${previewTitle}</div>
            </div>
            <div class="report-meta-modern">
              <span><strong>Tanggal:</strong> ${safeDate}</span>
              <span><strong>Operator:</strong> ${safeUser}</span>
            </div>
            ${fullTableHtml}
            <div class="report-footer-modern">
              <div class="footer-note">${safeFooter}</div>
              <div class="signature-area"><div>Dicetak Oleh,</div><div class="signature-line">${safeUser}</div></div>
            </div>
          </div>
        `,
        LAYOUT_C: () => `
          <div class="report-container compact">
            <div class="report-header-compact">
              <div class="header-left">
                <h1>${companyData.name}</h1>
                <div class="company-info">${companyData.address}</div>
              </div>
              <div class="header-right">
                <div class="report-title-compact">${previewTitle}</div>
                <div class="meta-compact">Op: ${safeUser} | ${safeDate}</div>
              </div>
            </div>
            ${fullTableHtml}
            <div class="report-footer-compact">
              <div class="footer-note">${safeFooter}</div>
              <div class="signature-area-compact"><div class="signature-line">${safeUser}</div></div>
            </div>
          </div>
        `,
      }
      finalHtml = renderers[settings.layout_type]?.() || renderers.LAYOUT_A()
      finalCss = `
        @page { size: A4; margin: 15mm; }
        body { font-family: '${fontFamily}', Arial, sans-serif; color: #333; line-height: 1.5; margin: 0; padding: 0; }
        .report-container { width: 100%; }
        .report-header { text-align: center; margin-bottom: 25px; border-bottom: 3px double #333; padding-bottom: 10px; }
        .report-header h1 { margin: 0; font-size: 18pt; text-transform: uppercase; }
        .company-info { font-size: 9pt; margin-bottom: 8px; }
        .report-title { margin-top: 10px; font-size: 13pt; font-weight: bold; text-decoration: underline; }
        .report-meta { display: flex; justify-content: space-between; font-size: 8pt; margin-bottom: 15px; }
        .report-header-modern { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #000; padding-bottom: 12px; }
        .company-brand h1 { margin: 0; font-size: 16pt; }
        .company-details { font-size: 8pt; color: #666; }
        .report-title-modern { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
        .report-meta-modern { font-size: 8pt; margin-bottom: 15px; padding-bottom: 5px; }
        .report-header-compact { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .report-header-compact h1 { margin: 0; font-size: 13pt; }
        .report-title-compact { font-weight: bold; font-size: 10pt; text-align: right; }
        .meta-compact { font-size: 7pt; text-align: right; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #333; padding: 6px; text-align: left; font-size: 9pt; }
        th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; }
        tr:nth-child(even) { background-color: #fafafa; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .report-footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
        .report-footer-modern { margin-top: 30px; display: flex; justify-content: space-between; }
        .report-footer-compact { margin-top: 15px; display: flex; justify-content: space-between; }
        .footer-note { font-size: 8pt; font-style: italic; color: #666; }
        .signature-area { text-align: center; width: 150px; }
        .signature-area-compact { text-align: right; }
        .signature-line { margin-top: 50px; border-top: 1px solid #333; font-weight: bold; font-size: 9pt; }
      `
    }

    return '<!doctype html><html><head><meta charset="utf-8"/><title>Preview - ' + previewTitle + '</title><style>' + finalCss + '</style></head><body>' + finalHtml + '</body></html>'
  }, [settings, companyData, auth?.username])

  const handlePreview = () => {
    const html = generatePreviewHtml()
    const previewWindow = window.open('', '_blank', 'width=800,height=900')
    if (previewWindow) {
      previewWindow.document.write(html)
      previewWindow.document.close()
    }
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

  const handleTokenClick = (token) => {
    if (showTemplateCode && codeEditorRef.current) {
      const textarea = codeEditorRef.current
      const start = textarea.selectionStart ?? templateCodeHtml.length
      const end = textarea.selectionEnd ?? templateCodeHtml.length
      const next = `${templateCodeHtml.slice(0, start)}${token}${templateCodeHtml.slice(end)}`
      setTemplateCodeHtml(next)
      setTimeout(() => {
        textarea.focus()
        const cursorPos = start + token.length
        textarea.setSelectionRange(cursorPos, cursorPos)
      }, 0)
      return
    }
    if (wysiwygEditorRef.current) {
      wysiwygEditorRef.current.focus()
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        sel.deleteFromDocument()
      }
      document.execCommand('insertHTML', false, token)
      setTemplateCodeHtml(wysiwygEditorRef.current.innerHTML)
    }
  }

  const handleApplyTemplate = () => {
    const currentHtml = showTemplateCode
      ? templateCodeHtml
      : (wysiwygEditorRef.current?.innerHTML || settings.custom_template_html || '')
    setSettings(prev => ({ ...prev, custom_template_html: currentHtml }))
    setTemplateCodeHtml(currentHtml)
  }

  const handleResetTemplate = () => {
    if (wysiwygEditorRef.current) {
      wysiwygEditorRef.current.innerHTML = DEFAULT_REPORT_SETTINGS.custom_template_html
    }
    setSettings(prev => ({
      ...prev,
      custom_template_html: DEFAULT_REPORT_SETTINGS.custom_template_html,
    }))
    setTemplateCodeHtml(DEFAULT_REPORT_SETTINGS.custom_template_html)
  }

  return (
    <div className="master-content">
      {error && <div className="master-error">{error}</div>}
      {showToast && (
        <div className="toast-notification">
          <span className="material-icons-round">check_circle</span>
          Pengaturan laporan disimpan
        </div>
      )}

      <div className="receipt-setting-popup" style={{ maxWidth: '1200px', margin: '16px auto' }}>
        <div className="receipt-setting-header">
          <span className="material-icons">print</span>
          <h3>Setting Cetak Laporan</h3>
          <button className="product-popup-close" onClick={onExit}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="receipt-setting-body">
          <div className="receipt-setting-form">
            <div className="receipt-setting-section">
              <h4>Tata Letak</h4>
              <div className="receipt-template-mode">
                <label className="receipt-radio-option">
                  <input
                    type="radio"
                    name="template-mode-report"
                    checked={settings.layout_type !== 'CUSTOM'}
                    onChange={() => setSettings(prev => ({ ...prev, layout_type: 'LAYOUT_A' }))}
                  />
                  <span>Default Template</span>
                </label>
                <label className="receipt-radio-option">
                  <input
                    type="radio"
                    name="template-mode-report"
                    checked={settings.layout_type === 'CUSTOM'}
                    onChange={() => {
                      setSettings(prev => ({
                        ...prev,
                        layout_type: 'CUSTOM',
                        custom_template_html: prev.custom_template_html || DEFAULT_REPORT_SETTINGS.custom_template_html,
                        custom_template_css: prev.custom_template_css || DEFAULT_REPORT_SETTINGS.custom_template_css,
                      }))
                    }}
                  />
                  <span>Custom Template</span>
                </label>
              </div>

              {settings.layout_type !== 'CUSTOM' ? (
                <div className="receipt-layout-grid">
                  {LAYOUT_OPTIONS.map((layout) => (
                    <button
                      key={layout.id}
                      type="button"
                      className={`receipt-layout-card ${settings.layout_type === layout.id ? 'is-selected' : ''}`}
                      onClick={() => handleLayoutSelect(layout.id)}
                    >
                      <strong>{layout.label}</strong>
                      <span>{layout.description}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="receipt-setting-template-panel in-form">
                  <div className="receipt-template-section">
                    <div className="receipt-template-section-header">
                      <span>HTML Template</span>
                      <div className="receipt-template-actions">
                        <button type="button" className="receipt-template-btn" onClick={handleApplyTemplate}>
                          Apply
                        </button>
                        <button
                          type="button"
                          className="receipt-template-btn"
                          onClick={() => {
                            const currentHtml = showTemplateCode
                              ? templateCodeHtml
                              : (wysiwygEditorRef.current?.innerHTML || settings.custom_template_html || '')
                            setTemplateCodeHtml(currentHtml)
                            if (showTemplateCode && wysiwygEditorRef.current) {
                              wysiwygEditorRef.current.innerHTML = currentHtml
                            }
                            setShowTemplateCode(prev => !prev)
                          }}
                        >
                          {showTemplateCode ? 'Hide Code' : 'Code'}
                        </button>
                        <button type="button" className="receipt-template-btn" onClick={handleResetTemplate}>
                          Reset
                        </button>
                      </div>
                    </div>
                    {!showTemplateCode ? (
                      <>
                        <div className="receipt-wysiwyg-toolbar">
                          <button type="button" className="receipt-wysiwyg-btn" title="Bold" onMouseDown={(e) => { e.preventDefault(); if (wysiwygEditorRef.current) wysiwygEditorRef.current.focus(); document.execCommand('bold', false, null) }}>
                            <strong>B</strong>
                          </button>
                          <button type="button" className="receipt-wysiwyg-btn" title="Italic" onMouseDown={(e) => { e.preventDefault(); if (wysiwygEditorRef.current) wysiwygEditorRef.current.focus(); document.execCommand('italic', false, null) }}>
                            <em>I</em>
                          </button>
                          <button type="button" className="receipt-wysiwyg-btn" title="Underline" onMouseDown={(e) => { e.preventDefault(); if (wysiwygEditorRef.current) wysiwygEditorRef.current.focus(); document.execCommand('underline', false, null) }}>
                            <u>U</u>
                          </button>
                          <span className="receipt-wysiwyg-sep" />
                          <button type="button" className="receipt-wysiwyg-btn" title="Font Size Small" onMouseDown={(e) => { e.preventDefault(); if (wysiwygEditorRef.current) wysiwygEditorRef.current.focus(); document.execCommand('fontSize', false, '2') }} style={{ fontSize: '10px' }}>A</button>
                          <button type="button" className="receipt-wysiwyg-btn" title="Font Size Normal" onMouseDown={(e) => { e.preventDefault(); if (wysiwygEditorRef.current) wysiwygEditorRef.current.focus(); document.execCommand('fontSize', false, '3') }} style={{ fontSize: '13px' }}>A</button>
                        </div>
                        <div
                          ref={wysiwygEditorRef}
                          className="receipt-wysiwyg-editor"
                          contentEditable
                          suppressContentEditableWarning
                          dangerouslySetInnerHTML={{ __html: settings.custom_template_html }}
                        />
                      </>
                    ) : (
                      <div className="receipt-setting-code-panel">
                        <textarea
                          ref={codeEditorRef}
                          className="receipt-setting-code-editor"
                          value={templateCodeHtml || settings.custom_template_html}
                          onChange={(e) => setTemplateCodeHtml(e.target.value)}
                          spellCheck={false}
                        />
                      </div>
                    )}
                  </div>

                  <div className="receipt-template-tokens">
                    <div className="receipt-template-tokens-title">Data - klik untuk menyisipkan:</div>
                    <div className="receipt-template-tokens-list">
                      {REPORT_TEMPLATE_TOKENS.map((token) => (
                        <button
                          key={token}
                          type="button"
                          className="receipt-template-token"
                          onClick={() => handleTokenClick(token)}
                        >
                          {token}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="receipt-setting-section">
              <h4>Font Cetak</h4>
              <select
                className="receipt-select"
                value={settings.report_font || 'Arial'}
                onChange={(e) => handleInputChange('report_font', e.target.value)}
              >
                {REPORT_FONTS.map((font) => (
                  <option key={font.value} value={font.value}>{font.label}</option>
                ))}
              </select>
            </div>

            <div className="receipt-setting-section">
              <h4>Pengaturan Teks</h4>
              <div className="receipt-setting-field-inline">
                <label htmlFor="report-header-text">Judul Laporan</label>
                <input
                  type="text"
                  id="report-header-text"
                  className="receipt-text-input"
                  value={settings.header_text}
                  onChange={(e) => handleInputChange('header_text', e.target.value)}
                  placeholder="Contoh: LAPORAN DATA MASTER"
                />
              </div>
              <div className="receipt-footer-text-wrap">
                <label htmlFor="report-footer-text">Text footer</label>
                <textarea
                  id="report-footer-text"
                  className="receipt-footer-text-input"
                  value={settings.footer_text}
                  onChange={(e) => handleInputChange('footer_text', e.target.value)}
                  rows={3}
                  placeholder="Teks yang muncul di bawah laporan..."
                />
              </div>
            </div>
          </div>

          <div className="receipt-setting-preview-wrap">
            <div className="receipt-setting-preview-panel">
              <div className="receipt-preview-iframe-container" style={{ background: '#fff', padding: '20px', border: '1px solid #ddd', height: '500px', overflow: 'auto' }}>
                <div style={{ transform: 'scale(0.8)', transformOrigin: 'top left', width: '125%' }} dangerouslySetInnerHTML={{ __html: generatePreviewHtml().replace(/<style>.*<\/style>/, '<style>' + generatePreviewHtml().split('<style>')[1]?.split('</style>')[0] + '</style>') }} />
              </div>
            </div>
          </div>
        </div>

        <div className="receipt-setting-footer">
          <button className="payment-btn-cancel" onClick={handleReset}>Reset Default</button>
          <button className="payment-btn-confirm" onClick={handleSave} disabled={isSaving}>Simpan</button>
        </div>
      </div>
    </div>
  )
}
