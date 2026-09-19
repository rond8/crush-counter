/**
 * Defines the fame tiers and their visual properties.
 */
export const FAME_TIERS = [
  { min: 5000, label: 'Legend', color: '#D946EF', aura: 'shadow-[0_0_20px_rgba(217,70,239,0.6)]', emoji: '👑' },
  { min: 2500, label: 'Celebrity', color: '#F59E0B', aura: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]', emoji: '🌟' },
  { min: 1000, label: 'Influencer', color: '#3B82F6', aura: 'shadow-[0_0_12px_rgba(59,130,246,0.4)]', emoji: '💎' },
  { min: 500, label: 'Popular', color: '#10B981', aura: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]', emoji: '🔥' },
  { min: 0, label: 'Member', color: '#64748B', aura: '', emoji: '👤' }
];

export function getFameTier(fame = 0) {
  return FAME_TIERS.find(t => fame >= t.min) || FAME_TIERS[FAME_TIERS.length - 1];
}

export function getNextTier(fame = 0) {
  const currentIdx = FAME_TIERS.findIndex(t => fame >= t.min);
  if (currentIdx <= 0) return null; // Already top tier
  return FAME_TIERS[currentIdx - 1];
}
