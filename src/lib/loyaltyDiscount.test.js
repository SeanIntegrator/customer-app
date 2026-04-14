import { describe, it, expect } from 'vitest';
import { computeRewardDiscountPenceForCart, REWARD_MAX_PENCE } from './loyaltyDiscount.js';
import { DEFAULT_REWARD_DRINK_CATEGORY_SLUGS } from './menuBuckets';

describe('loyaltyDiscount', () => {
  it('returns 0 for empty cart', () => {
    expect(
      computeRewardDiscountPenceForCart([], REWARD_MAX_PENCE, DEFAULT_REWARD_DRINK_CATEGORY_SLUGS)
    ).toBe(0);
  });

  it('caps discount at reward max', () => {
    const items = [{ category: 'hot-drinks', totalPrice: 2000, quantity: 1 }];
    expect(
      computeRewardDiscountPenceForCart(
        items,
        REWARD_MAX_PENCE,
        DEFAULT_REWARD_DRINK_CATEGORY_SLUGS
      )
    ).toBe(REWARD_MAX_PENCE);
  });

  it('uses single drink unit price when quantity > 1 (one reward = one drink)', () => {
    const items = [{ category: 'hot-drinks', totalPrice: 400, quantity: 3 }];
    expect(
      computeRewardDiscountPenceForCart(
        items,
        REWARD_MAX_PENCE,
        DEFAULT_REWARD_DRINK_CATEGORY_SLUGS
      )
    ).toBe(400);
  });
});
