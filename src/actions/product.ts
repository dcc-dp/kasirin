"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "../db";

import {
  categoris,
  products,
  units,
  stock_logs,
} from "../db/schema";

// ======================================================
// GET PRODUCTS
// ======================================================

export async function getProducts() {
  const db = getDb();

  return await db
    .select({
      id: products.id,
      category_id: products.category_id,
      unit_id: products.unit_id,
      barcode: products.barcode,
      name: products.name,
      description: products.description,
      purchase_price: products.purchase_price,
      selling_price: products.selling_price,
      stock: products.stock,

      category_name: categoris.name,
      unit_name: units.name,

      created_at: products.created_at,
      updated_at: products.updated_at,
    })
    .from(products)
    .leftJoin(
      categoris,
      eq(products.category_id, categoris.id)
    )
    .leftJoin(
      units,
      eq(products.unit_id, units.id)
    );
}

// ======================================================
// GET PRODUCT OPTIONS
// ======================================================

export async function getProductOptions() {
  const db = getDb();

  const [categories, unitList] = await Promise.all([
    db.select().from(categoris),
    db.select().from(units),
  ]);

  return {
    categories,
    units: unitList,
  };
}

// ======================================================
// CREATE PRODUCT
// ======================================================

export async function createProduct(data: {
  category_id: number;
  unit_id: number;
  barcode: string;
  name: string;
  description: string;
  purchase_price: number;
  selling_price: number;
  stock: number;
}) {
  try {
    const db = getDb();

    const barcode = data.barcode.trim();
    const name = data.name.trim();
    const description = data.description.trim();

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!barcode) {
      return {
        success: false,
        message: "Barcode wajib diisi.",
      };
    }

    if (!name) {
      return {
        success: false,
        message: "Nama produk wajib diisi.",
      };
    }

    if (!data.category_id) {
      return {
        success: false,
        message: "Kategori wajib dipilih.",
      };
    }

    if (!data.unit_id) {
      return {
        success: false,
        message: "Satuan wajib dipilih.",
      };
    }

    if (data.purchase_price < 0) {
      return {
        success: false,
        message: "Harga beli tidak boleh negatif.",
      };
    }

    if (data.selling_price < 0) {
      return {
        success: false,
        message: "Harga jual tidak boleh negatif.",
      };
    }

    if (data.stock < 0) {
      return {
        success: false,
        message: "Stok tidak boleh negatif.",
      };
    }

    // ==================================================
    // CEK BARCODE
    // ==================================================

    const existingBarcode = await db
      .select()
      .from(products)
      .where(eq(products.barcode, barcode));

    if (existingBarcode.length > 0) {
      return {
        success: false,
        message: "Barcode tersebut sudah digunakan.",
      };
    }

    // ==================================================
    // TRANSACTION
    // ==================================================

    await db.transaction(async (tx) => {
      const result = await tx
        .insert(products)
        .values({
          category_id: data.category_id,
          unit_id: data.unit_id,
          barcode,
          name,
          description,
          purchase_price: data.purchase_price,
          selling_price: data.selling_price,
          stock: data.stock,
        });

      // Ambil ID produk yang baru dibuat
      const productId = Number(
        (result as any)[0]?.insertId
      );

      // ==================================================
      // CATAT STOK AWAL
      // ==================================================

      if (data.stock > 0) {
        await tx.insert(stock_logs).values({
          product_id: productId,

          type: "in",

          quantity: data.stock,

          stock_before: 0,
          stock_after: data.stock,

          reference_type: "product",
          reference_id: productId,

          description: `Stok awal produk "${name}"`,

          user_id: null,
        });
      }
    });

    revalidatePath("/admin/produk");

    return {
      success: true,
      message: "Produk berhasil ditambahkan.",
    };
  } catch (error) {
    console.error("Create product error:", error);

    return {
      success: false,
      message: "Gagal menambahkan produk.",
    };
  }
}

// ======================================================
// UPDATE PRODUCT
// ======================================================

