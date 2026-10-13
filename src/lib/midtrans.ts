import crypto from "crypto";
import { getDb } from "@/db";
import { store_settings } from "@/db/schema";

export interface MidtransConfig {
  serverKey: string;
  clientKey: string;
  isProduction: boolean;
  coreApiBaseUrl: string;
  snapApiBaseUrl: string;
  snapJsUrl: string;
}

/**
 * Mengambil konfigurasi Midtrans (memprioritaskan dari database store_settings, lalu fallback ke .env)
 */
export async function getMidtransConfig(): Promise<MidtransConfig> {
  let serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  let clientKey = process.env.MIDTRANS_CLIENT_KEY || "";
  let isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  try {
    const db = getDb();
    const [settings] = await db
      .select({
        midtrans_server_key: store_settings.midtrans_server_key,
        midtrans_client_key: store_settings.midtrans_client_key,
        midtrans_is_production: store_settings.midtrans_is_production,
      })
      .from(store_settings)
      .limit(1);

    if (settings?.midtrans_server_key) {
      serverKey = settings.midtrans_server_key;
    }
    if (settings?.midtrans_client_key) {
      clientKey = settings.midtrans_client_key;
    }
    if (settings?.midtrans_is_production !== undefined && settings?.midtrans_is_production !== null) {
      isProduction = Boolean(settings.midtrans_is_production);
    }
  } catch (error) {
    // Fallback ke .env jika query database gagal
  }

  const coreApiBaseUrl = isProduction
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";

  const snapApiBaseUrl = isProduction
    ? "https://app.midtrans.com/snap/v1"
    : "https://app.sandbox.midtrans.com/snap/v1";

  const snapJsUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  return {
    serverKey,
    clientKey,
    isProduction,
    coreApiBaseUrl,
    snapApiBaseUrl,
    snapJsUrl,
  };
}

/**
 * Header Authorization Basic Auth untuk Midtrans (Server Key sebagai username)
 */
function getAuthHeader(serverKey: string): string {
  return "Basic " + Buffer.from(serverKey + ":").toString("base64");
}

export interface CreateQrisChargeParams {
  orderId: string;
  grossAmount: number;
  customerName?: string;
}

export interface QrisChargeResponse {
  success: boolean;
  orderId?: string;
  transactionId?: string;
  qrString?: string;
  qrCodeUrl?: string;
  expiryTime?: string;
  grossAmount?: number;
  error?: string;
}

/**
 * 1. Membuat Transaksi QRIS Dinamis via Midtrans Core API
 */
export async function createMidtransQrisCharge(
  params: CreateQrisChargeParams
): Promise<QrisChargeResponse> {
  const config = await getMidtransConfig();

  if (!config.serverKey) {
    return {
      success: false,
      orderId: params.orderId,
      error: "MIDTRANS_SERVER_KEY belum dikonfigurasi di sistem.",
    };
  }

  try {
    const payload = {
      payment_type: "qris",
      transaction_details: {
        order_id: params.orderId,
        gross_amount: Math.round(params.grossAmount),
      },
      qris: {
        acquirer: "gopay",
      },
      customer_details: {
        first_name: params.customerName || "Pelanggan Toko",
      },
    };

    const response = await fetch(`${config.coreApiBaseUrl}/v2/charge`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(config.serverKey),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || (data.status_code && data.status_code !== "201")) {
      return {
        success: false,
        orderId: params.orderId,
        error: data.status_message || `Midtrans error: ${response.status}`,
      };
    }

    const qrCodeAction = data.actions?.find(
      (a: any) => a.name === "generate-qr-code" || a.name === "generate-qr-code-v2"
    );

    return {
      success: true,
      orderId: data.order_id || params.orderId,
      transactionId: data.transaction_id,
      qrString: data.qr_string,
      qrCodeUrl: qrCodeAction?.url,
      expiryTime: data.expiry_time,
      grossAmount: Number(data.gross_amount),
    };
  } catch (error: any) {
    console.error("Midtrans QRIS Charge Error:", error);
    return {
      success: false,
      orderId: params.orderId,
      error: error.message || "Gagal menghubungkan ke Midtrans Gateway.",
    };
  }
}

