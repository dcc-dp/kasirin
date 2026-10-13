/**
 * In-Memory Sliding Window Rate Limiter & Brute-Force Protection
 * Melindungi endpoint login dari serangan credential stuffing dan password brute force.
 */

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  lockedUntil?: number;
}

const ATTEMPTS_MAP = new Map<string, AttemptRecord>();

// Konfigurasi Proteksi
const MAX_FAILED_ATTEMPTS = 5; // Maksimal 5x salah password
const WINDOW_MS = 15 * 60 * 1000; // Jendela waktu 15 menit
const LOCKOUT_MS = 15 * 60 * 1000; // Durasi penguncian akun 15 menit

export function checkLoginRateLimit(key: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockoutRemainingSeconds?: number;
} {
  const normalizedKey = key.trim().toLowerCase();
  const now = Date.now();
  const record = ATTEMPTS_MAP.get(normalizedKey);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  // Jika sedang terkunci
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutRemainingSeconds: remainingSeconds,
    };
  }

  // Jika jendela waktu sudah lewat, reset record
  if (now - record.firstAttemptAt > WINDOW_MS) {
    ATTEMPTS_MAP.delete(normalizedKey);
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - record.count);
  return { allowed: remaining > 0, remainingAttempts: remaining };
}

export function recordFailedLogin(key: string): {
  isLocked: boolean;
  lockoutRemainingSeconds?: number;
  remainingAttempts: number;
} {
  const normalizedKey = key.trim().toLowerCase();
  const now = Date.now();
  const record = ATTEMPTS_MAP.get(normalizedKey);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    ATTEMPTS_MAP.set(normalizedKey, {
      count: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
    });
    return {
      isLocked: false,
      remainingAttempts: MAX_FAILED_ATTEMPTS - 1,
    };
  }

  record.count += 1;
  record.lastAttemptAt = now;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    const remainingSeconds = Math.ceil(LOCKOUT_MS / 1000);
    return {
      isLocked: true,
      lockoutRemainingSeconds: remainingSeconds,
      remainingAttempts: 0,
    };
  }

  return {
    isLocked: false,
    remainingAttempts: MAX_FAILED_ATTEMPTS - record.count,
  };
}

export function resetLoginAttempts(key: string): void {
  const normalizedKey = key.trim().toLowerCase();
  ATTEMPTS_MAP.delete(normalizedKey);
}
