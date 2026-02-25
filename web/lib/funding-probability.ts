/**
 * Explainable funding probability band (High/Med/Low) + reasons + suggestions.
 * See docs/FUNDING-PROBABILITY-RUBRIC.md.
 */

import type { GuaranteeType } from './types';

export type FundingProbabilityBand = 'high' | 'med' | 'low';

export type FundingProbabilityInput = {
  riskTier: string;
  expectedReturnAPR: number;
  durationDays: number;
  guaranteeType: GuaranteeType | string;
  category?: string;
  minAllocation?: number;
  seekerHistory: number; // count of prior funded projects
};

export type FundingProbabilityResult = {
  band: FundingProbabilityBand;
  bandLabel: string;
  reasons: string[];
  suggestions: string[];
};

const MONTHS_12 = 365;
const MONTHS_24 = 730;

export function getFundingProbability(input: FundingProbabilityInput): FundingProbabilityResult {
  const { riskTier, expectedReturnAPR, durationDays, guaranteeType, seekerHistory } = input;
  const reasons: string[] = [];
  const suggestions: string[] = [];

  const strongGuarantee = guaranteeType === 'Collateral' || guaranteeType === 'Insurance';
  const weakGuarantee = guaranteeType === 'Buyback' || guaranteeType === 'Personal';
  const noGuarantee = guaranteeType === 'None';

  const shortDuration = durationDays <= MONTHS_12;
  const mediumDuration = durationDays > MONTHS_12 && durationDays <= MONTHS_24;
  const longDuration = durationDays > MONTHS_24;

  const aprInRange = expectedReturnAPR >= 15 && expectedReturnAPR <= 25;

  if (strongGuarantee) reasons.push('ضمانت وثیقه یا بیمه دارد');
  else if (weakGuarantee) reasons.push('ضمانت بازخرید یا ضامن حقیقی');
  else if (noGuarantee) {
    reasons.push('بدون ضمانت؛ ریسک بالاتر برای سرمایه‌گذار');
    suggestions.push('اضافه کردن ضمانت (وثیقه یا بیمه) احتمال تأمین را بالا می‌برد');
  }

  if (shortDuration) reasons.push('مدت کوتاه‌تر از ۱۲ ماه');
  else if (longDuration) {
    reasons.push('مدت بیش از ۲۴ ماه');
    suggestions.push('کوتاه‌تر کردن مدت بازپرداخت جذابیت را افزایش می‌دهد');
  }

  if (aprInRange) reasons.push('بازده در محدوده متعارف بازار');
  else if (expectedReturnAPR > 25) suggestions.push('بازده خیلی بالا ممکن است برای سرمایه‌گذار تردید ایجاد کند');
  else if (expectedReturnAPR < 15) suggestions.push('بازده بالاتر می‌تواند جذب را بهبود دهد');

  if (seekerHistory >= 1) reasons.push('سازنده با سابقه تأمین شده');
  else {
    reasons.push('سازنده جدید (اولین پروژه)');
    suggestions.push('ثبت مدارک و توضیح شفاف ضمانت به اعتماد کمک می‌کند');
  }

  if (riskTier === 'A') reasons.push('رتبه ریسک A');
  else if (riskTier === 'C') {
    reasons.push('رتبه ریسک C');
    suggestions.push('تقویت ضمانت یا کوتاه کردن مدت رتبه را بهبود می‌دهد');
  }

  let band: FundingProbabilityBand = 'med';
  if (riskTier === 'A' && strongGuarantee && shortDuration) band = 'high';
  else if (riskTier === 'C' || noGuarantee || longDuration) band = 'low';

  const bandLabels: Record<FundingProbabilityBand, string> = {
    high: 'احتمال تأمین: بالا',
    med: 'احتمال تأمین: متوسط',
    low: 'احتمال تأمین: پایین',
  };

  return {
    band,
    bandLabel: bandLabels[band],
    reasons,
    suggestions,
  };
}
