import { z } from "zod";

/**
 * Centralized Budget Utilization Thresholds
 *
 * - Below 80%: On Track ("on_track")
 * - 80% to 99.99%: Approaching Limit ("approaching_limit")
 * - 100% or above: Over Budget ("over_budget")
 */
export const BUDGET_THRESHOLDS = {
  APPROACHING_LIMIT_PERCENT: 80,
  OVER_BUDGET_PERCENT: 100,
} as const;

export type BudgetStatus = "on_track" | "approaching_limit" | "over_budget";

export type BudgetSortOption =
  | "utilization_desc"
  | "spent_desc"
  | "allocated_desc"
  | "name_asc";

export type BudgetStatusFilter =
  | "all"
  | "over_budget"
  | "approaching_limit"
  | "on_track";

export interface ComputedBudgetMetrics {
  allocatedPaise: number;
  spentPaise: number;
  remainingPaise: number; // Can be negative when over budget
  exceededPaise: number; // Positive amount exceeded when spentPaise > allocatedPaise, else 0
  utilizationPercentage: number; // 1 decimal precision (e.g., 84.5)
  progressBarPercent: number; // Clamped 0..100 for bar width
  status: BudgetStatus;
}

/**
 * Computes exact budget utilization and status using BigInt integer paise arithmetic.
 * Avoids floating-point rounding bugs (e.g. 999,999 / 1,000,000 paise stays "approaching_limit"
 * at 99.9% rather than falsely rounding up to 100% "over_budget").
 */
export function computeBudgetMetrics(
  allocatedPaise: number,
  spentPaise: number
): ComputedBudgetMetrics {
  const allocatedBig = BigInt(Math.max(0, Math.trunc(allocatedPaise)));
  const spentBig = BigInt(Math.max(0, Math.trunc(spentPaise)));

  if (allocatedBig <= BigInt(0)) {
    return {
      allocatedPaise: 0,
      spentPaise: Number(spentBig),
      remainingPaise: -Number(spentBig),
      exceededPaise: Number(spentBig),
      utilizationPercentage: spentBig > BigInt(0) ? 100 : 0,
      progressBarPercent: spentBig > BigInt(0) ? 100 : 0,
      status: spentBig > BigInt(0) ? "over_budget" : "on_track",
    };
  }

  const remainingBig = allocatedBig - spentBig;
  const exceededBig =
    spentBig > allocatedBig ? spentBig - allocatedBig : BigInt(0);

  // Determine status using exact integer cross-multiplication:
  // - Over Budget: spent >= allocated
  // - Approaching Limit: spent < allocated AND spent * 100 >= allocated * 80
  // - On Track: spent * 100 < allocated * 80
  let status: BudgetStatus;
  if (spentBig >= allocatedBig) {
    status = "over_budget";
  } else if (
    spentBig * BigInt(100) >=
    allocatedBig * BigInt(BUDGET_THRESHOLDS.APPROACHING_LIMIT_PERCENT)
  ) {
    status = "approaching_limit";
  } else {
    status = "on_track";
  }

  // Basis points (1/100th of 1%) for accurate 1-decimal percentage display
  const basisPoints = Number((spentBig * BigInt(1000)) / allocatedBig);
  let utilizationPercentage = basisPoints / 10;

  // Guard: if strictly under budget (spentBig < allocatedBig), cap display at 99.9%
  if (spentBig < allocatedBig && utilizationPercentage >= 100) {
    utilizationPercentage = 99.9;
  }
  // Guard: if non-zero spend is < 0.1%, display 0.1%
  if (spentBig > BigInt(0) && utilizationPercentage === 0) {
    utilizationPercentage = 0.1;
  }

  const progressBarPercent =
    spentBig === BigInt(0)
      ? 0
      : Math.min(100, Math.max(2, Math.round(utilizationPercentage)));

  return {
    allocatedPaise: Number(allocatedBig),
    spentPaise: Number(spentBig),
    remainingPaise: Number(remainingBig),
    exceededPaise: Number(exceededBig),
    utilizationPercentage,
    progressBarPercent,
    status,
  };
}

export function getBudgetStatusLabel(status: BudgetStatus): string {
  switch (status) {
    case "over_budget":
      return "Over Budget";
    case "approaching_limit":
      return "Approaching Limit";
    case "on_track":
      return "On Track";
  }
}

export const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface MonthBounds {
  monthKey: string; // "YYYY-MM"
  year: number;
  month: number; // 1..12
  periodStart: string; // "YYYY-MM-01"
  periodEnd: string; // "YYYY-MM-DD"
  label: string; // "November 2026"
  shortLabel: string; // "Nov 2026"
}

export function getDaysInCalendarMonth(year: number, month1Based: number): number {
  return new Date(Date.UTC(year, month1Based, 0)).getUTCDate();
}

export function parseMonthBounds(monthKey: string): MonthBounds | null {
  if (!MONTH_KEY_REGEX.test(monthKey)) {
    return null;
  }
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (year < 2000 || year > 2100 || month < 1 || month > 12) {
    return null;
  }

  const lastDay = getDaysInCalendarMonth(year, month);
  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(lastDay).padStart(2, "0");

  const periodStart = `${year}-${paddedMonth}-01`;
  const periodEnd = `${year}-${paddedMonth}-${paddedDay}`;

  const utcDate = new Date(Date.UTC(year, month - 1, 15));
  const label = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(utcDate);

  const shortLabel = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(utcDate);

  return {
    monthKey: `${year}-${paddedMonth}`,
    year,
    month,
    periodStart,
    periodEnd,
    label,
    shortLabel,
  };
}

export function shiftMonthKey(monthKey: string, deltaMonths: number): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const totalMonths = year * 12 + (month - 1) + deltaMonths;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  return `${targetYear}-${String(targetMonth).padStart(2, "0")}`;
}

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid("Please select a valid expense category."),
  amount: z
    .string()
    .trim()
    .min(1, "Monthly budget amount is required."),
  month: z
    .string()
    .trim()
    .regex(MONTH_KEY_REGEX, "Please select a valid month and year (YYYY-MM)."),
});

export const updateBudgetSchema = z.object({
  budgetId: z.string().uuid("Invalid budget identifier."),
  categoryId: z
    .string()
    .uuid("Please select a valid expense category.")
    .optional(),
  amount: z
    .string()
    .trim()
    .min(1, "Monthly budget amount is required."),
  month: z
    .string()
    .trim()
    .regex(MONTH_KEY_REGEX, "Please select a valid month and year (YYYY-MM).")
    .optional(),
});

export const deleteBudgetSchema = z.object({
  budgetId: z.string().uuid("Invalid budget identifier."),
});

export interface BudgetActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: {
    categoryId?: string[];
    amount?: string[];
    month?: string[];
  };
}

