# TODO Implementasi Dot Matrix (Khusus Tauri)

## 1) Runtime Gate & Guard
- [x] Tambah deteksi runtime Tauri di `src/components/POS/POS.jsx` (`window.__TAURI__`).
- [x] Disable opsi Dot Matrix pada browser non-Tauri dan tampilkan info "Non Browser".
- [x] Tambahkan fallback efektif ke `thermal` saat non-Tauri menerima setting `dot_matrix`.

## 2) Split Template & Layout per Printer Type
- [x] Pisahkan layout options thermal vs dot matrix di `src/components/POS/ReceiptLayouts.jsx`.
- [x] Pisahkan template map thermal vs dot matrix.
- [x] Pisahkan default custom HTML/CSS thermal vs dot matrix.
- [x] Sinkronkan `layout_type`, `template_mode`, dan custom template saat switch printer type.

## 3) Preview Dot Matrix
- [x] Update `src/components/POS/ReceiptPreview.jsx` untuk renderer berbasis printer type.
- [x] Update `src/components/POS/POS.css` agar visual dot matrix berbeda jelas dari thermal.
- [x] Tambahkan animasi preview ringan sesuai plan (`dotMatrixPreviewEnter`, `tractorFeedSweep`) dengan `prefers-reduced-motion`.

## 4) Print Output Dot Matrix
- [x] Refactor style print di `openPrintWindow` (`src/components/POS/POS.jsx`) untuk jalur thermal vs dot matrix.
- [x] Pastikan browser non-Tauri selalu memakai thermal path.
- [x] Pastikan mode dot matrix tetap memakai alur print existing (`window.print`) agar minim risiko.

## 5) Auto-Print Flow
- [x] Pastikan auto-print setelah payment mengikuti runtime guard + printer type aktif.
- [x] Pastikan fallback data print dari state transaksi saat `getSaleById` gagal.
- [x] Pastikan toast status pembayaran dan status cetak terpisah.

## 6) QA Checklist
- [ ] Uji browser non-Tauri: opsi Dot Matrix disabled + info "Non Browser", print tetap normal.
- [ ] Uji Tauri: switch Thermal <-> Dot Matrix berjalan tanpa error.
- [ ] Uji preview Dot Matrix (desktop + mobile).
- [ ] Uji custom template Dot Matrix (Apply/Code/Reset/Token).
- [ ] Uji auto-print setelah payment untuk thermal dan dot matrix.

## Progress Update (Latest)
- [x] Validasi implementasi runtime guard + disable Dot Matrix di browser (code-level).
- [x] Validasi animasi/visual Dot Matrix via pengecekan source (`dotMatrixPreviewEnter`, `tractorFeedSweep`).
- [x] `npm run lint` lulus tanpa error baru (tersisa warning lama di modul lain).
- [x] `npm run build` berhasil.
- [ ] Uji manual runtime Tauri native (desktop) masih pending.

## 8) Perbaikan Masalah Cetak Tauri (Iframe Fix)
- [x] Implementasi Hidden Iframe untuk memperbaiki cetak (Printing) di Tauri
- [x] Refactor `openPrintWindow` di `POS.jsx` untuk menggunakan Iframe
- [ ] Uji coba cetak Thermal dan Dot Matrix pada environment Tauri
- [ ] Verifikasi tampilan cetak (layout & style) di preview printer

## 9) Setup tauri-plugin-serial (Rust Side)
- [x] Tambahkan `tauri-plugin-serialplugin` ke `src-tauri/Cargo.toml`
- [x] Register plugin di `src-tauri/src/lib.rs`
- [x] Konfigurasi capabilities/permissions serial di `capabilities/default.json`

## 10) Rust Serial Commands
- [x] Tambah command `list_serial_ports()` → Vec<String>
- [x] Tambah command `open_serial_port(path, baud_rate)` → Result
- [x] Tambah command `write_serial_bytes(data)` → Result
- [x] Tambah command `close_serial_port()` → Result
- [x] Test cargo build --release Rust compilation

## 11) Dot Matrix Print Settings (Frontend)
- [x] Tambah field `baud_rate` di receipt settings (dropdown: 9600, 19200, 38400, 57600)
- [x] Tambah field `com_port` di receipt settings (string)
- [x] Update UI setting untuk pilihan port serial dan baud rate

## 12) ESC/POS Generator (JavaScript)
- [x] Modifikasi `ReceiptLayouts.js` untuk generate raw ESC/POS text (dot matrix)
- [x] Implementasi command ESC/POS: init, font mode, alignment, line feed, encoding
- [x] Reuse existing `paper_size` untuk karakter per baris (58mm=40, 80mm=42)

## 13) Frontend Serial Module
- [x] Buat `src/utils/serialApi.js`
- [x] Implementasi `listPorts()`, `connect()`, `print()`, `disconnect()`
- [x] Error handling: port busy, timeout, disconnected

