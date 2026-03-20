import mongoose from 'mongoose';
import { DiscountCode } from '@/lib/models/DiscountCode';
import type { IDiscountCode } from '@/lib/models/DiscountCode';
import { formatCurrency } from '@/lib/formatters';

export interface ValidateDiscountInput {
  code: string;
  amountBeforeCode: number;
  board: string;
  classLevel: string;
}

export interface ValidateDiscountResult {
  valid: boolean;
  message?: string;
  discountAmount?: number;
  finalAmount?: number;
  discountCode?: string;
  discountCodeId?: string;
}

/**
 * Validates a discount code and returns the discount amount and final amount.
 * Code is applied on top of duration-based discount (amountBeforeCode is already discounted).
 */
export async function validateDiscountCode(input: ValidateDiscountInput): Promise<ValidateDiscountResult> {
  const { code, amountBeforeCode, board, classLevel } = input;
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) {
    return { valid: false, message: 'Please enter a discount code' };
  }

  const doc = await DiscountCode.findOne({ code: normalizedCode });
  if (!doc) {
    return { valid: false, message: 'Invalid or expired discount code' };
  }

  return validateDiscountDoc(doc, amountBeforeCode, board, classLevel);
}

export function validateDiscountDoc(
  doc: IDiscountCode,
  amountBeforeCode: number,
  board: string,
  classLevel: string
): ValidateDiscountResult {
  const now = new Date();
  if (!doc.isActive) {
    return { valid: false, message: 'This discount code is no longer active' };
  }
  if (doc.validFrom > now) {
    return { valid: false, message: 'This discount code is not yet valid' };
  }
  if (doc.validUntil < now) {
    return { valid: false, message: 'This discount code has expired' };
  }
  if (doc.maxUses != null && doc.usedCount >= doc.maxUses) {
    return { valid: false, message: 'This discount code has reached its usage limit' };
  }
  if (doc.minAmount != null && amountBeforeCode < doc.minAmount) {
    return {
      valid: false,
      message: `Minimum order amount of ${formatCurrency(doc.minAmount)} required to use this code`,
    };
  }

  if (doc.applicableBoards.length > 0 && !doc.applicableBoards.includes(board)) {
    return { valid: false, message: 'This discount code is not applicable to this board' };
  }
  if (doc.applicableClasses.length > 0 && !doc.applicableClasses.includes(classLevel)) {
    return { valid: false, message: 'This discount code is not applicable to this class' };
  }

  let discountAmount: number;
  if (doc.type === 'percent') {
    discountAmount = Math.round((amountBeforeCode * doc.value) / 100);
    if (doc.maxDiscountAmount != null && discountAmount > doc.maxDiscountAmount) {
      discountAmount = doc.maxDiscountAmount;
    }
  } else {
    discountAmount = Math.min(doc.value, amountBeforeCode);
  }

  const finalAmount = Math.max(0, amountBeforeCode - discountAmount);

  return {
    valid: true,
    discountAmount,
    finalAmount,
    discountCode: doc.code,
    discountCodeId: String(doc._id),
  };
}

/** Increment usedCount when an enrollment is completed with this code. Call after creating Enrollment. */
export async function incrementDiscountCodeUsage(discountCodeId: mongoose.Types.ObjectId | string | undefined): Promise<void> {
  if (!discountCodeId) return;
  await DiscountCode.findByIdAndUpdate(discountCodeId, { $inc: { usedCount: 1 } });
}
