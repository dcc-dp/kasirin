"use server";

import { eq, sql, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  transactions,
  transaction_details,
  products,
  members,
  users,
  stock_logs,
  cash_shifts,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { generateInvoiceNumber, calculateChange } from "@/lib/financial";
import type { ActionResponse } from "@/types/action";

export type CartItemInput = {
  product_id: number;
  name: string;
  quantity: number;
  selling_price: number;
  subtotal: number;
};

export type CheckoutInput = {
  member_id?: number | null;
  items: CartItemInput[];
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  payment_method: "cash" | "transfer" | "qris";
  paid_amount: number;
  points_redeemed?: number;
};

export type ReceiptDetail = {
  invoice_number: string;
  transaction_date: Date;
  user_name: string;
  member_name: string | null;
  member_phone: string | null;
  items: {
    product_id: number;
    name: string;
    selling_price: number;
    quantity: number;
    subtotal: number;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  payment_method: "cash" | "transfer" | "qris";
  paid_amount: number;
  change_amount: number;
  point_gained: number;
  points_redeemed: number;
};

/**
 * Eksekusi Checkout Transaksi Kasir (Transaksi Atomik ACID MySQL)
 * Menguji ketersediaan stok, memotong stok riil, mencatat mutasi keluar,
 * menambah poin member, dan mengunci transaksi.
 */
export async function checkoutTransaction(
  data: CheckoutInput
): Promise<ActionResponse<ReceiptDetail>> {
  try {
    const db = getDb();
    const session = await getSession();

    let userId = session?.userId;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id, name: users.name }).from(users).limit(1);
      userId = firstUser?.id;
    }

    if (!userId) {
      return { success: false, message: "Sesi kasir tidak valid. Harap login kembali." };
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, message: "Keranjang belanja masih kosong." };
    }

    if (data.grand_total < 0) {
      return { success: false, message: "Total belanja tidak valid." };
    }

    if (data.payment_method === "cash" && data.paid_amount < data.grand_total) {
      return {
        success: false,
        message: `Nominal uang bayar (Rp ${data.paid_amount.toLocaleString("id-ID")}) kurang dari total belanja (Rp ${data.grand_total.toLocaleString("id-ID")}).`,
      };
    }

    // Pastikan Kasir Memiliki Shift yang Sedang Aktif
    const [openShift] = await db
      .select({ id: cash_shifts.id })
      .from(cash_shifts)
      .where(and(eq(cash_shifts.user_id, userId), eq(cash_shifts.status, "open")));

    if (!openShift) {
      return {
        success: false,
        message: "Anda belum membuka shift kasir. Silakan buka shift kasir terlebih dahulu sebelum melayani transaksi.",
      };
    }

    const changeAmount = calculateChange(data.paid_amount, data.grand_total);
    const invoiceNumber = generateInvoiceNumber("INV");
    const transactionDate = new Date();

    // Hitung perolehan poin: 1 poin per Rp 10.000 belanja
    const pointGained = data.member_id && data.grand_total >= 10000
      ? Math.floor(data.grand_total / 10000)
      : 0;

    const pointsRedeemed = data.points_redeemed || 0;

    // Ambil info nama user & member
    const [cashierUser] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId));
    let memberRecord: { nama: string; phone: string; poin: number } | null = null;
    if (data.member_id) {
      const [m] = await db.select().from(members).where(eq(members.id, data.member_id));
      memberRecord = m || null;
    }

    let insertedTxId = 0;

    // Transaksi Atomik Database
    await db.transaction(async (tx: any) => {
      // 1. Validasi Stok Seluruh Produk (Negative Stock Prevention)
      for (const item of data.items) {
        const [prod] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.product_id));

        if (!prod) {
          throw new Error(`Produk "${item.name}" tidak ditemukan di database.`);
        }

        if (prod.stock < item.quantity) {
          throw new Error(
            `Stok untuk produk "${prod.name}" tidak mencukupi (Tersisa: ${prod.stock}, Diminta: ${item.quantity}).`
          );
        }
      }

      // 2. Insert ke tabel `transactions`
      const [insertedTx] = await tx.insert(transactions).values({
        invoice_number: invoiceNumber,
        member_id: data.member_id || null,
        user_id: userId,
        point_gained: pointGained,
        transaction_date: transactionDate,
        subtotal: data.subtotal,
        discount: data.discount,
        grand_total: data.grand_total,
        payment_methode: data.payment_method,
        paid_amount: data.paid_amount,
        change_amount: changeAmount,
        status: "paid",
        tax: data.tax,
      });

      insertedTxId = Number(insertedTx.insertId);

      // 3. Insert `transaction_details`, kurangi stok produk, & catat `stock_logs`
      for (const item of data.items) {
        const [prod] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.product_id));

        const stockBefore = prod.stock;
        const stockAfter = stockBefore - item.quantity;

        // Insert item detail transaksi dengan snapshot HPP
        await tx.insert(transaction_details).values({
          transaction_id: insertedTxId,
          product_id: item.product_id,
          name: prod.name,
          description: prod.description || "",
          selling_price: item.selling_price,
          purchase_price: prod.purchase_price, // Catat HPP saat transaksi
          quantity: item.quantity,
          subtotal: item.subtotal,
        });

        // Potong stok produk
        await tx
          .update(products)
          .set({
            stock: stockAfter,
            updated_at: new Date(),
          })
          .where(eq(products.id, item.product_id));

        // Catat mutasi keluar di `stock_logs`
        await tx.insert(stock_logs).values({
          product_id: item.product_id,
          type: "out",
          quantity: item.quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reference_type: "transaction",
          reference_id: insertedTxId,
          description: `Penjualan POS #${invoiceNumber}`,
          user_id: userId,
        });
      }

      // 4. Update Saldo Poin Member (jika member dipilih)
      if (data.member_id && memberRecord) {
        const currentPoints = memberRecord.poin;
        const netPoints = Math.max(0, currentPoints - pointsRedeemed + pointGained);

        await tx
          .update(members)
          .set({
            poin: netPoints,
            updated_at: new Date(),
          })
          .where(eq(members.id, data.member_id));
      }
    });

    try {
      revalidatePath("/kasir");
      revalidatePath("/admin/products");
      revalidatePath("/admin/products/stock-logs");
      revalidatePath("/admin/transactions");
      revalidatePath("/admin/shifts");
      revalidatePath("/admin/members");
    } catch {
      // safe fallback
    }

    const receiptPayload: ReceiptDetail = {
      invoice_number: invoiceNumber,
      transaction_date: transactionDate,
      user_name: cashierUser?.name || "Kasir",
      member_name: memberRecord?.nama || null,
      member_phone: memberRecord?.phone || null,
      items: data.items.map((it) => ({
        product_id: it.product_id,
        name: it.name,
        selling_price: it.selling_price,
        quantity: it.quantity,
        subtotal: it.subtotal,
      })),
      subtotal: data.subtotal,
      discount: data.discount,
      tax: data.tax,
      grand_total: data.grand_total,
      payment_method: data.payment_method,
      paid_amount: data.paid_amount,
      change_amount: changeAmount,
      point_gained: pointGained,
      points_redeemed: pointsRedeemed,
    };

    return {
      success: true,
      message: `Transaksi #${invoiceNumber} berhasil diselesaikan.`,
      data: receiptPayload,
    };
  } catch (error: any) {
    console.error("Checkout error:", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan saat memproses transaksi pembayaran.",
    };
  }
}

