# PLAN Dot Matrix (Khusus Tauri)

## Tujuan
Mengaktifkan opsi printer **Dot Matrix** hanya saat aplikasi berjalan di **Tauri build/runtime**, dan menyembunyikannya saat berjalan di browser.
Selain itu, mode Dot Matrix harus memiliki **preview, layout, dan custom template** yang berbeda dari Thermal.

## Kondisi Existing (Ringkas)
- Opsi `printer_type` sudah mendukung `dot_matrix` di storage:
  - `src/features/setting/receiptSetting.storage.js`
- UI setting nota saat ini selalu menampilkan Dot Matrix (termasuk browser):
  - `src/components/POS/POS.jsx`
- Engine render nota:
  - `src/components/POS/ReceiptLayouts.jsx`
- Preview nota:
  - `src/components/POS/ReceiptPreview.jsx`
- Proses cetak masih via `window.open(...)` + `window.print()`:
  - `src/components/POS/POS.jsx`

## Scope Perubahan

### 1) Runtime Gate: Dot Matrix hanya di Tauri
- Tambahkan flag runtime di POS (contoh: `const isTauriRuntime = Boolean(window.__TAURI__)`).
- Pada UI pilihan printer:
  - Browser: tampilkan **hanya Thermal**.
  - Tauri: tampilkan **Thermal + Dot Matrix**.

### 2) Guard Fallback saat Browser
- Jika setting tersimpan `dot_matrix` lalu app dibuka via browser:
  - fallback efektif ke `thermal` di layer state/render POS.
- Tujuan: hindari kondisi UI/preview/cetak yang tidak valid di web.

### 3) Pisah Layout Thermal vs Dot Matrix
- Di `ReceiptLayouts.jsx`, pisahkan:
  - `THERMAL_LAYOUT_OPTIONS`
  - `DOT_MATRIX_LAYOUT_OPTIONS`
- Pisahkan map template default:
  - `RECEIPT_TEMPLATE_MAP_THERMAL`
  - `RECEIPT_TEMPLATE_MAP_DOT_MATRIX`
- Pemilihan layout harus berdasarkan `settings.printer_type`.

### 4) Pisah Custom Template Default
- Tambahkan default custom terpisah:
  - `DEFAULT_CUSTOM_TEMPLATE_HTML_THERMAL`
  - `DEFAULT_CUSTOM_TEMPLATE_CSS_THERMAL`
  - `DEFAULT_CUSTOM_TEMPLATE_HTML_DOT_MATRIX`
  - `DEFAULT_CUSTOM_TEMPLATE_CSS_DOT_MATRIX`
- Saat user switch `printer_type`, draft template menyesuaikan set milik printer tersebut.

### 5) Preview Dot Matrix yang Berbeda
- Update `ReceiptPreview.jsx` agar rendering preview mengikuti template map per printer type.
- Update `POS.css` untuk karakter Dot Matrix:
  - monospaced look,
  - garis sederhana/karakter style,
  - spacing dan kepadatan teks berbeda dari Thermal,
  - minim elemen grafis.

### 6) Print HTML/CSS Dot Matrix yang Berbeda
- Di `openPrintWindow` (POS):
  - pisahkan style thermal vs dot matrix.
  - dot matrix: fokus keterbacaan printer impact, line-height, border/line sederhana, font monospace.
- Alur cetak tetap mempertahankan mekanisme existing (`window.print`) untuk minim risiko.

## Rincian Implementasi (Urutan Eksekusi)
1. Tambah runtime detector Tauri di POS.
2. Gate UI pilihan printer berdasarkan runtime.
3. Tambah fallback logic jika browser menerima `dot_matrix`.
4. Refactor `ReceiptLayouts.jsx` untuk split layout/template per printer type.
5. Refactor `ReceiptPreview.jsx` agar pilih renderer berdasarkan printer type.
6. Sesuaikan CSS preview di `POS.css` untuk Dot Matrix visual.
7. Sesuaikan `openPrintWindow` style untuk output Dot Matrix.
8. Uji manual skenario utama (lihat checklist).

## Checklist Uji Manual

### Browser (non-Tauri)
- [ ] Opsi Dot Matrix tidak muncul.
- [ ] Bila localStorage lama berisi `dot_matrix`, UI/render tetap aman (efektif thermal).
- [ ] Preview dan print tetap berjalan normal.

### Tauri
- [ ] Opsi Dot Matrix muncul.
- [ ] Bisa switch Thermal <-> Dot Matrix tanpa error.
- [ ] Preview Dot Matrix berbeda jelas dari Thermal.
- [ ] Layout default Dot Matrix bekerja.
- [ ] Custom template Dot Matrix bekerja (Apply/Code/Reset/Token).
- [ ] Cetak Dot Matrix mengikuti style dot matrix.

## Risiko & Mitigasi
- **Risiko:** state setting lama bentrok setelah split template.
  - **Mitigasi:** normalisasi/fallback saat load + guard di POS state.
- **Risiko:** preview custom mismatch saat switch printer type.
  - **Mitigasi:** sinkronkan draft HTML/CSS per printer type saat onChange.
- **Risiko:** regressi thermal.
  - **Mitigasi:** thermal path dipertahankan, dot matrix path dibuat additive.

## Catatan Teknis
- Tidak menambah dependency baru.
- Fokus perubahan minimal dan terlokalisasi pada:
  - `src/components/POS/POS.jsx`
  - `src/components/POS/ReceiptLayouts.jsx`
  - `src/components/POS/ReceiptPreview.jsx`
  - `src/components/POS/POS.css`
