const RECEIPT_SETTINGS_KEY = 'pos_receipt_settings'

export const RECEIPT_FONTS = [
  { value: 'JetBrainsMono-Regular', label: 'JetBrains Mono', filename: 'JetBrainsMono-Regular-Dh36KTnx.ttf', googleFont: 'JetBrains+Mono:wght@400;700' },
  { value: 'JetBrainsMonoNL-Regular', label: 'JetBrains Mono NL', filename: 'JetBrainsMonoNL-Regular.ttf', googleFont: 'JetBrains+Mono:wght@400;700' },
  { value: 'Arial', label: 'Arial (Default)', filename: '', googleFont: '' },
]

export const BAUD_RATE_OPTIONS = [
  { value: 9600, label: '9600' },
  { value: 19200, label: '19200' },
  { value: 38400, label: '38400' },
  { value: 57600, label: '57600' },
]

export const DOT_MATRIX_CONNECTION_OPTIONS = [
  { value: 'serial', label: 'Serial Port' },
  { value: 'windows_printer', label: 'Windows Printer' },
]

export const DEFAULT_RECEIPT_SETTINGS = {
  paper_size: '58mm',
  chars_per_line: 38,
  layout_type: 'layout_a',
  template_mode: 'default',
  custom_template_html: '',
  custom_template_css: '',
  custom_template_text_dot_matrix: '',
  printer_type: 'thermal',
  receipt_font: 'JetBrainsMono-Regular',
  show_logo: true,
  show_footer: true,
  footer_text: '',
  calibration_mode: false,
  company_address: '',
  company_phone: '',
  auto_print_after_payment: true,
  debug_raw_text_printer: false,
  show_ppn: true,
  ppn_percentage: 11,
  dot_matrix_connection_type: 'serial',
  com_port: '',
  baud_rate: 9600,
  windows_printer_name: '',
}

export function normalizeReceiptSettings(value) {
  const source = value && typeof value === 'object' ? value : {}
  const paperSize = source.paper_size === '80mm' ? '80mm' : '58mm'
  const charsPerLine = typeof source.chars_per_line === 'number' && Number.isFinite(source.chars_per_line)
    ? Math.max(20, Math.min(80, Math.round(source.chars_per_line)))
    : DEFAULT_RECEIPT_SETTINGS.chars_per_line
  const layoutType = ['layout_a', 'layout_b', 'layout_c'].includes(source.layout_type)
    ? source.layout_type
    : 'layout_a'
  const templateMode = source.template_mode === 'custom' ? 'custom' : 'default'
  const printerType = ['thermal', 'dot_matrix'].includes(source.printer_type)
    ? source.printer_type
    : 'thermal'
  const dotMatrixConnectionType = DOT_MATRIX_CONNECTION_OPTIONS.some(option => option.value === source.dot_matrix_connection_type)
    ? source.dot_matrix_connection_type
    : DEFAULT_RECEIPT_SETTINGS.dot_matrix_connection_type
  const receiptFont = RECEIPT_FONTS.some(f => f.value === source.receipt_font)
    ? source.receipt_font
    : 'JetBrainsMono-Regular'

  return {
    ...DEFAULT_RECEIPT_SETTINGS,
    ...source,
    paper_size: paperSize,
    chars_per_line: charsPerLine,
    layout_type: layoutType,
    template_mode: templateMode,
    custom_template_html: typeof source.custom_template_html === 'string' ? source.custom_template_html : DEFAULT_RECEIPT_SETTINGS.custom_template_html,
    custom_template_css: typeof source.custom_template_css === 'string' ? source.custom_template_css : DEFAULT_RECEIPT_SETTINGS.custom_template_css,
    custom_template_text_dot_matrix: typeof source.custom_template_text_dot_matrix === 'string'
      ? source.custom_template_text_dot_matrix
      : DEFAULT_RECEIPT_SETTINGS.custom_template_text_dot_matrix,
    printer_type: printerType,
    dot_matrix_connection_type: dotMatrixConnectionType,
    receipt_font: receiptFont,
    show_logo: typeof source.show_logo === 'boolean' ? source.show_logo : DEFAULT_RECEIPT_SETTINGS.show_logo,
    show_footer: typeof source.show_footer === 'boolean' ? source.show_footer : DEFAULT_RECEIPT_SETTINGS.show_footer,
    footer_text: typeof source.footer_text === 'string' ? source.footer_text : DEFAULT_RECEIPT_SETTINGS.footer_text,
    calibration_mode: typeof source.calibration_mode === 'boolean' ? source.calibration_mode : DEFAULT_RECEIPT_SETTINGS.calibration_mode,
    company_address: typeof source.company_address === 'string' ? source.company_address : DEFAULT_RECEIPT_SETTINGS.company_address,
    company_phone: typeof source.company_phone === 'string' ? source.company_phone : DEFAULT_RECEIPT_SETTINGS.company_phone,
    auto_print_after_payment: typeof source.auto_print_after_payment === 'boolean'
      ? source.auto_print_after_payment
      : DEFAULT_RECEIPT_SETTINGS.auto_print_after_payment,
    debug_raw_text_printer: typeof source.debug_raw_text_printer === 'boolean'
      ? source.debug_raw_text_printer
      : DEFAULT_RECEIPT_SETTINGS.debug_raw_text_printer,
    show_ppn: typeof source.show_ppn === 'boolean' ? source.show_ppn : DEFAULT_RECEIPT_SETTINGS.show_ppn,
    ppn_percentage: typeof source.ppn_percentage === 'number' && source.ppn_percentage > 0 ? source.ppn_percentage : DEFAULT_RECEIPT_SETTINGS.ppn_percentage,
    com_port: typeof source.com_port === 'string' ? source.com_port : DEFAULT_RECEIPT_SETTINGS.com_port,
    baud_rate: typeof source.baud_rate === 'number' && BAUD_RATE_OPTIONS.some(b => b.value === source.baud_rate)
      ? source.baud_rate
      : DEFAULT_RECEIPT_SETTINGS.baud_rate,
    windows_printer_name: typeof source.windows_printer_name === 'string' ? source.windows_printer_name : DEFAULT_RECEIPT_SETTINGS.windows_printer_name,
  }
}

export function loadReceiptSettings() {
  try {
    const raw = localStorage.getItem(RECEIPT_SETTINGS_KEY)
    if (!raw) return DEFAULT_RECEIPT_SETTINGS
    return normalizeReceiptSettings(JSON.parse(raw))
  } catch (err) {
    console.error('Failed to load receipt settings:', err)
    return DEFAULT_RECEIPT_SETTINGS
  }
}

export function saveReceiptSettings(settings) {
  const normalized = normalizeReceiptSettings(settings)
  localStorage.setItem(RECEIPT_SETTINGS_KEY, JSON.stringify(normalized))
  return normalized
}

export function resetReceiptSettings() {
  localStorage.removeItem(RECEIPT_SETTINGS_KEY)
  return DEFAULT_RECEIPT_SETTINGS
}
