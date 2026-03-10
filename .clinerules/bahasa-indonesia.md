## Brief overview
Pedoman penggunaan Cline dalam bahasa Indonesia untuk proyek frontend_v2. File ini berisi aturan dan preferensi komunikasi serta pengembangan kode yang spesifik untuk pengguna berbahasa Indonesia.

## Komunikasi dalam bahasa Indonesia
- Gunakan bahasa Indonesia untuk semua komunikasi dengan pengguna
- Pertahankan gaya penulisan yang jelas dan teknis
- Hindari penggunaan kata-kata Inggris kecuali untuk istilah teknis yang sudah umum
- Gunakan struktur kalimat yang formal dan profesional

## Preferensi pengembangan kode
- Gunakan JavaScript dengan React untuk pengembangan frontend
- Ikuti struktur proyek yang sudah ada di `src/`
- Gunakan ESM (ECMAScript Modules) sebagai sistem module
- Pertahankan konsistensi dengan pola kode yang sudah ada

## Struktur proyek
- Kode frontend berada di direktori `src/`
- Komponen React menggunakan ekstensi `.jsx`
- Gunakan 2 spasi untuk indentasi
- Gunakan single quotes untuk string JavaScript

## Konvensi penamaan
- Komponen React: `PascalCase` (contoh: `App`, `LoginPanel`)
- Variabel/fungsi: `camelCase` (contoh: `handleSubmit`, `userData`)
- CSS classes: kebab-case (contoh: `window-titlebar`, `action-buttons`)
- File komponen reusable: `PascalCase.jsx` (contoh: `MasterDetailTable.jsx`)

## Aturan import
- Urutan import: 1) third-party packages, 2) local CSS, 3) local modules/components
- Gunakan satu baris kosong antar grup import
- Gunakan import relatif di dalam `src/`
- Hapus import yang tidak digunakan

## Pengembangan React
- Gunakan functional components
- Pertahankan komponen yang fokus dan kecil
- Ekstrak helper untuk logika UI yang kompleks
- Gunakan React Hooks sesuai kebutuhan

## CSS dan styling
- Pertahankan gaya visual yang sudah ada
- Gunakan CSS variables untuk nilai yang berulang
- Pertahankan responsive behavior dengan media queries
- Gunakan class names yang deskriptif

## Error handling
- Guard event handlers dari input/state yang invalid
- Tampilkan fallback UI yang graceful
- Log error yang actionable di development
- Gunakan Result propagation di Rust/Tauri

## Testing
- Gunakan Vitest untuk testing JavaScript
- Jalankan `npm run test` untuk watch mode
- Gunakan `npm run test:run` untuk menjalankan semua test
- Gunakan `npx vitest run -t "test name"` untuk single test

## Build dan deployment
- Gunakan `npm run build` untuk production build
- Gunakan `npm run dev` untuk development server
- Gunakan `npm run tauri:dev` untuk desktop development
- Pastikan ESLint lulus sebelum commit