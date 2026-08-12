import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { roles, menus, role_permissions, users } from "./schema";
import { hashPassword } from "../lib/auth";
import { eq } from "drizzle-orm";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }
  const db = drizzle(databaseUrl);

  console.log("Seeding Database...");

  console.log("Clearing existing data...");
  await db.delete(role_permissions);
  await db.delete(users);
  await db.delete(roles);
  await db.delete(menus);

  // 1. Seed Roles
  console.log("Seeding roles...");
  await db.insert(roles).values([
    { code: "ADM", name: "Admin" },
    { code: "KSR", name: "Kasir" },
  ]);

  const adminRoleList = await db.select().from(roles).where(eq(roles.code, "ADM"));
  const adminRole = adminRoleList[0];

  // 2. Seed Users
  console.log("Seeding users...");
  const hashedPassword = await hashPassword("password123");
  await db.insert(users).values([
    {
      name: "admin",
      password: hashedPassword,
      role_id: adminRole.id,
      is_active: true,
    }
  ]);

  // 3. Seed Menus
  console.log("Seeding menus...");
  // Main
  await db.insert(menus).values({ name: "Dashboard", path: "/admin/dashboard", icon: "GridIcon" });
  const dashboardMenuList = await db.select().from(menus).where(eq(menus.name, "Dashboard"));
  const dashboardMenu = dashboardMenuList[0];

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

  // Settings
  await db.insert(menus).values({ name: "Pengaturan Toko", path: "/admin/settings", icon: "PlugInIcon" });

  // 4. Seed Role Permissions
  console.log("Seeding permissions for Admin...");
  const allMenus = await db.select().from(menus);
  const permissionsData = allMenus.map(menu => ({
    role_id: adminRole.id,
    menu_id: menu.id,
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
    can_report: true,
  }));
  
  await db.insert(role_permissions).values(permissionsData);

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Seeding failed:");
  console.error(e);
  process.exit(1);
});
