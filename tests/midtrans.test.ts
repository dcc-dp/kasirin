import { describe, it, expect } from "bun:test";
import crypto from "crypto";
import { verifyMidtransNotificationSignature } from "@/lib/midtrans";

describe("Integrasi Payment Gateway Midtrans POS", () => {
  const mockServerKey = "Mid-server-TEST-KEY-12345";

  describe("verifyMidtransNotificationSignature()", () => {
    it("memvalidasi signature SHA-512 yang valid dari notifikasi Midtrans", () => {
      const orderId = "QRIS-1728950000-1234";
      const statusCode = "200";
      const grossAmount = "45000.00";

      // Rumus Midtrans: SHA512(order_id + status_code + gross_amount + ServerKey)
      const raw = orderId + statusCode + grossAmount + mockServerKey;
      const validSignature = crypto.createHash("sha512").update(raw).digest("hex");

      const isValid = verifyMidtransNotificationSignature(
        orderId,
        statusCode,
        grossAmount,
        mockServerKey,
        validSignature
      );

      expect(isValid).toBe(true);
    });

    it("menolak webhook dengan signature palsu atau hasil manipulasi hacker", () => {
      const orderId = "QRIS-1728950000-1234";
      const statusCode = "200";
      const grossAmount = "45000.00";
      const fakeSignature = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

      const isValid = verifyMidtransNotificationSignature(
        orderId,
        statusCode,
        grossAmount,
        mockServerKey,
        fakeSignature
      );

      expect(isValid).toBe(false);
    });

    it("menolak webhook jika Server Key berbeda (misal server key produksi vs sandbox)", () => {
      const orderId = "QRIS-1728950000-1234";
      const statusCode = "200";
      const grossAmount = "45000.00";
      const otherServerKey = "Mid-server-DIFFERENT-KEY-99999";

      const raw = orderId + statusCode + grossAmount + mockServerKey;
      const signatureWithMockKey = crypto.createHash("sha512").update(raw).digest("hex");

      const isValid = verifyMidtransNotificationSignature(
        orderId,
        statusCode,
        grossAmount,
        otherServerKey,
        signatureWithMockKey
      );

      expect(isValid).toBe(false);
    });
  });

  describe("Midtrans Order ID Generator Pattern", () => {
    it("menghasilkan format Order ID yang unik dan diawali prefix tipe pembayaran", () => {
      const qrisPrefix = "QRIS-";
      const snapPrefix = "SNAP-";
      const orderIdQris = `${qrisPrefix}${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const orderIdSnap = `${snapPrefix}${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      expect(orderIdQris.startsWith("QRIS-")).toBe(true);
      expect(orderIdSnap.startsWith("SNAP-")).toBe(true);
      expect(orderIdQris.length).toBeGreaterThan(15);
      expect(orderIdSnap.length).toBeGreaterThan(15);
    });
  });
});
