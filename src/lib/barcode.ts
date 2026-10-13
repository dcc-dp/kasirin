/**
 * Generator Barcode Utilitas untuk Kasirin
 * Mendukung pembentukan nomor barcode acak dan rendering Barcode Standar Code 128 (SVG)
 */

// Pola Code 128 Standar (107 simbol)
// Format string mewakili lebar bar & space secara bergantian: Bar-Space-Bar-Space-Bar-Space
const CODE128_PATTERNS: readonly string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 100-106 (104=START_B, 106=STOP)
];

const START_CODE_B = 104;
const STOP_CODE = 106;

/**
 * Generate barcode acak numerik 13-digit dengan prefix standar toko (899 untuk Indonesia)
 */
export function generateRandomBarcode(prefix = "899"): string {
  // Tambahkan 9 digit acak
  let randomMiddle = "";
  for (let i = 0; i < 9; i++) {
    randomMiddle += Math.floor(Math.random() * 10).toString();
  }
  const digits12 = `${prefix}${randomMiddle}`;

  // Hitung EAN-13 checksum digit ke-13
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits12[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return `${digits12}${checkDigit}`;
}

/**
 * Konversi teks ke urutan garis Code 128 (subset B)
 * Mengembalikan array modul { isBar: boolean, width: number }
 */
export function encodeCode128(text: string): { isBar: boolean; width: number }[] {
  if (!text) return [];

  const charCodes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    if (code >= 0 && code <= 95) {
      charCodes.push(code);
    }
  }

  // Hitung checksum Code 128
  let checksum = START_CODE_B;
  for (let i = 0; i < charCodes.length; i++) {
    checksum += charCodes[i] * (i + 1);
  }
  checksum = checksum % 103;

  const sequence = [START_CODE_B, ...charCodes, checksum, STOP_CODE];
  const modules: { isBar: boolean; width: number }[] = [];

  for (const sym of sequence) {
    const pattern = CODE128_PATTERNS[sym];
    if (!pattern) continue;

    for (let p = 0; p < pattern.length; p++) {
      const width = parseInt(pattern[p], 10);
      const isBar = p % 2 === 0; // Garis hitam pada posisi genap (0, 2, 4...)
      modules.push({ isBar, width });
    }
  }

  return modules;
}

/**
 * Buat Path SVG dari hasil encoding Code 128
 */
export function generateBarcodeSvgPath(text: string, barHeight = 60, scale = 2): { path: string; totalWidth: number; height: number } {
  const modules = encodeCode128(text);
  if (modules.length === 0) {
    return { path: "", totalWidth: 0, height: barHeight };
  }

  let x = 10 * scale; // Quiet zone awal
  let path = "";

  for (const mod of modules) {
    const modWidth = mod.width * scale;
    if (mod.isBar) {
      path += `M${x},0 h${modWidth} v${barHeight} h-${modWidth} Z `;
    }
    x += modWidth;
  }

  x += 10 * scale; // Quiet zone akhir
  return { path, totalWidth: x, height: barHeight };
}
