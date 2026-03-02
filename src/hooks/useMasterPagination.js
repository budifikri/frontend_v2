import { useMemo, useState } from 'react'

export function useMasterPagination({ initialLimit = 10, total = 0, hasMore = false } = {}) {
  const [offset, setOffset] = useState(0)
  const limit = initialLimit

  const page = Math.floor(offset / limit) + 1
  const totalPages = useMemo(() => {
    if (total > 0) return Math.max(1, Math.ceil(total / limit))
    return hasMore ? page + 1 : page
  }, [total, limit, hasMore, page])

  const canPrev = offset > 0
  const canNext = total > 0 ? page < totalPages : hasMore

  const goFirst = () => setOffset(0)
  const goPrev = () => setOffset((prev) => Math.max(0, prev - limit))
  const goNext = () => {
    if (!canNext) return
    setOffset((prev) => prev + limit)
  }
  const goLast = () => {
    if (total <= 0) return
    setOffset((Math.max(1, totalPages) - 1) * limit)
  }
  const reset = () => setOffset(0)

  return {
    limit,
    offset,
    setOffset,
    page,
    totalPages,
    canPrev,
    canNext,
    goFirst,
    goPrev,
    goNext,
    goLast,
    reset,
  }
}
