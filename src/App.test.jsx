import { act, fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

import { login } from './features/auth/login.api'
import { listWarehouses } from './features/master/warehouse/warehouse.api'
import { listPurchases } from './features/transaksi/purchase/purchase.api'

vi.mock('./features/auth/login.api', () => ({
  login: vi.fn(),
}))

vi.mock('./features/master/warehouse/warehouse.api', () => ({
  listWarehouses: vi.fn(),
  createWarehouse: vi.fn(),
  updateWarehouse: vi.fn(),
  deleteWarehouse: vi.fn(),
}))

vi.mock('./features/transaksi/purchase/purchase.api', () => ({
  listPurchases: vi.fn(),
  deletePurchase: vi.fn(),
}))

function createFakeJwt(payload = { role: 'admin' }) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.signature`
}

async function submitLogin() {
  fireEvent.change(screen.getByLabelText('USER ID'), { target: { value: 'admin' } })
  fireEvent.change(screen.getByLabelText('PASSWORD'), { target: { value: '123456' } })
  await act(async () => {
    fireEvent.click(screen.getByLabelText('Masuk'))
  })
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(login).mockResolvedValue({
      token: createFakeJwt({ role: 'admin' }),
      role: 'admin',
      username: 'admin',
      companyName: 'PT Retail',
    })
    vi.mocked(listWarehouses).mockResolvedValue({
      items: [],
      pagination: { total: 0, has_more: false },
    })
    vi.mocked(listPurchases).mockResolvedValue({
      items: [],
      pagination: { total: 0, has_more: false },
    })
  })

  it('renders login form terbaru', () => {
    render(<App />)

    expect(screen.getByText('PosXpress')).toBeTruthy()
    expect(screen.getByText('Ver 3.0')).toBeTruthy()
    expect(screen.getByLabelText('USER ID')).toBeTruthy()
    expect(screen.getByLabelText('PASSWORD')).toBeTruthy()
  })

  it('opens dashboard when login berhasil', async () => {
    render(<App />)

    await submitLogin()

    expect(login).toHaveBeenCalledWith({ username: 'admin', password: '123456' })
    expect(await screen.findByLabelText('POS Admin Menu Dashboard')).toBeTruthy()
    expect(screen.getByText('System Connected')).toBeTruthy()
  })

  it('toggle menu aktif saat dashboard-canvas berisi konten', async () => {
    const { container } = render(<App />)

    await submitLogin()
    expect(await screen.findByLabelText('POS Admin Menu Dashboard')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Warehouse/ }))

    const canvasPanel = container.querySelector('.dashboard-canvas-panel')
    const warehouseTitle = await screen.findByRole('heading', { name: 'Daftar Warehouse' })
    expect(canvasPanel?.classList.contains('hidden')).toBe(false)
    expect(warehouseTitle).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Master' }))
    expect(canvasPanel?.classList.contains('hidden')).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Master' }))
    expect(canvasPanel?.classList.contains('hidden')).toBe(false)
    expect(screen.getByRole('heading', { name: 'Daftar Warehouse' })).toBeTruthy()
  })

  it('no action saat activeTool belum ada dan menu aktif diklik', async () => {
    const { container } = render(<App />)

    await submitLogin()
    expect(await screen.findByLabelText('POS Admin Menu Dashboard')).toBeTruthy()

    const canvasPanel = container.querySelector('.dashboard-canvas-panel')
    expect(canvasPanel?.classList.contains('hidden')).toBe(false)
    expect(container.querySelector('.dashboard-toolbar')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Master' }))

    expect(canvasPanel?.classList.contains('hidden')).toBe(false)
    expect(container.querySelector('.dashboard-toolbar')).toBeTruthy()
  })

  it('menu lain bisa diklik saat awal loading dashboard', async () => {
    render(<App />)

    await submitLogin()
    expect(await screen.findByLabelText('POS Admin Menu Dashboard')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Transaksi' }))

    expect(screen.getByRole('button', { name: /Pembelian/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Transaksi' }).classList.contains('active')).toBe(true)
  })

  it('menu lain tetap bisa ganti kategori saat toolbar tampil', async () => {
    const { container } = render(<App />)

    await submitLogin()
    expect(await screen.findByLabelText('POS Admin Menu Dashboard')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Warehouse/ }))
    await screen.findByRole('heading', { name: 'Daftar Warehouse' })

    const canvasPanel = container.querySelector('.dashboard-canvas-panel')
    fireEvent.click(screen.getByRole('button', { name: 'Master' }))
    expect(canvasPanel?.classList.contains('hidden')).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Transaksi' }))
    expect(screen.getByRole('button', { name: /Pembelian/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Inventory/ })).toBeTruthy()
    expect(canvasPanel?.classList.contains('hidden')).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Transaksi' }))
    expect(canvasPanel?.classList.contains('hidden')).toBe(false)
    expect(screen.getByRole('heading', { name: 'Daftar Warehouse' })).toBeTruthy()
  })

  it('menu dashboard tetap tampil saat membuka order pembelian', async () => {
    render(<App />)

    await submitLogin()
    expect(await screen.findByLabelText('POS Admin Menu Dashboard')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Transaksi' }))
    fireEvent.click(screen.getByRole('button', { name: /Pembelian/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Order Pembelian/ }))

    expect(screen.getByRole('button', { name: 'Master' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Transaksi' })).toBeTruthy()
    expect(screen.getByText('Purchase Orders')).toBeTruthy()
  })
})
