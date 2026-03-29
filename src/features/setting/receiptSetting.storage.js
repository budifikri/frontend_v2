const RECEIPT_SETTINGS_KEY = 'pos_receipt_settings'

export const DEFAULT_RECEIPT_SETTINGS = {
  paper_size: '58mm',
  layout_type: 'layout_a',
  printer_type: 'thermal',
  show_logo: true,
  show_footer: true,
  footer_text: '',
  calibration_mode: false,
  company_address: '',
  company_phone: '',
  auto_print_after_payment: true,
}

export function normalizeReceiptSettings(value) {
  const source = value && typeof value === 'object' ? value : {}
  const paperSize = source.paper_size === '80mm' ? '80mm' : '58mm'
  const layoutType = ['layout_a', 'layout_b', 'layout_c'].includes(source.layout_type)
    ? source.layout_type
    : 'layout_a'
  const printerType = ['thermal', 'dot_matrix'].includes(source.printer_type)
    ? source.printer_type
    : 'thermal'

  return {
    ...DEFAULT_RECEIPT_SETTINGS,
    ...source,
    paper_size: paperSize,
    layout_type: layoutType,
    printer_type: printerType,
    show_logo: typeof source.show_logo === 'boolean' ? source.show_logo : DEFAULT_RECEIPT_SETTINGS.show_logo,
    show_footer: typeof source.show_footer === 'boolean' ? source.show_footer : DEFAULT_RECEIPT_SETTINGS.show_footer,
    footer_text: typeof source.footer_text === 'string' ? source.footer_text : DEFAULT_RECEIPT_SETTINGS.footer_text,
    calibration_mode: typeof source.calibration_mode === 'boolean' ? source.calibration_mode : DEFAULT_RECEIPT_SETTINGS.calibration_mode,
    company_address: typeof source.company_address === 'string' ? source.company_address : DEFAULT_RECEIPT_SETTINGS.company_address,
    company_phone: typeof source.company_phone === 'string' ? source.company_phone : DEFAULT_RECEIPT_SETTINGS.company_phone,
    auto_print_after_payment: typeof source.auto_print_after_payment === 'boolean'
      ? source.auto_print_after_payment
      : DEFAULT_RECEIPT_SETTINGS.auto_print_after_payment,
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
