/** Matches orders-db EMOJI_KIND for fingerprinting. */
const EMOJI_KIND = 'item_emoji';

function modifierNamesForFingerprint(modifiers) {
  if (!Array.isArray(modifiers)) return [];
  return modifiers
    .filter((m) => m && typeof m === 'object' && m.kind !== EMOJI_KIND && m.name)
    .map((m) => String(m.name))
    .sort();
}

/**
 * Stable signature for an order's line items (variation + modifiers multiset, quantities aggregated).
 */
export function orderItemsFingerprint(items) {
  if (!Array.isArray(items) || items.length === 0) return '';
  const buckets = new Map();
  for (const it of items) {
    const vid = it.square_variation_id || '';
    const mods = modifierNamesForFingerprint(it.modifiers).join('\u001f');
    const key = `${vid}\u001e${mods}`;
    const q = parseInt(String(it.quantity), 10) || 1;
    buckets.set(key, (buckets.get(key) || 0) + q);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, q]) => `${k}\u001d${q}`)
    .join('\u001c');
}

const DEFAULT_WINDOW_MS = 60 * 24 * 60 * 60 * 1000;

/**
 * Same exact basket (items + modifiers, aggregated quantities) ordered strictly more than 3 times
 * in the window → return the most recent matching basket's line items.
 *
 * @param {object[]} orders - API orders (with items, created_at)
 * @returns {null | { items: object[], matchCount: number }}
 */
export function findUsualOrderFromHistory(orders, windowMs = DEFAULT_WINDOW_MS) {
  const now = Date.now();
  const recent = orders.filter((o) => {
    const t = new Date(o.created_at).getTime();
    return Number.isFinite(t) && now - t <= windowMs && (o.items?.length ?? 0) > 0;
  });

  const fpMap = new Map();
  for (const o of recent) {
    const fp = orderItemsFingerprint(o.items);
    if (!fp) continue;
    const cur = fpMap.get(fp) || { count: 0, lastTs: 0, representative: null };
    cur.count += 1;
    const ts = new Date(o.created_at).getTime();
    if (ts >= cur.lastTs) {
      cur.lastTs = ts;
      cur.representative = o.items;
    }
    fpMap.set(fp, cur);
  }

  let best = null;
  for (const [, v] of fpMap) {
    if (v.count <= 3) continue;
    if (!best || v.count > best.count || (v.count === best.count && v.lastTs > best.lastTs)) {
      best = { ...v };
    }
  }

  if (!best?.representative?.length) return null;
  return { items: best.representative, matchCount: best.count };
}

/** Map API order items to cart line shape (new order, not edit mode). */
export function apiOrderItemsToCartLines(items) {
  if (!Array.isArray(items)) return [];
  return items.map((it, idx) => {
    const alterations = [];
    for (const m of it.modifiers || []) {
      if (m && typeof m === 'object' && m.kind !== EMOJI_KIND && m.name) {
        alterations.push(String(m.name));
      }
    }
    return {
      cartId: `usual-${it.id}-${idx}`,
      catalogObjectId: it.square_variation_id,
      name: it.item_name,
      emoji: it.item_emoji || '☕',
      category: 'coffee',
      size: 'Regular',
      milk: 'Full Fat',
      syrup: null,
      alterations,
      quantity: it.quantity || 1,
      totalPrice: it.unit_price,
      fromExistingOrder: false,
    };
  });
}
