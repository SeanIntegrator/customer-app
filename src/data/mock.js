export const USER = {
  name: 'Cristina',
  initials: 'C',
  memberSince: 'January 2024',
  stamps: 6,
  stampsGoal: 9,
  totalOrders: 23,
  favoriteItems: ['Flat White (Oat)', 'Almond Croissant'],
};

export const EVENTS = [
  {
    id: 1,
    title: 'Morning Brew & Sketch',
    date: 'Sat 15 Mar',
    time: '9:00 – 11:00am',
    description: 'Bring your sketchbook and let the morning light guide your pencil while the coffee keeps you warm. We supply the brews, you bring the curiosity — all levels welcome.',
    spotsLeft: 4,
    totalSpots: 12,
    emoji: '🎨',
    registered: false,
    category: 'community',
  },
  {
    id: 2,
    title: 'Wine Tasting With Sean',
    date: 'Thu 20 Mar',
    time: '6:30 – 8:30pm',
    description: 'A guided journey through small-batch natural wines sourced from passionate local producers who let the land do the talking. No stuffy formality — just great wine and even better conversation.',
    spotsLeft: 8,
    totalSpots: 20,
    emoji: '🍷',
    registered: true,
    category: 'social',
  },
  {
    id: 3,
    title: 'Book Swap Morning',
    date: 'Sun 23 Mar',
    time: '10:00am – 12:00pm',
    description: "Bring a book you loved and leave with one you haven't read yet — the best kind of serendipity. Coffee discounts run all morning to fuel your next chapter.",
    spotsLeft: null,
    totalSpots: null,
    emoji: '📚',
    registered: false,
    category: 'community',
  },
  {
    id: 4,
    title: 'Sourdough Workshop',
    date: 'Sat 29 Mar',
    time: '11:00am – 1:00pm',
    description: "Get your hands in the dough and learn the ancient craft of sourdough from our head baker, who's been nursing the same starter for over a decade. You'll leave with technique, knowledge, and a jar of live culture to take home.",
    spotsLeft: 2,
    totalSpots: 8,
    emoji: '🍞',
    registered: false,
    category: 'workshop',
  },
];

export const PAST_EVENTS = [
  {
    id: 10,
    title: 'Lino Printing Workshop',
    date: 'Sat 1 Feb',
    emoji: '🖨️',
    attended: true,
    description: 'You carved your own lino block and pressed it into a print to take home. A slow, satisfying afternoon that left ink on fingers and smiles on faces.',
  },
  {
    id: 11,
    title: 'Fermentation Tasting',
    date: 'Thu 13 Feb',
    emoji: '🫙',
    attended: true,
    description: 'A deep dive into kombucha, kimchi and wild-fermented sodas from producers across the county. The room smelled wonderfully strange and tasted even better.',
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
    description: "3 more stamps and your next coffee is on us.",
    tag: '3 away',
    emoji: '☕',
    bg: 'bg-clay',
    text: 'text-cream',
  },
];

export const ORDER_HISTORY = [
  {
    id: 'ORD-023',
    date: 'Today, 8:42am',
    items: ['Flat White (Oat)', 'Almond Croissant'],
    total: 8.50,
    status: 'completed',
  },
  {
    id: 'ORD-022',
    date: 'Mon 4 Mar, 9:15am',
    items: ['Latte (Oat, Large)', 'Pain au Chocolat'],
    total: 9.20,
    status: 'completed',
  },
  {
    id: 'ORD-021',
    date: 'Fri 28 Feb, 8:30am',
    items: ['Flat White', 'Plain Croissant', 'Espresso'],
    total: 10.30,
    status: 'completed',
  },
  {
    id: 'ORD-020',
    date: 'Wed 26 Feb, 2:10pm',
    items: ['Iced Matcha Latte (Oat)', 'Pistachio swirl'],
    total: 9.80,
    status: 'completed',
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
  if (['latte', 'flat white', 'cappuccino', 'mocha', 'cortado'].some((w) => n.includes(w))) return '☕';
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
  if (['coffee', 'latte', 'flat white', 'cappuccino', 'americano', 'espresso', 'mocha', 'macchiato', 'cortado'].some((w) => n.includes(w))) return 'coffee';
  if (['tea', 'matcha', 'chai'].some((w) => n.includes(w))) return 'tea';
  if (['croissant', 'pain', 'toast', 'cake', 'muffin', 'bagel', 'sandwich', 'wrap', 'swirl', 'bun', 'scone', 'brownie', 'cookie', 'flapjack'].some((w) => n.includes(w))) return 'food';
  return 'specials';
}

// Milk modifiers with price delta (pence) — fallback when API unavailable
export const MILK_OPTIONS = [
  { name: 'Full Fat', delta: 0 },
  { name: 'Oat', delta: 50 },
  { name: 'Almond', delta: 50 },
  { name: 'Soy', delta: 50 },
  { name: 'Coconut', delta: 50 },
  { name: 'Skinny', delta: 0 },
];

// Usual order — hardcoded, used by the Reorder shortcut on the home screen
export const USUAL_ORDER = [
  {
    catalogObjectId: 'USUAL_FLAT_WHITE',
    name: 'Flat White',
    emoji: '☕',
    size: 'Regular',
    milk: 'Oat',
    totalPrice: 400,
  },
  {
    catalogObjectId: 'USUAL_ALMOND_CROISSANT',
    name: 'Almond Croissant',
    emoji: '🥐',
    size: 'Regular',
    milk: 'Full Fat',
    totalPrice: 400,
  },
];

// Syrup chip colour palette — keyword-matched by modifier name from Square
const SYRUP_CHIP_COLORS = {
  caramel:         { bg: '#7B4A1E', text: '#F5DEB3' },
  vanilla:         { bg: '#C8A96E', text: '#3D2B1F' },
  hazelnut:        { bg: '#5C3317', text: '#F0DEC8' },
  'white chocolate': { bg: '#EED8A8', text: '#4A3520' },
  chocolate:       { bg: '#3D2010', text: '#F0D0A0' },
  strawberry:      { bg: '#B22040', text: '#FFE8EC' },
  raspberry:       { bg: '#8B1A4A', text: '#FFD8E8' },
  blueberry:       { bg: '#2D1B69', text: '#C8B8FF' },
  lavender:        { bg: '#7B5EA7', text: '#F0E8FF' },
  mint:            { bg: '#2E7D5E', text: '#E0F5EC' },
  cinnamon:        { bg: '#A0522D', text: '#FAEBD7' },
  pumpkin:         { bg: '#C05A1A', text: '#FFE4C4' },
  coconut:         { bg: '#8B7355', text: '#FFF8F0' },
  default:         { bg: '#6A5A48', text: '#F0E6D0' },
};

export function getSyrupChipColors(name) {
  const n = (name || '').toLowerCase();
  for (const [key, colors] of Object.entries(SYRUP_CHIP_COLORS)) {
    if (key !== 'default' && n.includes(key)) return colors;
  }
  return SYRUP_CHIP_COLORS.default;
}

// Fallback syrup options — empty so section is hidden when API unavailable
export const SYRUP_OPTIONS = [];

// Size modifiers with price delta (pence)
export const SIZE_OPTIONS = [
  { name: 'Regular', delta: 0 },
  { name: 'Large', delta: 50 },
];

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'tea', label: 'Tea & Matcha' },
  { id: 'food', label: 'Food' },
  { id: 'specials', label: 'Specials' },
];