## 14) Integration with Print Flow
- [x] Update `openPrintWindow` di POS.jsx: cek printer_type, Thermal → iframe, Dot Matrix → serial
- [ ] Test print Dot Matrix via serial port (TM-U300)
- [ ] Test auto-print Dot Matrix setelah payment

## 15) UI Setting Dot Matrix
- [x] Tambahkan section setting port/baud di popup nota settings
- [x] Tombol "Scan Port" untuk enumerate COM ports
- [x] Tombol "Test Print" untuk kirim karakter test
- [x] Status indicator koneksi serial

## 16) TM-U220 USB Driver Support (Windows Printer)
- [x] Tambah field `dot_matrix_connection_type` di receipt settings
- [x] Tambah field `windows_printer_name` di receipt settings
- [x] Tambah Rust command `list_windows_printers()`
- [x] Tambah Rust command `write_windows_printer_raw(printer_name, data)`
- [x] Tambah frontend API untuk scan printer Windows
- [x] Tambah UI pilihan `Serial Port` vs `Windows Printer`
- [x] Tambah dropdown printer Windows + tombol `Scan Printer`
- [x] Tambah `Test Print` untuk jalur Windows printer
- [x] Update flow Dot Matrix print berdasarkan `dot_matrix_connection_type`
- [ ] Uji print ke `EPSON TM-U220 Receipt`
- [ ] Uji auto-print setelah payment di mode Windows printer

## 17) Tag Alignment untuk Custom Template Dot Matrix
- [x] Tambah token `[C]` untuk center alignment di DOT_MATRIX_TOKEN_LIST
- [x] Tambah token `[R]` untuk right alignment di DOT_MATRIX_TOKEN_LIST
- [x] Implementasi fungsi `padLeft` dan `centerText` di DotMatrixFormatter.js
- [x] Implementasi `processAlignmentTags` untuk proses alignment tag
- [x] Integrasi proses alignment di `replaceDotMatrixToken`
- [x] Preview Dot Matrix sekarang selalu menggunakan `renderDotMatrixPlainText` (termasuk alignment)
- [x] Debug panel sekarang menggunakan `buildDotMatrixPrintModel` untuk alignment tags
- [x] Lint & build berhasil

## 18) Loop Items untuk Custom Template Dot Matrix
- [x] Tambah token list items: `{{#each items}}`, `{{/each items}}`, `{{index}}`, `{{name}}`, `{{quantity}}`, `{{unit_price}}`, `{{subtotal}}`, `{{discount}}`
- [x] Implementasi fungsi `replaceItemTokens` untuk replace token per item
- [x] Implementasi fungsi `parseEachItemsBlock` untuk parser loop Handlebars-style
- [x] Update `buildDotMatrixPrintModel` untuk include `discount` per item
- [x] Integrasi `parseEachItemsBlock` di `replaceDotMatrixToken`
- [x] Build berhasil

## 19) Width-Specific Alignment Markers [R{n}], [L{n}], [C{n}]
- [x] Tambah fungsi `applyAlignment` dengan padStart/padEnd
- [x] Tambah fungsi `parseAlignmentMarker` untuk parse [R3], [L5], [C2] dll
- [x] Update `replaceItemTokens` untuk proses per-line dengan alignment
- [x] Update `processAlignmentTags` untuk handle width markers di luar loop
- [x] Update `DOT_MATRIX_TOKEN_LIST` dengan `[R3]`, `[R5]`, `[L3]`, `[L5]`, `[C2]`, `[C3]`, `[C4]`
- [x] Refactor `replaceItemTokens` untuk multiple markers per line (token-level alignment)
- [x] Tambah fungsi `processLineWithTokens` untuk parse markers + tokens dalam 1 baris
- [x] Build berhasil

## 20) Error Handling untuk ReceiptPreview dan Settings
- [x] Tambah try-catch di `renderReceiptContent` call di ReceiptPreview.jsx
- [x] Tambah fallback untuk model null
- [x] Tambah try-catch untuk `renderDotMatrixPlainText` call
- [x] Tambah error handling di `handleOpenReceiptSettings`
- [x] Build berhasil

## 21) Crash Fixes untuk Tauri Runtime
- [x] Tambah maxIterations safeguard di `processLineWithTokens` (prevent infinite loop)
- [x] Tambah try-catch di `parseEachItemsBlock`
- [x] Tambah try-catch di `replaceDotMatrixToken` untuk `parseEachItemsBlock` dan `processAlignmentTags`
- [x] Tambah try-catch di `renderDotMatrixPlainText`
- [x] Tambah try-catch di `buildDotMatrixPrintModel` + fallback model
- [x] Fix nullable access: `sale?.items`, `sale?.payments`
- [x] Tambah try-catch untuk `dotMatrixDebugText` calculation di POS.jsx
- [x] Build berhasil
