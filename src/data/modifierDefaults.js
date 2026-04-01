/**
 * Default milk / size / syrup modifier rows (pence deltas) when the API is unavailable.
 * Single source of truth for catalog fallbacks and ItemDetailSheet prop defaults.
 */

export const MILK_OPTIONS = [
  { name: 'Full Fat', delta: 0 },
  { name: 'Oat', delta: 50 },
  { name: 'Almond', delta: 50 },
  { name: 'Soy', delta: 50 },
  { name: 'Coconut', delta: 50 },
  { name: 'Skinny', delta: 0 },
];

/** Empty so the syrup section stays hidden until modifier API returns options. */
export const SYRUP_OPTIONS = [];

export const SIZE_OPTIONS = [
  { name: 'Regular', delta: 0 },
  { name: 'Large', delta: 50 },
];
