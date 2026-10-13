"use server";

import { eq, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { purchases, purchase_details, products, suppliers, stock_logs, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { generatePurchaseInvoice } from "@/lib/financial";
import type { ActionResponse } from "@/types/action";

export type PurchaseListItem = {
  id: number;
  invoice: string;
  purchase_date: Date | null;
  total: number;
  supplier_id: number;
  supplier_name: string | null;
  user_id: number;
  user_name: string | null;
  total_items: number;
  total_quantity: number;
  created_at: Date;
};

export type PurchaseDetailView = {
  id: number;
  invoice: string;
  purchase_date: Date | null;
  total: number;
  supplier_id: number;
  supplier_name: string | null;
  supplier_phone: string | null;
  supplier_address: string | null;
  user_name: string | null;
  created_at: Date;
  items: {
    id: number;
    product_id: number;
    name: string;
    description: string;
    purchase_price: number;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
};

/**
 * Mengambil daftar seluruh riwayat pembelian restock dari supplier
 */
export async function getPurchases(): Promise<PurchaseListItem[]> {
  const db = getDb();

  const list = await db
    .select({
      id: purchases.id,
      invoice: purchases.invoice,
      purchase_date: purchases.purchase_date,
      total: purchases.total,
      supplier_id: purchases.supplier_id,
      supplier_name: suppliers.name,
      user_id: purchases.user_id,
      user_name: users.name,
      created_at: purchases.created_at,
      total_items: sql<number>`COALESCE(COUNT(${purchase_details.id}), 0)`.mapWith(Number),
      total_quantity: sql<number>`COALESCE(SUM(${purchase_details.quantity}), 0)`.mapWith(Number),
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplier_id, suppliers.id))
    .leftJoin(users, eq(purchases.user_id, users.id))
    .leftJoin(purchase_details, eq(purchases.id, purchase_details.purchase_id))
    .groupBy(purchases.id)
    .orderBy(desc(purchases.created_at));

  return list as PurchaseListItem[];
}

/**
 * Mengambil detail lengkap satu faktur pembelian beserta item-itemnya
 */
export async function getPurchaseById(id: number): Promise<PurchaseDetailView | null> {
  const db = getDb();

  const [header] = await db
    .select({
      id: purchases.id,
      invoice: purchases.invoice,
      purchase_date: purchases.purchase_date,
      total: purchases.total,
      supplier_id: purchases.supplier_id,
      supplier_name: suppliers.name,
      supplier_phone: suppliers.phone,
      supplier_address: suppliers.address,
      user_name: users.name,
      created_at: purchases.created_at,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplier_id, suppliers.id))
    .leftJoin(users, eq(purchases.user_id, users.id))
    .where(eq(purchases.id, id));

  if (!header) return null;

  const items = await db
    .select({
      id: purchase_details.id,
      product_id: purchase_details.product_id,
      name: purchase_details.name,
      description: purchase_details.description,
      purchase_price: purchase_details.purchase_price,
      price: purchase_details.price,
      quantity: purchase_details.quantity,
      subtotal: purchase_details.subtotal,
    })
    .from(purchase_details)
    .where(eq(purchase_details.purchase_id, id));

  return {
    ...header,
    items,
  };
}

/**
 * Pilihan opsi untuk form restock (Supplier aktif & Produk)
 */
export async function getPurchaseFormOptions() {
  const db = getDb();

  const [suppliersList, productsList] = await Promise.all([
    db.select({ id: suppliers.id, name: suppliers.name, phone: suppliers.phone }).from(suppliers),
    db.select({
      id: products.id,
      barcode: products.barcode,
      name: products.name,
      stock: products.stock,
      purchase_price: products.purchase_price,
      selling_price: products.selling_price,
    }).from(products),
  ]);

  return {
    suppliers: suppliersList,
    products: productsList,
  };
}

export type PurchaseItemInput = {
  product_id: number;
  quantity: number;
  purchase_price: number;
  selling_price?: number;
};

/**
 * Catat Pembelian Restock Barang Supplier (Transaksi Atomik ACID)
 * Otomatis:
 * 1. Simpan header `purchases`
 * 2. Simpan rincian `purchase_details`
 * 3. Tambah stok fisik di `products`
 * 4. Perbarui `purchase_price` (HPP) & `selling_price` di `products`
 * 5. Catat mutasi masuk ke `stock_logs` (type: 'in')
 */
export async function createPurchase(data: {
  supplier_id: number;
  invoice?: string;
  purchase_date?: string | Date;
  items: PurchaseItemInput[];
}): Promise<ActionResponse<{ id: number; invoice: string }>> {
  try {
    const db = getDb();
    const session = await getSession();

    if (!data.supplier_id) {
      return { success: false, message: "Pemasok / Supplier wajib dipilih." };
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, message: "Minimal harus ada 1 barang yang direstock." };
    }

    // Validasi setiap item
    for (const item of data.items) {
      if (!item.product_id) {
        return { success: false, message: "Produk tidak valid." };
      }
      if (item.quantity <= 0) {
        return { success: false, message: "Kuantitas restock harus lebih dari 0." };
      }
      if (item.purchase_price < 0) {
        return { success: false, message: "Harga beli tidak boleh negatif." };
      }
    }

    // Ambil info supplier
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, data.supplier_id));

    if (!supplier) {
      return { success: false, message: "Supplier tidak ditemukan." };
    }

    const invoice = data.invoice && data.invoice.trim() !== ""
      ? data.invoice.trim()
      : generatePurchaseInvoice();

    const purchaseDate = data.purchase_date
      ? new Date(data.purchase_date)
      : new Date();

    const grandTotal = data.items.reduce(
      (sum, item) => sum + item.purchase_price * item.quantity,
      0
    );

    let insertedPurchaseId = 0;

    // Transaksi Atomik Database
    await db.transaction(async (tx: any) => {
      let effectiveUserId = session?.userId;
      if (!effectiveUserId) {
        const [anyUser] = await tx.select({ id: users.id }).from(users).limit(1);
        effectiveUserId = anyUser?.id;
      }

      // 1. Insert header purchases
      const [insertedHeader] = await tx.insert(purchases).values({
        supplier_id: data.supplier_id,
        invoice,
        purchase_date: purchaseDate,
        total: grandTotal,
        user_id: effectiveUserId,
      });

      insertedPurchaseId = Number(insertedHeader.insertId);

      // 2. Loop insert details, update products stock & HPP, and log stock
      for (const item of data.items) {
        // Ambil data produk saat ini
        const [prod] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.product_id));

        if (!prod) {
          throw new Error(`Produk ID ${item.product_id} tidak ditemukan.`);
        }

        const subtotal = item.purchase_price * item.quantity;
        const currentStock = prod.stock;
        const newStock = currentStock + item.quantity;

        // Insert purchase details
        await tx.insert(purchase_details).values({
          purchase_id: insertedPurchaseId,
          product_id: item.product_id,
          name: prod.name,
          description: prod.description || `Restock dari ${supplier.name}`,
          purchase_price: item.purchase_price,
          price: item.selling_price && item.selling_price > 0 ? item.selling_price : prod.selling_price,
          quantity: item.quantity,
          subtotal,
        });

        // Update product stock and purchase price
        const updatePayload: any = {
          stock: newStock,
          purchase_price: item.purchase_price, // Perbarui HPP terkini
          updated_at: new Date(),
        };

        if (item.selling_price && item.selling_price > 0) {
          updatePayload.selling_price = item.selling_price;
        }

        await tx
          .update(products)
          .set(updatePayload)
          .where(eq(products.id, item.product_id));

        // Catat ke stock_logs mutasi masuk
        await tx.insert(stock_logs).values({
          product_id: item.product_id,
          type: "in",
          quantity: item.quantity,
          stock_before: currentStock,
          stock_after: newStock,
          reference_type: "purchase",
          reference_id: insertedPurchaseId,
          description: `Restock dari ${supplier.name} (Faktur #${invoice})`,
          user_id: session?.userId || null,
        });
      }
    });

    try {
      revalidatePath("/admin/purchases");
      revalidatePath("/admin/products");
      revalidatePath("/admin/products/stock-logs");
      revalidatePath("/kasir");
    } catch {
      // safe fallback
    }

    return {
      success: true,
      message: `Restock faktur #${invoice} berhasil disimpan. Stok barang telah otomatis bertambah.`,
      data: { id: insertedPurchaseId, invoice },
    };
  } catch (error) {
    console.error("Create purchase error:", error);
    return {
      success: false,
      message: "Gagal memproses faktur pembelian restock.",
    };
  }
}
