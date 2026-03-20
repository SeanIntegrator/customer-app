import { useState, useEffect } from 'react';
import { fetchCatalogItems, fetchModifierCategories } from '../lib/api';
import { getPriceForItem, getEmojiForItem, getCategoryForItem, MILK_OPTIONS, SIZE_OPTIONS } from '../data/mock';

function getCategoryFromSquareName(squareName) {
  if (!squareName) return null;
  const n = squareName.toLowerCase();
  if (n.includes('coffee') || n.includes('espresso')) return 'coffee';
  if (n.includes('tea') || n.includes('matcha') || n.includes('chai')) return 'tea';
  if (['food', 'pastry', 'pastries', 'bake', 'baked', 'snack', 'cake'].some((w) => n.includes(w))) return 'food';
  return 'specials';
}

function parseMilkOptions(categories) {
  const milkCat = categories.find((c) => c.name?.toLowerCase().includes('milk'));
  if (!milkCat || !milkCat.modifiers?.length) return null;
  return milkCat.modifiers.map((m) => ({ name: m.name.trim(), delta: m.price ?? 0 }));
}

function parseSizeOptions(categories) {
  // Look for a "Large" modifier in any category — size options may not have their own list
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
  const [milkOptions, setMilkOptions] = useState(MILK_OPTIONS);
  const [sizeOptions, setSizeOptions] = useState(SIZE_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([fetchCatalogItems(), fetchModifierCategories()])
      .then(([raw, categories]) => {
        if (cancelled) return;
        const enriched = raw.map((item) => ({
          catalogObjectId: item.id,
          name: item.name,
          price: getPriceForItem(item.name, item.price),
          emoji: getEmojiForItem(item.name),
          category: getCategoryFromSquareName(item.categoryName) ?? getCategoryForItem(item.name),
        }));
        setItems(enriched);
        setError(null);
        const fromApiMilk = parseMilkOptions(categories);
        if (fromApiMilk) setMilkOptions(fromApiMilk);
        const fromApiSizes = parseSizeOptions(categories);
        if (fromApiSizes) setSizeOptions(fromApiSizes);
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

  return { items, milkOptions, sizeOptions, loading, error };
}
