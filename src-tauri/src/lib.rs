use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
