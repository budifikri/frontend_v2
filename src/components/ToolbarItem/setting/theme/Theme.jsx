import { useState, useEffect } from 'react'
import './Theme.css'

const COLORS = [
  { name: 'Biru', value: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)' },
  { name: 'Ungu', value: 'linear-gradient(180deg, #c084fc 0%, #7c3aed 100%)' },
  { name: 'Merah', value: 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)' },
  { name: 'Orange', value: 'linear-gradient(180deg, #fb923c 0%, #ea580c 100%)' },
]

// const COLORS = [
//   { name: 'Biru', value: 'linear-gradient(180deg, #93c5fd 0%, #2563eb 100%)' },
//   { name: 'Ungu', value: 'linear-gradient(180deg, #d8b4fe 0%, #7c3aed 100%)' },
//   { name: 'Merah', value: 'linear-gradient(180deg, #fca5a5 0%, #dc2626 100%)' },
//   { name: 'Orange', value: 'linear-gradient(180deg, #fdba74 0%, #ea580c 100%)' },
// ]

const DEFAULT_TITLE_COLOR = import.meta.env.VITE_DEFAULT_TITLEBAR_COLOR || 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)'

export function Theme({ onExit }) {
  const [wallpaper, setWallpaper] = useState(localStorage.getItem('theme-wallpaper') || null)
  const [titleColor, setTitleColor] = useState(localStorage.getItem('theme-title-color') || DEFAULT_TITLE_COLOR)
  const [savedWallpaper, setSavedWallpaper] = useState(wallpaper)
  const [savedTitleColor, setSavedTitleColor] = useState(titleColor)
  const [showBrowse, setShowBrowse] = useState(false)

  const getWallpaperHistory = () => {
    const history = localStorage.getItem('wallpaper-history')
    return history ? JSON.parse(history) : []
  }

  useEffect(() => {
    // Apply saved settings on load (localStorage > .env)
    const savedW = localStorage.getItem('theme-wallpaper') || import.meta.env.VITE_DEFAULT_WALLPAPER
    const savedC = localStorage.getItem('theme-title-color') || import.meta.env.VITE_DEFAULT_TITLEBAR_COLOR
    
    if (savedW) {
      document.documentElement.style.setProperty('--app-wallpaper', `url(${savedW})`)
      document.body.classList.add('has-wallpaper')
    }
    if (savedC) document.documentElement.style.setProperty('--titlebar-bg', savedC)
  }, [])

  const handleSave = () => {
    setSavedWallpaper(wallpaper)
    setSavedTitleColor(titleColor)
    localStorage.setItem('theme-wallpaper', wallpaper || '')
    localStorage.setItem('theme-title-color', titleColor)
    
    // Save to wallpaper history if new wallpaper
    if (wallpaper) {
      const history = getWallpaperHistory()
      if (!history.includes(wallpaper)) {
        history.unshift(wallpaper)
        localStorage.setItem('wallpaper-history', JSON.stringify(history.slice(0, 10))) // Keep last 10
      }
    }

function extractFirstColor(gradient) {
  const match = gradient.match(/#([0-9a-fA-F]{6})/);
  return match ? match[0] : null;
}

const firstColor = extractFirstColor(titleColor);

document.documentElement.style.setProperty(
  '--firstcolor-bg',
  firstColor
   );


   function extractSecondColor(gradient) {
  const matches = gradient.match(/#([0-9a-fA-F]{6})/g);
  return matches && matches.length > 1 ? matches[1] : null;
}

const secondColor = extractSecondColor(titleColor);

document.documentElement.style.setProperty(
  '--secondcolor-bg',
  secondColor
);


    
    document.documentElement.style.setProperty('--titlebar-bg', titleColor)
    if (wallpaper) {
      document.documentElement.style.setProperty('--app-wallpaper', `url(${wallpaper})`)
      document.body.classList.add('has-wallpaper')
    } else {
      document.documentElement.style.setProperty('--app-wallpaper', 'none')
      document.body.classList.remove('has-wallpaper')
    }

    if (onExit) onExit()
  }

  const handleCancel = () => {
    // Revert to saved state
    setWallpaper(savedWallpaper)
    setTitleColor(savedTitleColor)
    document.documentElement.style.setProperty('--titlebar-bg', savedTitleColor)
    if (savedWallpaper) {
      document.documentElement.style.setProperty('--app-wallpaper', `url(${savedWallpaper})`)
      document.body.classList.add('has-wallpaper')
    } else {
      document.documentElement.style.setProperty('--app-wallpaper', 'none')
      document.body.classList.remove('has-wallpaper')
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
                <button className="theme-btn browse-btn" onClick={() => setShowBrowse(true)}>
                  <span className="material-icons">folder_open</span>
                  Browse
                </button>
                <button className="remove-link" onClick={handleRemoveWallpaper}>Remove Wallpaper</button>
              </div>
            </div>
          </div>

          {/* Titlebar Color Section */}
          <div className="theme-section">
            <div className="theme-header">
              <span className="material-icons">palette</span>
              <h2>Window Titlebar Color</h2>
            </div>
            <div className="theme-divider" />
            <div className="color-grid">
              {COLORS.map((color) => (
                <button
                  key={color.name}
                  className={`color-swatch ${titleColor === color.value ? 'selected' : ''}`}
                  style={{ background: color.value }}
                  onClick={() => setTitleColor(color.value)}
                  title={color.name}
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
              {/* Window */}
              <div className="mockup-window">
                {/* Titlebar */}
                <div className="mockup-titlebar" style={{ background: titleColor }}>
                  <div className="mockup-title-group">
                    <div className="mockup-dot" />
                    <span>POS Admin Menu Dashboard</span>
                  </div>
                  <div className="mockup-controls">
                    <div className="mockup-ctrl">-</div>
                    <div className="mockup-ctrl">+</div>
                    <div className="mockup-ctrl red">x</div>
                  </div>
                </div>
                {/* Menu Bar */}
                <div className="mockup-menubar">
                  <div className="mockup-menu-item active">Master</div>
                  <div className="mockup-menu-item">Transaksi</div>
                  <div className="mockup-menu-item">Laporan</div>
                  <div className="mockup-menu-item">Setting</div>
                  <div className="mockup-menu-item">Help</div>
                </div>
                {/* Toolbar */}
                <div className="mockup-toolbar">
                  <div className="mockup-toolbar-item logout">L</div>
                  <div className="mockup-toolbar-divider" />
                  <div className="mockup-toolbar-item">Warehouse</div>
                  <div className="mockup-toolbar-item">Satuan</div>
                  <div className="mockup-toolbar-item">Wilayah</div>
                  <div className="mockup-toolbar-item">Dept.</div>
                </div>
                {/* Canvas Area */}
                <div className="mockup-canvas">
                  {wallpaper ? (
                    <img src={wallpaper} alt="Wallpaper" className="mockup-wallpaper-img" />
                  ) : (
                    <div className="mockup-cash-register">
                      <div className="mockup-display" />
                      <div className="mockup-keys" />
                      <div className="mockup-base" />
                    </div>
                  )}
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

      {/* Browse Popup */}
      {showBrowse && (
        <div className="browse-popup-overlay" onClick={() => setShowBrowse(false)}>
          <div className="browse-popup-modal" onClick={e => e.stopPropagation()}>
            <div className="browse-popup-header">
              <h3>Select Wallpaper</h3>
              <button className="browse-popup-close" onClick={() => setShowBrowse(false)}>×</button>
            </div>
            <div className="browse-popup-content">
              {getWallpaperHistory().length === 0 ? (
                <p className="no-history">No wallpaper history. Upload a new wallpaper.</p>
              ) : (
                <div className="browse-grid">
                  {getWallpaperHistory().map((img, index) => (
                    <div 
                      key={index} 
                      className={`browse-item ${wallpaper === img ? 'selected' : ''}`}
                      onClick={() => { setWallpaper(img); setShowBrowse(false); }}
                    >
                      <img src={img} alt={`Wallpaper ${index + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
