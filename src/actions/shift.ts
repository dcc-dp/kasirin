"use server";

import { eq, sql, desc, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { cash_shifts, cash_movements, transactions, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import type { ActionResponse } from "@/types/action";

export type ShiftMovementItem = {
  id: number;
  type: "in" | "out";
  amount: number;
  reason: string;
  created_at: Date;
  user_name: string | null;
};

export type ActiveShiftData = {
  id: number;
  user_id: number;
  user_name: string | null;
  start_time: Date;
  starting_cash: number;
  status: "open" | "closed";
  total_cash_sales: number;
  total_non_cash_sales: number;
  total_transactions: number;
  total_cash_in: number;
  total_cash_out: number;
  expected_cash: number;
  movements: ShiftMovementItem[];
};

export type ShiftHistoryItem = {
  id: number;
  user_id: number;
  user_name: string | null;
  start_time: Date;
  end_time: Date | null;
  starting_cash: number;
  expected_cash: number | null;
  actual_cash: number | null;
  difference: number | null;
  notes: string | null;
  status: "open" | "closed";
  created_at: Date;
  total_cash_sales: number;
  total_non_cash_sales: number;
};

/**
 * Mengambil shift yang sedang aktif (status: 'open') untuk user saat ini
 */
export async function getActiveShift(targetUserId?: number): Promise<ActiveShiftData | null> {
  const db = getDb();
  const session = await getSession();

  let userId = targetUserId || session?.userId;
  if (!userId) {
    const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
    userId = firstUser?.id;
  }
  if (!userId) return null;

  // Cari shift berstatus open untuk user ini
  const [openShift] = await db
    .select({
      id: cash_shifts.id,
      user_id: cash_shifts.user_id,
      user_name: users.name,
      start_time: cash_shifts.start_time,
      starting_cash: cash_shifts.starting_cash,
      status: cash_shifts.status,
    })
    .from(cash_shifts)
    .leftJoin(users, eq(cash_shifts.user_id, users.id))
    .where(and(eq(cash_shifts.user_id, userId), eq(cash_shifts.status, "open")))
    .orderBy(desc(cash_shifts.start_time))
    .limit(1);

  if (!openShift) return null;

  // Hitung total transaksi penjualan sejak shift dibuka
  const salesResult = await db.execute(sql`
    SELECT
      COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN grand_total ELSE 0 END), 0) AS total_cash,
      COALESCE(SUM(CASE WHEN payment_method IN ('transfer', 'qris') THEN grand_total ELSE 0 END), 0) AS total_non_cash,
      COUNT(*) AS tx_count
    FROM transactions
    WHERE user_id = ${openShift.user_id}
      AND status = 'paid'
      AND transaction_date >= ${openShift.start_time}
  `);

  const totalCashSales = Number((salesResult[0] as any)?.total_cash ?? 0);
  const totalNonCashSales = Number((salesResult[0] as any)?.total_non_cash ?? 0);
  const totalTransactions = Number((salesResult[0] as any)?.tx_count ?? 0);

  // Ambil data petty cash movements
  const movementsList = await db
    .select({
      id: cash_movements.id,
      type: cash_movements.type,
      amount: cash_movements.amount,
      reason: cash_movements.reason,
      created_at: cash_movements.created_at,
      user_name: users.name,
    })
    .from(cash_movements)
    .leftJoin(users, eq(cash_movements.user_id, users.id))
    .where(eq(cash_movements.shift_id, openShift.id))
    .orderBy(desc(cash_movements.created_at));

  const totalCashIn = movementsList
    .filter((m: any) => m.type === "in")
    .reduce((sum: number, m: any) => sum + m.amount, 0);

  const totalCashOut = movementsList
    .filter((m: any) => m.type === "out")
    .reduce((sum: number, m: any) => sum + m.amount, 0);

  // Expected Cash = Starting Cash + Cash Sales + Cash In - Cash Out
  const expectedCash = openShift.starting_cash + totalCashSales + totalCashIn - totalCashOut;

  return {
    ...openShift,
    total_cash_sales: totalCashSales,
    total_non_cash_sales: totalNonCashSales,
    total_transactions: totalTransactions,
    total_cash_in: totalCashIn,
    total_cash_out: totalCashOut,
    expected_cash: expectedCash,
    movements: movementsList,
  };
}

/**
 * Buka Shift Kasir Baru (Input Modal Kas Awal)
 */
export async function openShift(
  startingCash: number,
  notes?: string
): Promise<ActionResponse<{ shiftId: number }>> {
  try {
    const db = getDb();
    const session = await getSession();

    let userId = session?.userId;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }

    if (!userId) {
      return { success: false, message: "Sesi kasir tidak valid. Silakan login kembali." };
    }

    if (startingCash < 0) {
      return { success: false, message: "Modal kas awal tidak boleh bernilai negatif." };
    }

    // Cek apakah kasir ini masih memiliki shift aktif yang belum ditutup
    const [existingOpen] = await db
      .select({ id: cash_shifts.id })
      .from(cash_shifts)
      .where(and(eq(cash_shifts.user_id, userId), eq(cash_shifts.status, "open")));

    if (existingOpen) {
      return {
        success: false,
        message: "Anda masih memiliki shift yang sedang aktif. Harap tutup shift sebelumnya terlebih dahulu.",
      };
    }

    const [inserted] = await db.insert(cash_shifts).values({
      user_id: userId,
      start_time: new Date(),
      starting_cash: startingCash,
      status: "open",
      notes: notes?.trim() || null,
    });

    try {
      revalidatePath("/kasir");
      revalidatePath("/admin/shifts");
    } catch {
      // safe fallback
    }

    return {
      success: true,
      message: "Shift kasir berhasil dibuka. Selamat bertugas!",
      data: { shiftId: Number(inserted.insertId) },
    };
  } catch (error) {
    console.error("Open shift error:", error);
    return { success: false, message: "Gagal membuka shift kasir." };
  }
}

/**
 * Catat Pengeluaran / Pemasukan Kas Darurat (Petty Cash)
 */
export async function recordCashMovement(
  shiftId: number,
  type: "in" | "out",
  amount: number,
  reason: string
): Promise<ActionResponse> {
  try {
    const db = getDb();
    const session = await getSession();

    let userId = session?.userId;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }

    if (!userId) {
      return { success: false, message: "Sesi tidak valid." };
    }

    if (amount <= 0) {
      return { success: false, message: "Nominal uang petty cash harus lebih dari 0." };
    }

    if (!reason || !reason.trim()) {
      return { success: false, message: "Keterangan/alasan pengeluaran kas wajib diisi." };
    }

    // Validasi shift masih open
    const [shift] = await db
      .select()
      .from(cash_shifts)
      .where(eq(cash_shifts.id, shiftId));

    if (!shift || shift.status !== "open") {
      return { success: false, message: "Shift ini tidak aktif atau sudah ditutup." };
    }

    await db.insert(cash_movements).values({
      shift_id: shiftId,
      user_id: userId,
      type,
      amount,
      reason: reason.trim(),
    });

    try {
      revalidatePath("/kasir");
      revalidatePath("/admin/shifts");
    } catch {
      // safe fallback
    }

    return {
      success: true,
      message: `${type === "out" ? "Kas keluar" : "Kas masuk"} sebesar Rp ${amount.toLocaleString("id-ID")} berhasil dicatat.`,
    };
  } catch (error) {
    console.error("Record cash movement error:", error);
    return { success: false, message: "Gagal mencatat mutasi petty cash." };
  }
}

