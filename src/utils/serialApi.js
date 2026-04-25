import { invoke } from '@tauri-apps/api/core'

export async function listSerialPorts() {
  try {
    const ports = await invoke('list_serial_ports')
    return { success: true, data: ports }
  } catch (err) {
    return { success: false, error: err.message || String(err) }
  }
}

export async function openSerialPort(portName, baudRate) {
  try {
    await invoke('open_serial_port', {
      portName,
      baudRate,
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message || String(err) }
  }
}

export async function writeSerialBytes(data) {
  try {
    await invoke('write_serial_bytes', { data })
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message || String(err) }
  }
}

export async function closeSerialPort() {
  try {
    await invoke('close_serial_port')
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message || String(err) }
  }
}

export async function isSerialPortOpen() {
  try {
    const open = await invoke('is_serial_port_open')
    return { success: true, data: open }
  } catch (err) {
    return { success: false, error: err.message || String(err) }
  }
}

export async function printViaSerial(text, portName, baudRate) {
  const bytes = stringToBytes(text)
  const openResult = await openSerialPort(portName, baudRate)
  if (!openResult.success) {
    return { success: false, error: openResult.error }
  }

  const writeResult = await writeSerialBytes(bytes)
  if (!writeResult.success) {
    await closeSerialPort()
    return { success: false, error: writeResult.error }
  }

  await closeSerialPort()
  return { success: true }
}

function stringToBytes(text) {
  const encoder = new TextEncoder()
  return Array.from(encoder.encode(text))
}

export function testPrintBytes() {
  const ESC = String.fromCharCode(0x1b)
  const GS = String.fromCharCode(0x1d)
  const LF = String.fromCharCode(0x0a)

  let output = ''

  output += ESC + '@'
  output += ESC + 'a' + String.fromCharCode(1)
  output += '================================\n'
  output += ESC + 'a' + String.fromCharCode(0)
  output += '     TEST PRINT - TM-U300\n'
  output += '================================\n'
  output += LF
  output += '12345678901234567890123456789012345678\n'
  output += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef\n'
  output += '0123456789\n'
  output += LF
  output += ESC + 'a' + String.fromCharCode(1)
  output += '    -- TEST PRINT OK --\n'
  output += ESC + 'a' + String.fromCharCode(0)
  output += '================================\n'
  output += LF + LF + LF

  return output
}