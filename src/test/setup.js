import { cleanup } from '@testing-library/react'
 
const tauriMocks = {
  invoke: vi.fn(),
  emit: vi.fn(),
  listen: vi.fn(async () => () => {}),
  once: vi.fn(async () => {}),
  window: {
    close: vi.fn(),
    setTitle: vi.fn(),
    minimize: vi.fn(),
    maximize: vi.fn(),
    unmaximize: vi.fn(),
    isMaximized: vi.fn(async () => false),
  },
  reset() {
    this.invoke.mockReset()
    this.emit.mockReset()
    this.listen.mockReset()
    this.once.mockReset()

    this.listen.mockImplementation(async () => () => {})
    this.once.mockImplementation(async () => {})

    this.window.close.mockReset()
    this.window.setTitle.mockReset()
    this.window.minimize.mockReset()
    this.window.maximize.mockReset()
    this.window.unmaximize.mockReset()
    this.window.isMaximized.mockReset()
    this.window.isMaximized.mockResolvedValue(false)
  },
}

globalThis.__TAURI_MOCKS__ = tauriMocks

vi.mock('@tauri-apps/api/core', () => ({
  invoke: tauriMocks.invoke,
}))

vi.mock('@tauri-apps/api/event', () => ({
  emit: tauriMocks.emit,
  listen: tauriMocks.listen,
  once: tauriMocks.once,
}))

vi.mock('@tauri-apps/api/window', () => ({
  appWindow: tauriMocks.window,
  getCurrentWindow: () => tauriMocks.window,
}))

afterEach(() => {
  cleanup()
  tauriMocks.reset()
})
