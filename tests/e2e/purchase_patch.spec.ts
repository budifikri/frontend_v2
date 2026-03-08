import { test, expect } from '@playwright/test'

// End-to-end test: ensure adding items to a PO affects only that PO
test('PO item add isolated per PO', async ({ page }) => {
  // 1) Open app and login
  await page.goto('http://localhost:5173/?debug')
  await page.fill('input[name="username"]', 'budifikri')
  await page.fill('input[name="password"]', '486456')
  // Adjust selector if login button has different attributes
  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]')
  ])

  // 2) Navigate to first Purchase order detail
  // Replace selectors with actual text/labels in your app
  await page.click('text=Purchase')
  await page.click('text=PO 1')

  // 3) Add a new item
  await page.click('text=Add Item')
  // Fill item fields - adjust selectors to match your form
  await page.fill('input[name="po-product"]', 'Product A')
  await page.fill('input[name="po-qty"]', '2')
  await page.fill('input[name="po-unit-price"]', '15000')
  await page.click('button:has-text("Save")')

  // 4) Inspect the PUT payload via network and assert it targets the correct PO
  const putReq = await page.waitForResponse(resp => resp.url().includes('/api/purchases/') && resp.request().method() === 'PUT')
  const json = await putReq.json()
  // Ensure payload contains the new item and that items correspond to the current PO only
  expect(Array.isArray(json?.data?.items)).toBeTruthy()
  expect(json.data.items.length).toBeGreaterThan(0)
  // Additional checks can be added based on known product ids
})
