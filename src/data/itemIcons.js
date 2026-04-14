/**
 * Optional custom icons for menu tiles (`/public/icons/items/...`).
 *
 * Add entries keyed by Square **variation** id (`catalogObjectId`) when assets are ready.
 * Until then, tiles fall back to emoji from `getEmojiForItem` in `mock.js`.
 *
 * @example
 * export const ITEM_ICON_BY_CATALOG_ID = Object.freeze({
 *   'ABCD1234': '/icons/items/latte.png',
 * });
 */

/** @type {Readonly<Record<string, string>>} */
export const ITEM_ICON_BY_CATALOG_ID = Object.freeze({});

/**
 * @param {{ catalogObjectId?: string | null, name?: string | null }} item
 * @returns {string | null} Public URL or null to use emoji fallback
 */
export function resolveItemIconUrl(item) {
  const id = item?.catalogObjectId;
  if (id && ITEM_ICON_BY_CATALOG_ID[id]) {
    return ITEM_ICON_BY_CATALOG_ID[id];
  }
  return null;
}
