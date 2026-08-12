"use server";

import { getDb } from "@/db";
import { menus, roles, role_permissions, users } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- MENUS ---
export async function getMenus() {
  const db = getDb();
  return await db.select().from(menus);
}

export async function createMenu(data: { name: string; path: string; icon?: string; parent_id?: number | null }) {
  const db = getDb();
  await db.insert(menus).values(data as any);
  revalidatePath("/admin/rbac/menus");
}

export async function updateMenu(id: number, data: { name: string; path: string; icon?: string; parent_id?: number | null }) {
  const db = getDb();
  await db.update(menus).set(data as any).where(eq(menus.id, id));
  revalidatePath("/admin/rbac/menus");
}

export async function deleteMenu(id: number) {
  const db = getDb();
  await db.delete(menus).where(eq(menus.id, id));
  revalidatePath("/admin/rbac/menus");
}

// --- ROLES ---
export async function getRoles() {
  const db = getDb();
  return await db.select().from(roles);
}

export async function createRole(data: { code: string; name: string }) {
  const db = getDb();
  await db.insert(roles).values(data);
  revalidatePath("/admin/rbac/roles");
}

export async function updateRole(id: number, data: { code: string; name: string }) {
  const db = getDb();
  await db.update(roles).set(data).where(eq(roles.id, id));
  revalidatePath("/admin/rbac/roles");
}

export async function deleteRole(id: number) {
  const db = getDb();
  await db.delete(roles).where(eq(roles.id, id));
  revalidatePath("/admin/rbac/roles");
}

import bcrypt from "bcryptjs";

// --- USERS ---
export async function getUsers() {
  const db = getDb();
  return await db
    .select({
      id: users.id,
      name: users.name,
      role_id: users.role_id,
      role_name: roles.name,
      is_active: users.is_active,
    })
    .from(users)
    .innerJoin(roles, eq(users.role_id, roles.id));
}

export async function createUser(data: { name: string; password?: string; role_id: number }) {
  const db = getDb();
  const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : await bcrypt.hash("password123", 10);
  
  await db.insert(users).values({
    name: data.name,
    password: hashedPassword,
    role_id: data.role_id,
  });
  revalidatePath("/admin/rbac/users");
}

export async function updateUser(id: number, data: { name: string; password?: string; role_id: number }) {
  const db = getDb();
  const updateData: any = {
    name: data.name,
    role_id: data.role_id,
  };
  
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }
  
  await db.update(users).set(updateData).where(eq(users.id, id));
  revalidatePath("/admin/rbac/users");
}

export async function deleteUser(id: number) {
  const db = getDb();
  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin/rbac/users");
}

// --- ROLE PERMISSIONS ---
export async function getRolePermissions(roleId: number) {
  const db = getDb();
  return await db.select().from(role_permissions).where(eq(role_permissions.role_id, roleId));
}

export async function getAllRolePermissions() {
  const db = getDb();
  return await db.select().from(role_permissions);
}

export async function saveRolePermissions(roleId: number, permissions: any[]) {
  const db = getDb();
  // Clear existing permissions for this role
  await db.delete(role_permissions).where(eq(role_permissions.role_id, roleId));
  // Insert new ones
  if (permissions.length > 0) {
    await db.insert(role_permissions).values(permissions);
  }
  revalidatePath("/admin/rbac/permissions");
}
