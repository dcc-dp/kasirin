"use server";

import { eq, sql, desc, and, or, like, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  transactions,
  transaction_details,
  products,
  members,
  users,
  roles,
  stock_logs,
  cash_shifts,
  cash_movements,
  returns,
  return_details,
} from "@/db/schema";
import { getSession, comparePassword } from "@/lib/auth";
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
  midtrans_order_id?: string | null;
  midtrans_transaction_id?: string | null;
  midtrans_payment_type?: string | null;
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
        transaction_date: sql`CURRENT_TIMESTAMP`,
        subtotal: data.subtotal,
        discount: data.discount,
        grand_total: data.grand_total,
        payment_methode: data.payment_method,
        paid_amount: data.paid_amount,
        change_amount: changeAmount,
        status: "paid",
        tax: data.tax,
        midtrans_order_id: data.midtrans_order_id || null,
        midtrans_transaction_id: data.midtrans_transaction_id || null,
        midtrans_payment_type: data.midtrans_payment_type || null,
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

export type TransactionListItem = {
  id: number;
  invoice_number: string;
  transaction_date: Date;
  user_id: number;
  user_name: string;
  member_id: number | null;
  member_name: string | null;
  member_phone: string | null;
  subtotal: number;
  discount: number;
  grand_total: number;
  payment_method: "cash" | "transfer" | "qris";
  paid_amount: number;
  change_amount: number;
  status: "pending" | "paid" | "cancelled";
  tax: number;
  point_gained: number;
  void_reason: string | null;
  voided_by: number | null;
  voided_by_name: string | null;
  voided_at: Date | null;
  item_count: number;
  total_refunded: number;
};

export type TransactionKPIs = {
  total_transactions: number;
  total_revenue: number;
  total_void: number;
  total_returns: number;
};

/**
 * Mengambil daftar seluruh transaksi penjualan dengan filter & ringkasan KPI
 */
export async function getTransactions(filters?: {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ list: TransactionListItem[]; kpis: TransactionKPIs }> {
  const db = getDb();

  // Alias untuk user supervisor pem-void
  const supervisorUsers = sql`supervisor_users`;

  const query = sql`
    SELECT 
      t.id,
      t.invoice_number,
      t.transaction_date,
      t.user_id,
      u.name AS user_name,
      t.member_id,
      m.nama AS member_name,
      m.phone AS member_phone,
      t.subtotal,
      t.discount,
      t.grand_total,
      t.payment_method,
      t.paid_amount,
      t.change_amount,
      t.status,
      t.tax,
      t.point_gained,
      t.void_reason,
      t.voided_by,
      v.name AS voided_by_name,
      t.voided_at,
      COALESCE((SELECT COUNT(*) FROM transaction_details td WHERE td.transaction_id = t.id), 0) AS item_count,
      COALESCE((SELECT SUM(r.total_refund) FROM \`returns\` r WHERE r.transaction_id = t.id), 0) AS total_refunded
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN members m ON t.member_id = m.id
    LEFT JOIN users v ON t.voided_by = v.id
    WHERE 1=1
  `;

  const rows: any = await db.execute(sql`
    SELECT 
      t.id,
      t.invoice_number,
      t.transaction_date,
      t.user_id,
      u.name AS user_name,
      t.member_id,
      m.nama AS member_name,
      m.phone AS member_phone,
      t.subtotal,
      t.discount,
      t.grand_total,
      t.payment_method,
      t.paid_amount,
      t.change_amount,
      t.status,
      t.tax,
      t.point_gained,
      t.void_reason,
      t.voided_by,
      v.name AS voided_by_name,
      t.voided_at,
      COALESCE((SELECT COUNT(*) FROM transaction_details td WHERE td.transaction_id = t.id), 0) AS item_count,
      COALESCE((SELECT SUM(r.total_refund) FROM \`returns\` r WHERE r.transaction_id = t.id), 0) AS total_refunded
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN members m ON t.member_id = m.id
    LEFT JOIN users v ON t.voided_by = v.id
    ORDER BY t.created_at DESC
  `);

  const rawList = Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows;
  let allItems: TransactionListItem[] = (rawList || []).map((r: any) => ({
    id: Number(r.id),
    invoice_number: String(r.invoice_number),
    transaction_date: new Date(r.transaction_date || Date.now()),
    user_id: Number(r.user_id),
    user_name: r.user_name || "Kasir",
    member_id: r.member_id ? Number(r.member_id) : null,
    member_name: r.member_name || null,
    member_phone: r.member_phone || null,
    subtotal: Number(r.subtotal || 0),
    discount: Number(r.discount || 0),
    grand_total: Number(r.grand_total || 0),
    payment_method: r.payment_method as any,
    paid_amount: Number(r.paid_amount || 0),
    change_amount: Number(r.change_amount || 0),
    status: r.status as any,
    tax: Number(r.tax || 0),
    point_gained: Number(r.point_gained || 0),
    void_reason: r.void_reason || null,
    voided_by: r.voided_by ? Number(r.voided_by) : null,
    voided_by_name: r.voided_by_name || null,
    voided_at: r.voided_at ? new Date(r.voided_at) : null,
    item_count: Number(r.item_count || 0),
    total_refunded: Number(r.total_refunded || 0),
  }));

  // Hitung KPI dari seluruh data
  const total_transactions = allItems.length;
  const total_revenue = allItems
    .filter((it) => it.status === "paid")
    .reduce((acc, it) => acc + (it.grand_total - it.total_refunded), 0);
  const total_void = allItems.filter((it) => it.status === "cancelled").length;
  const total_returns = allItems.reduce((acc, it) => acc + it.total_refunded, 0);

  // Filter di memory
  if (filters?.status && filters.status !== "all") {
    allItems = allItems.filter((it) => it.status === filters.status);
  }

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    allItems = allItems.filter(
      (it) =>
        it.invoice_number.toLowerCase().includes(q) ||
        (it.member_name && it.member_name.toLowerCase().includes(q)) ||
        it.user_name.toLowerCase().includes(q)
    );
  }

  if (filters?.startDate) {
    const start = new Date(filters.startDate);
    allItems = allItems.filter((it) => new Date(it.transaction_date) >= start);
  }

  if (filters?.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    allItems = allItems.filter((it) => new Date(it.transaction_date) <= end);
  }

  return {
    list: allItems,
    kpis: {
      total_transactions,
      total_revenue,
      total_void,
      total_returns,
    },
  };
}