export type CloseShiftResult = {
  shiftId: number;
  userName: string;
  startTime: Date;
  endTime: Date;
  startingCash: number;
  cashSales: number;
  nonCashSales: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  totalTransactions: number;
};

/**
 * Tutup Shift Kasir & Rekonsiliasi Kas Fisik (Z-Report)
 */
export async function closeShift(
  shiftId: number,
  actualCash: number,
  notes?: string
): Promise<ActionResponse<CloseShiftResult>> {
  try {
    const db = getDb();
    const endTime = new Date();

    const [shift] = await db
      .select({
        id: cash_shifts.id,
        user_id: cash_shifts.user_id,
        user_name: users.name,
        start_time: cash_shifts.start_time,
        starting_cash: cash_shifts.starting_cash,
        status: cash_shifts.status,
      })
      .from(cash_shifts)
      .leftJoin(users, eq(cash_shifts.user_id, users.id))
      .where(eq(cash_shifts.id, shiftId));

    if (!shift) {
      return { success: false, message: "Shift tidak ditemukan." };
    }

    if (shift.status === "closed") {
      return { success: false, message: "Shift ini sudah ditutup sebelumnya." };
    }

    if (actualCash < 0) {
      return { success: false, message: "Jumlah uang fisik di laci tidak boleh negatif." };
    }

    // Hitung total penjualan tunai & non-tunai
    const salesResult = await db.execute(sql`
      SELECT
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN grand_total ELSE 0 END), 0) AS total_cash,
        COALESCE(SUM(CASE WHEN payment_method IN ('transfer', 'qris') THEN grand_total ELSE 0 END), 0) AS total_non_cash,
        COUNT(*) AS tx_count
      FROM transactions
      WHERE user_id = ${shift.user_id}
        AND status = 'paid'
        AND transaction_date >= ${shift.start_time}
    `);

    const cashSales = Number((salesResult[0] as any)?.total_cash ?? 0);
    const nonCashSales = Number((salesResult[0] as any)?.total_non_cash ?? 0);
    const totalTransactions = Number((salesResult[0] as any)?.tx_count ?? 0);

    // Ambil petty cash
    const movementsList = await db
      .select({ type: cash_movements.type, amount: cash_movements.amount })
      .from(cash_movements)
      .where(eq(cash_movements.shift_id, shiftId));

    const cashIn = movementsList
      .filter((m: any) => m.type === "in")
      .reduce((sum: number, m: any) => sum + m.amount, 0);

    const cashOut = movementsList
      .filter((m: any) => m.type === "out")
      .reduce((sum: number, m: any) => sum + m.amount, 0);

    const expectedCash = shift.starting_cash + cashSales + cashIn - cashOut;
    const difference = actualCash - expectedCash;

    // Update status shift menjadi closed
    await db
      .update(cash_shifts)
      .set({
        end_time: endTime,
        expected_cash: expectedCash,
        actual_cash: actualCash,
        difference: difference,
        notes: notes?.trim() || null,
        status: "closed",
        updated_at: new Date(),
      })
      .where(eq(cash_shifts.id, shiftId));

    try {
      revalidatePath("/kasir");
      revalidatePath("/admin/shifts");
    } catch {
      // safe fallback
    }

    return {
      success: true,
      message: `Shift kasir berhasil ditutup.${difference === 0 ? " Kas seimbang (Pas)." : difference > 0 ? ` Kas surplus +Rp ${difference.toLocaleString("id-ID")}` : ` Kas kurang -Rp ${Math.abs(difference).toLocaleString("id-ID")}`}`,
      data: {
        shiftId,
        userName: shift.user_name || "Kasir",
        startTime: shift.start_time,
        endTime,
        startingCash: shift.starting_cash,
        cashSales,
        nonCashSales,
        cashIn,
        cashOut,
        expectedCash,
        actualCash,
        difference,
        totalTransactions,
      },
    };
  } catch (error) {
    console.error("Close shift error:", error);
    return { success: false, message: "Gagal memproses penutupan shift kasir." };
  }
}

