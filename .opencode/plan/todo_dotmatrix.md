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

## 7) Dokumentasi
- [x] Sinkronkan perubahan implementasi dengan `PLAN_dotmatrix.md` bila ada deviasi.
- [ ] Tambahkan catatan risiko aktual dan mitigasi final setelah implementasi selesai.
