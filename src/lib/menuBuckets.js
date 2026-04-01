/**
 * Four customer-facing menu buckets. Routes: /order/menu/:slug
 * Square category names are mapped here (see menuBucketSlugForSquareCategory).
 */

export const MENU_BUCKETS = [
  { slug: 'matcha', label: 'Matcha' },
  { slug: 'hot-drinks', label: 'Hot drinks' },
  { slug: 'iced-drinks', label: 'Iced drinks' },
  { slug: 'pastries', label: 'Pastries' },
];

const OTHER_SLUG = 'other';
export const DEFAULT_REWARD_DRINK_CATEGORY_SLUGS = ['matcha', 'hot-drinks', 'iced-drinks'];

/**
 * Map a Square category display name to a stable menu bucket slug.
 * Tuned for names like "Coffee (Hot)", "Non Coffee Drinks (Cold)", "Matcha", "Pastries".
 */
export function menuBucketSlugForSquareCategory(squareCategoryName) {
  if (!squareCategoryName) return OTHER_SLUG;
  const n = squareCategoryName.toLowerCase();

  if (n.includes('matcha')) return 'matcha';
  if (n.includes('pastry') || n.includes('pastries')) return 'pastries';

  const isCold = n.includes('cold') || n.includes('iced');
  const isHot = n.includes('hot') && !isCold;

  if (isCold && (n.includes('coffee') || n.includes('drink') || n.includes('tea'))) {
    return 'iced-drinks';
  }
  if (isHot && (n.includes('coffee') || n.includes('drink') || n.includes('tea'))) {
    return 'hot-drinks';
  }
  if (isCold) return 'iced-drinks';
  if (isHot) return 'hot-drinks';

  return OTHER_SLUG;
}

/** Drink menu buckets eligible for free-drink loyalty reward (matches cafe-orders lib/menu-bucket). */
export function isDrinkLoyaltyCategory(
  slug,
  drinkCategorySlugs = DEFAULT_REWARD_DRINK_CATEGORY_SLUGS
) {
  return Array.isArray(drinkCategorySlugs) && drinkCategorySlugs.includes(slug);
}
