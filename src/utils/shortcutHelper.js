import { toolbarItems } from '../data'

export function buildShortcutMap(menuKey) {
  const tools = toolbarItems[menuKey] || []
  const shortcutMap = new Map()

  tools.forEach((item) => {
    if (item?.divider || item?.backToLogin || !item?.mark || !item?.key) return

    const markKey = String(item.mark).toLowerCase()

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
