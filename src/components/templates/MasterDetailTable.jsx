import { MasterDetailItem } from './MasterDetailItem'

export function MasterDetailTable({
  items,
  columns,
  selectedIds,
  setSelectedIds,
  editingId,
  setEditingId,
  updateItem,
  itemConfig,
}) {
  const handleSelect = (itemId) => {
    setSelectedIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === items.length && items.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(items.map((i) => i.id))
    }
  }

  return (
    <div className="master-table-wrapper">
      <div className="master-table-container">
        <table className="master-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width }}>
                  {col.type === 'checkbox' ? (
                    <input
                      type="checkbox"
                      checked={selectedIds.length === items.length && items.length > 0}
                      onChange={handleSelectAll}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <MasterDetailItem
                key={item.id}
                item={item}
                columns={columns}
                isSelected={selectedIds.includes(item.id)}
                isEditing={editingId === item.id}
                onSelect={() => handleSelect(item.id)}
                onEdit={() => setEditingId && setEditingId(item.id)}
                onUpdate={(updates) => updateItem && updateItem(item.id, updates)}
                itemConfig={itemConfig}
              />
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center">
                  No items added yet. Click "Add Item" to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
