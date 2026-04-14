import { isDrinkLoyaltyCategory } from './menuBuckets';

export const STAMPS_PER_REWARD = 9;
export const REWARD_MAX_PENCE = 700;

export function cartHasEligibleDrinkForReward(items, drinkCategorySlugs) {
  if (!Array.isArray(items)) return false;
  return items.some((i) => i && isDrinkLoyaltyCategory(i.category, drinkCategorySlugs));
}

/** Cheapest single drink unit price in basket; discount = min(that, cap). One reward covers one drink. */
export function computeRewardDiscountPenceForCart(
  items,
  rewardMaxPence = REWARD_MAX_PENCE,
  drinkCategorySlugs
) {
  if (!Array.isArray(items)) return 0;
  let minUnit = null;
  for (const i of items) {
    if (!i || !isDrinkLoyaltyCategory(i.category, drinkCategorySlugs)) continue;
    const unit = Number(i.totalPrice);
    if (!Number.isFinite(unit)) continue;
    if (minUnit == null || unit < minUnit) minUnit = unit;
  }
  if (minUnit == null) return 0;
  return Math.min(Math.round(minUnit), rewardMaxPence);
}
