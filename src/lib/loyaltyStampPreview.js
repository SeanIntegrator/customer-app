/**
 * Mirrors cafe-orders/lib/loyalty.js defaults for UI copy (stamps earned / pending).
 * STAMP_THRESHOLD_PENCE, DOUBLE_STAMP_WEEKDAY, LOYALTY_TIMEZONE must stay aligned with server.
 */

const STAMP_THRESHOLD_PENCE = 200;
const DOUBLE_STAMP_WEEKDAY = 2; // Tuesday (0 = Sunday), same as server
const LOYALTY_TIMEZONE = 'Europe/London';

function weekdayInTimezone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }).formatToParts(date);
  const w = parts.find((p) => p.type === 'weekday')?.value;
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const idx = names.indexOf(w);
  return idx >= 0 ? idx : 0;
}

/**
 * @param {number} totalPence
 * @param {Date} [when]
 * @returns {{ stamps: number, qualifies: boolean }}
 */
export function previewStampsEarnedForOrderTotal(totalPence, when = new Date()) {
  const total = Number(totalPence) || 0;
  if (total < STAMP_THRESHOLD_PENCE) {
    return { stamps: 0, qualifies: false };
  }
  const wd = weekdayInTimezone(when, LOYALTY_TIMEZONE);
  const stamps = wd === DOUBLE_STAMP_WEEKDAY ? 2 : 1;
  return { stamps, qualifies: true };
}

export function penceNeededForNextStamp(subtotalPence) {
  const s = Number(subtotalPence) || 0;
  if (s >= STAMP_THRESHOLD_PENCE) return 0;
  return STAMP_THRESHOLD_PENCE - s;
}

export { STAMP_THRESHOLD_PENCE, DOUBLE_STAMP_WEEKDAY, LOYALTY_TIMEZONE };
