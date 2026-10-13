"use server";

import { eq, sql, desc, or, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { suppliers, purchases } from "@/db/schema";
import { normalizePhoneNumber } from "@/lib/privacy";
import type { ActionResponse } from "@/types/action";

export type SupplierWithStats = {
  id: number;
  name: string;
  phone: string;
  address: string;
  email: string;
  total_purchases: number;
  total_purchase_amount: number;
  created_at: Date;
  updated_at: Date;
};

/**
 * Mengambil seluruh data supplier beserta agregasi riwayat restock / pembelian barang
 */
export async function getSuppliers(): Promise<SupplierWithStats[]> {
  const db = getDb();

  const supplierList = await db
    .select({
      id: suppliers.id,
      name: suppliers.name,
      phone: suppliers.phone,
      address: suppliers.address,
      email: suppliers.email,
      created_at: suppliers.created_at,
      updated_at: suppliers.updated_at,
      total_purchases: sql<number>`COALESCE(COUNT(${purchases.id}), 0)`.mapWith(Number),
      total_purchase_amount: sql<number>`COALESCE(SUM(${purchases.total}), 0)`.mapWith(Number),
    })
    .from(suppliers)
    .leftJoin(purchases, eq(suppliers.id, purchases.supplier_id))
    .groupBy(suppliers.id)
    .orderBy(desc(suppliers.created_at));

  return supplierList as SupplierWithStats[];
}

/**
 * Cari supplier berdasarkan nama, kontak, atau email
 */
export async function searchSuppliers(query: string) {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const db = getDb();
  return await db
    .select()
    .from(suppliers)
    .where(
      or(
        like(suppliers.name, `%${cleanQuery}%`),
        like(suppliers.phone, `%${cleanQuery}%`),
        like(suppliers.email, `%${cleanQuery}%`)
      )
    )
    .limit(10);
}

/**
 * Tambah Supplier Baru
 */
export async function createSupplier(data: {
  name: string;
  phone: string;
  address: string;
  email?: string;
}): Promise<ActionResponse<{ id: number }>> {
  try {
    const db = getDb();
    const name = data.name.trim();
    const phone = normalizePhoneNumber(data.phone.trim());
    const address = data.address.trim();
    const email = (data.email || "").trim();

    if (!name) {
      return { success: false, message: "Nama distributor / supplier wajib diisi." };
    }

    if (!phone || phone.length < 8) {
      return { success: false, message: "Nomor telepon/kontak pemasok minimal 8 digit." };
    }

    if (!address) {
      return { success: false, message: "Alamat kantor/gudang supplier wajib diisi." };
    }

    const [inserted] = await db.insert(suppliers).values({
      name,
      phone,
      address,
      email: email || "-",
    });

    try {
      revalidatePath("/admin/suppliers");
      revalidatePath("/admin/purchases");
    } catch {
      // safe fallback
    }

    return {
      success: true,
      message: `Supplier "${name}" berhasil ditambahkan.`,
      data: { id: (inserted as any)?.insertId || 0 },
    };
  } catch (error) {
    console.error("Create supplier error:", error);
    return { success: false, message: "Terjadi kesalahan saat menyimpan supplier." };
  }
}

/**
 * Perbarui Data Supplier
 */
export async function updateSupplier(
  id: number,
  data: {
    name: string;
    phone: string;
    address: string;
    email?: string;
  }
): Promise<ActionResponse> {
  try {
    const db = getDb();
    const name = data.name.trim();
    const phone = normalizePhoneNumber(data.phone.trim());
    const address = data.address.trim();
    const email = (data.email || "").trim();

    if (!name) {
      return { success: false, message: "Nama supplier wajib diisi." };
    }

    if (!phone || phone.length < 8) {
      return { success: false, message: "Nomor telepon pemasok minimal 8 digit." };
    }

    if (!address) {
      return { success: false, message: "Alamat supplier wajib diisi." };
    }

    await db
      .update(suppliers)
      .set({
        name,
        phone,
        address,
        email: email || "-",
        updated_at: new Date(),
      })
      .where(eq(suppliers.id, id));

    try {
      revalidatePath("/admin/suppliers");
      revalidatePath("/admin/purchases");
    } catch {
      // safe fallback
    }

    return { success: true, message: "Data supplier berhasil diperbarui." };
  } catch (error) {
    console.error("Update supplier error:", error);
    return { success: false, message: "Gagal memperbarui data supplier." };
  }
}

/**
 * Hapus Supplier
 * Hanya diizinkan jika supplier belum memiliki riwayat restock / pembelian
 */
export async function deleteSupplier(id: number): Promise<ActionResponse> {
  try {
    const db = getDb();

    // Cek relasi pembelian
    const purchaseCountResult = await db.execute(
      sql`SELECT COUNT(*) AS count FROM purchases WHERE supplier_id = ${id}`
    );
    const purchaseCount = Number((purchaseCountResult[0] as any)?.count ?? 0);

    if (purchaseCount > 0) {
      return {
        success: false,
        message: `Supplier tidak dapat dihapus karena memiliki ${purchaseCount} faktur riwayat restock barang.`,
      };
    }

    await db.delete(suppliers).where(eq(suppliers.id, id));

    try {
      revalidatePath("/admin/suppliers");
      revalidatePath("/admin/purchases");
    } catch {
      // safe fallback
    }

    return { success: true, message: "Supplier berhasil dihapus." };
  } catch (error) {
    console.error("Delete supplier error:", error);
    return { success: false, message: "Terjadi kesalahan saat menghapus supplier." };
  }
}
