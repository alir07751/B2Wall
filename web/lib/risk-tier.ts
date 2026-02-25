/**
 * Suggest risk tier from guarantee + duration for wizard/preview.
 * Full rubric in docs/RISK-TIER-RUBRIC.md.
 */

import type { GuaranteeType } from './types';

export function deriveRiskTier(guaranteeType: GuaranteeType | string, durationDays: number): 'A' | 'B' | 'C' {
  const months = durationDays / 30;
  const strong = guaranteeType === 'Collateral' || guaranteeType === 'Insurance';
  const weak = guaranteeType === 'Buyback' || guaranteeType === 'Personal';

  if (strong && months <= 12) return 'A';
  if (guaranteeType === 'None' || months > 24) return 'C';
  if (weak || (months > 12 && months <= 24)) return 'B';
  return 'B';
}
