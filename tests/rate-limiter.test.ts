import { describe, it, expect, beforeEach } from "bun:test";
import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
} from "@/lib/rate-limiter";

describe("Proteksi Anti Brute-Force & Rate Limiting", () => {
  const testUser = "security_test_user";

  beforeEach(() => {
    resetLoginAttempts(testUser);
  });

  it("mengizinkan percobaan login awal dengan sisa 5 kesempatan", () => {
    const status = checkLoginRateLimit(testUser);
    expect(status.allowed).toBe(true);
    expect(status.remainingAttempts).toBe(5);
  });

  it("mengurangi kuota percobaan setiap kali password salah", () => {
    const attempt1 = recordFailedLogin(testUser);
    expect(attempt1.isLocked).toBe(false);
    expect(attempt1.remainingAttempts).toBe(4);

    const attempt2 = recordFailedLogin(testUser);
    expect(attempt2.isLocked).toBe(false);
    expect(attempt2.remainingAttempts).toBe(3);
  });

  it("mengunci akun otomatis pada kegagalan ke-5 selama 15 menit (900 detik)", () => {
    recordFailedLogin(testUser); // 1
    recordFailedLogin(testUser); // 2
    recordFailedLogin(testUser); // 3
    recordFailedLogin(testUser); // 4
    const attempt5 = recordFailedLogin(testUser); // 5

    expect(attempt5.isLocked).toBe(true);
    expect(attempt5.remainingAttempts).toBe(0);
    expect(attempt5.lockoutRemainingSeconds).toBeGreaterThan(800);

    // Verifikasi checkLoginRateLimit menolak akses
    const check = checkLoginRateLimit(testUser);
    expect(check.allowed).toBe(false);
    expect(check.remainingAttempts).toBe(0);
  });

  it("mereset hitungan saat login berhasil", () => {
    recordFailedLogin(testUser);
    recordFailedLogin(testUser);

    resetLoginAttempts(testUser);

    const check = checkLoginRateLimit(testUser);
    expect(check.allowed).toBe(true);
    expect(check.remainingAttempts).toBe(5);
  });
});