/**
 * Mengambil struk transaksi berdasarkan nomor invoice
 */
export async function getReceiptByInvoice(
  invoiceNumber: string
): Promise<ReceiptDetail | null> {
  const db = getDb();

  const [tx] = await db
    .select({
      id: transactions.id,
      invoice_number: transactions.invoice_number,
      transaction_date: transactions.transaction_date,
      subtotal: transactions.subtotal,
      discount: transactions.discount,
      grand_total: transactions.grand_total,
      payment_method: transactions.payment_methode,
      paid_amount: transactions.paid_amount,
      change_amount: transactions.change_amount,
      tax: transactions.tax,
      point_gained: transactions.point_gained,
      user_name: users.name,
      member_name: members.nama,
      member_phone: members.phone,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.user_id, users.id))
    .leftJoin(members, eq(transactions.member_id, members.id))
    .where(eq(transactions.invoice_number, invoiceNumber));

  if (!tx) return null;

  const items = await db
    .select({
      product_id: transaction_details.product_id,
      name: transaction_details.name,
      selling_price: transaction_details.selling_price,
      quantity: transaction_details.quantity,
      subtotal: transaction_details.subtotal,
    })
    .from(transaction_details)
    .where(eq(transaction_details.transaction_id, tx.id));

  return {
    invoice_number: tx.invoice_number,
    transaction_date: tx.transaction_date || new Date(),
    user_name: tx.user_name || "Kasir",
    member_name: tx.member_name || null,
    member_phone: tx.member_phone || null,
    items,
    subtotal: tx.subtotal,
    discount: tx.discount,
    tax: tx.tax,
    grand_total: tx.grand_total,
    payment_method: tx.payment_method,
    paid_amount: tx.paid_amount,
    change_amount: tx.change_amount,
    point_gained: tx.point_gained || 0,
    points_redeemed: 0,
  };
}
