/**
 * Mirrors PhoneNumbers.normalizeGhanaian on the API: accepts 0XXXXXXXXX or
 * +233XXXXXXXXX (spaces, dashes and brackets allowed) and returns +233XXXXXXXXX.
 */
export function normalizeGhanaianPhone(raw: string): string | null {
  const digits = raw.trim().replace(/[\s\-()]/g, '');
  const match = /^\+?233(\d{9})$/.exec(digits) ?? /^0(\d{9})$/.exec(digits);
  return match ? `+233${match[1]}` : null;
}

/** Formats +233241234567 as "024 123 4567" for display. */
export function formatGhanaianPhone(e164: string): string {
  const match = /^\+233(\d{2})(\d{3})(\d{4})$/.exec(e164);
  return match ? `0${match[1]} ${match[2]} ${match[3]}` : e164;
}
