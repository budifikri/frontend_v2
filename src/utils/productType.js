export function normalizeProductType(value) {
  if (value === 'service' || value === 'consumable') return value
  return 'stockable'
}

export function formatProductTypeLabel(value) {
  const normalized = normalizeProductType(value)
  if (normalized === 'service') return 'Service'
  if (normalized === 'consumable') return 'Consumable'
  return 'Stockable'
}
