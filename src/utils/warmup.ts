export interface WarmupTier {
  percentage: number; // 0-100, e.g., 50
  reps: number;
}

export interface WarmupSet {
  weight: number; // Rounded to nearest 2.5kg
  reps: number;
  percentage: number; // For display
}

export const DEFAULT_WARMUP_TIERS: [WarmupTier, WarmupTier] = [
  { percentage: 50, reps: 5 },
  { percentage: 75, reps: 3 },
];

function roundToNearest(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

export function calculateWarmupSets(
  maxWeight: number,
  tiers: [WarmupTier, WarmupTier]
): [WarmupSet, WarmupSet] {
  return tiers.map((tier) => ({
    weight: roundToNearest(maxWeight * (tier.percentage / 100), 2.5),
    reps: tier.reps,
    percentage: tier.percentage,
  })) as [WarmupSet, WarmupSet];
}
