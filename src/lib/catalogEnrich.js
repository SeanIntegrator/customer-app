import { fetchCatalogItems } from './api';
import { isRetailSquareCategory, showDrinkModifiersForCategory } from './categorySlug';
import { MENU_BUCKETS, menuBucketSlugForSquareCategory } from './menuBuckets';
import { getPriceForItem, getEmojiForItem } from '../data/mock';

/**
 * @param {Array<{ id: string, name: string, price?: number|null, categoryName?: string|null, categoryId?: string|null }>} raw
 */
export function enrichCatalogRaw(raw) {
  const filtered = raw.filter((item) => !isRetailSquareCategory(item.categoryName));

  /** @type {Record<string, { categorySlug: string, squareCategoryName: string | null, showDrinkModifiers: boolean }>} */
  const variationById = {};

  const items = filtered.map((item) => {
    const squareCategoryName = item.categoryName?.trim() ?? null;
    const categoryId = item.categoryId ?? null;
    const menuBucket = menuBucketSlugForSquareCategory(squareCategoryName);
    const showDrinkModifiers = showDrinkModifiersForCategory(squareCategoryName);
    const enriched = {
      catalogObjectId: item.id,
      name: item.name,
      price: getPriceForItem(item.name, item.price),
      emoji: getEmojiForItem(item.name),
      squareCategoryName,
      categoryId,
      category: menuBucket,
      showDrinkModifiers,
    };
    if (item.id) {
      variationById[item.id] = {
        categorySlug: menuBucket,
        squareCategoryName,
        showDrinkModifiers,
      };
    }
    return enriched;
  });

  const hasOther = items.some((i) => i.category === 'other');
  const menuCategories = [
    ...MENU_BUCKETS.map(({ slug, label }) => ({ slug, label, categoryId: null })),
    ...(hasOther ? [{ slug: 'other', label: 'Other', categoryId: null }] : []),
  ];

  return { items, menuCategories, variationById };
}

let enrichedCache = null;
let inFlight = null;

export async function getEnrichedCatalog() {
  if (enrichedCache) return enrichedCache;
  if (!inFlight) {
    inFlight = fetchCatalogItems()
      .then((raw) => enrichCatalogRaw(raw))
      .then((data) => {
        enrichedCache = data;
        inFlight = null;
        return data;
      })
      .catch((err) => {
        inFlight = null;
        throw err;
      });
  }
  return inFlight;
}

export function invalidateEnrichedCatalogCache() {
  enrichedCache = null;
}

export function peekEnrichedCatalog() {
  return enrichedCache;
}
