"use server";

import {
  createMidtransQrisCharge,
  checkMidtransStatus,
  createMidtransSnapToken,
  getMidtransConfig,
  type QrisChargeResponse,
  type MidtransStatusResponse,
  type SnapTokenResponse,
} from "@/lib/midtrans";
import { getSession } from "@/lib/auth";

/**
 * 1. Memicu Pembuatan QRIS Dinamis Midtrans dari Layar Kasir POS
 */
export async function requestMidtransQris(
  amount: number,
  customerName?: string
): Promise<QrisChargeResponse> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Sesi kasir tidak valid." };
  }

  if (amount <= 0) {
    return { success: false, error: "Nominal pembayaran tidak valid." };
  }

  const orderId = `QRIS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const chargeResult = await createMidtransQrisCharge({
    orderId,
    grossAmount: amount,
    customerName: customerName || "Pelanggan POS",
  });

  return chargeResult;
}

/**
 * 2. Memeriksa Status Pembayaran QRIS Midtrans (Polling Kasir)
 */
export async function pollMidtransQrisStatus(
  orderId: string
): Promise<MidtransStatusResponse> {
  if (!orderId) {
    return { success: false, isSettled: false, error: "Order ID kosong." };
  }

  const status = await checkMidtransStatus(orderId);
  return status;
}

/**
 * 3. Memicu Pembuatan Token Snap Midtrans (Multi Non-Tunai)
 */
export async function requestMidtransSnap(
  amount: number,
  items?: { id: string; price: number; quantity: number; name: string }[],
  customerName?: string
): Promise<SnapTokenResponse> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Sesi kasir tidak valid." };
  }

  const orderId = `SNAP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const snapResult = await createMidtransSnapToken({
    orderId,
    grossAmount: amount,
    customerName,
    items,
  });

  if (!snapResult.success) {
    return snapResult;
  }

  return {
    ...snapResult,
    orderId,
  };
}

/**
 * 4. Uji Koneksi Kredensial Midtrans (Untuk Halaman Pengaturan Admin)
 */
export async function testMidtransConnection() {
  const session = await getSession();
  if (!session || session.roleCode === "KSR") {
    return { success: false, error: "Akses ditolak." };
  }

  const config = await getMidtransConfig();

  if (!config.serverKey) {
    return {
      success: false,
      error: "MIDTRANS_SERVER_KEY belum diisi.",
    };
  }

  try {
    const start = performance.now();
    // Panggil endpoint charge simulasi atau endpoint status
    const dummyOrderId = `TEST-PING-${Date.now()}`;
    const res = await fetch(`${config.coreApiBaseUrl}/v2/${dummyOrderId}/status`, {
      headers: {
        Authorization: "Basic " + Buffer.from(config.serverKey + ":").toString("base64"),
        Accept: "application/json",
      },
    });

    const latency = Math.round(performance.now() - start);
    const data = await res.json();

    // Jika 401 Unauthorized -> Server Key salah
    if (res.status === 401) {
      return {
        success: false,
        error: "Kredensial Server Key tidak valid (401 Unauthorized). Periksa Server Key Anda.",
        latencyMs: latency,
      };
    }

    // Jika 404 Not Found -> Berarti auth valid tapi transaksi dummy belum ada (koneksi sukses!)
    // Atau jika 200/201 -> Sukses
    if (res.status === 404 || res.status === 200 || data.status_code === "404") {
      return {
        success: true,
        message: "Koneksi ke Midtrans Payment Gateway BERHASIL!",
        environment: config.isProduction ? "Production" : "Sandbox (Uji Coba)",
        merchantId: data.merchant_id || "Terhubung",
        latencyMs: latency,
      };
    }

    return {
      success: true,
      message: "Terhubung ke Midtrans Gateway.",
      environment: config.isProduction ? "Production" : "Sandbox (Uji Coba)",
      latencyMs: latency,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menghubungi server Midtrans.",
    };
  }
}
