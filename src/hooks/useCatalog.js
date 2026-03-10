import { useState, useEffect } from 'react';
import { fetchCatalogItems, fetchModifierCategories } from '../lib/api';
import { getPriceForItem, getEmojiForItem, getCategoryForItem, MILK_OPTIONS } from '../data/mock';

function parseMilkOptions(categories) {
  const milkCat = categories.find((c) => c.name?.toLowerCase().includes('milk'));
  if (!milkCat || !milkCat.modifiers?.length) return null;
  return milkCat.modifiers.map((m) => ({
    name: m.name,
    delta: m.price ?? 0,
  }));
}

export default function useCatalog() {
  const [items, setItems] = useState([]);
  const [milkOptions, setMilkOptions] = useState(MILK_OPTIONS);
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
          category: getCategoryForItem(item.name),
        }));
        setItems(enriched);
        setError(null);
        const fromApi = parseMilkOptions(categories);
        if (fromApi) setMilkOptions(fromApi);
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

  return { items, milkOptions, loading, error };
}
