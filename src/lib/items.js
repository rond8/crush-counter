// Shared across Spin.jsx and Shop.jsx so both pages describe items
// identically. Add a new entry here any time you add a new item type
// (see supabase/add_star_item.sql for the full recipe of what else
// needs updating: inventory_items constraint, spin odds, a use_X()
// function, etc).
export const ITEM_INFO = {
  fire: {
    icon: '/images/items/fire.png',
    name: 'Fire',
    tagline: 'Boosts your own fame by 5 when used.',
  },
  lighter: {
    icon: '/images/items/lighter.png',
    name: 'Lighter',
    tagline: "Gift +5 fame to someone else's account.",
  },
  sword: {
    icon: '/images/items/sword.png',
    name: 'Sword',
    tagline: 'For 24h, your messages to your crush show as priority.',
  },
  star: {
    icon: '/images/items/star.png',
    name: 'Star',
    tagline: 'Rare! Boosts your own fame by 10 when used.',
  },
  arrow: {
    icon: '/images/items/arrow.png',
    name: 'Arrow',
    tagline: "Reduces another user's fame by 5. Blocked if they're shielded.",
  },
  shield: {
    icon: '/images/items/shield.png',
    name: 'Shield',
    tagline: 'Protects your fame from Arrows for 24h.',
  },
  magnet: {
    icon: '/images/items/magnet.png',
    name: 'Magnet',
    tagline: 'Steals 3 fame directly from another player.',
  },
  clover: {
    icon: '/images/items/clover.png',
    name: 'Lucky Clover',
    tagline: 'Instantly grants +10 bonus coins!',
  },
  mirror: {
    icon: '/images/items/mirror.png',
    name: 'Magic Mirror',
    tagline: 'Reflects incoming arrows back at attackers for 24h.',
  },
  spear: {
    icon: '/images/items/spear.png',
    name: 'Shieldbreaker Spear',
    tagline: 'Pierces through shields & mirrors to deal -8 fame directly.',
  },

  handshake: {
    icon: '/images/items/handshake.png',
    name: 'Handshake Offer',
    tagline: 'Send to your crush — if they accept, you BOTH gain +3 fame!',
  },

}

// Alias — some files (e.g. Inventory.jsx) import this as `ITEMS`
// rather than `ITEM_INFO`. Both names point at the same object so
// either import style works.
export const ITEMS = ITEM_INFO