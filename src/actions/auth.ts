"use server";

import { getDb } from "@/db";
import { users, roles } from "@/db/schema";
import { comparePassword, setSession, clearSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { checkLoginRateLimit, recordFailedLogin, resetLoginAttempts } from "@/lib/rate-limiter";

export async function login(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!name || !password) {
    return { error: "Semua field harus diisi" };
  }

  // 1. Cek Rate Limiting / Brute-force Lockout
  const rateLimitStatus = checkLoginRateLimit(name);
  if (!rateLimitStatus.allowed) {
    const minutesLeft = Math.ceil((rateLimitStatus.lockoutRemainingSeconds || 60) / 60);
    return {
      error: `Terlalu banyak percobaan login gagal. Akun dikunci sementara selama ${minutesLeft} menit demi keamanan.`,
    };
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
    const failInfo = recordFailedLogin(name);
    if (failInfo.isLocked) {
      return {
        error: `Username atau password salah. Batas percobaan terlampaui. Akun dikunci selama 15 menit.`,
      };
    }
    return {
      error: `Username tidak ditemukan. Sisa percobaan: ${failInfo.remainingAttempts}x`,
    };
  }

  // Compare password
  const isValid = await comparePassword(password, user.password);
  
  if (!isValid) {
    const failInfo = recordFailedLogin(name);
    if (failInfo.isLocked) {
      return {
        error: `Password salah. Batas percobaan terlampaui. Akun dikunci selama 15 menit.`,
      };
    }
    return {
      error: `Password salah. Sisa percobaan aman: ${failInfo.remainingAttempts}x sebelum akun dikunci.`,
    };
  }
  
  if (!user.is_active) {
    return { error: "Akun anda tidak aktif. Hubungi Administrator." };
  }

  // Reset percobaan jika login sukses
  resetLoginAttempts(name);

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
