import { useEffect, useCallback } from 'react'

export function useMasterTableKeyboardNav({
  data,
  selectedId,
  setSelectedId,
  handleEdit,
  tableRef,
  isModalOpen = false,
}) {
  const selectRow = useCallback((index) => {
    if (index >= 0 && index < data.length) {
      const row = data[index]
      if (row?.id) {
        setSelectedId(row.id)
      }
    }
  }, [data, setSelectedId])

  const getCurrentIndex = useCallback(() => {
    if (!selectedId || !data.length) return -1
    return data.findIndex((row) => row.id === selectedId)
  }, [selectedId, data])

  const handleKeyDown = useCallback((e) => {
    if (isModalOpen) return

    const currentIndex = getCurrentIndex()

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (currentIndex === -1) {
          selectRow(0)
        } else if (currentIndex < data.length - 1) {
          selectRow(currentIndex + 1)
        }
        break

      case 'ArrowUp':
        e.preventDefault()
        if (currentIndex === -1) {
          selectRow(data.length - 1)
        } else if (currentIndex > 0) {
          selectRow(currentIndex - 1)
        }
        break

      case 'Home':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          selectRow(0)
        }
        break

      case 'End':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          selectRow(data.length - 1)
        }
        break

      case 'Enter':
        e.preventDefault()
        if (selectedId && data.length > 0) {
          handleEdit(data[getCurrentIndex()] || data[0])
        }
        break

      default:
        break
    }
  }, [data, selectedId, getCurrentIndex, selectRow, handleEdit, isModalOpen])

  useEffect(() => {
    const element = tableRef?.current
    if (element) {
      element.addEventListener('keydown', handleKeyDown)
      return () => {
        element.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [tableRef, handleKeyDown])

  useEffect(() => {
    const element = tableRef?.current
    if (element && data.length > 0 && !selectedId) {
      selectRow(0)
      element.focus()
    }
  }, [data.length, tableRef, selectRow, selectedId])

  return {
    handleKeyDown,
    selectRow,
    getCurrentIndex,
  }
}
