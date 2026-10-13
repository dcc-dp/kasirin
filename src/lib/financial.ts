/**
 * Utilitas Finansial & Kalkulasi Transaksi Kasirin
 */

/**
 * Format angka ke mata uang Rupiah (contoh: Rp 50.000)
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "Rp 0";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Parse string Rupiah kembali ke angka integer murni
 */
export function parseRupiah(formatted: string): number {
  if (!formatted) return 0;
  const cleaned = formatted.replace(/[^\d]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
}

/**
 * Generate nomor invoice transaksi kasir unik
 * Format: INV-YYYYMMDD-HHMMSS-XXXX (contoh: INV-20261014-153022-7821)
 */
export function generateInvoiceNumber(prefix = "INV"): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}-${year}${month}${date}-${hours}${minutes}${seconds}-${randomSuffix}`;
}

/**
 * Generate nomor faktur restock pembelian supplier unik
 * Format: PUR-YYYYMMDD-XXXX (contoh: PUR-20261014-8921)
 */
export function generatePurchaseInvoice(prefix = "PUR"): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}-${year}${month}${date}-${randomSuffix}`;
}

/**
 * Pembulatan nominal uang tunai kasir ke ratusan terdekat
 * Berguna saat transaksi tunai agar kasir tidak pusing uang koin ganjil
 * Contoh: roundCash(14340, 100) => 14300, roundCash(14370, 100) => 14400
 */
export function roundCash(amount: number, roundTo = 100): number {
  if (roundTo <= 0) return amount;
  return Math.round(amount / roundTo) * roundTo;
}

/**
 * Kalkulasi PPN berdasarkan subtotal belanja setelah diskon
 */
export function calculateTax(subtotalAfterDiscount: number, taxRatePercent: number): number {
  if (subtotalAfterDiscount <= 0 || taxRatePercent <= 0) return 0;
  return Math.round((subtotalAfterDiscount * taxRatePercent) / 100);
}

/**
 * Kalkulasi uang kembalian
 */
export function calculateChange(paidAmount: number, grandTotal: number): number {
  const change = paidAmount - grandTotal;
  return change >= 0 ? change : 0;
}

/**
 * Kalkulasi Laba Kotor (Gross Profit) dari penjualan
 * Laba = (Harga Jual - Harga Beli) * Kuantitas
 */
export function calculateGrossProfit(sellingPrice: number, purchasePrice: number, qty: number): number {
  return (sellingPrice - purchasePrice) * qty;
}

/**
 * Kalkulasi persentase Margin Keuntungan (Markup %)
 * Markup % = ((Harga Jual - Harga Beli) / Harga Beli) * 100
 */
export function calculateMarkupPercent(purchasePrice: number, sellingPrice: number): number {
  if (purchasePrice <= 0) return 0;
  const margin = ((sellingPrice - purchasePrice) / purchasePrice) * 100;
  return Math.round(margin * 10) / 10; // 1 desimal
}
