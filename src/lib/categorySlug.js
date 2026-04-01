/**
 * Square category labels → URL-safe slugs with collision handling.
 */

/** Pastry / baked goods Square categories: hide global drink modifier UI. */
const FOOD_CATEGORY_SUBSTRINGS = ['pastry', 'pastries', 'food'];

export function normalizeCategoryLabel(name) {
  if (!name || typeof name !== 'string') return '';
  return name.normalize('NFKC').trim();
}

export function slugifyCategoryLabel(name) {
  if (!name) return 'other';
  const normalized = name.normalize('NFKC').trim().toLowerCase();
  const slug = normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || 'other';
}

function simpleHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = Math.imul(31, h) + s.charCodeAt(i) || 0;
  }
  return Math.abs(h).toString(36).slice(0, 6);
}

function idSuffix(categoryId, label) {
  if (categoryId)
    return (
      String(categoryId)
        .replace(/[^A-Za-z0-9]/g, '')
        .slice(-6) || simpleHash(label)
    );
  return simpleHash(label);
}

/**
 * @param {Array<{ label: string, categoryId?: string | null }>} categoriesInOrder
 * @returns {Array<{ slug: string, label: string, categoryId: string | null }>}
 */
export function assignUniqueCategorySlugs(categoriesInOrder) {
  const labels = categoriesInOrder.map((c) => c.label?.trim() || 'Other');
  const bases = labels.map((l) => slugifyCategoryLabel(l));
  const baseCount = new Map();
  for (const b of bases) {
    baseCount.set(b, (baseCount.get(b) || 0) + 1);
  }
  return categoriesInOrder.map((c, idx) => {
    const label = c.label?.trim() || 'Other';
    const categoryId = c.categoryId ?? null;
    const base = bases[idx];
    const slug = baseCount.get(base) > 1 ? `${base}-${idSuffix(categoryId, label)}` : base;
    return { slug, label, categoryId };
  });
}

export function isFoodOnlySquareCategory(squareCategoryName) {
  if (!squareCategoryName) return false;
  const n = squareCategoryName.toLowerCase();
  return FOOD_CATEGORY_SUBSTRINGS.some((w) => n.includes(w));
}

export function showDrinkModifiersForCategory(squareCategoryName) {
  return !isFoodOnlySquareCategory(squareCategoryName);
}

export function isRetailSquareCategory(squareCategoryName) {
  if (!squareCategoryName) return false;
  return squareCategoryName.toLowerCase().includes('retail');
}
