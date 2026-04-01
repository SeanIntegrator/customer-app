import { useState, useEffect } from 'react';
import { fetchModifierCategories } from '../lib/api';
import { getEnrichedCatalog } from '../lib/catalogEnrich';
import { MILK_OPTIONS, SIZE_OPTIONS, SYRUP_OPTIONS } from '../data/modifierDefaults';

function parseMilkOptions(categories) {
  const milkCat = categories.find((c) => c.name?.toLowerCase().includes('milk'));
  if (!milkCat || !milkCat.modifiers?.length) return null;
  return milkCat.modifiers.map((m) => ({ name: m.name.trim(), delta: m.price ?? 0 }));
}

function parseSyrupOptions(categories) {
  const syrups = [];
  for (const cat of categories) {
    for (const m of cat.modifiers || []) {
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
    for (const m of cat.modifiers || []) {
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
  const [menuCategories, setMenuCategories] = useState([]);
  const [milkOptions, setMilkOptions] = useState(MILK_OPTIONS);
  const [sizeOptions, setSizeOptions] = useState(SIZE_OPTIONS);
  const [syrupOptions, setSyrupOptions] = useState(SYRUP_OPTIONS);
  const [alterationOptions, setAlterationOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([getEnrichedCatalog(), fetchModifierCategories()])
      .then(([enriched, modifierCategories]) => {
        if (cancelled) return;
        setItems(enriched.items);
        setMenuCategories(enriched.menuCategories);
        setError(null);

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
        setMenuCategories([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    items,
    menuCategories,
    milkOptions,
    sizeOptions,
    syrupOptions,
    alterationOptions,
    loading,
    error,
  };
}
