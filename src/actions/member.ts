"use server";

import { eq, sql, desc, or, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { members, transactions } from "@/db/schema";
import { normalizePhoneNumber } from "@/lib/privacy";
import type { ActionResponse } from "@/types/action";

export type MemberWithStats = {
  id: number;
  nama: string;
  phone: string;
  address: string;
  poin: number;
  total_transactions: number;
  total_spent: number;
  created_at: Date;
  updated_at: Date;
};

/**
 * Mengambil seluruh data member beserta statistik akumulasi belanja
 */
export async function getMembers(): Promise<MemberWithStats[]> {
  const db = getDb();

  // Ambil data member beserta agregasi transaksi
  const memberList = await db
    .select({
      id: members.id,
      nama: members.nama,
      phone: members.phone,
      address: members.address,
      poin: members.poin,
      created_at: members.created_at,
      updated_at: members.updated_at,
      total_transactions: sql<number>`COALESCE(COUNT(${transactions.id}), 0)`.mapWith(Number),
      total_spent: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.status} = 'paid' THEN ${transactions.grand_total} ELSE 0 END), 0)`.mapWith(Number),
    })
    .from(members)
    .leftJoin(transactions, eq(members.id, transactions.member_id))
    .groupBy(members.id)
    .orderBy(desc(members.created_at));

  return memberList as MemberWithStats[];
}

/**
 * Mencari member berdasarkan nama atau nomor telepon (untuk auto-complete kasir POS)
 */
export async function searchMembers(query: string) {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const db = getDb();
  return await db
    .select()
    .from(members)
    .where(
      or(
        like(members.nama, `%${cleanQuery}%`),
        like(members.phone, `%${cleanQuery}%`)
      )
    )
    .limit(10);
}

/**
 * Pendaftaran Member Baru
 */
export async function createMember(data: {
  nama: string;
  phone: string;
  address?: string;
}): Promise<ActionResponse<{ id: number }>> {
  try {
    const db = getDb();
    const nama = data.nama.trim();
    const phone = normalizePhoneNumber(data.phone.trim());
    const address = (data.address || "").trim();

    if (!nama) {
      return { success: false, message: "Nama lengkap member wajib diisi." };
    }

    if (!phone || phone.length < 9) {
      return { success: false, message: "Nomor telepon/WhatsApp minimal 9 digit." };
    }

    // Cek apakah nomor HP sudah terdaftar
    const existing = await db
      .select()
      .from(members)
      .where(eq(members.phone, phone));

    if (existing.length > 0) {
      return {
        success: false,
        message: `Nomor telepon ${phone} sudah terdaftar atas nama ${existing[0].nama}.`,
      };
    }

    const [inserted] = await db.insert(members).values({
      nama,
      phone,
      address,
      poin: 0,
    });

    try {
      revalidatePath("/admin/members");
      revalidatePath("/kasir");
    } catch {
      // safe fallback
    }

    return {
      success: true,
      message: `Member "${nama}" berhasil didaftarkan.`,
      data: { id: (inserted as any)?.insertId || 0 },
    };
  } catch (error) {
    console.error("Create member error:", error);
    return { success: false, message: "Terjadi kesalahan saat mendaftarkan member." };
  }
}

/**
 * Update Data Member
 */
export async function updateMember(
  id: number,
  data: {
    nama: string;
    phone: string;
    address?: string;
  }
): Promise<ActionResponse> {
  try {
    const db = getDb();
    const nama = data.nama.trim();
    const phone = normalizePhoneNumber(data.phone.trim());
    const address = (data.address || "").trim();

    if (!nama) {
      return { success: false, message: "Nama member wajib diisi." };
    }

    if (!phone || phone.length < 9) {
      return { success: false, message: "Nomor telepon minimal 9 digit." };
    }

    // Cek nomor dipakai member lain
    const existing = await db
      .select()
      .from(members)
      .where(eq(members.phone, phone));

    const duplicate = existing.find((m: any) => m.id !== id);
    if (duplicate) {
      return {
        success: false,
        message: `Nomor telepon tersebut sudah digunakan member "${duplicate.nama}".`,
      };
    }

    await db
      .update(members)
      .set({
        nama,
        phone,
        address,
        updated_at: new Date(),
      })
      .where(eq(members.id, id));

    try {
      revalidatePath("/admin/members");
      revalidatePath("/kasir");
    } catch {
      // safe fallback
    }

    return { success: true, message: "Data member berhasil diperbarui." };
  } catch (error) {
    console.error("Update member error:", error);
    return { success: false, message: "Gagal memperbarui data member." };
  }
}

/**
 * Penyesuaian / Reward Saldo Poin Member secara Manual oleh Admin
 */
export async function adjustMemberPoints(
  id: number,
  pointsAdjustment: number,
  reason: string
): Promise<ActionResponse> {
  try {
    const db = getDb();

    if (pointsAdjustment === 0) {
      return { success: false, message: "Nilai penyesuaian poin tidak boleh 0." };
    }

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, id));

    if (!member) {
      return { success: false, message: "Member tidak ditemukan." };
    }

    const newPoints = Math.max(0, member.poin + pointsAdjustment);

    await db
      .update(members)
      .set({
        poin: newPoints,
        updated_at: new Date(),
      })
      .where(eq(members.id, id));

    try {
      revalidatePath("/admin/members");
      revalidatePath("/kasir");
    } catch {
      // safe fallback
    }

    return {
      success: true,
      message: `Poin member "${member.nama}" berhasil diperbarui menjadi ${newPoints} poin.`,
    };
  } catch (error) {
    console.error("Adjust member points error:", error);
    return { success: false, message: "Gagal menyesuaikan poin member." };
  }
}

/**
 * Hapus Member
 * Hanya diizinkan jika member belum pernah memiliki riwayat transaksi
 */
export async function deleteMember(id: number): Promise<ActionResponse> {
  try {
    const db = getDb();

    // Cek relasi transaksi
    const txCountResult = await db.execute(
      sql`SELECT COUNT(*) AS count FROM transactions WHERE member_id = ${id}`
    );
    const txCount = Number((txCountResult[0] as any)?.count ?? 0);

    if (txCount > 0) {
      return {
        success: false,
        message: `Member tidak dapat dihapus karena memiliki ${txCount} riwayat transaksi belanja.`,
      };
    }

    await db.delete(members).where(eq(members.id, id));

    try {
      revalidatePath("/admin/members");
      revalidatePath("/kasir");
    } catch {
      // safe fallback
    }

    return { success: true, message: "Member berhasil dihapus." };
  } catch (error) {
    console.error("Delete member error:", error);
    return { success: false, message: "Terjadi kesalahan saat menghapus member." };
  }
}
