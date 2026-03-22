import { useState, useEffect } from 'react';
import { fetchCatalogItems, fetchModifierCategories } from '../lib/api';
import { getPriceForItem, getEmojiForItem, MILK_OPTIONS, SIZE_OPTIONS, SYRUP_OPTIONS } from '../data/mock';

// Convert a Square category name to a stable URL-safe slug for filtering
function slugify(name) {
  if (!name) return 'other';
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Espresso-based drinks get milk/syrup/alteration pickers.
// Check the Square CATEGORY name, not the item name, to avoid
// misclassifying "Matcha Latte" (latte → coffee) or missing "Long Black".
function isCoffeeCategory(squareCategoryName) {
  if (!squareCategoryName) return false;
  const n = squareCategoryName.toLowerCase();
  if (['retail', 'tea', 'matcha', 'chai', 'cold', 'food', 'pastry', 'pastries'].some((w) => n.includes(w))) return false;
  return ['coffee', 'espresso', 'hot drink', 'latte'].some((w) => n.includes(w));
}

function parseMilkOptions(categories) {
  const milkCat = categories.find((c) => c.name?.toLowerCase().includes('milk'));
  if (!milkCat || !milkCat.modifiers?.length) return null;
  return milkCat.modifiers.map((m) => ({ name: m.name.trim(), delta: m.price ?? 0 }));
}

function parseSyrupOptions(categories) {
  const syrups = [];
  for (const cat of categories) {
    for (const m of (cat.modifiers || [])) {
      if (m.name?.toLowerCase().includes('syrup')) {
        syrups.push({ name: m.name.trim(), delta: m.price ?? 0 });
      }
    }
  }
  return syrups.length > 0 ? syrups : null;
}

function parseAlterationOptions(categories) {
  const ALTERATION_KEYWORDS = ['extra shot', 'decaf'];
  const alterations = [];
  for (const cat of categories) {
    for (const m of (cat.modifiers || [])) {
      const nameLower = m.name?.toLowerCase().trim() ?? '';
      if (ALTERATION_KEYWORDS.some((kw) => nameLower.includes(kw))) {
        alterations.push({ name: m.name.trim(), delta: m.price ?? 0 });
      }
    }
  }
  return alterations.length > 0 ? alterations : null;
}

function parseSizeOptions(categories) {
  for (const cat of categories) {
    const large = cat.modifiers?.find((m) => m.name?.trim().toLowerCase() === 'large');
    if (large) {
      return [
        { name: 'Regular', delta: 0 },
        { name: 'Large', delta: large.price ?? 0 },
      ];
    }
  }
  return null;
}

export default function useCatalog() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([{ id: 'all', label: 'All' }]);
  const [milkOptions, setMilkOptions] = useState(MILK_OPTIONS);
  const [sizeOptions, setSizeOptions] = useState(SIZE_OPTIONS);
  const [syrupOptions, setSyrupOptions] = useState(SYRUP_OPTIONS);
  const [alterationOptions, setAlterationOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([fetchCatalogItems(), fetchModifierCategories()])
      .then(([raw, modifierCategories]) => {
        if (cancelled) return;

        const enriched = raw.map((item) => {
          const squareCategoryName = item.categoryName?.trim() ?? null;
          return {
            catalogObjectId: item.id,
            name: item.name,
            price: getPriceForItem(item.name, item.price),
            emoji: getEmojiForItem(item.name),
            squareCategoryName,
            category: slugify(squareCategoryName),
            showCoffeeOptions: isCoffeeCategory(squareCategoryName),
          };
        });

        setItems(enriched);
        setError(null);

        // Build dynamic category tabs from the unique Square category names,
        // preserving their natural order of first appearance in the catalog.
        const seen = new Set();
        const dynamicCategories = [{ id: 'all', label: 'All' }];
        for (const item of enriched) {
          if (item.squareCategoryName && !seen.has(item.category)) {
            seen.add(item.category);
            dynamicCategories.push({ id: item.category, label: item.squareCategoryName });
          }
        }
        setCategories(dynamicCategories);

        const fromApiMilk = parseMilkOptions(modifierCategories);
        if (fromApiMilk) setMilkOptions(fromApiMilk);
        const fromApiSizes = parseSizeOptions(modifierCategories);
        if (fromApiSizes) setSizeOptions(fromApiSizes);
        const fromApiSyrups = parseSyrupOptions(modifierCategories);
        if (fromApiSyrups) setSyrupOptions(fromApiSyrups);
        const fromApiAlterations = parseAlterationOptions(modifierCategories);
        if (fromApiAlterations) setAlterationOptions(fromApiAlterations);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Catalog load failed, using empty menu:', err.message);
        setError(err.message);
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { items, categories, milkOptions, sizeOptions, syrupOptions, alterationOptions, loading, error };
}
