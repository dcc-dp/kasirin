"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "../db";
import { categoris, products } from "../db/schema";

export async function getCategories() {
  const db = getDb();

  return await db
    .select({
      id: categoris.id,
      name: categoris.name,
      description: categoris.description,
      created_at: categoris.created_at,
      updated_at: categoris.updated_at,
    })
    .from(categoris);
}

export async function createCategory(
  name: string,
  description: string
) {
  try {
    const db = getDb();

    const categoryName = name.trim();
    const categoryDescription = description.trim();

    if (!categoryName) {
      return {
        success: false,
        message: "Nama kategori wajib diisi.",
      };
    }

    // Cek nama kategori yang sama
    const existingCategory = await db
      .select()
      .from(categoris)
      .where(eq(categoris.name, categoryName));

    if (existingCategory.length > 0) {
      return {
        success: false,
        message: "Kategori dengan nama tersebut sudah ada.",
      };
    }

    await db.insert(categoris).values({
      name: categoryName,
      description: categoryDescription,
    });

    revalidatePath("/admin/products/categories");

    return {
      success: true,
      message: "Kategori berhasil ditambahkan.",
    };
  } catch (error) {
    console.error("Create category error:", error);

    return {
      success: false,
      message: "Gagal menambahkan kategori.",
    };
  }
}

export async function updateCategory(
  id: number,
  name: string,
  description: string
) {
  try {
    const db = getDb();

    const categoryName = name.trim();
    const categoryDescription = description.trim();

    if (!categoryName) {
      return {
        success: false,
        message: "Nama kategori wajib diisi.",
      };
    }

    // Cek apakah nama sudah digunakan kategori lain
    const existingCategory = await db
    .select()
    .from(categoris)
    .where(eq(categoris.name, categoryName));

    const duplicate = existingCategory.some(
    (category: typeof existingCategory[number]) => category.id !== id
    );

    if (duplicate) {
    return {
        success: false,
        message: "Kategori dengan nama tersebut sudah ada.",
    };
    }

    await db
      .update(categoris)
      .set({
        name: categoryName,
        description: categoryDescription,
        updated_at: new Date(),
      })
      .where(eq(categoris.id, id));

    revalidatePath("/admin/products/categories");

    return {
      success: true,
      message: "Kategori berhasil diperbarui.",
    };
  } catch (error) {
    console.error("Update category error:", error);

    return {
      success: false,
      message: "Gagal memperbarui kategori.",
    };
  }
}

export async function deleteCategory(id: number) {
  try {
    const db = getDb();

    // Cek apakah kategori masih digunakan oleh produk
    const usedProducts = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(products)
      .where(eq(products.category_id, id));

    const productCount = Number(usedProducts[0]?.count ?? 0);

    if (productCount > 0) {
      return {
        success: false,
        message: `Kategori tidak dapat dihapus karena masih digunakan oleh ${productCount} produk.`,
      };
    }

    await db
      .delete(categoris)
      .where(eq(categoris.id, id));

    revalidatePath("/admin/products/categories");

    return {
      success: true,
      message: "Kategori berhasil dihapus.",
    };
  } catch (error) {
    console.error("Delete category error:", error);

    return {
      success: false,
      message: "Gagal menghapus kategori.",
    };
  }
}