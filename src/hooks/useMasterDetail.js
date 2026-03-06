import { useCallback, useMemo, useState } from 'react'

/**
 * Base hook for Master-Detail form logic
 * 
 * @param {Object} config
 * @param {Object} config.initialData - Initial header + items data
 * @param {Function} config.onSubmit - Submit handler
 * @param {Object} config.headerConfig - Header field configuration
 * @param {Object} config.itemConfig - Item column configuration
 * @param {Function} config.validateItem - Custom item validator
 * @param {Function} config.calculateField - Auto-calculate field handler
 */
export function useMasterDetail({
  initialData,
  onSubmit,
  headerConfig,
  itemConfig,
  validateItem,
  calculateField,
}) {
  // Header state
  const [header, setHeader] = useState(initialData?.header || {})
  
  // Items state
  const [items, setItems] = useState(initialData?.items || [])
  
  // UI state
  const [selectedIds, setSelectedIds] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  // Add item
  const addItem = useCallback((newItem) => {
    const itemWithId = {
      ...newItem,
      id: newItem.id || `item-${Date.now()}`,
      _isNew: true,
    }
    
    // Auto-calculate fields if configured
    if (calculateField) {
      Object.keys(calculateField).forEach((field) => {
        itemWithId[field] = calculateField[field](itemWithId, items, header)
      })
    }
    
    setItems((prev) => [...prev, itemWithId])
  }, [items, header, calculateField])

  // Update item
  const updateItem = useCallback((itemId, updates) => {
    setItems((prev) => prev.map((item) => {
      if (item.id === itemId) {
        const updated = { ...item, ...updates }
        
        // Auto-calculate fields if configured
        if (calculateField) {
          Object.keys(calculateField).forEach((field) => {
            updated[field] = calculateField[field](updated, prev, header)
          })
        }
        
        return updated
      }
      return item
    }))
  }, [header, calculateField])

  // Remove item
  const removeItem = useCallback((ids) => {
    const idsToRemove = Array.isArray(ids) ? ids : [ids]
    setItems((prev) => prev.filter((item) => !idsToRemove.includes(item.id)))
    setSelectedIds((prev) => prev.filter((id) => !idsToRemove.includes(id)))
  }, [])

  // Clear all items
  const clearItems = useCallback(() => {
    setItems([])
    setSelectedIds([])
    setEditingId(null)
  }, [])

  // Validate header
  const validateHeader = useCallback(() => {
    const errors = []
    headerConfig?.fields?.forEach((field) => {
      if (field.required && !header[field.name]) {
        errors.push(`${field.label} is required`)
      }
    })
    return errors
  }, [header, headerConfig])

  // Validate items
  const validateItems = useCallback(() => {
    const errors = []
    items.forEach((item, index) => {
      if (validateItem) {
        const itemErrors = validateItem(item, items, header)
        errors.push(...itemErrors)
      }
      
      // Default validation
      itemConfig?.columns?.forEach((col) => {
        if (col.required && !item[col.key]) {
          errors.push(`Row ${index + 1}: ${col.label} is required`)
        }
      })
    })
    return errors
  }, [items, header, itemConfig, validateItem])

  // Validate all
  const validate = useCallback(() => {
    const headerErrors = validateHeader()
    const itemsErrors = validateItems()
    const allErrors = [...headerErrors, ...itemsErrors]
    
    setValidationErrors({
      header: headerErrors,
      items: itemsErrors,
    })
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    }
  }, [validateHeader, validateItems])

  // Handle submit
  const handleSubmit = useCallback(async () => {
    const { isValid } = validate()
    if (!isValid) return
    
    await onSubmit({
      header,
      items: items.map(({ _isNew, ...item }) => item), // Remove internal flags
    })
  }, [header, items, validate, onSubmit])

  // Calculate summary
  const summary = useMemo(() => {
    if (!itemConfig?.summary) return {}
    
    return itemConfig.summary.reduce((acc, calc) => {
      acc[calc.key] = calc.calculate(items)
      return acc
    }, {})
  }, [items, itemConfig])

  return {
    // State
    header,
    setHeader,
    items,
    selectedIds,
    setSelectedIds,
    editingId,
    setEditingId,
    validationErrors,
    summary,
    
    // Actions
    addItem,
    updateItem,
    removeItem,
    clearItems,
    validate,
    handleSubmit,
  }
}
