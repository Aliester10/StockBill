# 🚀 Panduan Instalasi Aplikasi Tagihan (Untuk Pemula)

Selamat datang! Aplikasi ini dibuat agar sangat mudah diinstal tanpa perlu mengerti bahasa pemrograman sama sekali. Anda hanya perlu melakukan **copy-paste** dan mengikuti langkah-langkah di bawah ini secara berurutan.

---

## 🛠️ Langkah-Langkah Pemasangan (Instalasi)

### Tahap 1: Membuat "Database" Anda
Aplikasi ini menggunakan Google Spreadsheet sebagai tempat penyimpanan datanya.
1. Buka tab baru di browser Anda dan ketik: [sheets.new](https://sheets.new) (tekan Enter).
2. Sebuah file Google Sheets kosong akan terbuka. 
3. Beri nama file tersebut di pojok kiri atas (misalnya: **"Database Tagihan & Stok"**).

### Tahap 2: Memasukkan Kode Aplikasi
1. Pada halaman Google Sheets tersebut, klik menu **Ekstensi** (di deretan menu atas) lalu pilih **Apps Script**.
2. Sebuah tab baru akan terbuka. Ini adalah tempat kita akan menaruh kodenya.
3. Di panel sebelah kiri, Anda akan melihat file bernama `Code.gs`. Klik file tersebut.
4. **Hapus semua teks** yang ada di kotak sebelah kanan, lalu **copy-paste** seluruh isi dari file `Code.gs` yang ada di dalam folder aplikasi ini.
5. Selanjutnya, kita akan membuat halaman tampilannya. Di panel kiri, klik tombol **Tambah file (ikon +)**, lalu pilih **HTML**.
6. Akan muncul kolom untuk mengetik nama. Ketikkan persis dengan nama ini: **`index`** (huruf kecil semua, lalu tekan Enter).
7. Klik file `index.html` yang baru dibuat. **Hapus semua teks bawaannya**, lalu **copy-paste** seluruh isi dari file `index.html` yang ada di folder aplikasi ini.

### Tahap 3: Sedikit Pengaturan Khusus
1. Di panel paling kiri (barisan ikon), klik ikon **Roda Gigi ⚙️** (Pengaturan Project).
2. Cari kotak centang bertuliskan **"Tampilkan file manifes 'appsscript.json' di editor"** lalu centang kotak tersebut.
3. Kembali ke tampilan file dengan mengklik ikon **Kurung Sudut `< >`** (Editor) di kiri atas.
4. Sekarang akan muncul file baru bernama `appsscript.json`. Klik file tersebut.
5. Hapus isinya, lalu copy-paste dari file `appsscript.json` milik aplikasi ini.
6. **Jangan lupa simpan!** Klik tombol disket 💾 (Simpan project) di bagian atas.

### Tahap 4: Menghubungkan Aplikasi ke Database
Langkah ini sangat penting agar aplikasi tahu ke Spreadsheet mana ia harus menyimpan data.
1. Klik kembali file `Code.gs`.
2. Di bagian atas layar (sebelah kiri tombol "Jalankan" atau "Run"), ada kotak dropdown (pilihan). Klik kotak tersebut dan ubah pilihannya menjadi **`sambungkanKeSpreadsheetIni`**.
3. Klik tombol **▶️ Jalankan (Run)**.
4. *PENTING:* Jika muncul kotak peringatan "Otorisasi Diperlukan" (Authorization Required):
   - Klik **Tinjau Izin (Review Permissions)**.
   - Pilih akun Google Anda.
   - Jika muncul peringatan keamanan merah, klik tulisan kecil **"Lanjutan (Advanced)"** di paling bawah.
   - Scroll ke bawah dan klik **"Buka [Nama Project Anda] (tidak aman)"**.
   - Terakhir, klik **Izinkan (Allow)**.

### Tahap 5: Meluncurkan Aplikasi (Selesai!)
1. Di pojok kanan atas layar, klik tombol biru bertuliskan **Terapkan (Deploy)**.
2. Pilih **Deployment Baru (New deployment)**.
3. Di kotak yang muncul, klik ikon Roda Gigi ⚙️ di sebelah tulisan "Pilih jenis", lalu pilih **Aplikasi Web (Web App)**.
4. Isi data berikut:
   - **Deskripsi:** Bebas diisi apa saja (contoh: *Versi 1*).
   - **Aplikasi dieksekusi sebagai:** Biarkan pada pilihan *Saya (Me)*.
   - **Siapa yang memiliki akses:** Ubah menjadi **Siapa saja (Anyone)** agar linknya bisa diakses.
5. Klik tombol **Terapkan (Deploy)**.
6. Tunggu beberapa detik... Selamat! Anda akan mendapatkan **"URL Aplikasi Web"**.
7. **Copy (Salin) link URL tersebut**. Link tersebut adalah alamat aplikasi Anda yang bisa Anda buka di HP maupun Komputer.

---

## 💡 Cara Melakukan Update di Masa Depan
Jika suatu saat ada perbaikan atau penambahan fitur (dan Anda diberi file `Code.gs` atau `index.html` yang baru):
1. Buka kembali Google Sheets Anda > Ekstensi > Apps Script.
2. Timpa (paste) kode lama dengan kode yang baru di file yang sesuai.
3. Klik **Terapkan (Deploy)** > **Kelola deployment (Manage deployments)**.
4. Klik ikon pensil ✏️ (Edit) di sebelah kanan atas kotak.
5. Pada bagian **Versi (Version)**, pilih **Versi Baru (New version)**.
6. Klik **Terapkan (Deploy)**. Selesai! Tidak perlu link baru, link lama Anda akan otomatis diperbarui.

---

*Catatan: Pastikan komputer atau HP Anda terhubung ke internet saat menggunakan aplikasi ini karena sistem memerlukan internet untuk menyimpan data dan mencetak PDF/Excel.*
