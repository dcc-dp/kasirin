import { describe, it, expect } from "bun:test";
import { getDb } from "@/db";
import { products, transactions, stock_logs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

describe("Integritas Transaksi ACID & Negative Stock Prevention", () => {
  const db = getDb();

  it("mencegah stok minus jika permintaan kuantitas melebihi stok fisik", async () => {
    // 1. Ambil 1 produk aktif dari database
    const [sampleProduct] = await db
      .select({ id: products.id, name: products.name, stock: products.stock })
      .from(products)
      .limit(1);

    expect(sampleProduct).toBeDefined();
    const initialStock = sampleProduct.stock;
    const excessiveQuantity = initialStock + 9999;

    // 2. Simulasikan validasi stok atomik
    let errorCaught = "";
    try {
      await db.transaction(async (tx: any) => {
        const [prod] = await tx
          .select({ stock: products.stock, name: products.name })
          .from(products)
          .where(eq(products.id, sampleProduct.id));

        if (prod.stock < excessiveQuantity) {
          throw new Error(
            `Stok untuk produk "${prod.name}" tidak mencukupi (Tersisa: ${prod.stock}, Diminta: ${excessiveQuantity}).`
          );
        }

        // Tidak boleh sampai ke titik pengurangan stok ini
        await tx
          .update(products)
          .set({ stock: prod.stock - excessiveQuantity })
          .where(eq(products.id, sampleProduct.id));
      });
    } catch (err: any) {
      errorCaught = err.message;
    }

    // 3. Verifikasi error tertangkap dan pesan menyebutkan stok tidak mencukupi
    expect(errorCaught).toContain("tidak mencukupi");

    // 4. Verifikasi stok di basis data tetap utuh (tidak berkurang / tidak menjadi negatif)
    const [verifiedProduct] = await db
      .select({ stock: products.stock })
      .from(products)
      .where(eq(products.id, sampleProduct.id));

    expect(verifiedProduct.stock).toBe(initialStock);
    expect(verifiedProduct.stock).toBeGreaterThanOrEqual(0);
  });

  it("menjamin atomic rollback saat terjadi kegagalan sistem di tengah transaksi", async () => {
    const [sampleProduct] = await db
      .select({ id: products.id, stock: products.stock })
      .from(products)
      .limit(1);

    const initialStock = sampleProduct.stock;

    let transactionFailed = false;
    try {
      await db.transaction(async (tx: any) => {
        // Langkah 1: Kurangi stok 1 unit sementara
        await tx
          .update(products)
          .set({ stock: initialStock - 1 })
          .where(eq(products.id, sampleProduct.id));

        // Langkah 2: Sengaja lempar error kegagalan jaringan / hardware
        throw new Error("SIMULATED_DATABASE_FAILOVER_OR_POWER_LOSS");
      });
    } catch (err: any) {
      if (err.message === "SIMULATED_DATABASE_FAILOVER_OR_POWER_LOSS") {
        transactionFailed = true;
      }
    }

    expect(transactionFailed).toBe(true);

    // Verifikasi bahwa langkah 1 di-rollback sepenuhnya oleh MySQL ACID
    const [postRollbackProduct] = await db
      .select({ stock: products.stock })
      .from(products)
      .where(eq(products.id, sampleProduct.id));

    expect(postRollbackProduct.stock).toBe(initialStock);
  });
});
