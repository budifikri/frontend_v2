# PLAN Detail Penjualan

## Tujuan
- Menyederhanakan `PenjualanDetailModal.jsx` agar tanpa tab.
- Konten modal fokus pada:
  1. Header `Detail Penjualan`
  2. Tabel item penjualan

## Scope Perubahan
- File utama: `src/components/ToolbarItem/laporan/penjualan/PenjualanDetailModal.jsx`
- CSS utama: `src/App.css` (jika perlu tambah style metadata header)
- Tidak mengubah alur fetch data detail dari parent.

## Rencana Implementasi
1. Hapus mekanisme tab:
   - hapus state `activeTab`
   - hapus tombol `Summary` dan `Items`
2. Jadikan body modal satu alur:
   - tampilkan info ringkas di header kanan (No Nota, Tanggal, Status)
   - langsung render tabel item penjualan di body
3. Rapikan fallback field item untuk stabilitas data:
   - `unit` => `item.unit ?? item.unit_name ?? '-'`
   - `price` => `item.price ?? item.unit_price ?? 0`
   - `subtotal` => `item.subtotal ?? item.line_total ?? 0`
4. Footer:
   - tombol `Print` dan `Exit` tetap
   - `Total Item` tampil selalu
5. Pastikan state `loading`, `error`, dan `no data` tetap berjalan.

## Design Visual

### Struktur Layar
```
┌─────────────────────────────────────────────────────────────────────┐
│ [icon] Detail Penjualan          No.Nota | Tanggal | Status       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TABLE PENJUALAN                                                     │
│  NO | PRODUK | QTY | SATUAN | HARGA | SUBTOTAL                      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ [Print] [Exit]                                  Total Item: xx      │
└─────────────────────────────────────────────────────────────────────┘
```

### Arah Visual
- Header tetap ringan (`background` soft abu) dengan border bawah tipis.
- Metadata header kanan berukuran kecil, label uppercase, value tegas.
- Tabel tetap pakai style existing (`master-table`) agar konsisten report lain.
- Footer sticky di bagian bawah modal dengan aksi utama jelas.

### Responsive
- Header metadata wrap ke baris berikutnya saat lebar sempit.
- Tabel tetap dapat di-scroll horizontal.
- Tombol footer tetap mudah dijangkau pada mobile.

## TODO
- [ ] Hapus `activeTab` dan seluruh JSX tab di `PenjualanDetailModal.jsx`.
- [ ] Pindahkan ringkasan penting penjualan ke header kanan modal.
- [ ] Render tabel item penjualan sebagai konten utama tunggal.
- [ ] Tambahkan fallback aman untuk nilai `unit`, `price`, `subtotal`.
- [ ] Tampilkan `Total Item` selalu di footer.
- [ ] Hapus class tab yang tidak dipakai agar code bersih.
- [ ] Tambah style metadata header di `App.css` bila belum tersedia.
- [ ] Uji state: loading, error, data kosong, data normal.
- [ ] Jalankan `npm run lint`.
- [ ] Verifikasi manual dari menu laporan penjualan.

## Acceptance Criteria
- Tab `Summary` dan `Items` sudah tidak ada.
- Modal langsung menampilkan tabel item saat detail dibuka.
- Header tetap bertuliskan `Detail Penjualan`.
- Footer tetap punya aksi `Print` dan `Exit`.
- Tidak ada error lint baru akibat perubahan ini.
