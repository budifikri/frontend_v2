import { apiFetch } from '../../../shared/http'

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeCashDrawer(raw, index) {
  const isValidId = raw?.id && raw?.id !== '00000000-0000-0000-0000-000000000000'
  return {
    id: isValidId ? raw?.id : `drawer-${index}`,
    drawer_id: raw?.drawer_id ?? raw?.id ?? '',
    open_date: raw?.open_date ?? raw?.opened_at ?? raw?.created_at ?? '-',
    close_date: raw?.close_date ?? raw?.closed_at ?? null,
    status: raw?.status ?? raw?.state ?? (raw?.is_closed === true ? 'CLOSED' : 'OPEN'),
    opening_balance: toNumber(raw?.opening_balance ?? raw?.open_balance ?? raw?.openingAmount, 0),
    cash_in_total: toNumber(raw?.cash_in_total ?? raw?.total_cash_in ?? raw?.cashIn, 0),
    cash_out_total: toNumber(raw?.cash_out_total ?? raw?.total_cash_out ?? raw?.cashOut, 0),
    theoretical_balance: toNumber(raw?.theoretical_balance ?? raw?.expected_balance ?? raw?.calculated_balance, 0),
    actual_balance: toNumber(raw?.actual_balance ?? raw?.closing_balance ?? raw?.real_balance, 0),
    difference: toNumber(raw?.difference ?? raw?.selisih ?? raw?.variance, 0),
    cashier_name: raw?.cashier_name ?? raw?.cashier?.name ?? raw?.user?.name ?? raw?.opened_by ?? raw?.user_open ?? '-',
    warehouse_name: raw?.warehouse_name ?? raw?.warehouse?.name ?? raw?.opened_by ?? '-',
    opened_by: raw?.opened_by ?? raw?.user_open ?? raw?.cashier_open ?? '-',
    closed_by: raw?.closed_by ?? raw?.user_close ?? raw?.cashier_close ?? null,
    notes: raw?.notes ?? raw?.description ?? raw?.catatan ?? '',
  }
}

function normalizeCashDrawerTransaction(raw, index) {
  return {
    id: raw?.id ?? raw?.transaction_id ?? `tx-${index}`,
    date: raw?.date ?? raw?.transaction_date ?? raw?.created_at ?? '-',
    reference: raw?.reference ?? raw?.no ?? raw?.document_number ?? '-',
    type: raw?.type ?? raw?.transaction_type ?? raw?.jenis ?? '-',
    amount: toNumber(raw?.amount ?? raw?.nominal ?? raw?.value ?? raw?.jumlah, 0),
    reason: raw?.reason ?? raw?.description ?? raw?.note ?? raw?.keterangan ?? '-',
    created_by: raw?.created_by ?? raw?.user ?? raw?.kasir ?? '-',
  }
}

const DUMMY_CASH_DRAWERS = [
  {
    id: 'CD001',
    drawer_id: 'CD001',
    open_date: '2024-01-15 08:00:00',
    close_date: '2024-01-15 16:00:00',
    status: 'closed',
    opening_balance: 500000,
    cash_in_total: 1500000,
    cash_out_total: 200000,
    theoretical_balance: 1800000,
    actual_balance: 1800000,
    difference: 0,
    opened_by: 'Admin',
    closed_by: 'Admin',
    notes: 'Penjualan hari pertama',
  },
  {
    id: 'CD002',
    drawer_id: 'CD002',
    open_date: '2024-01-16 08:00:00',
    close_date: null,
    status: 'open',
    opening_balance: 500000,
    cash_in_total: 2500000,
    cash_out_total: 500000,
    theoretical_balance: 2500000,
    actual_balance: 2450000,
    difference: -50000,
    opened_by: 'Kasir 1',
    closed_by: null,
    notes: '',
  },
  {
    id: 'CD003',
    drawer_id: 'CD003',
    open_date: '2024-01-17 08:00:00',
    close_date: '2024-01-17 18:00:00',
    status: 'closed',
    opening_balance: 1000000,
    cash_in_total: 3000000,
    cash_out_total: 800000,
    theoretical_balance: 3200000,
    actual_balance: 3150000,
    difference: -50000,
    opened_by: 'Kasir 2',
    closed_by: 'Admin',
    notes: 'Selisih karena kembalian salah',
  },
]

const DUMMY_TRANSACTIONS = [
  { id: 'TX001', date: '2024-01-16 09:15:00', reference: 'SALE-001', type: 'sale', amount: 150000, reason: 'Penjualan', created_by: 'Kasir 1' },
  { id: 'TX002', date: '2024-01-16 10:30:00', reference: 'SALE-002', type: 'sale', amount: 200000, reason: 'Penjualan', created_by: 'Kasir 1' },
  { id: 'TX003', date: '2024-01-16 11:00:00', reference: 'CIN-001', type: 'cash_in', amount: 500000, reason: 'Setoran tambahan', created_by: 'Kasir 1' },
  { id: 'TX004', date: '2024-01-16 12:15:00', reference: 'SALE-003', type: 'sale', amount: 175000, reason: 'Penjualan', created_by: 'Kasir 1' },
  { id: 'TX005', date: '2024-01-16 14:00:00', reference: 'COUT-001', type: 'cash_out', amount: 200000, reason: ' Biaya operasional', created_by: 'Kasir 1' },
  { id: 'TX006', date: '2024-01-16 15:30:00', reference: 'RET-001', type: 'return', amount: -50000, reason: 'Retur penjualan', created_by: 'Kasir 1' },
]

