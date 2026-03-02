export function MasterTableHeader({ columns, sortConfig, onSort }) {
  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) return 'unfold_more'
    return sortConfig.direction === 'asc' ? 'expand_less' : 'expand_more'
  }

  return (
    <thead>
      <tr>
        {columns.map((column) => {
          const sortable = column.sortable !== false
          return (
            <th
              key={column.key}
              className={`master-th-header${sortable ? ' master-th-sortable' : ''}`}
              onClick={sortable ? () => onSort(column.key) : undefined}
            >
              <div className="master-th-content">
                {column.label}
                {sortable && (
                  <span className={`material-icons-round ${sortConfig?.key === column.key ? 'text-primary' : ''}`}>
                    {getSortIcon(column.key)}
                  </span>
                )}
              </div>
            </th>
          )
        })}
      </tr>
    </thead>
  )
}
