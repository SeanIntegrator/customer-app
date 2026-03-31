import { isDrinkLoyaltyCategory } from './menuBuckets';

export const STAMPS_PER_REWARD = 9;
export const REWARD_MAX_PENCE = 700;

export function cartHasEligibleDrinkForReward(items) {
  if (!Array.isArray(items)) return false;
  return items.some((i) => i && isDrinkLoyaltyCategory(i.category));
}

/** Cheapest drink line total in basket; discount preview = min(line, cap). */
export function computeRewardDiscountPenceForCart(items) {
  if (!Array.isArray(items)) return 0;
  let minLine = null;
  for (const i of items) {
    if (!i || !isDrinkLoyaltyCategory(i.category)) continue;
    const line = Number(i.totalPrice) * Number(i.quantity || 1);
    if (!Number.isFinite(line)) continue;
    if (minLine == null || line < minLine) minLine = line;
  }
  if (minLine == null) return 0;
  return Math.min(Math.round(minLine), REWARD_MAX_PENCE);
}
