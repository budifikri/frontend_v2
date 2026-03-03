export function extractFirstColor(gradient) {
  const match = gradient?.match(/#([0-9a-fA-F]{6})/)
  return match ? match[0] : null
}

export function extractSecondColor(gradient) {
  const matches = gradient?.match(/#([0-9a-fA-F]{6})/g)
  return matches?.length > 1 ? matches[1] : null
}

export function applyTitlebarColors(gradient) {
  if (typeof document === 'undefined' || !gradient) return

  const firstColor = extractFirstColor(gradient) || ''
  const secondColor = extractSecondColor(gradient) || ''

  document.documentElement.style.setProperty('--firstcolor-bg', firstColor)
  document.documentElement.style.setProperty('--secondcolor-bg', secondColor)
  document.documentElement.style.setProperty('--titlebar-bg', gradient)
}

export function applyWallpaper(wallpaper) {
  if (typeof document === 'undefined') return

  if (wallpaper) {
    document.documentElement.style.setProperty('--app-wallpaper', `url(${wallpaper})`)
    document.body.classList.add('has-wallpaper')
    return
  }

  document.documentElement.style.setProperty('--app-wallpaper', 'none')
  document.body.classList.remove('has-wallpaper')
}
