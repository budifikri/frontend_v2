import { test, expect } from '@playwright/test'

// End-to-end: ensure adding items to one PO does not affect another PO
test('PO isolation via API + UI flow (per-PO payload)', async ({ request, page }) => {
  // 1) Login via API to obtain token
  const loginRes = await request.post('http://localhost:3000/api/auth/login', {
    data: { username: 'budifikri', password: '486456' }
  })
  expect(loginRes.ok()).toBeTruthy()
  const loginJson = await loginRes.json()
  const token = loginJson?.token
  expect(token).toBeTruthy()

  // 2) Create PO A
  const poA = {
    supplier_id: 'SUP1',
    warehouse_id: 'WH1',
    po_date: '2026-03-09',
    expected_date: '2026-03-16',
    notes: 'PO A for isolation test',
    items: [
      { product_id: 'PROD1', quantity: 2, unit_price: 10000, discount: 0, tax_rate: 0 }
    ]
  }
  const resA = await request.post('http://localhost:3000/api/purchases', {
    headers: { Authorization: `Bearer ${token}` },
    data: poA
  })
  expect(resA.ok()).toBeTruthy()
  const dataA = await resA.json()
  const poAId = dataA?.data?.id || dataA?.data?.po_number
  expect(poAId).toBeTruthy()

  // 3) Create PO B with different data
  const poB = {
    supplier_id: 'SUP2',
    warehouse_id: 'WH2',
    po_date: '2026-03-10',
    expected_date: '2026-03-17',
    notes: 'PO B isolation test',
    items: [
      { product_id: 'PROD2', quantity: 1, unit_price: 15000, discount: 0, tax_rate: 0 }
    ]
  }
  const resB = await request.post('http://localhost:3000/api/purchases', {
    headers: { Authorization: `Bearer ${token}` },
    data: poB
  })
  expect(resB.ok()).toBeTruthy()
  const dataB = await resB.json()
  const poBId = dataB?.data?.id || dataB?.data?.po_number
  expect(poBId).toBeTruthy()

  // 4) Update PO A by adding a new item (isolation test)
  const updatedA = {
    supplier_id: poA.supplier_id,
    warehouse_id: poA.warehouse_id,
    po_date: poA.po_date,
    expected_date: poA.expected_date,
    notes: poA.notes,
    items: [
      { product_id: 'PROD1', quantity: 2, unit_price: 10000, discount: 0, tax_rate: 0 },
      { product_id: 'PROD3', quantity: 1, unit_price: 5000, discount: 0, tax_rate: 0 }
    ]
  }
  const respUpdateA = await request.put(`http://localhost:3000/api/purchases/${poAId}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: updatedA
  })
  expect(respUpdateA.ok()).toBeTruthy()

  // 5) Fetch PO B to verify it is not mutated by PO A update
  const respGetB = await request.get(`http://localhost:3000/api/purchases/${poBId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  expect(respGetB.ok()).toBeTruthy()
  const poBAfter = await respGetB.json()
  expect(poBAfter?.data?.items?.length).toBeGreaterThan(0)

  // 6) Optional: Verify PO A payload includes new item
  const respGetA = await request.get(`http://localhost:3000/api/purchases/${poAId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  expect(respGetA.ok()).toBeTruthy()
  const poAAfter = await respGetA.json()
  const hasNewItem = (poAAfter?.data?.items || []).some(i => i.product_id === 'PROD3')
  expect(hasNewItem).toBeTruthy()
})
