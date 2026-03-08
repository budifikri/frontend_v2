export function MasterDetailItem({
  item,
  columns,
  isSelected,
  isEditing,
  onSelect,
  onEdit,
  onUpdate,
}) {
  const handleDoubleClick = () => {
    if (onEdit) onEdit()
  }

  const getCellClass = (col, item) => {
    if (col.className && typeof col.className === 'function') {
      return col.className(item)
    }
    return col.className || ''
  }

  const shouldShowField = (col, item) => {
    if (col.showIf && typeof col.showIf === 'function') {
      return col.showIf(item)
    }
    return true
  }

  return (
    <tr
      className={`master-row ${isSelected ? 'master-row-selected' : ''} ${isEditing ? 'item-row-editing' : ''}`}
      onDoubleClick={handleDoubleClick}
      onClick={onSelect}
    >
      {columns.map((col) => {
        if (!shouldShowField(col, item) && !isEditing) {
          return <td key={col.key}></td>
        }

        return (
          <td key={col.key} className={getCellClass(col, item)}>
            {col.type === 'checkbox' ? (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation()
                  onSelect()
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : col.editable && isEditing ? (
              col.type === 'select' ? (
                <select
                  value={item[col.key] || ''}
                  onChange={(e) => onUpdate({ [col.key]: e.target.value })}
                  className="master-form-input"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">Select...</option>
                  {col.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={col.type || 'text'}
                  value={item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : ''}
                  onChange={(e) => onUpdate({ [col.key]: col.type === 'number' ? Number(e.target.value) : e.target.value })}
                  className="master-form-input"
                  onClick={(e) => e.stopPropagation()}
                />
              )
            ) : col.display ? (
              col.display(item)
            ) : (
              item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '-'
            )}
          </td>
        )
      })}
    </tr>
  )
}
