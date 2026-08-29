"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "../db";
import { units } from "../db/schema";

export async function getUnits() {
  const db = getDb();

  return await db
    .select({
      id: units.id,
      name: units.name,
      description: units.description,
      created_at: units.created_at,
      updated_at: units.updated_at,
    })
    .from(units);
}

export async function createUnit(
  name: string,
  description: string
) {
  try {
    const db = getDb();

    const unitName = name.trim();
    const unitDescription = description.trim();

    if (!unitName) {
      return {
        success: false,
        message: "Nama satuan wajib diisi.",
      };
    }

    const existingUnit = await db
      .select()
      .from(units)
      .where(eq(units.name, unitName));

    if (existingUnit.length > 0) {
      return {
        success: false,
        message: "Satuan dengan nama tersebut sudah ada.",
      };
    }

    await db.insert(units).values({
      name: unitName,
      description: unitDescription,
    });

    revalidatePath("/admin/produk/units");

    return {
      success: true,
      message: "Satuan berhasil ditambahkan.",
    };
  } catch (error) {
    console.error("Create unit error:", error);

    return {
      success: false,
      message: "Gagal menambahkan satuan.",
    };
  }
}

export async function updateUnit(
  id: number,
  name: string,
  description: string
) {
  try {
    const db = getDb();

    const unitName = name.trim();
    const unitDescription = description.trim();

    if (!unitName) {
      return {
        success: false,
        message: "Nama satuan wajib diisi.",
      };
    }

    const existingUnit = await db
      .select()
      .from(units)
      .where(eq(units.name, unitName));

    const duplicate = existingUnit.find(
      (unit: typeof existingUnit[number]) =>
        unit.id !== id
    );

    if (duplicate) {
      return {
        success: false,
        message: "Satuan dengan nama tersebut sudah ada.",
      };
    }

    await db
      .update(units)
      .set({
        name: unitName,
        description: unitDescription,
        updated_at: new Date(),
      })
      .where(eq(units.id, id));

    revalidatePath("/admin/produk/units");

    return {
      success: true,
      message: "Satuan berhasil diperbarui.",
    };
  } catch (error) {
    console.error("Update unit error:", error);

    return {
      success: false,
      message: "Gagal memperbarui satuan.",
    };
  }
}

export async function deleteUnit(id: number) {
  try {
    const db = getDb();

    // Cek apakah satuan masih digunakan produk
    const usedProducts = await db.execute(`
      SELECT COUNT(*) AS count
      FROM products
      WHERE unit_id = ${id}
    `);

    const productCount = Number(
      (usedProducts[0] as any)?.count ?? 0
    );

    if (productCount > 0) {
      return {
        success: false,
        message: `Satuan tidak dapat dihapus karena masih digunakan oleh ${productCount} produk.`,
      };
    }

    await db
      .delete(units)
      .where(eq(units.id, id));

    revalidatePath("/admin/produk/units");

    return {
      success: true,
      message: "Satuan berhasil dihapus.",
    };
  } catch (error) {
    console.error("Delete unit error:", error);

    return {
      success: false,
      message: "Gagal menghapus satuan.",
    };
  }
}