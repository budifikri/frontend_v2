import { menuItems } from '../../data'

export function DashboardMenuBar({ activeMenu, onMenuChange }) {
  return (
    <div className="dashboard-menu-bar">
      {menuItems.map((item) => (
        <button
          key={item.key}
          type="button"
          className={activeMenu === item.key ? 'active' : ''}
          onClick={() => onMenuChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
