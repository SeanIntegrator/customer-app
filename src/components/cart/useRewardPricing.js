import { useMemo } from 'react';
import {
  cartHasEligibleDrinkForReward,
  computeRewardDiscountPenceForCart,
} from '../../lib/loyaltyDiscount';

export function useRewardPricing({
  isFreshStripeCheckout,
  isAuthenticated,
  rewardsAvailable,
  items,
  applyReward,
  rewardConfig,
  loyaltyConfig,
}) {
  const eligibleForReward =
    isFreshStripeCheckout &&
    isAuthenticated &&
    rewardsAvailable > 0 &&
    cartHasEligibleDrinkForReward(items, rewardConfig?.drinkCategorySlugs);

  const rewardDiscountPence = useMemo(
    () =>
      applyReward && eligibleForReward
        ? computeRewardDiscountPenceForCart(
            items,
            loyaltyConfig?.rewardMaxPence,
            rewardConfig?.drinkCategorySlugs
          )
        : 0,
    [
      applyReward,
      eligibleForReward,
      items,
      loyaltyConfig?.rewardMaxPence,
      rewardConfig?.drinkCategorySlugs,
    ]
  );

  return { eligibleForReward, rewardDiscountPence };
}
