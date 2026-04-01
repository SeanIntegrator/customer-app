/** Shared typography / chip styles for ItemDetailSheet. */

export const ITEM_DETAIL_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='280' height='280' filter='url(%23n)' opacity='0.14'/%3E%3C/svg%3E\")";

export const itemDetailSectionLabel = {
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'rgba(26,46,26,0.45)',
  marginBottom: 10,
  display: 'block',
};

export const itemDetailActiveOption = {
  background: '#1a2e1a',
  color: '#f0e6d0',
  border: 'none',
};

export const itemDetailInactiveOption = {
  background: 'rgba(240,230,208,0.6)',
  border: '1.5px solid #d4c0a0',
  color: '#6a5a48',
};
