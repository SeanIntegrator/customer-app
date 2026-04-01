export function mapApiOrderToEditableLines(order) {
  return (order.items || []).map((it, idx) => ({
    key: `${it.id}-${idx}`,
    square_variation_id: it.square_variation_id,
    item_name: it.item_name,
    item_emoji: it.item_emoji || '☕',
    quantity: it.quantity,
    unit_price: it.unit_price,
    modifiers: it.modifiers || [],
    customer_note: it.customer_note != null ? String(it.customer_note) : '',
  }));
}

export function mapEditableLinesToUpdatePayload(lines) {
  return lines.map((l) => {
    const cn = (l.customer_note || '').trim();
    return {
      catalog_object_id: l.square_variation_id,
      quantity: l.quantity,
      item_name: l.item_name,
      unit_price: l.unit_price,
      emoji: l.item_emoji,
      modifiers: l.modifiers,
      ...(cn ? { customer_note: cn } : {}),
    };
  });
}
