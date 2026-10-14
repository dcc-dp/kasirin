import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import {
  roles,
  menus,
  role_permissions,
  users,
  categoris,
  units,
  products,
  stock_logs,
  members,
  suppliers,
  store_settings,
} from "./schema";
import { hashPassword } from "../lib/auth";
import { eq, sql } from "drizzle-orm";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }
  const db = drizzle(databaseUrl);

  console.log("Seeding Database...");

  console.log("Clearing existing auth & menu data...");
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  await db.delete(role_permissions);
  await db.delete(users);
  await db.delete(roles);
  await db.delete(menus);
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);

  // 1. Seed Roles
  console.log("Seeding roles...");
  await db.insert(roles).values([
    { code: "ADM", name: "Admin" },
    { code: "KSR", name: "Kasir" },
  ]);

  const adminRoleList = await db.select().from(roles).where(eq(roles.code, "ADM"));
  const adminRole = adminRoleList[0];

  const kasirRoleList = await db.select().from(roles).where(eq(roles.code, "KSR"));
  const kasirRole = kasirRoleList[0];

  // 2. Seed Users
  console.log("Seeding users...");
  const hashedPassword = await hashPassword("password123");
  await db.insert(users).values([
    {
      name: "admin",
      password: hashedPassword,
      role_id: adminRole.id,
      is_active: true,
    },
    {
      name: "kasir1",
      password: hashedPassword,
      role_id: kasirRole.id,
      is_active: true,
    },
  ]);

  const insertedUsers = await db.select().from(users).where(eq(users.name, "admin"));
  const adminUser = insertedUsers[0];

  // 3. Seed Menus
  console.log("Seeding menus...");
  // Main
  await db.insert(menus).values({ name: "Dashboard", path: "/admin/dashboard", icon: "GridIcon" });

  // RBAC Group
  await db.insert(menus).values({ name: "Web Management", path: "/admin/rbac", icon: "UserCircleIcon" });
  const rbacMenuList = await db.select().from(menus).where(eq(menus.name, "Web Management"));
  const rbacMenu = rbacMenuList[0];

  await db.insert(menus).values([
    { name: "Menus", path: "/admin/rbac/menus", parent_id: rbacMenu.id },
    { name: "Roles", path: "/admin/rbac/roles", parent_id: rbacMenu.id },
    { name: "Role Permissions", path: "/admin/rbac/permissions", parent_id: rbacMenu.id },
    { name: "Users", path: "/admin/rbac/users", parent_id: rbacMenu.id },
  ]);

  // Products
  await db.insert(menus).values({ name: "Produk", path: "/admin/products", icon: "BoxCubeIcon" });
  const productsMenuList = await db.select().from(menus).where(eq(menus.name, "Produk"));
  const productsMenu = productsMenuList[0];
  await db.insert(menus).values([
    { name: "Daftar Produk", path: "/admin/products", parent_id: productsMenu.id },
    { name: "Kategori", path: "/admin/products/categories", parent_id: productsMenu.id },
    { name: "Riwayat Stok", path: "/admin/products/stock-logs", parent_id: productsMenu.id },
    { name: "Satuan", path: "/admin/products/units", parent_id: productsMenu.id },
  ]);

  // Transaksi
  await db.insert(menus).values({ name: "Transaksi", path: "/admin/transactions", icon: "TableIcon" });
  const transMenuList = await db.select().from(menus).where(eq(menus.name, "Transaksi"));
  const transMenu = transMenuList[0];
  await db.insert(menus).values([
    { name: "POS (Kasir)", path: "/kasir", parent_id: transMenu.id },
    { name: "Laporan Penjualan", path: "/admin/transactions", parent_id: transMenu.id },
    { name: "Restock", path: "/admin/purchases", parent_id: transMenu.id },
  ]);

  // Member & Supplier & Shift
  await db.insert(menus).values({ name: "Member", path: "/admin/members", icon: "GroupIcon" });
  await db.insert(menus).values({ name: "Supplier", path: "/admin/suppliers", icon: "BoxIcon" });
  await db.insert(menus).values({ name: "Riwayat Shift", path: "/admin/shifts", icon: "TimeIcon" });

  // Settings
  await db.insert(menus).values({ name: "Pengaturan Toko", path: "/admin/settings", icon: "PlugInIcon" });

  // 4. Seed Role Permissions
  console.log("Seeding permissions for Admin...");
  const allMenus = await db.select().from(menus);
  const permissionsData = allMenus.map((menu) => ({
    role_id: adminRole.id,
    menu_id: menu.id,
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
    can_report: true,
  }));

  await db.insert(role_permissions).values(permissionsData);

  // 5. Seed Default Categories if empty
  const existingCategories = await db.select().from(categoris);
  if (existingCategories.length === 0) {
    console.log("Seeding default categories...");
    await db.insert(categoris).values([
      { name: "Minuman Dingin", description: "Aneka kopi, teh, jus, dan air mineral botol" },
      { name: "Makanan Ringan", description: "Snack, biskuit, keripik, dan camilan" },
      { name: "Sembako & Dapur", description: "Beras, minyak, gula, mie instan, dan bumbu" },
      { name: "Personal Care", description: "Sabun, sampo, pasta gigi, dan tisu" },
    ]);
  }

  // 6. Seed Default Units if empty
  const existingUnits = await db.select().from(units);
  if (existingUnits.length === 0) {
    console.log("Seeding default units...");
    await db.insert(units).values([
      { name: "pcs", description: "Satuan per buah / satuan tunggal" },
      { name: "botol", description: "Satuan botol kemasan" },
      { name: "pack", description: "Kemasan bungkus / pack" },
      { name: "kaleng", description: "Satuan kaleng" },
      { name: "box", description: "Satuan dus / kotak" },
    ]);
  }

  // 7. Seed Sample Starter Products if empty
  const existingProducts = await db.select().from(products);
  if (existingProducts.length === 0) {
    console.log("Seeding starter retail products...");
    const catList = await db.select().from(categoris);
    const unitList = await db.select().from(units);

    const catMinuman = catList.find((c) => c.name.includes("Minuman"))?.id || catList[0].id;
    const catMakanan = catList.find((c) => c.name.includes("Makanan"))?.id || catList[0].id;
    const catSembako = catList.find((c) => c.name.includes("Sembako"))?.id || catList[0].id;

    const unitPcs = unitList.find((u) => u.name === "pcs")?.id || unitList[0].id;
    const unitBotol = unitList.find((u) => u.name === "botol")?.id || unitList[0].id;
    const unitPack = unitList.find((u) => u.name === "pack")?.id || unitList[0].id;

    const sampleProducts = [
      {
        barcode: "8999999001011",
        name: "Aqua Air Mineral 600ml",
        description: "Air mineral pegunungan botol sedang",
        category_id: catMinuman,
        unit_id: unitBotol,
        purchase_price: 2500,
        selling_price: 3500,
        stock: 48,
      },
      {
        barcode: "8999999002022",
        name: "Kopi Kenangan Mantan 220ml",
        description: "Kopi susu siap minum kemasan botol",
        category_id: catMinuman,
        unit_id: unitBotol,
        purchase_price: 8000,
        selling_price: 11000,
        stock: 15,
      },
      {
        barcode: "8999999003033",
        name: "Chitato Sapi Panggang 68g",
        description: "Keripik kentang bergelombang rasa sapi panggang",
        category_id: catMakanan,
        unit_id: unitPack,
        purchase_price: 9000,
        selling_price: 12500,
        stock: 4, // Menipis <= 5
      },
      {
        barcode: "8999999004044",
        name: "Indomie Goreng Spesial 85g",
        description: "Mie instan kuah/goreng legendaris",
        category_id: catSembako,
        unit_id: unitPack,
        purchase_price: 2700,
        selling_price: 3500,
        stock: 120,
      },
      {
        barcode: "8999999005055",
        name: "Minyak Goreng Bimoli 1 Liter",
        description: "Minyak goreng kelapa sawit higienis",
        category_id: catSembako,
        unit_id: unitPcs,
        purchase_price: 18000,
        selling_price: 21500,
        stock: 0, // Habis = 0
      },
    ];

    for (const sp of sampleProducts) {
      const [inserted] = await db.insert(products).values(sp);
      const insertedId = (inserted as any)?.insertId;
      if (insertedId && sp.stock > 0) {
        await db.insert(stock_logs).values({
          product_id: Number(insertedId),
          type: "in",
          quantity: sp.stock,
          stock_before: 0,
          stock_after: sp.stock,
          reference_type: "initial_stock",
          description: "Stok awal inventori sistem",
          user_id: adminUser?.id || null,
        });
      }
    }
  }

  // 8. Seed Sample Members if empty
  const existingMembers = await db.select().from(members);
  if (existingMembers.length === 0) {
    console.log("Seeding sample members...");
    await db.insert(members).values([
      {
        nama: "Siti Rahmawati",
        phone: "081234567890",
        address: "Jl. Melati No. 12, RT 02/05, Jakarta Selatan",
        poin: 45,
      },
      {
        nama: "Budi Santoso",
        phone: "085711223344",
        address: "Jl. Mawar No. 5, Beji, Depok",
        poin: 120,
      },
      {
        nama: "Dewi Lestari",
        phone: "087899887766",
        address: "Komplek Anggrek Blok C2, Tangerang",
        poin: 15,
      },
    ]);
  }

  // 9. Seed Sample Suppliers if empty
  const existingSuppliers = await db.select().from(suppliers);
  if (existingSuppliers.length === 0) {
    console.log("Seeding sample suppliers...");
    await db.insert(suppliers).values([
      {
        name: "PT Indofood CBP Sukses Makmur",
        phone: "08118001234",
        address: "Kawasan Industri Pulo Gadung, Jakarta Timur",
        email: "order@indofood.co.id",
      },
      {
        name: "CV Tirta Berkah Abadi (Distributor Aqua)",
        phone: "081299881122",
        address: "Jl. Raya Bogor KM 28, Cimanggis, Depok",
        email: "distributor.tirta@gmail.com",
      },
      {
        name: "PT Wings Surya Retail",
        phone: "082155443322",
        address: "Jl. Tipar Cakung No. 45, Cakung, Jakarta Timur",
        email: "sales@wingscorp.com",
      },
    ]);
  }

  // 10. Seed Default Store Settings if empty
  const existingSettings = await db.select().from(store_settings);
  if (existingSettings.length === 0) {
    console.log("Seeding default store settings...");
    await db.insert(store_settings).values({
      store_name: "Kasirin Digital Store",
      address: "Jl. Malioboro No. 45, Yogyakarta",
      phone: "0812-3456-7890",
      email: "kontak@kasirin.app",
      logo: "/images/logo/logo.svg",
      tax: 11,
      receipt_footer: "Terima Kasih Telah Berbelanja di Toko Kami!",
    });
  }

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Seeding failed:");
  console.error(e);
  process.exit(1);
});