export interface MidtransStatusResponse {
  success: boolean;
  orderId?: string;
  transactionId?: string;
  transactionStatus?: string; // "settlement", "pending", "expire", "cancel", "deny"
  isSettled: boolean;
  paymentType?: string;
  grossAmount?: number;
  settlementTime?: string;
  statusMessage?: string;
  error?: string;
}

/**
 * 2. Memeriksa Status Transaksi Midtrans secara Real-Time
 */
export async function checkMidtransStatus(
  orderId: string
): Promise<MidtransStatusResponse> {
  const config = await getMidtransConfig();

  if (!config.serverKey) {
    return {
      success: false,
      orderId,
      isSettled: false,
      error: "MIDTRANS_SERVER_KEY belum dikonfigurasi.",
    };
  }

  try {
    const response = await fetch(
      `${config.coreApiBaseUrl}/v2/${encodeURIComponent(orderId)}/status`,
      {
        headers: {
          Authorization: getAuthHeader(config.serverKey),
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok && response.status !== 200 && response.status !== 201) {
      return {
        success: false,
        orderId,
        isSettled: false,
        error: data.status_message || `HTTP ${response.status}`,
      };
    }

    const isSettled =
      data.transaction_status === "settlement" ||
      data.transaction_status === "capture";

    return {
      success: true,
      orderId: data.order_id || orderId,
      transactionId: data.transaction_id,
      transactionStatus: data.transaction_status,
      isSettled,
      paymentType: data.payment_type,
      grossAmount: Number(data.gross_amount),
      settlementTime: data.settlement_time || data.transaction_time,
      statusMessage: data.status_message,
    };
  } catch (error: any) {
    return {
      success: false,
      orderId,
      isSettled: false,
      error: error.message || "Gagal mengambil status transaksi Midtrans.",
    };
  }
}

export interface CreateSnapTokenParams {
  orderId: string;
  grossAmount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items?: { id: string; price: number; quantity: number; name: string }[];
}

export interface SnapTokenResponse {
  success: boolean;
  orderId?: string;
  token?: string;
  redirectUrl?: string;
  clientKey?: string;
  snapJsUrl?: string;
  error?: string;
}

/**
 * 3. Membuat Snap Token untuk Pembayaran Multi Non-Tunai (QRIS, E-Wallet, VA Bank)
 */
export async function createMidtransSnapToken(params: CreateSnapTokenParams): Promise<SnapTokenResponse> {
  const config = await getMidtransConfig();

  if (!config.serverKey) {
    return {
      success: false,
      error: "MIDTRANS_SERVER_KEY belum dikonfigurasi.",
    };
  }

  try {
    const payload = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: Math.round(params.grossAmount),
      },
      customer_details: {
        first_name: params.customerName || "Pelanggan Toko",
        email: params.customerEmail || "customer@kasirin.app",
        phone: params.customerPhone || "081234567890",
      },
      item_details: params.items?.map((item) => ({
        id: String(item.id),
        price: Math.round(item.price),
        quantity: item.quantity,
        name: item.name.slice(0, 50),
      })),
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/kasir`,
      },
    };

    const response = await fetch(`${config.snapApiBaseUrl}/transactions`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(config.serverKey),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.token) {
      return {
        success: false,
        error: data.error_messages?.[0] || data.status_message || "Gagal membuat Snap token.",
      };
    }

    return {
      success: true,
      token: data.token,
      redirectUrl: data.redirect_url,
      clientKey: config.clientKey,
      snapJsUrl: config.snapJsUrl,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menghubungkan ke Midtrans Snap.",
    };
  }
}

/**
 * 4. Memvalidasi Tanda Tangan Webhook Notifikasi Midtrans
 * Rumus: SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransNotificationSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
  signatureKey: string
): boolean {
  try {
    const raw = orderId + statusCode + grossAmount + serverKey;
    const computedSignature = crypto
      .createHash("sha512")
      .update(raw)
      .digest("hex");
    return computedSignature.toLowerCase() === signatureKey.toLowerCase();
  } catch (error) {
    return false;
  }
}
