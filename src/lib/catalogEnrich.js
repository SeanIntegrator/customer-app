import { fetchCatalogItems } from './api';
import { isRetailSquareCategory, showDrinkModifiersForCategory } from './categorySlug';
import {
  MENU_BUCKETS,
  menuBucketSlugForSquareCategory,
  showDrinkModifiersForMenuBucket,
} from './menuBuckets';
import {
  foodSubCategoryForPastriesItem,
  isLikelyStandaloneModifierItem,
  menuBucketOverrideForItemName,
} from './catalogFilters';
import { resolveItemIconUrl } from '../data/itemIcons';
import { getPriceForItem, getEmojiForItem } from '../data/mock';

/**
 * @param {Array<{ id: string, name: string, price?: number|null, categoryName?: string|null, categoryId?: string|null }>} raw
 * Drops £0 items (pence ≤ 0) — admin / comp SKUs not shown in order-ahead.
 */
export function enrichCatalogRaw(raw) {
  const filtered = raw.filter(
    (item) =>
      !isRetailSquareCategory(item.categoryName) && !isLikelyStandaloneModifierItem(item.name)
  );

  /** @type {Record<string, { categorySlug: string, squareCategoryName: string | null, showDrinkModifiers: boolean }>} */
  const variationById = {};

  const items = [];
  for (const item of filtered) {
    const pricePence = getPriceForItem(item.name, item.price);
    if (!Number.isFinite(pricePence) || pricePence <= 0) continue;

    const squareCategoryName = item.categoryName?.trim() ?? null;
    const categoryId = item.categoryId ?? null;
    const menuBucket =
      menuBucketOverrideForItemName(item.name) ?? menuBucketSlugForSquareCategory(squareCategoryName);
    const showDrinkModifiers = showDrinkModifiersForMenuBucket(menuBucket)
      ? true
      : showDrinkModifiersForCategory(squareCategoryName);
    const foodSubCategory =
      menuBucket === 'pastries' ? foodSubCategoryForPastriesItem(item.name) : null;
    const iconUrl = resolveItemIconUrl({ catalogObjectId: item.id, name: item.name });
    const enriched = {
      catalogObjectId: item.id,
      name: item.name,
      price: pricePence,
      emoji: getEmojiForItem(item.name),
      iconUrl,
      squareCategoryName,
      categoryId,
      category: menuBucket,
      foodSubCategory,
      showDrinkModifiers,
    };
    items.push(enriched);
    if (item.id) {
      variationById[item.id] = {
        categorySlug: menuBucket,
        squareCategoryName,
        showDrinkModifiers,
      };
    }
  }

  const hasOther = items.some((i) => i.category === 'other');
  const menuCategories = [
    ...MENU_BUCKETS.map(({ slug, label, headerImage }) => ({
      slug,
      label,
      headerImage,
      categoryId: null,
    })),
    ...(hasOther
      ? [
          {
            slug: 'other',
            label: 'Other',
            headerImage: '/icons/categories/other.svg',
            categoryId: null,
          },
        ]
      : []),
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
