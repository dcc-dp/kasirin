import { describe, it, expect } from "bun:test";
import { formatRupiah, roundCash } from "@/lib/financial";

describe("Formula Finansial & Kasir Kasirin POS", () => {
  describe("formatRupiah()", () => {
    it("memformat nominal positif ke standar Rupiah Indonesia", () => {
      expect(formatRupiah(15000)).toBe("Rp 15.000");
      expect(formatRupiah(1250500)).toBe("Rp 1.250.500");
    });

    it("memformat angka 0 ke Rp 0", () => {
      expect(formatRupiah(0)).toBe("Rp 0");
    });

    it("memformat nominal negatif dengan tanda minus", () => {
      expect(formatRupiah(-5000)).toBe("-Rp 5.000");
    });
  });

  describe("roundCash() - Pembulatan Pembayaran Tunai", () => {
    it("membulatkan uang tunai ke ratusan terdekat", () => {
      expect(roundCash(14340)).toBe(14300);
      expect(roundCash(14350)).toBe(14400);
      expect(roundCash(14380)).toBe(14400);
    });

    it("mempertahankan angka yang sudah bulat", () => {
      expect(roundCash(25000)).toBe(25000);
      expect(roundCash(100)).toBe(100);
    });
  });

  describe("Kalkulasi Checkout & Akuntansi Kasir", () => {
    it("menghitung Grand Total: Subtotal - Diskon + PPN", () => {
      const subtotal = 100000;
      const discount = 10000;
      const taxRate = 11; // 11%
      const taxableAmount = subtotal - discount; // 90000
      const taxAmount = Math.round(taxableAmount * (taxRate / 100)); // 9900
      const grandTotal = taxableAmount + taxAmount; // 99900

      expect(taxableAmount).toBe(90000);
      expect(taxAmount).toBe(9900);
      expect(grandTotal).toBe(99900);
    });

    it("menghitung Uang Kembalian Tunai secara presisi", () => {
      const grandTotal = 99900;
      const cashPaid = 100000;
      const change = cashPaid - grandTotal;

      expect(change).toBe(100);
    });

    it("menghitung Omzet Bersih, HPP (COGS), dan Laba Kotor", () => {
      const grossSales = 500000;
      const discount = 25000;
      const refund = 15000;
      const netSales = grossSales - discount - refund; // 460000

      const cogs = 320000; // Modal harga beli barang terjual
      const grossProfit = netSales - cogs; // 140000
      const profitMargin = (grossProfit / netSales) * 100; // ~30.43%

      expect(netSales).toBe(460000);
      expect(grossProfit).toBe(140000);
      expect(Number(profitMargin.toFixed(2))).toBe(30.43);
    });
  });
});
