// THE INSTRUMENT score — Fully Fashioned's own computed opinion of a fit.
//
// Not a human rating. It is a tally of the data the app holds about the fit's
// items (their historical HIT-rates across the whole catalog), presented as an
// opinion on a /10 scale. Because it is computed it has an opinion at vote #1
// (carries cold-start while THE ROOM is empty), and because it reads the items'
// catalog-wide record — not this fit's live tap — it is adaptive (a fit can
// drift 7.1 → 8.6 as its items accrue votes elsewhere) and Law-3 safe.
//
// v1 formula (approved 2026-05-28). v2: fold in tags / category comparables.

/** Neutral prior the score shrinks toward when data is thin. */
export const PRIOR_RATE = 0.5;
/** Strength of the prior, in phantom votes. */
export const PRIOR_W = 5;

export interface ItemTally {
  /** HIT votes for this item across all fits containing it. */
  hits: number;
  /** Total votes (hits + misses) for this item across all fits. */
  total: number;
}

/**
 * Compute the /10 Instrument score for a fit from its items' tallies.
 * Each item's rate is Bayesian-shrunk toward neutral, then items are combined
 * weighted by their confidence (vote count). Returns one decimal of false
 * precision (8.6, not 9). An itemless fit reads exactly neutral (5.0).
 */
export function instrumentScore(items: ItemTally[]): number {
  if (items.length === 0) return round1(PRIOR_RATE * 10);

  let weightSum = 0;
  let rateWeightSum = 0;
  for (const { hits, total } of items) {
    const rate = (hits + PRIOR_W * PRIOR_RATE) / (total + PRIOR_W);
    const weight = total + PRIOR_W;
    rateWeightSum += rate * weight;
    weightSum += weight;
  }
  return round1((rateWeightSum / weightSum) * 10);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
