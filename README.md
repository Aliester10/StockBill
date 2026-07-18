# SOA Generator & Stock Monitoring (StockBill)

Aplikasi berbasis web untuk memudahkan pembuatan Statement of Account (SOA), rekapitulasi data customer, dan memonitoring stok barang (Stock Monitoring) secara efisien.

## 🚀 Fitur Utama
- **Data & Generate (Tagihan)**: Memproses data excel atau input manual untuk menghasilkan dokumen SOA (Statement of Account) dalam format PDF secara otomatis.
- **Rekap Customer**: Menyimpan dan mengelola data master pelanggan.
- **Monitoring Barang (Stock)**: Mengelola stok barang, melihat riwayat Purchase Order (PO), jumlah pesanan, barang transit, barang yang sudah datang, dan sisa pesanan yang belum terpenuhi.
- **Pengaturan (Settings)**: Konfigurasi pengaturan aplikasi (termasuk rekening bank, profil perusahaan, dll).

## 🛠️ Teknologi yang Digunakan
- **Frontend**: React.js (menggunakan Hooks dan Context API)
- **Bundler**: Vite
- **Styling**: Vanilla CSS (menggunakan CSS Variables untuk tema modern dan desain responsif)
- **Export Data**: Ekspor ke PDF (PDFMake/JSPDF) & Excel (XLSX)

## 📁 Struktur Proyek
Proyek ini memiliki struktur folder yang rapih di dalam direktori `src/`:

```
src/
├── components/       # Komponen UI yang dapat digunakan kembali
│   ├── Header.jsx    # Header atas aplikasi
│   ├── Sidebar.jsx   # Navigasi utama samping (Sidebar)
│   ├── Navbar.jsx    # Navigasi utama (untuk tampilan mobile/tablet)
│   ├── Modal.jsx     # Komponen pop-up/modal standar
│   └── Toast.jsx     # Notifikasi sukses/error ringan
│
├── context/          # State management menggunakan React Context
│   └── AppContext.jsx# Context utama penyimpan state aplikasi secara global
│
├── pages/            # Tampilan utama (Halaman)
│   ├── TagihanPage.jsx   # Halaman untuk memproses data tagihan/SOA
│   ├── MasterPage.jsx    # Halaman Rekap Customer
│   ├── StockPage.jsx     # Halaman Monitoring Barang
│   ├── SettingsPage.jsx  # Halaman Pengaturan
│   ├── InputDataPage.jsx # Halaman formulir input manual
│   └── UploadPage.jsx    # Halaman unggah dokumen excel
│
├── utils/            # Fungsi bantuan (Helpers)
│   ├── generateSOA.js        # Logika utama menyusun dan membuat dokumen SOA
│   ├── generatePDF.js        # Fungsi utilitas untuk ekspor ke format PDF
│   ├── parseExcel.js         # Fungsi untuk membaca dan memparsing file excel (Upload)
│   ├── generateStockPDF.js   # Ekspor laporan Monitoring Barang ke PDF
│   ├── generateStockExcel.js # Ekspor laporan Monitoring Barang ke Excel
│   └── terbilang.js          # Fungsi mengubah angka numerik menjadi teks terbilang (misal: "Satu Juta")
│
├── App.jsx           # Komponen root penyusun tata letak (layout) dan routing sederhana
├── index.css         # Styling utama (variabel warna, utilitas dasar)
└── main.jsx          # Titik masuk utama aplikasi (entry point) React
```

## ⚙️ Bagaimana Aplikasi Ini Bekerja

1. **State Management**:
   Aplikasi menggunakan `AppContext` untuk menyimpan data penting (seperti data yang sudah di-parse, pengaturan user, dll) agar dapat diakses dari berbagai halaman tanpa *prop drilling*.

2. **Alur Kerja Pembuatan SOA**:
   - Pengguna masuk ke menu **Data & Generate**.
   - Pengguna mengunggah file Excel berisi rincian tagihan menggunakan logika pembacaan di `parseExcel.js`.
   - Data dikonversi menjadi format tabel di dalam aplikasi untuk ditinjau.
   - Saat pengguna menekan "Generate", aplikasi akan memanggil `generateSOA.js` (dan `generatePDF.js`) untuk menyusun tampilan laporan lalu mendownloadnya dalam bentuk dokumen cetak PDF. Di dalamnya menggunakan `terbilang.js` untuk menuliskan nominal secara teks secara otomatis.

3. **Alur Kerja Monitoring Barang**:
   - Pengguna masuk ke menu **Monitoring Barang**.
   - Terdapat tabel interaktif untuk memonitor pesanan berdasarkan *Vendor*, *No PO*, dan *Status* (GR, Partial, Belum datang).
   - Pengguna bisa mengekspor laporan secara detail ke file PDF (`generateStockPDF.js`) atau Excel (`generateStockExcel.js`).

## 💻 Cara Menjalankan Secara Lokal

Pastikan Anda sudah menginstal **Node.js** di komputer Anda.

1. **Instal dependensi**
   Buka terminal di root proyek dan jalankan:
   ```bash
   npm install
   ```

2. **Jalankan server pengembangan**
   ```bash
   npm run dev
   ```

3. Buka aplikasi di browser, biasanya di alamat `http://localhost:5173`.