export type TransactionDetailData = {
  transaction: TransactionListItem;
  items: {
    id: number;
    product_id: number;
    name: string;
    description: string;
    selling_price: number;
    purchase_price: number;
    quantity: number;
    returned_quantity: number;
    subtotal: number;
  }[];
  returns: {
    id: number;
    return_number: string;
    total_refund: number;
    refund_method: string;
    reason: string;
    created_at: Date;
    user_name: string;
  }[];
};

/**
 * Mengambil detail lengkap transaksi beserta item dan riwayat retur
 */
export async function getTransactionDetailById(
  id: number
): Promise<TransactionDetailData | null> {
  const db = getDb();

  const [tx] = await db
    .select({
      id: transactions.id,
      invoice_number: transactions.invoice_number,
      transaction_date: transactions.transaction_date,
      user_id: transactions.user_id,
      member_id: transactions.member_id,
      subtotal: transactions.subtotal,
      discount: transactions.discount,
      grand_total: transactions.grand_total,
      payment_method: transactions.payment_methode,
      paid_amount: transactions.paid_amount,
      change_amount: transactions.change_amount,
      status: transactions.status,
      tax: transactions.tax,
      point_gained: transactions.point_gained,
      void_reason: transactions.void_reason,
      voided_by: transactions.voided_by,
      voided_at: transactions.voided_at,
      user_name: users.name,
      member_name: members.nama,
      member_phone: members.phone,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.user_id, users.id))
    .leftJoin(members, eq(transactions.member_id, members.id))
    .where(eq(transactions.id, id));

  if (!tx) return null;

  // Nama supervisor pem-void jika ada
  let voidedByName: string | null = null;
  if (tx.voided_by) {
    const [sup] = await db.select({ name: users.name }).from(users).where(eq(users.id, tx.voided_by));
    voidedByName = sup?.name || null;
  }

  // Ambil detail items transaksi
  const rawItems = await db
    .select()
    .from(transaction_details)
    .where(eq(transaction_details.transaction_id, id));

  // Ambil total retur yang pernah terjadi untuk transaksi ini
  const returnList = await db
    .select({
      id: returns.id,
      return_number: returns.return_number,
      total_refund: returns.total_refund,
      refund_method: returns.refund_method,
      reason: returns.reason,
      created_at: returns.created_at,
      user_name: users.name,
    })
    .from(returns)
    .leftJoin(users, eq(returns.user_id, users.id))
    .where(eq(returns.transaction_id, id));

  // Hitung berapa kuantitas yang sudah pernah diretur per item produk
  const returnDetailList = await db
    .select({
      product_id: return_details.product_id,
      quantity: return_details.quantity,
    })
    .from(return_details)
    .innerJoin(returns, eq(return_details.return_id, returns.id))
    .where(eq(returns.transaction_id, id));

  const returnedMap = new Map<number, number>();
  for (const rd of returnDetailList) {
    const prev = returnedMap.get(rd.product_id) || 0;
    returnedMap.set(rd.product_id, prev + rd.quantity);
  }

  const items = rawItems.map((it: any) => ({
    id: it.id,
    product_id: it.product_id,
    name: it.name,
    description: it.description || "",
    selling_price: it.selling_price,
    purchase_price: it.purchase_price,
    quantity: it.quantity,
    returned_quantity: returnedMap.get(it.product_id) || 0,
    subtotal: it.subtotal,
  }));

  const totalRefunded = returnList.reduce((acc: number, r: any) => acc + (r.total_refund || 0), 0);

  return {
    transaction: {
      id: tx.id,
      invoice_number: tx.invoice_number,
      transaction_date: tx.transaction_date || new Date(),
      user_id: tx.user_id,
      user_name: tx.user_name || "Kasir",
      member_id: tx.member_id,
      member_name: tx.member_name || null,
      member_phone: tx.member_phone || null,
      subtotal: tx.subtotal,
      discount: tx.discount,
      grand_total: tx.grand_total,
      payment_method: tx.payment_method,
      paid_amount: tx.paid_amount,
      change_amount: tx.change_amount,
      status: tx.status,
      tax: tx.tax,
      point_gained: tx.point_gained || 0,
      void_reason: tx.void_reason || null,
      voided_by: tx.voided_by || null,
      voided_by_name: voidedByName,
      voided_at: tx.voided_at || null,
      item_count: items.length,
      total_refunded: totalRefunded,
    },
    items,
    returns: returnList.map((r: any) => ({
      id: r.id,
      return_number: r.return_number,
      total_refund: r.total_refund,
      refund_method: r.refund_method,
      reason: r.reason,
      created_at: r.created_at,
      user_name: r.user_name || "Petugas",
    })),
  };
}

