// Konversi angka ke terbilang Bahasa Indonesia
const satuan = [
  '', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam',
  'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas',
  'dua belas', 'tiga belas', 'empat belas', 'lima belas',
  'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas',
];

const puluhan = [
  '', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh',
  'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh',
];

function convert(n) {
  if (n < 20)   return satuan[n];
  if (n < 100)  return puluhan[Math.floor(n / 10)] + (n % 10 ? ' ' + satuan[n % 10] : '');
  if (n < 200)  return 'seratus' + (n % 100 ? ' ' + convert(n % 100) : '');
  if (n < 1000) return satuan[Math.floor(n / 100)] + ' ratus' + (n % 100 ? ' ' + convert(n % 100) : '');
  if (n < 2000) return 'seribu' + (n % 1000 ? ' ' + convert(n % 1000) : '');
  if (n < 1e6)  return convert(Math.floor(n / 1000)) + ' ribu' + (n % 1000 ? ' ' + convert(n % 1000) : '');
  if (n < 1e9)  return convert(Math.floor(n / 1e6)) + ' juta' + (n % 1e6 ? ' ' + convert(n % 1e6) : '');
  if (n < 1e12) return convert(Math.floor(n / 1e9)) + ' miliar' + (n % 1e9 ? ' ' + convert(n % 1e9) : '');
  return convert(Math.floor(n / 1e12)) + ' triliun' + (n % 1e12 ? ' ' + convert(n % 1e12) : '');
}

export function terbilang(angka) {
  angka = Math.round(Math.abs(angka));
  if (angka === 0) return 'Nol';
  const hasil = convert(angka);
  return hasil.charAt(0).toUpperCase() + hasil.slice(1) + ' Rupiah';
}
