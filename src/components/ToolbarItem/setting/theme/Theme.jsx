import { useState, useEffect } from 'react'
import './Theme.css'

const COLORS = [
  '#2563eb', // Blue
  '#475569', // Slate
  '#0d9488', // Teal
  '#0f172a', // Navy
  '#9333ea', // Purple
  '#059669', // Green
  '#e11d48', // Red
  '#d97706', // Orange
]

export function Theme({ onExit }) {
  const [wallpaper, setWallpaper] = useState(localStorage.getItem('theme-wallpaper') || null)
  const [frameColor, setFrameColor] = useState(localStorage.getItem('theme-frame-color') || '#2563eb')
  const [savedWallpaper, setSavedWallpaper] = useState(wallpaper)
  const [savedFrameColor, setSavedFrameColor] = useState(frameColor)

  useEffect(() => {
    // Apply saved settings on load
    const savedW = localStorage.getItem('theme-wallpaper')
    const savedC = localStorage.getItem('theme-frame-color')
    if (savedW) document.documentElement.style.setProperty('--app-wallpaper', `url(${savedW})`)
    if (savedC) document.documentElement.style.setProperty('--frame-color', savedC)
  }, [])

  const handleSave = () => {
    setSavedWallpaper(wallpaper)
    setSavedFrameColor(frameColor)
    localStorage.setItem('theme-wallpaper', wallpaper || '')
    localStorage.setItem('theme-frame-color', frameColor)
    document.documentElement.style.setProperty('--frame-color', frameColor)
    if (wallpaper) {
      document.documentElement.style.setProperty('--app-wallpaper', `url(${wallpaper})`)
    } else {
      document.documentElement.style.setProperty('--app-wallpaper', 'none')
    }
  }

  const handleCancel = () => {
    // Revert to saved state
    setWallpaper(savedWallpaper)
    setFrameColor(savedFrameColor)
    document.documentElement.style.setProperty('--frame-color', savedFrameColor)
    if (savedWallpaper) {
      document.documentElement.style.setProperty('--app-wallpaper', `url(${savedWallpaper})`)
    } else {
      document.documentElement.style.setProperty('--app-wallpaper', 'none')
    }
    if (onExit) onExit()
  }

  const handleWallpaperChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setWallpaper(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveWallpaper = () => {
    setWallpaper(null)
  }

  return (
    <div className="theme-settings">
      <div className="theme-grid">
        {/* Left Column */}
        <div className="theme-col">
          {/* Wallpaper Section */}
          <div className="theme-section">
            <div className="theme-header">
              <span className="material-icons">image</span>
              <h2>Wallpaper</h2>
            </div>
            <div className="theme-divider" />
            <div className="wallpaper-actions">
              <div className="wallpaper-preview">
                {wallpaper ? (
                  <img src={wallpaper} alt="Wallpaper Preview" />
                ) : (
                  <div className="no-wallpaper">No Wallpaper</div>
                )}
                <div className="wallpaper-filename">wallpaper.jpg</div>
              </div>
              <div className="wallpaper-buttons">
                <label className="theme-btn browse-btn">
                  <span className="material-icons">upload</span>
                  Upload
                  <input type="file" onChange={handleWallpaperChange} style={{ display: 'none' }} accept="image/*" />
                </label>
                <button className="theme-btn browse-btn">
                  <span className="material-icons">folder_open</span>
                  Browse
                </button>
                <button className="remove-link" onClick={handleRemoveWallpaper}>Remove Wallpaper</button>
              </div>
            </div>
          </div>

          {/* Frame Color Section */}
          <div className="theme-section">
            <div className="theme-header">
              <span className="material-icons">palette</span>
              <h2>Window Frame Color</h2>
            </div>
            <div className="theme-divider" />
            <div className="color-grid">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={`color-swatch ${frameColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFrameColor(color)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="theme-col">
          <div className="theme-section">
            <div className="theme-header">
              <span className="material-icons">desktop_windows</span>
              <h2>Real-time Preview</h2>
            </div>
            <div className="theme-divider" />
            <div className="preview-container">
              <div className="mockup-frame" style={{ backgroundColor: frameColor }}>
                <div className="mockup-wallpaper" style={{ backgroundImage: wallpaper ? `url(${wallpaper})` : 'none' }}>
                  <div className="mockup-window">
                    <div className="mockup-titlebar">
                      <div className="mockup-dot" />
                      <span>POS Mockup</span>
                      <div className="mockup-controls">
                        <div className="mockup-ctrl" />
                        <div className="mockup-ctrl red" />
                      </div>
                    </div>
                    <div className="mockup-body">
                      <div className="mockup-menu">
                        <div className="mockup-item" />
                        <div className="mockup-item" />
                        <div className="mockup-item" />
                        <div className="mockup-item" />
                      </div>
                      <div className="mockup-content">
                        <span className="material-icons large">calculate</span>
                        <div className="mockup-text">POS SYSTEM</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="preview-hint italic">
              Changes will be visible across all application windows instantly.
            </p>
          </div>
        </div>
      </div>
      <div className="theme-footer">
        <button className="theme-btn-cancel" onClick={handleCancel}>Cancel</button>
        <button className="theme-btn-save" onClick={handleSave}>Save</button>
      </div>
    </div>
  )
}
