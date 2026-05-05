/**
 * QR Token Generator / Validator
 * Generates HMAC-like time-based tokens that rotate every 10 minutes.
 * Uses a shared secret to prevent QR screenshot abuse.
 */

const QR_SECRET = 'ecar-asistencia-2026-secret-key';
const ROTATION_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

/** Get the current time slot (floor to nearest 10-min window) */
function getTimeSlot(date = new Date()): number {
  return Math.floor(date.getTime() / ROTATION_INTERVAL_MS);
}

/** Simple hash function for browser (no crypto API needed) */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to hex and make it look like a real token
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  // Create a longer token by hashing again with a salt
  let hash2 = 0;
  const salted = input + '-salt-ecar';
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash2 = ((hash2 << 5) - hash2) + char;
    hash2 = hash2 & hash2;
  }
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  return `${hex}${hex2}`.toUpperCase();
}

/** Generate the current valid QR token */
export function generateQRToken(): { token: string; expiresAt: Date; slot: number } {
  const slot = getTimeSlot();
  const token = simpleHash(`${QR_SECRET}-${slot}`);
  const nextSlot = (slot + 1) * ROTATION_INTERVAL_MS;
  return {
    token,
    expiresAt: new Date(nextSlot),
    slot,
  };
}

/** Validate a token — accepts current slot and previous slot (grace period) */
export function validateQRToken(token: string): boolean {
  const currentSlot = getTimeSlot();
  // Check current window
  const currentToken = simpleHash(`${QR_SECRET}-${currentSlot}`);
  if (token === currentToken) return true;
  // Check previous window (1 slot = 10 min grace period)
  const prevToken = simpleHash(`${QR_SECRET}-${currentSlot - 1}`);
  if (token === prevToken) return true;
  return false;
}

/** Calculate time remaining in current QR window */
export function getTimeRemaining(): { minutes: number; seconds: number; totalSeconds: number } {
  const now = Date.now();
  const currentSlotEnd = (getTimeSlot() + 1) * ROTATION_INTERVAL_MS;
  const remaining = Math.max(0, currentSlotEnd - now);
  const totalSeconds = Math.floor(remaining / 1000);
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
  };
}

/** Build the URL for the check-in page */
export function buildCheckInUrl(token: string): string {
  const base = window.location.origin;
  return `${base}/fichar?token=${token}`;
}
