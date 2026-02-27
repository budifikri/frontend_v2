import { menuItems } from '../../data'

export function DashboardMenuBar() {
  return (
    <div className="dashboard-menu-bar">
      {menuItems.map((item) => (
        <button
          key={item.key}
          type="button"
          className={item.active ? 'active' : ''}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
