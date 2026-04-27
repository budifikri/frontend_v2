use serde::{Deserialize, Serialize};
use std::io::Write;
use std::sync::Mutex;
use tauri::State;

#[cfg(target_os = "windows")]
use std::ffi::c_void;
#[cfg(target_os = "windows")]
use std::ptr::null_mut;
#[cfg(target_os = "windows")]
use windows_sys::Win32::Foundation::HANDLE;
#[cfg(target_os = "windows")]
use windows_sys::Win32::Graphics::Printing::{
    ClosePrinter, EndDocPrinter, EndPagePrinter, EnumPrintersW, OpenPrinterW, StartDocPrinterW,
    StartPagePrinter, WritePrinter, DOC_INFO_1W, PRINTER_ENUM_CONNECTIONS, PRINTER_ENUM_LOCAL,
    PRINTER_INFO_4W,
};

pub struct SerialConnection {
    port: Option<Box<dyn serialport::SerialPort>>,
}

impl Default for SerialConnection {
    fn default() -> Self {
        SerialConnection { port: None }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SerialPortInfo {
    pub port_name: String,
    pub port_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SerialError {
    pub message: String,
}

impl From<serialport::Error> for SerialError {
    fn from(err: serialport::Error) -> Self {
        SerialError {
            message: err.to_string(),
        }
    }
}

impl From<String> for SerialError {
    fn from(err: String) -> Self {
        SerialError { message: err }
    }
}

#[tauri::command]
fn list_serial_ports() -> Result<Vec<SerialPortInfo>, SerialError> {
    let ports = serialport::available_ports().map_err(|e| SerialError {
        message: e.to_string(),
    })?;

    let result: Vec<SerialPortInfo> = ports
        .into_iter()
        .map(|p| SerialPortInfo {
            port_name: p.port_name,
            port_type: format!("{:?}", p.port_type),
        })
        .collect();

    Ok(result)
}

#[tauri::command]
fn open_serial_port(
    port_name: String,
    baud_rate: u32,
    connection: State<'_, Mutex<SerialConnection>>,
) -> Result<(), SerialError> {
    let mut conn = connection.lock().map_err(|e| SerialError {
        message: format!("Lock error: {}", e),
    })?;

    if conn.port.is_some() {
        return Err(SerialError {
            message: "Port already open".to_string(),
        });
    }

    let port = serialport::new(&port_name, baud_rate)
        .timeout(std::time::Duration::from_millis(1000))
        .open()
        .map_err(|e| SerialError {
            message: format!("Failed to open {}: {}", port_name, e),
        })?;

    conn.port = Some(port);

    log::info!("Serial port {} opened at {} baud", port_name, baud_rate);

    Ok(())
}

#[tauri::command]
fn write_serial_bytes(
    data: Vec<u8>,
    connection: State<'_, Mutex<SerialConnection>>,
) -> Result<(), SerialError> {
    let mut conn = connection.lock().map_err(|e| SerialError {
        message: format!("Lock error: {}", e),
    })?;

    let port = conn.port.as_mut().ok_or(SerialError {
        message: "Port not open".to_string(),
    })?;

    port.write_all(&data).map_err(|e| SerialError {
        message: format!("Write error: {}", e),
    })?;

    port.flush().map_err(|e| SerialError {
        message: format!("Flush error: {}", e),
    })?;

    log::info!("Wrote {} bytes to serial port", data.len());

    Ok(())
}

#[tauri::command]
fn close_serial_port(connection: State<'_, Mutex<SerialConnection>>) -> Result<(), SerialError> {
    let mut conn = connection.lock().map_err(|e| SerialError {
        message: format!("Lock error: {}", e),
    })?;

    if conn.port.is_some() {
        conn.port = None;
        log::info!("Serial port closed");
    }

    Ok(())
}

#[tauri::command]
fn is_serial_port_open(
    connection: State<'_, Mutex<SerialConnection>>,
) -> Result<bool, SerialError> {
    let conn = connection.lock().map_err(|e| SerialError {
        message: format!("Lock error: {}", e),
    })?;

    Ok(conn.port.is_some())
}

#[tauri::command]
fn list_windows_printers() -> Result<Vec<String>, SerialError> {
    #[cfg(target_os = "windows")]
    {
        enumerate_windows_printers()
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err(SerialError {
            message: "Windows printer hanya didukung di Windows".to_string(),
        })
    }
}

#[tauri::command]
fn write_windows_printer_raw(printer_name: String, data: Vec<u8>) -> Result<(), SerialError> {
    #[cfg(target_os = "windows")]
    {
        write_raw_to_windows_printer(&printer_name, &data)
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = (printer_name, data);
        Err(SerialError {
            message: "Windows printer hanya didukung di Windows".to_string(),
        })
    }
}

#[cfg(target_os = "windows")]
fn enumerate_windows_printers() -> Result<Vec<String>, SerialError> {
    let flags = PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS;
    let mut needed = 0u32;
    let mut returned = 0u32;

    unsafe {
        EnumPrintersW(
            flags,
            null_mut(),
            4,
            null_mut(),
            0,
            &mut needed,
            &mut returned,
        );
    }

    if needed == 0 {
        return Ok(Vec::new());
    }

    let mut buffer = vec![0u8; needed as usize];
    let success = unsafe {
        EnumPrintersW(
            flags,
            null_mut(),
            4,
            buffer.as_mut_ptr(),
            needed,
            &mut needed,
            &mut returned,
        )
    };

    if success == 0 {
        return Err(last_os_error("Gagal membaca daftar printer Windows"));
    }

    let printer_infos = unsafe {
        std::slice::from_raw_parts(buffer.as_ptr() as *const PRINTER_INFO_4W, returned as usize)
    };

    let mut printers = printer_infos
        .iter()
        .map(|printer| from_wide_ptr(printer.pPrinterName))
        .filter(|name| !name.trim().is_empty())
        .collect::<Vec<_>>();

    printers.sort();
    printers.dedup();

    Ok(printers)
}

#[cfg(target_os = "windows")]
fn write_raw_to_windows_printer(printer_name: &str, data: &[u8]) -> Result<(), SerialError> {
    let printer_name_wide = to_wide(printer_name);
    let doc_name = to_wide("POS Dot Matrix Receipt");
    let raw = to_wide("RAW");
    let mut printer_handle: HANDLE = null_mut();

    let open_result = unsafe {
        OpenPrinterW(
            printer_name_wide.as_ptr() as *mut u16,
            &mut printer_handle,
            null_mut(),
        )
    };

    if open_result == 0 || printer_handle.is_null() {
        return Err(last_os_error(&format!(
            "Gagal membuka printer Windows '{}'",
            printer_name
        )));
    }

    let result = (|| -> Result<(), SerialError> {
        let doc_info = DOC_INFO_1W {
            pDocName: doc_name.as_ptr() as *mut u16,
            pOutputFile: null_mut(),
            pDatatype: raw.as_ptr() as *mut u16,
        };

        let job_id =
            unsafe { StartDocPrinterW(printer_handle, 1, &doc_info as *const DOC_INFO_1W) };
        if job_id == 0 {
            return Err(last_os_error("Gagal memulai RAW print document"));
        }

        let started_page = unsafe { StartPagePrinter(printer_handle) };
        if started_page == 0 {
            unsafe {
                EndDocPrinter(printer_handle);
            }
            return Err(last_os_error("Gagal memulai halaman print"));
        }

        let mut written = 0u32;
        let write_result = unsafe {
            WritePrinter(
                printer_handle,
                data.as_ptr() as *const c_void,
                data.len() as u32,
                &mut written,
            )
        };

        if write_result == 0 {
            unsafe {
                EndPagePrinter(printer_handle);
                EndDocPrinter(printer_handle);
            }
            return Err(last_os_error("Gagal mengirim data RAW ke printer"));
        }

        if written != data.len() as u32 {
            unsafe {
                EndPagePrinter(printer_handle);
                EndDocPrinter(printer_handle);
            }
            return Err(SerialError {
                message: format!(
                    "Data RAW tidak terkirim penuh: {} dari {} bytes",
                    written,
                    data.len()
                ),
            });
        }

        let end_page_result = unsafe { EndPagePrinter(printer_handle) };
        if end_page_result == 0 {
            unsafe {
                EndDocPrinter(printer_handle);
            }
            return Err(last_os_error("Gagal menutup halaman print"));
        }

        let end_doc_result = unsafe { EndDocPrinter(printer_handle) };
        if end_doc_result == 0 {
            return Err(last_os_error("Gagal menutup print document"));
        }

        Ok(())
    })();

    unsafe {
        ClosePrinter(printer_handle);
    }

    if result.is_ok() {
        log::info!(
            "Wrote {} bytes to Windows printer '{}'",
            data.len(),
            printer_name
        );
    }

    result
}

#[cfg(target_os = "windows")]
fn to_wide(value: &str) -> Vec<u16> {
    value.encode_utf16().chain(std::iter::once(0)).collect()
}

#[cfg(target_os = "windows")]
fn from_wide_ptr(ptr: *mut u16) -> String {
    if ptr.is_null() {
        return String::new();
    }

    unsafe {
        let mut len = 0usize;
        while *ptr.add(len) != 0 {
            len += 1;
        }

        String::from_utf16_lossy(std::slice::from_raw_parts(ptr, len))
    }
}

#[cfg(target_os = "windows")]
fn last_os_error(prefix: &str) -> SerialError {
    let os_error = std::io::Error::last_os_error();
    SerialError {
        message: format!("{}: {}", prefix, os_error),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(SerialConnection::default()))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .plugin(tauri_plugin_serialplugin::init())
        .invoke_handler(tauri::generate_handler![
            list_serial_ports,
            open_serial_port,
            write_serial_bytes,
            close_serial_port,
            is_serial_port_open,
            list_windows_printers,
            write_windows_printer_raw,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
