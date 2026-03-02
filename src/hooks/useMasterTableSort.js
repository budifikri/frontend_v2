import { useCallback, useMemo, useState } from 'react'

function getComparableValue(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 1 : 0
  return String(value).toLowerCase()
}

export function useMasterTableSort(data, options = {}) {
  const {
    initialKey,
    initialDirection = 'asc',
    valueGetters = {},
  } = options

  const [sortConfig, setSortConfig] = useState({ key: initialKey, direction: initialDirection })

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        }
      }

      return {
        key,
        direction: 'asc',
      }
    })
  }, [])

  const sortedData = useMemo(() => {
    if (!Array.isArray(data)) return []
    if (!sortConfig.key) return data

    const getter = valueGetters[sortConfig.key] || ((row) => row?.[sortConfig.key])
    const direction = sortConfig.direction === 'desc' ? -1 : 1

    return [...data].sort((a, b) => {
      const aVal = getComparableValue(getter(a))
      const bVal = getComparableValue(getter(b))
      if (aVal === bVal) return 0
      return aVal > bVal ? direction : -direction
    })
  }, [data, sortConfig, valueGetters])

  return {
    sortConfig,
    sortedData,
    handleSort,
  }
}
