import { loadStripe } from '@stripe/stripe-js';

/** @type {Map<string, Promise<import('@stripe/stripe-js').Stripe | null>>} */
const stripePromiseByKey = new Map();

/**
 * Single cached Stripe.js instance per publishable key (avoids redundant script loads).
 * @param {string} publishableKey
 */
export function getStripePromise(publishableKey) {
  if (!publishableKey) return Promise.resolve(null);
  let p = stripePromiseByKey.get(publishableKey);
  if (!p) {
    p = loadStripe(publishableKey);
    stripePromiseByKey.set(publishableKey, p);
  }
  return p;
}

/**
 * Hosted Checkout: redirect via Stripe.js; if redirect fails but `url` is present, full-page navigate.
 * @param {{ publishableKey: string, sessionId: string, url?: string | null }} opts
 * @returns {Promise<void>}
 */
export async function redirectToCheckoutWithFallback({ publishableKey, sessionId, url }) {
  const stripe = await getStripePromise(publishableKey);
  if (!stripe) {
    throw new Error('Stripe.js failed to load');
  }
  const { error: stripeErr } = await stripe.redirectToCheckout({ sessionId });
  if (stripeErr) {
    if (url) {
      window.location.assign(url);
      return;
    }
    throw new Error(stripeErr.message || 'Could not redirect to payment');
  }
}
