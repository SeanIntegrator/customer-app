import { describe, it, expect } from 'vitest';
import {
  buildGoldCardModelFromCustomerApiOrder,
  buildActiveOrderSnapshotFromApiOrder,
  pickupMinutesFromOrderForSuccess,
} from './orderViewModels.js';

describe('orderViewModels', () => {
  it('buildGoldCardModelFromCustomerApiOrder maps server order', () => {
    const m = buildGoldCardModelFromCustomerApiOrder({
      id: 5,
      status: 'pending',
      total_amount: 800,
      pickup_time: new Date(Date.now() + 30 * 60000).toISOString(),
      items: [{ item_name: 'Latte', item_emoji: '☕', quantity: 1, unit_price: 800 }],
      is_paid_via_stripe: true,
    });
    expect(m.id).toBe(5);
    expect(m.is_paid_via_stripe).toBe(true);
    expect(m.items[0].name).toBe('Latte');
  });

  it('buildActiveOrderSnapshotFromApiOrder returns snapshot', () => {
    const s = buildActiveOrderSnapshotFromApiOrder({
      id: 9,
      total_amount: 500,
      square_order_id: 'sq1',
      pickup_time: new Date(Date.now() + 60000).toISOString(),
      items: [],
    });
    expect(s.dbOrderId).toBe(9);
    expect(s.squareOrderId).toBe('sq1');
  });

  it('pickupMinutesFromOrderForSuccess defaults to 15 without pickup_time', () => {
    expect(pickupMinutesFromOrderForSuccess({})).toBe(15);
  });
});