/**
 * Void Transaksi (Pembatalan Transaksi dengan Otorisasi Supervisor / Admin)
 * Memulihkan stok riil, mencatat mutasi masuk, mengoreksi poin member,
 * dan mencatat pengeluaran kas jika bayar tunai.
 */
export async function voidTransaction(input: {
  transaction_id: number;
  void_reason: string;
  supervisor_username?: string;
  supervisor_password?: string;
}): Promise<ActionResponse> {
  try {
    const db = getDb();
    const session = await getSession();

    if (!input.void_reason || input.void_reason.trim().length < 3) {
      return { success: false, message: "Alasan pembatalan/void wajib diisi (minimal 3 karakter)." };
    }

    // 1. Otorisasi Supervisor / Admin
    let supervisorId: number | null = null;

    if (session && session.roleCode === "ADM") {
      supervisorId = session.userId;
    } else {
      // Kasir memerlukan verifikasi kredensial supervisor
      if (!input.supervisor_username || !input.supervisor_password) {
        return {
          success: false,
          message: "Otorisasi supervisor diperlukan. Masukkan username dan password supervisor/admin.",
        };
      }

      const supervisorUsersList = await db
        .select({
          id: users.id,
          name: users.name,
          password: users.password,
          is_active: users.is_active,
          role_code: roles.code,
        })
        .from(users)
        .innerJoin(roles, eq(users.role_id, roles.id))
        .where(eq(users.name, input.supervisor_username.trim()));

      const supervisor = supervisorUsersList[0];
      if (!supervisor || supervisor.role_code !== "ADM" || !supervisor.is_active) {
        return {
          success: false,
          message: "Akun supervisor tidak valid atau tidak memiliki wewenang otorisasi void.",
        };
      }

      const isPasswordValid = await comparePassword(
        input.supervisor_password,
        supervisor.password
      );

      if (!isPasswordValid) {
        return { success: false, message: "Password supervisor salah. Otorisasi void ditolak." };
      }

      supervisorId = supervisor.id;
    }

    // 2. Ambil data transaksi
    const [tx] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, input.transaction_id));

    if (!tx) {
      return { success: false, message: "Data transaksi tidak ditemukan." };
    }

    if (tx.status === "cancelled") {
      return { success: false, message: "Transaksi ini sudah dibatalkan sebelumnya." };
    }

    // Ambil item details transaksi
    const txItems = await db
      .select()
      .from(transaction_details)
      .where(eq(transaction_details.transaction_id, tx.id));

    // Cek shift kasir aktif jika tunai
    const [activeShift] = await db
      .select({ id: cash_shifts.id })
      .from(cash_shifts)
      .where(and(eq(cash_shifts.user_id, session?.userId || tx.user_id), eq(cash_shifts.status, "open")));

    const now = new Date();

    // 3. Transaksi Atomik Database
    await db.transaction(async (trx: any) => {
      // Update Status Transaksi Menjadi Cancelled
      await trx
        .update(transactions)
        .set({
          status: "cancelled",
          void_reason: input.void_reason.trim(),
          voided_by: supervisorId,
          voided_at: now,
          updated_at: now,
        })
        .where(eq(transactions.id, tx.id));

      // Kembalikan stok untuk setiap item produk & catat log mutasi
      for (const item of txItems) {
        const [prod] = await trx
          .select({ stock: products.stock })
          .from(products)
          .where(eq(products.id, item.product_id));

        const stockBefore = prod?.stock || 0;
        const stockAfter = stockBefore + item.quantity;

        // Update stok produk
        await trx
          .update(products)
          .set({
            stock: stockAfter,
            updated_at: now,
          })
          .where(eq(products.id, item.product_id));

        // Catat mutasi masuk pengembalian void
        await trx.insert(stock_logs).values({
          product_id: item.product_id,
          type: "in",
          quantity: item.quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reference_type: "void",
          reference_id: tx.id,
          description: `Void Transaksi #${tx.invoice_number}: ${input.void_reason.trim()}`,
          user_id: supervisorId,
        });
      }

      // Koreksi Saldo Poin Member jika ada
      if (tx.member_id && (tx.point_gained || 0) > 0) {
        const [mem] = await trx
          .select({ poin: members.poin })
          .from(members)
          .where(eq(members.id, tx.member_id));

        if (mem) {
          const netPoin = Math.max(0, mem.poin - (tx.point_gained || 0));
          await trx
            .update(members)
            .set({ poin: netPoin, updated_at: now })
            .where(eq(members.id, tx.member_id));
        }
      }

      // Jika Pembayaran Tunai & ada Shift Aktif: catat pengeluaran kas refund di laci kasir
      if (tx.payment_methode === "cash" && activeShift) {
        await trx.insert(cash_movements).values({
          shift_id: activeShift.id,
          user_id: session?.userId || tx.user_id,
          type: "out",
          amount: tx.grand_total,
          reason: `Pengembalian Kas Void #${tx.invoice_number}`,
        });
      }
    });

    try {
      revalidatePath("/admin/transactions");
      revalidatePath("/admin/products");
      revalidatePath("/admin/products/stock-logs");
      revalidatePath("/admin/shifts");
      revalidatePath("/kasir");
    } catch {
      // safe fallback
    }

    return {
      success: true,
      message: `Transaksi #${tx.invoice_number} berhasil dibatalkan (Void). Stok barang telah dikembalikan.`,
    };
  } catch (error: any) {
    console.error("Void transaction error:", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan sistem saat memproses void transaksi.",
    };
  }
}