export async function getCashDrawers(token, params = {}) {
  const qs = new URLSearchParams()
  const dateFrom = params.date_from?.trim?.()
  const dateTo = params.date_to?.trim?.()
  if (dateFrom) qs.set('date_from', dateFrom)
  if (dateTo) qs.set('date_to', dateTo)
  if (params.status) qs.set('status', String(params.status).toUpperCase())
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const url = `/api/cash-drawers${queryString}`
  console.log('[LapCashDrawer API] getCashDrawers REQUEST URL:', url)
  console.log('[LapCashDrawer API] getCashDrawers PARAMS:', params)

  if (!token) {
    console.log('[LapCashDrawer API] No token - returning DUMMY data')
    return {
      items: DUMMY_CASH_DRAWERS,
      total: DUMMY_CASH_DRAWERS.length,
      pagination: {
        total: DUMMY_CASH_DRAWERS.length,
        limit: params.limit ?? 10,
        offset: params.offset ?? 0,
        hasMore: false,
      },
    }
  }

  const raw = await apiFetch(url, { token })
  console.log('[LapCashDrawer API] getCashDrawers RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load cash drawers')

  const rows = Array.isArray(raw.data) ? raw.data : (raw.data?.items ?? raw.data?.data ?? [])
  const pagination = raw.pagination ?? raw.data?.pagination ?? {}

  return {
    items: (rows ?? []).map((item, index) => normalizeCashDrawer(item, index)),
    pagination: {
      limit: params.limit ?? 10,
      offset: params.offset ?? 0,
      ...pagination,
    },
  }
}

export async function getCashDrawerSummary(token, drawerId) {
  const url = `/api/cash-drawers/${encodeURIComponent(drawerId)}/summary`
  console.log('[LapCashDrawer API] getCashDrawerSummary REQUEST URL:', url)

  if (!token) {
    console.log('[LapCashDrawer API] No token - returning DUMMY summary')
    const drawer = DUMMY_CASH_DRAWERS.find((d) => d.id === drawerId || d.drawer_id === drawerId)
    const transactions = DUMMY_TRANSACTIONS
    return {
      drawer: drawer || DUMMY_CASH_DRAWERS[0],
      summary: {
        total_sales: transactions.filter((t) => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0),
        total_returns: transactions.filter((t) => t.type === 'return').reduce((sum, t) => sum + Math.abs(t.amount), 0),
        total_purchases: 0,
        total_purchase_returns: 0,
        total_cash_in: transactions.filter((t) => t.type === 'cash_in').reduce((sum, t) => sum + t.amount, 0),
        total_cash_out: transactions.filter((t) => t.type === 'cash_out').reduce((sum, t) => sum + t.amount, 0),
      },
      transactions: transactions,
    }
  }

  const raw = await apiFetch(url, { token })
  console.log('[LapCashDrawer API] getCashDrawerSummary RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load cash drawer summary')

  return {
    drawer: normalizeCashDrawer(raw.drawer ?? raw.data, 0),
    summary: raw.summary ?? raw.data?.summary ?? {},
    transactions: (raw.transactions ?? raw.data?.transactions ?? []).map((item, index) => normalizeCashDrawerTransaction(item, index)),
  }
}

export async function getCashDrawerTransactions(token, drawerId, params = {}) {
  const qs = new URLSearchParams()
  if (params.type) qs.set('type', params.type)
  if (params.date_from) qs.set('date_from', params.date_from)
  if (params.date_to) qs.set('date_to', params.date_to)
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))

  const queryString = qs.toString() ? `?${qs.toString()}` : ''
  const url = `/api/cash-drawers/${encodeURIComponent(drawerId)}/transactions${queryString}`
  console.log('[LapCashDrawer API] getCashDrawerTransactions REQUEST URL:', url)

  if (!token) {
    console.log('[LapCashDrawer API] No token - returning DUMMY transactions')
    return {
      items: DUMMY_TRANSACTIONS,
      pagination: {
        total: DUMMY_TRANSACTIONS.length,
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
        hasMore: false,
      },
    }
  }

  const raw = await apiFetch(url, { token })
  console.log('[LapCashDrawer API] getCashDrawerTransactions RESPONSE:', raw)

  if (!raw.success) throw new Error(raw.error || raw.message || 'Failed to load transactions')

  const rows = Array.isArray(raw.data) ? raw.data : (raw.data?.items ?? raw.data?.data ?? [])
  const pagination = raw.pagination ?? raw.data?.pagination ?? {}

  return {
    items: (rows ?? []).map((item, index) => normalizeCashDrawerTransaction(item, index)),
    pagination: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
      ...pagination,
    },
  }
}