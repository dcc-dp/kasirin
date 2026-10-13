import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMidtransConfig, verifyMidtransNotificationSignature } from "@/lib/midtrans";

export const dynamic = "force-dynamic";

/**
 * Midtrans Webhook / HTTP Notification Handler
 * Menerima notifikasi status pembayaran asinkron dari Midtrans
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      transaction_id,
      payment_type,
    } = body;

    if (!order_id || !signature_key) {
      return NextResponse.json(
        { error: "Invalid notification payload" },
        { status: 400 }
      );
    }

    const config = await getMidtransConfig();

    // 1. Verifikasi Keaslian Tanda Tangan Notifikasi (SHA512)
    const isValidSignature = verifyMidtransNotificationSignature(
      order_id,
      status_code,
      gross_amount,
      config.serverKey,
      signature_key
    );

    if (!isValidSignature) {
      console.warn(`[Midtrans Webhook] Invalid signature for order: ${order_id}`);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    // 2. Perbarui transaksi di basis data jika order_id cocok
    const db = getDb();
    const [matchedTx] = await db
      .select({ id: transactions.id, status: transactions.status })
      .from(transactions)
      .where(eq(transactions.midtrans_order_id, order_id))
      .limit(1);

    if (matchedTx) {
      if (transaction_status === "settlement" || transaction_status === "capture") {
        await db
          .update(transactions)
          .set({
            status: "paid",
            midtrans_transaction_id: transaction_id || null,
            midtrans_payment_type: payment_type || null,
            updated_at: new Date(),
          })
          .where(eq(transactions.id, matchedTx.id));
      } else if (
        transaction_status === "cancel" ||
        transaction_status === "deny" ||
        transaction_status === "expire"
      ) {
        await db
          .update(transactions)
          .set({
            status: "cancelled",
            midtrans_transaction_id: transaction_id || null,
            updated_at: new Date(),
          })
          .where(eq(transactions.id, matchedTx.id));
      }
    }

    return NextResponse.json({ status: "OK", order_id, transaction_status });
  } catch (error: any) {
    console.error("[Midtrans Webhook Error]:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