export type ReturnItemInput = {
  product_id: number;
  quantity: number;
  condition: "good" | "damaged";
};

/**
 * Memproses Retur / Refund Barang dari Transaksi yang Sudah Dibayar
 */
export async function processReturnItem(input: {
  transaction_id: number;
  items: ReturnItemInput[];
  refund_method: "cash" | "transfer";
  reason: string;
}): Promise<ActionResponse<{ return_number: string; total_refund: number }>> {
  try {
    const db = getDb();
    const session = await getSession();

    let userId = session?.userId;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }

    if (!userId) {
      return { success: false, message: "Sesi kasir tidak valid. Harap login kembali." };
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, message: "Pilih minimal satu barang yang ingin diretur." };
    }

    if (!input.reason || input.reason.trim().length < 3) {
      return { success: false, message: "Alasan retur barang wajib diisi." };
    }

    // Ambil data transaksi
    const [tx] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, input.transaction_id));

    if (!tx) {
      return { success: false, message: "Transaksi tidak ditemukan." };
    }

    if (tx.status !== "paid") {
      return { success: false, message: "Hanya transaksi berstatus Sukses (Paid) yang dapat diretur." };
    }

    // Ambil detail items transaksi
    const txItems = await db
      .select()
      .from(transaction_details)
      .where(eq(transaction_details.transaction_id, tx.id));

    // Ambil kuantitas yang sudah pernah diretur sebelumnya
    const prevReturns = await db
      .select({
        product_id: return_details.product_id,
        quantity: return_details.quantity,
      })
      .from(return_details)
      .innerJoin(returns, eq(return_details.return_id, returns.id))
      .where(eq(returns.transaction_id, tx.id));

    const returnedCountMap = new Map<number, number>();
    for (const pr of prevReturns) {
      const prev = returnedCountMap.get(pr.product_id) || 0;
      returnedCountMap.set(pr.product_id, prev + pr.quantity);
    }

    let calculatedRefund = 0;
    const itemsToProcess: {
      product_id: number;
      name: string;
      quantity: number;
      price: number;
      subtotal: number;
      condition: "good" | "damaged";
    }[] = [];

    // Validasi kuantitas retur per item
    for (const retItem of input.items) {
      if (retItem.quantity <= 0) continue;

      const matchedTxItem = txItems.find((it: any) => it.product_id === retItem.product_id);
      if (!matchedTxItem) {
        return {
          success: false,
          message: `Produk ID ${retItem.product_id} tidak terdapat pada transaksi ini.`,
        };
      }

      const alreadyReturned = returnedCountMap.get(retItem.product_id) || 0;
      const maxReturnable = matchedTxItem.quantity - alreadyReturned;

      if (retItem.quantity > maxReturnable) {
        return {
          success: false,
          message: `Kuantitas retur untuk "${matchedTxItem.name}" (${retItem.quantity}) melebihi sisa pembelian (${maxReturnable}).`,
        };
      }

      const itemSubtotal = retItem.quantity * matchedTxItem.selling_price;
      calculatedRefund += itemSubtotal;

      itemsToProcess.push({
        product_id: retItem.product_id,
        name: matchedTxItem.name,
        quantity: retItem.quantity,
        price: matchedTxItem.selling_price,
        subtotal: itemSubtotal,
        condition: retItem.condition,
      });
    }

    if (itemsToProcess.length === 0) {
      return { success: false, message: "Kuantitas retur tidak valid." };
    }

    const returnNumber = generateInvoiceNumber("RET");
    const now = new Date();

    // Cek shift kasir aktif
    const [activeShift] = await db
      .select({ id: cash_shifts.id })
      .from(cash_shifts)
      .where(and(eq(cash_shifts.user_id, userId), eq(cash_shifts.status, "open")));

    // Transaksi Atomik Database
    await db.transaction(async (trx: any) => {
      // 1. Insert ke tabel `returns`
      const [insertedReturn] = await trx.insert(returns).values({
        return_number: returnNumber,
        transaction_id: tx.id,
        user_id: userId,
        total_refund: calculatedRefund,
        refund_method: input.refund_method,
        reason: input.reason.trim(),
        created_at: now,
        updated_at: now,
      });

      const returnId = Number(insertedReturn.insertId);

      // 2. Insert ke `return_details` & kembalikan stok jika kondisinya 'good'
      for (const item of itemsToProcess) {
        await trx.insert(return_details).values({
          return_id: returnId,
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          item_condition: item.condition,
        });

        if (item.condition === "good") {
          const [prod] = await trx
            .select({ stock: products.stock })
            .from(products)
            .where(eq(products.id, item.product_id));

          const stockBefore = prod?.stock || 0;
          const stockAfter = stockBefore + item.quantity;

          await trx
            .update(products)
            .set({ stock: stockAfter, updated_at: now })
            .where(eq(products.id, item.product_id));

          await trx.insert(stock_logs).values({
            product_id: item.product_id,
            type: "in",
            quantity: item.quantity,
            stock_before: stockBefore,
            stock_after: stockAfter,
            reference_type: "return",
            reference_id: returnId,
            description: `Retur Barang Layak Jual #${returnNumber} (${item.name})`,
            user_id: userId,
          });
        } else {
          // Kondisi barang rusak/damaged
          await trx.insert(stock_logs).values({
            product_id: item.product_id,
            type: "in",
            quantity: 0,
            stock_before: 0,
            stock_after: 0,
            reference_type: "return",
            reference_id: returnId,
            description: `Retur Barang Rusak #${returnNumber} (${item.name} x${item.quantity} - Tidak Masuk Stok Jual)`,
            user_id: userId,
          });
        }
      }

      // 3. Jika Refund Tunai & ada Shift Aktif: catat pengeluaran kas di laci kasir
      if (input.refund_method === "cash" && activeShift) {
        await trx.insert(cash_movements).values({
          shift_id: activeShift.id,
          user_id: userId,
          type: "out",
          amount: calculatedRefund,
          reason: `Pengeluaran Kas Refund Retur #${returnNumber}`,
        });
      }
    });

    try {
      revalidatePath("/admin/transactions");
      revalidatePath("/admin/products");
      revalidatePath("/admin/products/stock-logs");
      revalidatePath("/admin/shifts");
      revalidatePath("/kasir");
    } catch {
      // safe fallback
    }

    return {
      success: true,
      message: `Retur barang #${returnNumber} berhasil diproses. Total refund: Rp ${calculatedRefund.toLocaleString("id-ID")}.`,
      data: {
        return_number: returnNumber,
        total_refund: calculatedRefund,
      },
    };
  } catch (error: any) {
    console.error("Process return error:", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan saat memproses retur barang.",
    };
  }
}

