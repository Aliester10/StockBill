# Catatan Pengembangan & Revisi SOA (StockBill)
**Tanggal:** 23 Juli 2026

## Revisi yang Sudah Diselesaikan:

### 1. Perbaikan Kolom Jatuh Tempo (NaN Hari)
- **Masalah:** Jika tanggal jatuh tempo belum diisi atau formatnya `YYYY-MM-DD`, sistem mengkalkulasi selisih hari menjadi `NaN` dan menampilkannya sebagai `NaN Hari`.
- **Solusi:** 
  - Memperbarui fungsi `hitungUmur` di `TagihanPage.jsx` dan `InputDataPage.jsx` agar otomatis mengembalikan karakter `"-"` (strip) apabila tanggal kosong atau tidak valid, serta mendukung format `YYYY-MM-DD` dan `DD/MM/YYYY`.
  - Tabel kini menampilkan `"-"` tanpa tambahan string "Hari" jika tanggal belum diisi.

### 2. Perbaikan Perhitungan Rekap "Total Close" dan "Total Open"
- **Masalah:** Di menu Rekap Customer, jika nilai Nominal (Total Tagihan) adalah 0, sistem tidak menghitung totalnya meskipun tagihan tersebut dibayar menggunakan termin (Termin 1, 2, dan 3) yang jumlahnya bernilai (misalnya 900rb). Hal ini membuat Total Close tidak cocok dengan nilai invoice sebenarnya.
- **Solusi:**
  - Menambahkan fungsi helper pembacaan Nilai Full tagihan, yakni: `Nilai = Maksimal dari (Nominal, Total Termin 1-3)`.
  - Mengimplementasikan helper tersebut ke dalam perhitungan variabel `totalOpen`, `totalClose`, dan `totalSemua`.
  - Pembaruan ini diaplikasikan di:
    - `MasterPage.jsx` (Rekap Customer dan Footer Keseluruhan)
    - `TagihanPage.jsx` (Filter Status)
    - `InputDataPage.jsx` (Summary Total Data)
    - `UploadPage.jsx` (Preview Data)
    - `utils/generatePDF.js` (Export Data PDF)

## Status Terkini:
Kedua masalah utama (Kolom Jatuh Tempo & Rekap Keseluruhan Customer) sudah beres, valid, dan di-sync di seluruh halaman app. Siap dilanjutkan untuk fitur atau revisi selanjutnya ketika Anda kembali.
