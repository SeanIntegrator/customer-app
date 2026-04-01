/** Shared cart line caption + section label styles for CartDrawer subviews. */

export const sectionLabelStyle = {
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(26,46,26,0.45)',
  margin: '0 0 8px',
};

export function lineMetaCaption(item) {
  return (
    [
      item.size !== 'Regular' && item.size,
      !['Full Fat', 'Regular'].includes(item.milk) && item.milk,
      item.syrup,
      ...(item.alterations ?? []),
    ].filter(Boolean).join(', ') ||
    ((item.showDrinkModifiers ?? item.showCoffeeOptions) ? 'Regular' : null)
  );
}
