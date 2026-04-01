/** Profile page: date formatting, order copy, and horizon filters for order history. */

export const PROFILE_GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='280' height='280' filter='url(%23n)' opacity='0.14'/%3E%3C/svg%3E")`;

export const EVENT_GRADIENTS = [
  'linear-gradient(148deg, #a04820 0%, #c87040 55%, #e09858 100%)',
  'linear-gradient(148deg, #2a0812 0%, #5a1428 55%, #782038 100%)',
  'linear-gradient(148deg, #7a5008 0%, #a87020 55%, #c89038 100%)',
  'linear-gradient(148deg, #4a2810 0%, #7a4820 55%, #a06830 100%)',
];

export const ORDERS_PAGE_SIZE = 6;

export function formatHistoryOrderDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function orderSummaryLine(order) {
  const items = order.items || [];
  return items
    .map((it) => (it.quantity > 1 ? `${it.quantity}× ` : '') + (it.item_name || 'Item'))
    .join(', ');
}

export function startOfWeekMonday(ref) {
  const x = new Date(ref);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfCalendarMonth(ref) {
  return new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
}