export type ReturnHistoryItem = {
  id: number;
  return_number: string;
  transaction_id: number;
  invoice_number: string;
  total_refund: number;
  refund_method: "cash" | "transfer";
  reason: string;
  user_name: string;
  created_at: Date;
  items: {
    product_id: number;
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
    condition: "good" | "damaged";
  }[];
};

/**
 * Mengambil seluruh riwayat retur barang
 */
export async function getReturnHistory(
  searchQuery?: string
): Promise<ReturnHistoryItem[]> {
  const db = getDb();

  const returnList = await db
    .select({
      id: returns.id,
      return_number: returns.return_number,
      transaction_id: returns.transaction_id,
      invoice_number: transactions.invoice_number,
      total_refund: returns.total_refund,
      refund_method: returns.refund_method,
      reason: returns.reason,
      user_name: users.name,
      created_at: returns.created_at,
    })
    .from(returns)
    .innerJoin(transactions, eq(returns.transaction_id, transactions.id))
    .leftJoin(users, eq(returns.user_id, users.id))
    .orderBy(desc(returns.created_at));

  const allDetails = await db.select().from(return_details);

  const detailMap = new Map<number, any[]>();
  for (const d of allDetails) {
    const list = detailMap.get(d.return_id) || [];
    list.push({
      product_id: d.product_id,
      name: d.name,
      quantity: d.quantity,
      price: d.price,
      subtotal: d.subtotal,
      condition: d.item_condition,
    });
    detailMap.set(d.return_id, list);
  }

  let results: ReturnHistoryItem[] = returnList.map((r: any) => ({
    id: r.id,
    return_number: r.return_number,
    transaction_id: r.transaction_id,
    invoice_number: r.invoice_number,
    total_refund: r.total_refund,
    refund_method: r.refund_method,
    reason: r.reason,
    user_name: r.user_name || "Petugas",
    created_at: r.created_at,
    items: detailMap.get(r.id) || [],
  }));

  if (searchQuery?.trim()) {
    const q = searchQuery.trim().toLowerCase();
    results = results.filter(
      (r) =>
        r.return_number.toLowerCase().includes(q) ||
        r.invoice_number.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
    );
  }

  return results;
}

