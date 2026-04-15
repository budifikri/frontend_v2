import { toolbarItems } from '../data'

export function buildShortcutMap(menuKey) {
  const tools = toolbarItems[menuKey] || []
  const shortcutMap = new Map()

  tools.forEach((item) => {
    if (item?.divider || item?.backToLogin || !item?.mark || !item?.key) return

    const markKey = String(item.mark).toLowerCase()

    if (item.isPopup && item.subItems?.length > 0) {
      if (shortcutMap.has(markKey)) {
        const existing = shortcutMap.get(markKey)
        console.warn(
          `Duplicate shortcut '${markKey.toUpperCase()}' in menu '${menuKey}': '${existing.key}' and '${item.key}'. Keeping first one.`
        )
        return
      }
      shortcutMap.set(markKey, {
        key: item.key,
        label: item.label || item.key,
        isPopup: true,
        subItems: item.subItems,
      })

      item.subItems.forEach((subItem) => {
        if (!subItem?.mark || !subItem?.key) return
        const subMarkKey = String(subItem.mark).toLowerCase()
        if (shortcutMap.has(subMarkKey)) {
          const existing = shortcutMap.get(subMarkKey)
          console.warn(
            `Duplicate shortcut '${subMarkKey.toUpperCase()}' in menu '${menuKey}' from subItem: '${existing.key}' and '${subItem.key}'. Keeping first one.`
          )
          return
        }
        shortcutMap.set(subMarkKey, {
          key: subItem.key,
          label: subItem.label || subItem.key,
        })
      })
      return
    }

    if (shortcutMap.has(markKey)) {
      const existing = shortcutMap.get(markKey)
      console.warn(
        `Duplicate shortcut '${markKey.toUpperCase()}' in menu '${menuKey}': '${existing.key}' and '${item.key}'. Keeping first one.`
      )
      return
    }

    shortcutMap.set(markKey, {
      key: item.key,
      label: item.label || item.key,
    })
  })

  return shortcutMap
}

export function resolveShortcutTool(menuKey, key) {
  if (!key) return null
  const shortcutMap = buildShortcutMap(menuKey)
  return shortcutMap.get(String(key).toLowerCase()) || null
}
