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

  const canvases = document.querySelectorAll('.dashboard-canvas')

  if (wallpaper) {
    const wallpaperUrl = `url("${wallpaper}")`
    document.documentElement.style.setProperty('--app-wallpaper', wallpaperUrl)
    document.body.classList.add('has-wallpaper')

    // Directly apply to dashboard canvas elements for immediate effect
    canvases.forEach(el => {
      el.style.backgroundImage = `${wallpaperUrl}, radial-gradient(ellipse at center, rgba(255, 255, 255, 0.08) 0%, transparent 70%)`
      el.style.backgroundColor = 'transparent'
    })
    return
  }

  document.documentElement.style.setProperty('--app-wallpaper', 'none')
  document.body.classList.remove('has-wallpaper')

  // Reset dashboard canvas elements
  canvases.forEach(el => {
    el.style.backgroundImage = ''
    el.style.backgroundColor = ''
  })
}
