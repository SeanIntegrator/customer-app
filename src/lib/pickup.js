/**
 * Shared pickup-time rules for checkout, edit-order, and home gold card display.
 */

export const PICKUP_STEP = 5;
/** API / stepper: 0 means ASAP. */
export const PICKUP_MIN_PICKUP = 0;
/** First scheduled slot when stepping up from ASAP. */
export const PICKUP_MIN_SCHEDULED = 10;
export const DEFAULT_PICKUP_MINUTES = PICKUP_MIN_SCHEDULED;

/** Decorative grain used on checkout sheets and home hero cards. */
export const PAPER_GRAIN_BACKGROUND =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='280' height='280' filter='url(%23n)' opacity='0.14'/%3E%3C/svg%3E\")";

export const checkoutStepperButtonStyle = {
  width: 28,
  height: 28,
  borderRadius: '48%',
  background: 'rgba(26,46,26,0.08)',
  border: '1.5px solid #d4c0a0',
  color: '#1a2e1a',
  fontSize: 16,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

/**
 * Remaining minutes until pickup (wall-clock). For gold card / profile copy.
 */
export function remainingMinutesUntilPickup(iso) {
  if (!iso) return DEFAULT_PICKUP_MINUTES;
  return Math.max(0, Math.round((new Date(iso) - Date.now()) / 60000));
}

/**
 * Map stored pickup_time to stepper value when editing (0 = ASAP, else multiples of 5, min 10).
 */
export function pickupIsoToStepperMinutes(iso) {
  if (!iso) return PICKUP_MIN_SCHEDULED;
  const rem = Math.round((new Date(iso) - Date.now()) / 60000);
  if (rem < PICKUP_MIN_SCHEDULED) return PICKUP_MIN_PICKUP;
  const snapped = Math.round(rem / PICKUP_STEP) * PICKUP_STEP;
  return Math.max(PICKUP_MIN_SCHEDULED, snapped);
}

export function formatPickupTimeShort(minutes) {
  if (minutes === PICKUP_MIN_PICKUP) return 'ASAP';
  const d = new Date(Date.now() + minutes * 60 * 1000);
  return d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatPickupTimeWithAtPrefix(minutes) {
  if (minutes === PICKUP_MIN_PICKUP) return 'ASAP';
  const d = new Date(Date.now() + minutes * 60 * 1000);
  return `at ${d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
}

export function goldCardPickupChipLabel(minutes) {
  return minutes === PICKUP_MIN_PICKUP ? 'ASAP' : `~${minutes} mins`;
}

/** One-line copy for menu in-progress bar (pickup_time ISO from API). */
export function orderReadyInOneLine(iso) {
  if (!iso) return 'Order in progress';
  const m = remainingMinutesUntilPickup(iso);
  if (m === PICKUP_MIN_PICKUP) return 'Order ready ASAP';
  if (m === 1) return 'Ready to pickup';
  return `Ready for collection in ${m} minutes`;
}

/**
 * +/- PICKUP_STEP from current value; matches edit-order modal semantics (no 5m-only slot from 0).
 */
export function adjustPickupStepper(current, delta) {
  if (delta > 0) {
    if (current === PICKUP_MIN_PICKUP) return PICKUP_MIN_SCHEDULED;
    return current + PICKUP_STEP;
  }
  if (current <= PICKUP_MIN_SCHEDULED) return PICKUP_MIN_PICKUP;
  return current - PICKUP_STEP;
}
