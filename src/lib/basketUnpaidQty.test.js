import { describe, it, expect } from 'vitest';
import { unpaidBasketQuantity, navBasketBadgeCount } from './basketUnpaidQty.js';

describe('basketUnpaidQty', () => {
  const items = [
    { quantity: 2, fromExistingOrder: true },
    { quantity: 1, fromExistingOrder: false },
  ];

  it('counts only new lines in edit mode', () => {
    expect(unpaidBasketQuantity(items, 1, null)).toBe(1);
  });

  it('counts all in add-to-order mode', () => {
    expect(unpaidBasketQuantity(items, null, 99)).toBe(3);
  });

  it('navBasketBadgeCount respects suppress flag', () => {
    expect(navBasketBadgeCount([{ quantity: 2 }], null, null, true)).toBe(0);
    expect(navBasketBadgeCount([{ quantity: 2 }], null, null, false)).toBe(2);
  });
});
