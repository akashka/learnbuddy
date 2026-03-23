/**
 * Calendar-month pro-rata when switching teachers mid-month.
 * - Previous teacher "earned" share for days already elapsed in the month.
 * - Unused portion of the current month from the old monthly fee is credited toward the new package.
 */

export type ProrataBreakdown = {
  daysInMonth: number;
  switchDay: number;
  remainingDays: number;
  elapsedDays: number;
  oldFeeMonthly: number;
  newFeeMonthly: number;
  /** Informational: old teacher's share for days already passed this month */
  oldTeacherEarnedThisMonth: number;
  /** Credit applied to the new purchase (unused part of current month at old rate) */
  creditFromOldUnusedMonth: number;
  /** New full package after duration discount, before promo code */
  basePackageAfterDurationDiscount: number;
  /** basePackage - credit (before promo code) */
  subtotalAfterCredit: number;
};

const DISCOUNTS: Record<string, number> = { '3months': 0, '6months': 5, '12months': 10 };

export function getDurationDiscountPct(duration: string): number {
  return DISCOUNTS[duration] ?? 0;
}

export function computeSwitchProrata(params: {
  oldFeeMonthly: number;
  newFeeMonthly: number;
  duration: '3months' | '6months' | '12months';
  now?: Date;
}): ProrataBreakdown {
  const now = params.now ?? new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const switchDay = now.getDate();
  const remainingDays = Math.max(0, daysInMonth - switchDay + 1);
  const elapsedDays = Math.max(0, switchDay - 1);

  const oldFee = params.oldFeeMonthly;
  const newFee = params.newFeeMonthly;

  const oldTeacherEarnedThisMonth = Math.round((oldFee * elapsedDays) / daysInMonth);
  const creditFromOldUnusedMonth = Math.round((oldFee * remainingDays) / daysInMonth);

  const months = params.duration === '3months' ? 3 : params.duration === '6months' ? 6 : 12;
  const discPct = getDurationDiscountPct(params.duration);
  const basePackageAfterDurationDiscount = Math.round(
    newFee * months * (1 - discPct / 100)
  );
  const subtotalAfterCredit = Math.max(0, basePackageAfterDurationDiscount - creditFromOldUnusedMonth);

  return {
    daysInMonth,
    switchDay,
    remainingDays,
    elapsedDays,
    oldFeeMonthly: oldFee,
    newFeeMonthly: newFee,
    oldTeacherEarnedThisMonth,
    creditFromOldUnusedMonth,
    basePackageAfterDurationDiscount,
    subtotalAfterCredit,
  };
}
