import { DEFAULT_PICKUP_MINUTES } from './pickup';

export const CHECKOUT_CART_STORAGE_KEY = 'claybean_checkout_cart_v1';

/**
 * Persisted checkout cart for surviving full page reloads after Stripe redirect/cancel.
 * Only the "fresh" basket (not edit-order / add-to-order) should be written — callers gate that.
 */

export function readPersistedCheckoutCart() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CHECKOUT_CART_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p.version !== 1) return null;
    return {
      items: Array.isArray(p.items) ? p.items : [],
      applyReward: Boolean(p.applyReward),
      pickupMinutes:
        typeof p.pickupMinutes === 'number' && Number.isFinite(p.pickupMinutes)
          ? p.pickupMinutes
          : DEFAULT_PICKUP_MINUTES,
    };
  } catch {
    return null;
  }
}

export function writePersistedCheckoutCart({ items, applyReward, pickupMinutes }) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      CHECKOUT_CART_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        items,
        applyReward,
        pickupMinutes,
      })
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearPersistedCheckoutCart() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(CHECKOUT_CART_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
