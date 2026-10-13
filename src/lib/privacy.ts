/**
 * Utilitas Privasi & Perlindungan Data Pribadi (PII Protection)
 * Sesuai kepatuhan UU Pelindungan Data Pribadi & standar DevSecOps OWASP
 */

/**
 * Sensor nomor telepon pelanggan (misal: 081234567890 -> 0812****7890)
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "-";
  const clean = phone.trim();
  if (clean.length <= 6) return clean;

  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-4);
  const stars = "*".repeat(Math.max(3, clean.length - 8));
  return `${prefix}${stars}${suffix}`;
}

/**
 * Sensor alamat email (misal: supplier@distributor.com -> s***r@distributor.com)
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "-";
  const clean = email.trim();
  const atIndex = clean.indexOf("@");
  if (atIndex <= 2) return clean;

  const user = clean.slice(0, atIndex);
  const domain = clean.slice(atIndex);
  const maskedUser = `${user[0]}***${user[user.length - 1]}`;
  return `${maskedUser}${domain}`;
}

/**
 * Format nomor telepon standar Indonesia (ubah +62 atau spasi ke format bersih 08...)
 */
export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+62")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("62")) {
    cleaned = "0" + cleaned.slice(2);
  }
  return cleaned;
}
