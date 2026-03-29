const RECEIPT_SETTINGS_KEY = 'pos_receipt_settings'

export const DEFAULT_RECEIPT_SETTINGS = {
  paper_size: '58mm',
  layout_type: 'layout_a',
  show_logo: true,
  show_footer: true,
}

export function normalizeReceiptSettings(value) {
  const source = value && typeof value === 'object' ? value : {}
  const paperSize = source.paper_size === '80mm' ? '80mm' : '58mm'
  const layoutType = ['layout_a', 'layout_b', 'layout_c'].includes(source.layout_type)
    ? source.layout_type
    : 'layout_a'

  return {
    ...DEFAULT_RECEIPT_SETTINGS,
    ...source,
    paper_size: paperSize,
    layout_type: layoutType,
    show_logo: typeof source.show_logo === 'boolean' ? source.show_logo : DEFAULT_RECEIPT_SETTINGS.show_logo,
    show_footer: typeof source.show_footer === 'boolean' ? source.show_footer : DEFAULT_RECEIPT_SETTINGS.show_footer,
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
