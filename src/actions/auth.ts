"use server";

import { getDb } from "@/db";
import { users } from "@/db/schema";
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
  
  // Find user
  const userList = await db.select().from(users).where(eq(users.name, name));
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

  // Set session
  await setSession(user.id, user.role_id);
  
  redirect("/admin/dashboard");
}

export async function logout() {
  await clearSession();
  redirect("/signin");
}
