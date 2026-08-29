"use server";

import { desc, eq } from "drizzle-orm";

import { getDb } from "../db";

import {
  products,
  stock_logs,
} from "../db/schema";

// ======================================================
// GET STOCK LOGS
// ======================================================

export async function getStockLogs() {
  const db = getDb();

  return await db
    .select({
      id: stock_logs.id,

      product_id: stock_logs.product_id,

      product_name: products.name,
      barcode: products.barcode,

      type: stock_logs.type,

      quantity: stock_logs.quantity,

      stock_before: stock_logs.stock_before,
      stock_after: stock_logs.stock_after,

      reference_type: stock_logs.reference_type,
      reference_id: stock_logs.reference_id,

      description: stock_logs.description,

      user_id: stock_logs.user_id,

      created_at: stock_logs.created_at,
      updated_at: stock_logs.updated_at,
    })
    .from(stock_logs)
    .leftJoin(
      products,
      eq(stock_logs.product_id, products.id)
    )
    .orderBy(desc(stock_logs.created_at));
}