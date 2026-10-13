"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { store_settings } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type StoreSettingsData = {
  id: number;
  store_name: string;
  address: string;
  phone: string | null;
  email: string;
  logo: string;
  tax: number;
  receipt_footer: string | null;
  midtrans_server_key: string | null;
  midtrans_client_key: string | null;
  midtrans_is_production: boolean;
  updated_at: Date;
};

export type UpdateSettingsInput = {
  store_name: string;
  address: string;
  phone?: string;
  email: string;
  logo?: string;
  tax: number;
  receipt_footer?: string;
  midtrans_server_key?: string;
  midtrans_client_key?: string;
  midtrans_is_production?: boolean;
};

/**
 * Mengambil pengaturan toko lengkap (untuk halaman admin)
 */
export async function getStoreSettings(): Promise<StoreSettingsData> {
  const db = getDb();
  const [existing] = await db.select().from(store_settings).limit(1);

  if (!existing) {
    // Inisialisasi default jika belum ada
    const [inserted] = await db.insert(store_settings).values({
      store_name: "Kasirin Digital Store",
      address: "Jl. Malioboro No. 45, Yogyakarta",
      phone: "0812-3456-7890",
      email: "kontak@kasirin.app",
      logo: "/images/logo/logo.svg",
      tax: 11,
      receipt_footer: "Terima Kasih Telah Berbelanja di Toko Kami!",
    });

    return {
      id: Number(inserted.insertId),
      store_name: "Kasirin Digital Store",
      address: "Jl. Malioboro No. 45, Yogyakarta",
      phone: "0812-3456-7890",
      email: "kontak@kasirin.app",
      logo: "/images/logo/logo.svg",
      tax: 11,
      receipt_footer: "Terima Kasih Telah Berbelanja di Toko Kami!",
      midtrans_server_key: process.env.MIDTRANS_SERVER_KEY || null,
      midtrans_client_key: process.env.MIDTRANS_CLIENT_KEY || null,
      midtrans_is_production: process.env.MIDTRANS_IS_PRODUCTION === "true",
      updated_at: new Date(),
    };
  }

  return {
    id: existing.id,
    store_name: existing.store_name,
    address: existing.address,
    phone: existing.phone ?? null,
    email: existing.email,
    logo: existing.logo,
    tax: existing.tax,
    receipt_footer: existing.receipt_footer ?? null,
    midtrans_server_key: existing.midtrans_server_key || process.env.MIDTRANS_SERVER_KEY || null,
    midtrans_client_key: existing.midtrans_client_key || process.env.MIDTRANS_CLIENT_KEY || null,
    midtrans_is_production: Boolean(existing.midtrans_is_production),
    updated_at: existing.updated_at,
  };
}

/**
 * Mengambil info toko ringkas (dapat diakses kasir untuk cetak struk)
 */
export async function getPublicStoreInfo() {
  const db = getDb();
  const [existing] = await db
    .select({
      store_name: store_settings.store_name,
      address: store_settings.address,
      phone: store_settings.phone,
      email: store_settings.email,
      logo: store_settings.logo,
      tax: store_settings.tax,
      receipt_footer: store_settings.receipt_footer,
    })
    .from(store_settings)
    .limit(1);

  if (!existing) {
    return {
      store_name: "Kasirin Digital Store",
      address: "Jl. Malioboro No. 45, Yogyakarta",
      phone: "0812-3456-7890",
      email: "kontak@kasirin.app",
      logo: "/images/logo/logo.svg",
      tax: 11,
      receipt_footer: "Terima Kasih Telah Berbelanja di Toko Kami!",
    };
  }

  return existing;
}

/**
 * Memperbarui pengaturan toko (hanya untuk Admin)
 */
export async function updateStoreSettings(input: UpdateSettingsInput) {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Sesi tidak valid, silakan login kembali." };
  }

  if (session.roleCode === "KSR") {
    return { success: false, error: "Akses ditolak. Hanya Admin yang dapat mengubah pengaturan toko." };
  }

  if (!input.store_name || input.store_name.trim().length === 0) {
    return { success: false, error: "Nama toko tidak boleh kosong." };
  }

  if (!input.address || input.address.trim().length === 0) {
    return { success: false, error: "Alamat toko tidak boleh kosong." };
  }

  if (input.tax < 0 || input.tax > 100) {
    return { success: false, error: "Tarif pajak (PPN) harus berada di antara 0% - 100%." };
  }

  try {
    const db = getDb();
    const [existing] = await db.select({ id: store_settings.id }).from(store_settings).limit(1);

    if (existing) {
      await db
        .update(store_settings)
        .set({
          store_name: input.store_name.trim(),
          address: input.address.trim(),
          phone: input.phone ? input.phone.trim() : null,
          email: input.email ? input.email.trim() : "",
          logo: input.logo ? input.logo.trim() : "/images/logo/logo.svg",
          tax: Math.round(input.tax),
          receipt_footer: input.receipt_footer ? input.receipt_footer.trim() : null,
          midtrans_server_key: input.midtrans_server_key ? input.midtrans_server_key.trim() : null,
          midtrans_client_key: input.midtrans_client_key ? input.midtrans_client_key.trim() : null,
          midtrans_is_production: input.midtrans_is_production ? 1 : 0,
          updated_at: new Date(),
        })
        .where(eq(store_settings.id, existing.id));
    } else {
      await db.insert(store_settings).values({
        store_name: input.store_name.trim(),
        address: input.address.trim(),
        phone: input.phone ? input.phone.trim() : null,
        email: input.email ? input.email.trim() : "",
        logo: input.logo ? input.logo.trim() : "/images/logo/logo.svg",
        tax: Math.round(input.tax),
        receipt_footer: input.receipt_footer ? input.receipt_footer.trim() : null,
        midtrans_server_key: input.midtrans_server_key ? input.midtrans_server_key.trim() : null,
        midtrans_client_key: input.midtrans_client_key ? input.midtrans_client_key.trim() : null,
        midtrans_is_production: input.midtrans_is_production ? 1 : 0,
      });
    }

    revalidatePath("/admin/settings");
    revalidatePath("/kasir");
    revalidatePath("/admin/reports");

    return { success: true, message: "Pengaturan toko berhasil disimpan." };
  } catch (error: any) {
    console.error("Failed to update store settings:", error);
    return { success: false, error: error.message || "Gagal menyimpan pengaturan toko." };
  }
}
