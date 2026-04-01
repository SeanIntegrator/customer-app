export const EVENTS = [
  {
    id: 1,
    title: 'Morning Brew & Sketch',
    date: 'Sat 12 Apr',
    time: '9:00 – 11:00am',
    startsAt: '2026-04-12T08:00:00.000Z',
    description:
      'Bring your sketchbook and let the morning light guide your pencil while the coffee keeps you warm. We supply the brews, you bring the curiosity — all levels welcome.',
    spotsLeft: 4,
    totalSpots: 12,
    emoji: '🎨',
    registered: false,
    category: 'community',
  },
  {
    id: 2,
    title: 'Wine Tasting With Sean',
    date: 'Thu 17 Apr',
    time: '6:30 – 8:30pm',
    startsAt: '2026-04-17T17:30:00.000Z',
    description:
      'A guided journey through small-batch natural wines sourced from passionate local producers who let the land do the talking. No stuffy formality — just great wine and even better conversation.',
    spotsLeft: 8,
    totalSpots: 20,
    emoji: '🍷',
    registered: false,
    category: 'social',
  },
  {
    id: 3,
    title: 'Book Swap Morning',
    date: 'Sun 20 Apr',
    time: '10:00am – 12:00pm',
    startsAt: '2026-04-20T09:00:00.000Z',
    description:
      "Bring a book you loved and leave with one you haven't read yet — the best kind of serendipity. Coffee discounts run all morning to fuel your next chapter.",
    spotsLeft: null,
    totalSpots: null,
    emoji: '📚',
    registered: false,
    category: 'community',
  },
  {
    id: 4,
    title: 'Sourdough Workshop',
    date: 'Sat 3 May',
    time: '11:00am – 1:00pm',
    startsAt: '2026-05-03T10:00:00.000Z',
    description:
      "Get your hands in the dough and learn the ancient craft of sourdough from our head baker, who's been nursing the same starter for over a decade. You'll leave with technique, knowledge, and a jar of live culture to take home.",
    spotsLeft: 2,
    totalSpots: 8,
    emoji: '🍞',
    registered: false,
    category: 'workshop',
  },
];

export const PROMOTIONS = [
  {
    id: 1,
    title: 'Double Stamp Tuesday',
    description: 'Every Tuesday — earn stamps twice as fast all day.',
    tag: 'Every Tue',
    emoji: '✌️',
    bg: 'bg-sage',
    text: 'text-bark',
  },
  {
    id: 2,
    title: 'Loyalty Freebie Unlocked',
    description: '3 more stamps and your next coffee is on us.',
    tag: '3 away',
    emoji: '☕',
    bg: 'bg-clay',
    text: 'text-cream',
  },
];

// Fallback prices by keyword (pence) — used when Square catalog has no price
export const PRICE_MAP = {
  espresso: 260,
  americano: 320,
  'flat white': 350,
  latte: 380,
  cappuccino: 360,
  mocha: 420,
  macchiato: 360,
  cortado: 320,
  'chai latte': 420,
  matcha: 450,
  tea: 280,
  croissant: 320,
  'almond croissant': 400,
  'pain au chocolat': 360,
  'pain suisse': 380,
  swirl: 440,
  cake: 480,
  muffin: 380,
  scone: 340,
  toast: 420,
  sandwich: 680,
  wrap: 720,
};

export function getPriceForItem(name, squarePrice) {
  if (squarePrice != null) return squarePrice;
  const n = (name || '').toLowerCase();
  for (const [key, price] of Object.entries(PRICE_MAP)) {
    if (n.includes(key)) return price;
  }
  return 350; // default 350p = £3.50
}

export function getEmojiForItem(name) {
  const n = (name || '').toLowerCase();
  if (['latte', 'flat white', 'cappuccino', 'mocha', 'cortado'].some((w) => n.includes(w)))
    return '☕';
  if (['espresso', 'americano'].some((w) => n.includes(w))) return '⚡';
  if (['matcha'].some((w) => n.includes(w))) return '🍵';
  if (['chai', 'tea'].some((w) => n.includes(w))) return '🫖';
  if (['croissant', 'pain', 'pastry', 'bun'].some((w) => n.includes(w))) return '🥐';
  if (['swirl', 'cake', 'muffin', 'brownie'].some((w) => n.includes(w))) return '🍰';
  if (['toast', 'sandwich', 'wrap', 'bagel'].some((w) => n.includes(w))) return '🥪';
  if (['scone'].some((w) => n.includes(w))) return '🫐';
  return '✨';
}

export function getCategoryForItem(name) {
  const n = (name || '').toLowerCase();
  if (
    [
      'coffee',
      'latte',
      'flat white',
      'cappuccino',
      'americano',
      'espresso',
      'mocha',
      'macchiato',
      'cortado',
    ].some((w) => n.includes(w))
  )
    return 'coffee';
  if (['tea', 'matcha', 'chai'].some((w) => n.includes(w))) return 'tea';
  if (
    [
      'croissant',
      'pain',
      'toast',
      'cake',
      'muffin',
      'bagel',
      'sandwich',
      'wrap',
      'swirl',
      'bun',
      'scone',
      'brownie',
      'cookie',
      'flapjack',
    ].some((w) => n.includes(w))
  )
    return 'food';
  return 'specials';
}

export { MILK_OPTIONS, SIZE_OPTIONS, SYRUP_OPTIONS } from './modifierDefaults.js';

// Syrup chip colour palette — keyword-matched by modifier name from Square
const SYRUP_CHIP_COLORS = {
  caramel: { bg: '#7B4A1E', text: '#F5DEB3' },
  vanilla: { bg: '#C8A96E', text: '#3D2B1F' },
  hazelnut: { bg: '#5C3317', text: '#F0DEC8' },
  'white chocolate': { bg: '#EED8A8', text: '#4A3520' },
  chocolate: { bg: '#3D2010', text: '#F0D0A0' },
  strawberry: { bg: '#B22040', text: '#FFE8EC' },
  raspberry: { bg: '#8B1A4A', text: '#FFD8E8' },
  blueberry: { bg: '#2D1B69', text: '#C8B8FF' },
  lavender: { bg: '#7B5EA7', text: '#F0E8FF' },
  mint: { bg: '#2E7D5E', text: '#E0F5EC' },
  cinnamon: { bg: '#A0522D', text: '#FAEBD7' },
  pumpkin: { bg: '#C05A1A', text: '#FFE4C4' },
  coconut: { bg: '#8B7355', text: '#FFF8F0' },
  default: { bg: '#6A5A48', text: '#F0E6D0' },
};

export function getSyrupChipColors(name) {
  const n = (name || '').toLowerCase();
  for (const [key, colors] of Object.entries(SYRUP_CHIP_COLORS)) {
    if (key !== 'default' && n.includes(key)) return colors;
  }
  return SYRUP_CHIP_COLORS.default;
}

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'tea', label: 'Tea & Matcha' },
  { id: 'food', label: 'Food' },
  { id: 'specials', label: 'Specials' },
];