export async function updateProduct(
  id: number,
  data: {
    category_id: number;
    unit_id: number;
    barcode: string;
    name: string;
    description: string;
    purchase_price: number;
    selling_price: number;
    stock: number;
  }
) {
  try {
    const db = getDb();

    const barcode = data.barcode.trim();
    const name = data.name.trim();
    const description = data.description.trim();

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!barcode) {
      return {
        success: false,
        message: "Barcode wajib diisi.",
      };
    }

    if (!name) {
      return {
        success: false,
        message: "Nama produk wajib diisi.",
      };
    }

    if (!data.category_id) {
      return {
        success: false,
        message: "Kategori wajib dipilih.",
      };
    }

    if (!data.unit_id) {
      return {
        success: false,
        message: "Satuan wajib dipilih.",
      };
    }

    if (data.purchase_price < 0) {
      return {
        success: false,
        message: "Harga beli tidak boleh negatif.",
      };
    }

    if (data.selling_price < 0) {
      return {
        success: false,
        message: "Harga jual tidak boleh negatif.",
      };
    }

    if (data.stock < 0) {
      return {
        success: false,
        message: "Stok tidak boleh negatif.",
      };
    }

    // ==================================================
    // CEK BARCODE
    // ==================================================

    const existingBarcode = await db
      .select()
      .from(products)
      .where(eq(products.barcode, barcode));

    const duplicate = existingBarcode.find(
      (product) => product.id !== id
    );

    if (duplicate) {
      return {
        success: false,
        message:
          "Barcode tersebut sudah digunakan produk lain.",
      };
    }

    // ==================================================
    // AMBIL PRODUK LAMA
    // ==================================================

    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (existingProduct.length === 0) {
      return {
        success: false,
        message: "Produk tidak ditemukan.",
      };
    }

    const oldProduct = existingProduct[0];

    const stockBefore = oldProduct.stock;
    const stockAfter = data.stock;

    const stockDifference =
      stockAfter - stockBefore;

    // ==================================================
    // TRANSACTION
    // ==================================================

    await db.transaction(async (tx) => {
      // Update produk
      await tx
        .update(products)
        .set({
          category_id: data.category_id,
          unit_id: data.unit_id,

          barcode,
          name,
          description,

          purchase_price:
            data.purchase_price,

          selling_price:
            data.selling_price,

          stock: data.stock,

          updated_at: new Date(),
        })
        .where(eq(products.id, id));

      // ==================================================
      // STOCK LOG
      // ==================================================

      if (stockDifference !== 0) {
        const type =
          stockDifference > 0
            ? "in"
            : "out";

        const quantity =
          Math.abs(stockDifference);

        await tx.insert(stock_logs).values({
          product_id: id,

          type,

          quantity,

          stock_before: stockBefore,
          stock_after: stockAfter,

          reference_type: "product",
          reference_id: id,

          description:
            stockDifference > 0
              ? `Penambahan stok produk "${name}"`
              : `Pengurangan stok produk "${name}"`,

          user_id: null,
        });
      }
    });

    revalidatePath("/admin/produk");

    return {
      success: true,
      message: "Produk berhasil diperbarui.",
    };
  } catch (error) {
    console.error("Update product error:", error);

    return {
      success: false,
      message: "Gagal memperbarui produk.",
    };
  }
}

// ======================================================
// DELETE PRODUCT
// ======================================================

export async function deleteProduct(id: number) {
  try {
    const db = getDb();

    // ==================================================
    // CEK TRANSACTION DETAILS
    // ==================================================

    const transactionUsage = await db.execute(
      sql`
        SELECT COUNT(*) AS count
        FROM transaction_details
        WHERE product_id = ${id}
      `
    );

    // ==================================================
    // CEK PURCHASE DETAILS
    // ==================================================

    const purchaseUsage = await db.execute(
      sql`
        SELECT COUNT(*) AS count
        FROM purchase_details
        WHERE product_id = ${id}
      `
    );

    const transactionCount = Number(
      (transactionUsage[0] as any)?.count ?? 0
    );

    const purchaseCount = Number(
      (purchaseUsage[0] as any)?.count ?? 0
    );

    if (
      transactionCount > 0 ||
      purchaseCount > 0
    ) {
      return {
        success: false,
        message:
          "Produk tidak dapat dihapus karena sudah memiliki riwayat transaksi atau pembelian.",
      };
    }

    // ==================================================
    // DELETE
    // ==================================================

    await db
      .delete(products)
      .where(eq(products.id, id));

    revalidatePath("/admin/produk");

    return {
      success: true,
      message: "Produk berhasil dihapus.",
    };
  } catch (error) {
    console.error("Delete product error:", error);

    return {
      success: false,
      message: "Gagal menghapus produk.",
    };
  }
}