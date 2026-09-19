// Replace <YOUR_PROJECT_REF> with your actual Supabase project reference ID
const SUPABASE_STORAGE_URL = 'https://ifhtaieggnvoaeuecuxd.supabase.co/storage/v1/object/public/game-assets/items';

export const ITEM_INFO = {
  fire: {
    icon: `${SUPABASE_STORAGE_URL}/fire.png`,
    name: 'Fire',
    tagline: 'Boosts your own fame by 5 when used.',
  },
  lighter: {
    icon: `${SUPABASE_STORAGE_URL}/lighter.png`,
    name: 'Lighter',
    tagline: "Gift +5 fame to someone else's account.",
  },
  sword: {
    icon: `${SUPABASE_STORAGE_URL}/sword.png`,
    name: 'Sword',
    tagline: 'For 24h, your messages to your crush show as priority.',
  },
  star: {
    icon: `${SUPABASE_STORAGE_URL}/star.png`, // Make sure to upload star.png to Supabase!
    name: 'Star',
    tagline: 'Rare! Boosts your own fame by 10 when used.',
  },
  arrow: {
    icon: `${SUPABASE_STORAGE_URL}/arrow.png`,
    name: 'Arrow',
    tagline: "Reduces another user's fame by 5. Blocked if they're shielded.",
  },
  shield: {
    icon: `${SUPABASE_STORAGE_URL}/shield.png`,
    name: 'Shield',
    tagline: 'Protects your fame from Arrows for 24h.',
  },
  magnet: {
    icon: `${SUPABASE_STORAGE_URL}/magnet.png`,
    name: 'Magnet',
    tagline: 'Steals 3 fame directly from another player.',
  },
  clover: {
    icon: `${SUPABASE_STORAGE_URL}/clover.png`,
    name: 'Lucky Clover',
    tagline: 'Instantly grants +10 bonus coins!',
  },
  mirror: {
    icon: `${SUPABASE_STORAGE_URL}/mirror.png`,
    name: 'Magic Mirror',
    tagline: 'Reflects incoming arrows back at attackers for 24h.',
  },
  spear: {
    icon: `${SUPABASE_STORAGE_URL}/spear.png`,
    name: 'Shieldbreaker Spear',
    tagline: 'Pierces through shields & mirrors to deal -8 fame directly.',
  },
  handshake: {
    icon: `${SUPABASE_STORAGE_URL}/handshake.png`,
    name: 'Handshake Offer',
    tagline: 'Send to your crush — if they accept, you BOTH gain +3 fame!',
  },
  pettreat: {
    icon: `${SUPABASE_STORAGE_URL}/pettreat.png`,
    name: 'Pet Treat',
    tagline: "Instantly refills your pet's hunger.",
  },
  pettoy: {
    icon: `${SUPABASE_STORAGE_URL}/pettoy.png`,
    name: 'Pet Toy',
    tagline: "Instantly boosts your pet's happiness.",
  },
  petmedicine: {
    icon: `${SUPABASE_STORAGE_URL}/petmedicine.png`,
    name: 'Pet Medicine',
    tagline: "Cures sickness and restores your pet's health.",
  },
  rose: {
    icon: `${SUPABASE_STORAGE_URL}/rose.png`,
    name: 'Digital Rose',
    tagline: 'A classic gift to show someone you care.',
  },
  chocolate: {
    icon: `${SUPABASE_STORAGE_URL}/chocolate.png`,
    name: 'Box of Chocolates',
    tagline: 'Sweeten someone’s day with a digital treat.',
  },
  crown: {
    icon: `${SUPABASE_STORAGE_URL}/crown.png`,
    name: 'Golden Crown',
    tagline: 'The ultimate gift for a true legend.',
  },
  mysterybox: {
    icon: `${SUPABASE_STORAGE_URL}/mysterybox.png`,
    name: 'Mystery Box',
    tagline: 'Open for a chance to win rare items or 20 coins!',
  },
  shield_gold: {
    icon: `${SUPABASE_STORAGE_URL}/shield_gold.png`,
    name: 'Eternal Shield',
    tagline: 'Full protection from arrows for a whole week.',
  },
};

export const ITEMS = ITEM_INFO;