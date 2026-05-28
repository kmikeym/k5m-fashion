// The Instrument's reading logic — shared by the outfit verdict bloom (#15)
// and the stats page (#12) so the threshold never drifts between surfaces.

/** Minimum real votes before a hot-rate is reported as a settled reading. */
export const MIN_VOTES = 5;

/** Strength of the phantom prior used for the sub-threshold projection. */
const PRIOR_STRENGTH = 5;

export type VerdictState = 'empty' | 'predictive' | 'real';

export interface Verdict {
  state: VerdictState;
  /** 0–100 hot-rate. A settled reading when `real`, a projection when `predictive`, null when `empty`. */
  pct: number | null;
  /** Real votes counted. */
  n: number;
  hot: number;
  not: number;
  /** Crowd leans hot — picks the warm vs cool verdict bloom. */
  isHot: boolean;
}

/**
 * Deterministic baseline lean for an outfit/item, derived from its id so the
 * projected number is stable across reloads and varies fit-to-fit (≈48–68%).
 */
function priorRate(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return 0.48 + (h % 21) / 100;
}

/**
 * Turn a raw hot/not tally into a reading.
 * - n === 0           → empty (awaiting the first verdict)
 * - 0 < n < MIN_VOTES → predictive: blend real votes with a phantom prior
 *                       (Bayesian shrinkage) so one vote still lands a lively,
 *                       clearly-labeled projection that converges on the truth.
 * - n >= MIN_VOTES    → real: the honest crowd rate.
 */
export function getVerdict(hot: number, not: number, seed: string): Verdict {
  const n = hot + not;

  if (n >= MIN_VOTES) {
    const pct = Math.round((hot / n) * 100);
    return { state: 'real', pct, n, hot, not, isHot: pct >= 50 };
  }

  if (n === 0) {
    return { state: 'empty', pct: null, n, hot, not, isHot: false };
  }

  const priorHot = priorRate(seed) * PRIOR_STRENGTH;
  const projected = (hot + priorHot) / (n + PRIOR_STRENGTH);
  const pct = Math.round(projected * 100);
  return { state: 'predictive', pct, n, hot, not, isHot: pct >= 50 };
}
