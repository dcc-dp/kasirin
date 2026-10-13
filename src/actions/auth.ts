"use server";

import { getDb } from "@/db";
import { users, roles } from "@/db/schema";
import { comparePassword, setSession, clearSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function login(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!name || !password) {
    return { error: "Semua field harus diisi" };
  }

  const db = getDb();
  
  // Find user with role
  const userList = await db
    .select({
      id: users.id,
      name: users.name,
      password: users.password,
      role_id: users.role_id,
      is_active: users.is_active,
      role_code: roles.code,
    })
    .from(users)
    .innerJoin(roles, eq(users.role_id, roles.id))
    .where(eq(users.name, name));
  const user = userList[0];

  if (!user) {
    return { error: "Username tidak ditemukan" };
  }

  // Compare password
  const isValid = await comparePassword(password, user.password);
  
  if (!isValid) {
    return { error: "Password salah" };
  }
  
  if (!user.is_active) {
    return { error: "Akun anda tidak aktif" };
  }

  // Set session with role code and user name
  await setSession(user.id, user.role_id, user.role_code, user.name);
  
  // Smart redirect: kasir langsung ke /kasir, admin ke /admin/dashboard
  if (user.role_code === "KSR") {
    redirect("/kasir");
  } else {
    redirect("/admin/dashboard");
  }
}

export async function logout() {
  await clearSession();
  redirect("/signin");
}
