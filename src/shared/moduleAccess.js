export function matchesItemFilter(filter, companyConfig, userRole) {
  if (!filter) return true
  if (!companyConfig?.businessType) return true
  if (!Array.isArray(companyConfig?.modules) || companyConfig.modules.length === 0) return true

  const businessTypeMatch =
    !Array.isArray(filter.businessType) ||
    filter.businessType.length === 0 ||
    filter.businessType.includes(companyConfig.businessType)

  const moduleCodeMatch =
    !Array.isArray(filter.moduleCodes) ||
    filter.moduleCodes.length === 0 ||
    filter.moduleCodes.some((code) => companyConfig.modules.includes(code))

  const roleMatch =
    !Array.isArray(filter.roles) ||
    filter.roles.length === 0 ||
    filter.roles.includes(userRole)

  return businessTypeMatch && moduleCodeMatch && roleMatch
}

function normalizeDividers(items) {
  return items.filter((item, index) => {
    if (!item.divider) return true
    const prev = items[index - 1]
    const next = items[index + 1]
    return prev && next && !prev.divider && !next.divider
  })
}

export function getVisibleToolbarItems(items, companyConfig, userRole) {
  const visible = []

  for (const item of items) {
    if (item.divider) {
      visible.push(item)
      continue
    }

    if (item.isPopup) {
      const subItems = (item.subItems || []).filter((subItem) => matchesItemFilter(subItem.filter, companyConfig, userRole))
      if (subItems.length > 0) {
        visible.push({ ...item, subItems })
      }
      continue
    }

    if (matchesItemFilter(item.filter, companyConfig, userRole)) {
      visible.push(item)
    }
  }

  return normalizeDividers(visible)
}

export function canAccessTool(toolbarMap, toolKey, companyConfig, userRole) {
  for (const items of Object.values(toolbarMap)) {
    for (const item of items) {
      if (item.divider) continue
      if (item.isPopup) {
        const matchedSubItem = (item.subItems || []).find((subItem) => subItem.key === toolKey)
        if (matchedSubItem) return matchesItemFilter(matchedSubItem.filter, companyConfig, userRole)
        continue
      }
      if (item.key === toolKey) return matchesItemFilter(item.filter, companyConfig, userRole)
    }
  }

  return true
}
