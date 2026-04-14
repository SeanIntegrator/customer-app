/**
 * Filter Square ITEM rows that duplicate modifier SKUs (shown only in item detail sheets).
 */

const STANDALONE_MODIFIER_PATTERNS = [
  /^(oat|almond|coconut|soy|skim|semi[\s-]?skim)\s*milk$/i,
  /^extra\s*shot$/i,
  /^decaf$/i,
  /\bsyrup\b/i,
];

/**
 * @param {string | null | undefined} name
 * @returns {boolean}
 */
export function isLikelyStandaloneModifierItem(name) {
  const n = String(name ?? '').trim();
  if (!n) return false;
  return STANDALONE_MODIFIER_PATTERNS.some((re) => re.test(n));
}

const ITEM_BUCKET_OVERRIDES = [
  { test: (n) => /\bpourover\b/i.test(n), slug: 'hot-drinks' },
  { test: (n) => /\bbabycino\b/i.test(n), slug: 'hot-drinks' },
];

/**
 * Per-item bucket overrides when Square category is wrong (e.g. miscategorised as food).
 * @param {string | null | undefined} itemName
 * @returns {import('./menuBuckets').MenuBucketSlug | null}
 */
export function menuBucketOverrideForItemName(itemName) {
  const n = String(itemName ?? '').trim();
  if (!n) return null;
  for (const { test, slug } of ITEM_BUCKET_OVERRIDES) {
    if (test(n)) return slug;
  }
  return null;
}

/** @typedef {'pastries' | 'cakes'} FoodSubCategory */

/**
 * Within the pastries menu tab, order pastries before cakes.
 * @param {string | null | undefined} itemName
 * @returns {FoodSubCategory}
 */
export function foodSubCategoryForPastriesItem(itemName) {
  const n = String(itemName ?? '').toLowerCase();
  if (
    /\b(cake|cakes|brownie|brownies|tiffin|blondie|blondies|gateau|torte|bakewell|flapjack|scone|scones)\b/.test(
      n
    )
  ) {
    return 'cakes';
  }
  return 'pastries';
}