/**
 * Mengambil riwayat seluruh shift kasir untuk admin toko
 */
export async function getShiftHistory(filters?: {
  userId?: number;
  status?: "open" | "closed";
}): Promise<ShiftHistoryItem[]> {
  const db = getDb();

  const conditions = [];
  if (filters?.userId) {
    conditions.push(eq(cash_shifts.user_id, filters.userId));
  }
  if (filters?.status) {
    conditions.push(eq(cash_shifts.status, filters.status));
  }

  const query = db
    .select({
      id: cash_shifts.id,
      user_id: cash_shifts.user_id,
      user_name: users.name,
      start_time: cash_shifts.start_time,
      end_time: cash_shifts.end_time,
      starting_cash: cash_shifts.starting_cash,
      expected_cash: cash_shifts.expected_cash,
      actual_cash: cash_shifts.actual_cash,
      difference: cash_shifts.difference,
      notes: cash_shifts.notes,
      status: cash_shifts.status,
      created_at: cash_shifts.created_at,
    })
    .from(cash_shifts)
    .leftJoin(users, eq(cash_shifts.user_id, users.id))
    .orderBy(desc(cash_shifts.start_time));

  const list = conditions.length > 0
    ? await query.where(and(...conditions))
    : await query;

  // Enhance dengan penjualan per shift
  const enhancedList: ShiftHistoryItem[] = [];

  for (const s of list) {
    const endCondition = s.end_time ? lte(transactions.transaction_date, s.end_time) : sql`1=1`;

    const [sales] = await db
      .select({
        cash: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.payment_methode} = 'cash' THEN ${transactions.grand_total} ELSE 0 END), 0)`.mapWith(Number),
        non_cash: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.payment_methode} IN ('transfer', 'qris') THEN ${transactions.grand_total} ELSE 0 END), 0)`.mapWith(Number),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.user_id, s.user_id),
          eq(transactions.status, "paid"),
          gte(transactions.transaction_date, s.start_time),
          endCondition
        )
      );

    enhancedList.push({
      ...s,
      total_cash_sales: sales?.cash || 0,
      total_non_cash_sales: sales?.non_cash || 0,
    });
  }

  return enhancedList;
}
