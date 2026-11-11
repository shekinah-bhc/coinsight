"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { parseRupeesToPaise } from "@/lib/finance/money";
import {
  type BudgetActionState,
  type BudgetStatus,
  computeBudgetMetrics,
  createBudgetSchema,
  deleteBudgetSchema,
  parseMonthBounds,
  shiftMonthKey,
  updateBudgetSchema,
} from "@/lib/validations/budgets";

export interface BudgetWithSpending {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  categoryIsDefault: boolean;
  categoryIsActive: boolean;
  monthKey: string; // "YYYY-MM"
  periodStart: string; // "YYYY-MM-01"
  periodEnd: string; // "YYYY-MM-DD"
  allocatedPaise: number;
  spentPaise: number;
  remainingPaise: number; // Can be negative when over budget
  exceededPaise: number;
  utilizationPercentage: number;
  progressBarPercent: number;
  status: BudgetStatus;
  transactionCount: number;
  previousMonthAllocatedPaise: number | null;
  previousMonthSpentPaise: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetOverviewMetrics {
  monthKey: string;
  monthLabel: string;
  shortMonthLabel: string;
  periodStart: string;
  periodEnd: string;
  currentMonthKey: string;
  periodRelation: "past" | "current" | "future";
  timezone: string;
  totalBudgetPaise: number;
  totalSpentPaise: number; // Spent across budgeted categories
  totalAllExpensePaise: number; // All expense transactions in selected month
  unbudgetedSpentPaise: number; // Expenses in categories without a budget this month
  remainingBudgetPaise: number; // Can be negative when totalSpentPaise > totalBudgetPaise
  exceededBudgetPaise: number;
  overallUtilizationPercentage: number;
  overallProgressBarPercent: number;
  overallStatus: BudgetStatus;
  totalBudgetsCount: number;
  onTrackCount: number;
  approachingLimitCount: number;
  overBudgetCount: number;
}

export interface SelectableBudgetCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  isActive: boolean;
  hasBudgetInSelectedMonth: boolean;
  existingBudgetId: string | null;
  existingAllocatedPaise: number | null;
  selectedMonthSpentPaise: number;
}

export interface MonthlyBudgetTrendPoint {
  monthKey: string;
  label: string;
  shortLabel: string;
  totalBudgetPaise: number;
  totalBudgetedSpentPaise: number;
  totalAllExpensePaise: number;
  utilizationPercentage: number;
  progressBarPercent: number;
  status: BudgetStatus;
  budgetCount: number;
  overBudgetCount: number;
  isFuture: boolean;
}

export interface CategoryMonthComparisonItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  currentAllocatedPaise: number;
  currentSpentPaise: number;
  currentStatus: BudgetStatus;
  previousAllocatedPaise: number | null;
  previousSpentPaise: number;
  spentDeltaPaise: number; // currentSpentPaise - previousSpentPaise
}

export interface ConsistentlyOverBudgetItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  monthsExceededCount: number;
  monthsBudgetedCount: number;
  totalExceededPaise: number;
  latestUtilizationPercentage: number;
}

export interface UnusedAllocationItem {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  allocatedPaise: number;
  spentPaise: number;
  unusedPaise: number;
  utilizationPercentage: number;
}

export interface UnbudgetedCategorySpendItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  isActive: boolean;
  spentPaise: number;
  transactionCount: number;
}

export interface BudgetAnalyticsData {
  selectedMonthKey: string;
  previousMonthKey: string;
  previousMonthLabel: string;
  previousMonthTotalBudgetPaise: number;
  previousMonthTotalSpentPaise: number;
  previousMonthUtilizationPercentage: number;
  monthOverMonthSpentDeltaPaise: number;
  monthlyTrend: MonthlyBudgetTrendPoint[];
  categoryComparisons: CategoryMonthComparisonItem[];
  consistentlyOverBudget: ConsistentlyOverBudgetItem[];
  unusedAllocations: UnusedAllocationItem[];
  unbudgetedCategories: UnbudgetedCategorySpendItem[];
}

export interface BudgetsPageData {
  overview: BudgetOverviewMetrics;
  budgets: BudgetWithSpending[];
  availableCategories: SelectableBudgetCategory[];
  analytics: BudgetAnalyticsData;
}

interface RawCategoryRow {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
  color: string | null;
  is_default: boolean;
  is_active?: boolean;
}

interface RawBudgetRow {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period_start: string;
  period_end: string;
  category_type: string;
  created_at: string;
  updated_at: string;
}

interface RawExpenseTxRow {
  id: string;
  category_id: string | null;
  amount: number;
  transaction_date: string;
}

function getCurrentDatePartsInTimezone(timezone: string): {
  year: number;
  month: number;
  day: number;
  monthKey: string;
  todayDateStr: string;
} {
  let effectiveTz = timezone || "Asia/Kolkata";
  try {
    Intl.DateTimeFormat(undefined, { timeZone: effectiveTz });
  } catch {
    effectiveTz = "Asia/Kolkata";
  }

  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: effectiveTz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === "year")?.value ?? 2026);
  const month = Number(parts.find((p) => p.type === "month")?.value ?? 1);
  const day = Number(parts.find((p) => p.type === "day")?.value ?? 1);

  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");

  return {
    year,
    month,
    day,
    monthKey: `${year}-${paddedMonth}`,
    todayDateStr: `${year}-${paddedMonth}-${paddedDay}`,
  };
}

/**
 * Loads complete monthly budgets, actual expense spending, and 6-month historical
 * budget analytics for the authenticated user.
 */
export async function getBudgetsData(
  requestedMonth?: string
): Promise<BudgetsPageData> {
  const user = await requireAuth();
  const supabase = await createClient();

  // 1. Fetch user's configured timezone
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();

  const timezone = profile?.timezone || "Asia/Kolkata";
  const currentParts = getCurrentDatePartsInTimezone(timezone);
  const currentMonthKey = currentParts.monthKey;

  // Validate requested month or fall back to current month in user's timezone
  const targetBounds =
    (requestedMonth ? parseMonthBounds(requestedMonth.trim()) : null) ??
    parseMonthBounds(currentMonthKey)!;

  const selectedMonthKey = targetBounds.monthKey;
  const periodRelation: "past" | "current" | "future" =
    selectedMonthKey < currentMonthKey
      ? "past"
      : selectedMonthKey > currentMonthKey
        ? "future"
        : "current";

  // Build 6-month window ending at selectedMonthKey (5 prior months + selectedMonthKey)
  const trendMonthKeys: string[] = [];
  for (let offset = -5; offset <= 0; offset++) {
    trendMonthKeys.push(shiftMonthKey(selectedMonthKey, offset));
  }

  const earliestBounds = parseMonthBounds(trendMonthKeys[0]!)!;
  const previousMonthKey = shiftMonthKey(selectedMonthKey, -1);
  const previousBounds = parseMonthBounds(previousMonthKey)!;

  // Prevent accidental future-period spending calculations:
  // If a month is in the future relative to currentMonthKey, its spending is 0.
  // For the query upper bound, clamp to the end of currentMonthKey (or targetBounds.periodEnd if past/current).
  const currentMonthBounds = parseMonthBounds(currentMonthKey)!;
  const spendingQueryEndDate =
    targetBounds.periodEnd > currentMonthBounds.periodEnd
      ? currentMonthBounds.periodEnd
      : targetBounds.periodEnd;

  // 2. Fetch categories, budgets in 6-month window, and expense transactions in 6-month window
  const [categoriesResult, budgetsResult, expenseTxResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, user_id, name, type, icon, color, is_default, is_active")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true }),
    supabase
      .from("budgets")
      .select(
        "id, user_id, category_id, amount, period_start, period_end, category_type, created_at, updated_at"
      )
      .eq("user_id", user.id)
      .gte("period_start", earliestBounds.periodStart)
      .lte("period_start", targetBounds.periodStart)
      .order("amount", { ascending: false }),
    supabase
      .from("transactions")
      .select("id, category_id, amount, transaction_date")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("transaction_date", earliestBounds.periodStart)
      .lte("transaction_date", spendingQueryEndDate),
  ]);

  if (categoriesResult.error) {
    throw new Error(
      `Failed to load categories for budgets: ${categoriesResult.error.message}`
    );
  }
  if (budgetsResult.error) {
    throw new Error(
      `Failed to load monthly budgets: ${budgetsResult.error.message}`
    );
  }
  if (expenseTxResult.error) {
    throw new Error(
      `Failed to load expense transactions for budgets: ${expenseTxResult.error.message}`
    );
  }

  const allCategories = (categoriesResult.data ?? []) as RawCategoryRow[];
  const categoryById = new Map<string, RawCategoryRow>();
  for (const cat of allCategories) {
    categoryById.set(cat.id, cat);
  }

  const windowBudgets = (budgetsResult.data ?? []) as RawBudgetRow[];
  const windowExpenseTxs = (expenseTxResult.data ?? []) as RawExpenseTxRow[];

  // 3. Aggregate expense transactions by (monthKey, categoryId) using BigInt paise
  // Map key: `${monthKey}::${categoryId || 'uncategorized'}`
  const monthCategorySpendMap = new Map<
    string,
    { paise: bigint; count: number }
  >();
  const monthTotalAllExpenseMap = new Map<string, bigint>();

  for (const tx of windowExpenseTxs) {
    const txMonthKey = tx.transaction_date.slice(0, 7); // "YYYY-MM"
    // Never count spending in future months beyond currentMonthKey
    if (txMonthKey > currentMonthKey) {
      continue;
    }

    const amountBig = BigInt(Math.max(0, Math.trunc(Number(tx.amount))));
    const prevMonthTotal = monthTotalAllExpenseMap.get(txMonthKey) ?? BigInt(0);
    monthTotalAllExpenseMap.set(txMonthKey, prevMonthTotal + amountBig);

    const catKey = `${txMonthKey}::${tx.category_id ?? "uncategorized"}`;
    const prevCat = monthCategorySpendMap.get(catKey) ?? {
      paise: BigInt(0),
      count: 0,
    };
    prevCat.paise += amountBig;
    prevCat.count += 1;
    monthCategorySpendMap.set(catKey, prevCat);
  }

  // Group budgets by monthKey ("YYYY-MM")
  const budgetsByMonthMap = new Map<string, RawBudgetRow[]>();
  for (const b of windowBudgets) {
    const mKey = b.period_start.slice(0, 7);
    const list = budgetsByMonthMap.get(mKey) ?? [];
    list.push(b);
    budgetsByMonthMap.set(mKey, list);
  }

  const selectedMonthBudgetsRaw =
    budgetsByMonthMap.get(selectedMonthKey) ?? [];
  const previousMonthBudgetsRaw =
    budgetsByMonthMap.get(previousMonthKey) ?? [];

  const prevBudgetByCategoryId = new Map<string, RawBudgetRow>();
  for (const pb of previousMonthBudgetsRaw) {
    prevBudgetByCategoryId.set(pb.category_id, pb);
  }

  // 4. Build enriched BudgetWithSpending items for the selected month
  let totalBudgetBig = BigInt(0);
  let totalBudgetedSpentBig = BigInt(0);
  let onTrackCount = 0;
  let approachingLimitCount = 0;
  let overBudgetCount = 0;

  const budgetedCategoryIdsInSelectedMonth = new Set<string>();
  const selectedBudgetByCategoryId = new Map<string, RawBudgetRow>();

  const budgets: BudgetWithSpending[] = selectedMonthBudgetsRaw.map((b) => {
    budgetedCategoryIdsInSelectedMonth.add(b.category_id);
    selectedBudgetByCategoryId.set(b.category_id, b);

    const cat = categoryById.get(b.category_id);
    const spendEntry =
      periodRelation === "future"
        ? { paise: BigInt(0), count: 0 }
        : (monthCategorySpendMap.get(`${selectedMonthKey}::${b.category_id}`) ?? {
            paise: BigInt(0),
            count: 0,
          });

    const prevSpendEntry =
      previousMonthKey > currentMonthKey
        ? { paise: BigInt(0), count: 0 }
        : (monthCategorySpendMap.get(`${previousMonthKey}::${b.category_id}`) ?? {
            paise: BigInt(0),
            count: 0,
          });

    const prevBudget = prevBudgetByCategoryId.get(b.category_id);

    const allocatedPaise = Number(b.amount);
    const spentPaise = Number(spendEntry.paise);

    totalBudgetBig += BigInt(allocatedPaise);
    totalBudgetedSpentBig += spendEntry.paise;

    const computed = computeBudgetMetrics(allocatedPaise, spentPaise);
    if (computed.status === "over_budget") {
      overBudgetCount += 1;
    } else if (computed.status === "approaching_limit") {
      approachingLimitCount += 1;
    } else {
      onTrackCount += 1;
    }

    return {
      id: b.id,
      userId: b.user_id,
      categoryId: b.category_id,
      categoryName: cat?.name ?? "Archived Category",
      categoryIcon: cat?.icon ?? "Tag",
      categoryColor: cat?.color ?? "#6366F1",
      categoryIsDefault: Boolean(cat?.is_default),
      categoryIsActive: cat ? cat.is_active !== false : false,
      monthKey: selectedMonthKey,
      periodStart: b.period_start,
      periodEnd: b.period_end,
      allocatedPaise: computed.allocatedPaise,
      spentPaise: computed.spentPaise,
      remainingPaise: computed.remainingPaise,
      exceededPaise: computed.exceededPaise,
      utilizationPercentage: computed.utilizationPercentage,
      progressBarPercent: computed.progressBarPercent,
      status: computed.status,
      transactionCount: spendEntry.count,
      previousMonthAllocatedPaise: prevBudget ? Number(prevBudget.amount) : null,
      previousMonthSpentPaise: Number(prevSpendEntry.paise),
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    };
  });

  // Sort budgets by utilization % descending, then spent descending, then name ascending
  budgets.sort((a, b) => {
    if (b.utilizationPercentage !== a.utilizationPercentage) {
      return b.utilizationPercentage - a.utilizationPercentage;
    }
    if (b.spentPaise !== a.spentPaise) {
      return b.spentPaise - a.spentPaise;
    }
    if (b.allocatedPaise !== a.allocatedPaise) {
      return b.allocatedPaise - a.allocatedPaise;
    }
    return a.categoryName.localeCompare(b.categoryName);
  });

  const totalAllExpenseBig =
    periodRelation === "future"
      ? BigInt(0)
      : (monthTotalAllExpenseMap.get(selectedMonthKey) ?? BigInt(0));

  const unbudgetedSpentBig =
    totalAllExpenseBig > totalBudgetedSpentBig
      ? totalAllExpenseBig - totalBudgetedSpentBig
      : BigInt(0);

  const overallComputed = computeBudgetMetrics(
    Number(totalBudgetBig),
    Number(totalBudgetedSpentBig)
  );

  const overview: BudgetOverviewMetrics = {
    monthKey: selectedMonthKey,
    monthLabel: targetBounds.label,
    shortMonthLabel: targetBounds.shortLabel,
    periodStart: targetBounds.periodStart,
    periodEnd: targetBounds.periodEnd,
    currentMonthKey,
    periodRelation,
    timezone,
    totalBudgetPaise: Number(totalBudgetBig),
    totalSpentPaise: Number(totalBudgetedSpentBig),
    totalAllExpensePaise: Number(totalAllExpenseBig),
    unbudgetedSpentPaise: Number(unbudgetedSpentBig),
    remainingBudgetPaise:
      totalBudgetBig > BigInt(0) ? overallComputed.remainingPaise : 0,
    exceededBudgetPaise:
      totalBudgetBig > BigInt(0) ? overallComputed.exceededPaise : 0,
    overallUtilizationPercentage:
      totalBudgetBig > BigInt(0) ? overallComputed.utilizationPercentage : 0,
    overallProgressBarPercent:
      totalBudgetBig > BigInt(0) ? overallComputed.progressBarPercent : 0,
    overallStatus:
      totalBudgetBig > BigInt(0) ? overallComputed.status : "on_track",
    totalBudgetsCount: budgets.length,
    onTrackCount,
    approachingLimitCount,
    overBudgetCount,
  };

  // 5. Build available active expense categories for Create/Edit Budget form
  const availableCategories: SelectableBudgetCategory[] = allCategories
    .filter((c) => c.type === "expense" && c.is_active !== false)
    .map((c) => {
      const existingBudget = selectedBudgetByCategoryId.get(c.id);
      const spendEntry =
        periodRelation === "future"
          ? { paise: BigInt(0), count: 0 }
          : (monthCategorySpendMap.get(`${selectedMonthKey}::${c.id}`) ?? {
              paise: BigInt(0),
              count: 0,
            });

      return {
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        isDefault: c.is_default,
        isActive: c.is_active !== false,
        hasBudgetInSelectedMonth: Boolean(existingBudget),
        existingBudgetId: existingBudget?.id ?? null,
        existingAllocatedPaise: existingBudget
          ? Number(existingBudget.amount)
          : null,
        selectedMonthSpentPaise: Number(spendEntry.paise),
      };
    });

  // 6. Build 6-Month Historical Trend & Analytics
  const categoryExceedTracker = new Map<
    string,
    {
      monthsExceededCount: number;
      monthsBudgetedCount: number;
      totalExceededBig: bigint;
      latestUtilizationPercentage: number;
    }
  >();

  const monthlyTrend: MonthlyBudgetTrendPoint[] = trendMonthKeys.map((mKey) => {
    const mBounds = parseMonthBounds(mKey)!;
    const isFuture = mKey > currentMonthKey;
    const mBudgets = budgetsByMonthMap.get(mKey) ?? [];

    let mBudgetBig = BigInt(0);
    let mBudgetedSpentBig = BigInt(0);
    let mOverBudgetCount = 0;

    for (const mb of mBudgets) {
      const allocPaise = Number(mb.amount);
      const spendEntry = isFuture
        ? { paise: BigInt(0), count: 0 }
        : (monthCategorySpendMap.get(`${mKey}::${mb.category_id}`) ?? {
            paise: BigInt(0),
            count: 0,
          });
      const spentPaise = Number(spendEntry.paise);

      mBudgetBig += BigInt(allocPaise);
      mBudgetedSpentBig += spendEntry.paise;

      const mComputed = computeBudgetMetrics(allocPaise, spentPaise);
      if (mComputed.status === "over_budget") {
        mOverBudgetCount += 1;
      }

      if (!isFuture) {
        const tracker = categoryExceedTracker.get(mb.category_id) ?? {
          monthsExceededCount: 0,
          monthsBudgetedCount: 0,
          totalExceededBig: BigInt(0),
          latestUtilizationPercentage: 0,
        };
        tracker.monthsBudgetedCount += 1;
        tracker.latestUtilizationPercentage = mComputed.utilizationPercentage;
        if (mComputed.status === "over_budget") {
          tracker.monthsExceededCount += 1;
          tracker.totalExceededBig += BigInt(mComputed.exceededPaise);
        }
        categoryExceedTracker.set(mb.category_id, tracker);
      }
    }

    const mAllExpenseBig = isFuture
      ? BigInt(0)
      : (monthTotalAllExpenseMap.get(mKey) ?? BigInt(0));

    const mOverall = computeBudgetMetrics(
      Number(mBudgetBig),
      Number(mBudgetedSpentBig)
    );

    return {
      monthKey: mKey,
      label: mBounds.label,
      shortLabel: mBounds.shortLabel,
      totalBudgetPaise: Number(mBudgetBig),
      totalBudgetedSpentPaise: Number(mBudgetedSpentBig),
      totalAllExpensePaise: Number(mAllExpenseBig),
      utilizationPercentage:
        mBudgetBig > BigInt(0) ? mOverall.utilizationPercentage : 0,
      progressBarPercent:
        mBudgetBig > BigInt(0) ? mOverall.progressBarPercent : 0,
      status: mBudgetBig > BigInt(0) ? mOverall.status : "on_track",
      budgetCount: mBudgets.length,
      overBudgetCount: mOverBudgetCount,
      isFuture,
    };
  });

  const prevTrendPoint = monthlyTrend.find(
    (pt) => pt.monthKey === previousMonthKey
  );
  const previousMonthTotalBudgetPaise = prevTrendPoint?.totalBudgetPaise ?? 0;
  const previousMonthTotalSpentPaise =
    prevTrendPoint?.totalBudgetedSpentPaise ?? 0;
  const previousMonthUtilizationPercentage =
    prevTrendPoint?.utilizationPercentage ?? 0;
  const monthOverMonthSpentDeltaPaise =
    overview.totalSpentPaise - previousMonthTotalSpentPaise;

  // Per-category comparison (Selected Month vs Previous Month)
  const categoryComparisons: CategoryMonthComparisonItem[] = budgets.map(
    (b) => ({
      categoryId: b.categoryId,
      categoryName: b.categoryName,
      categoryIcon: b.categoryIcon,
      categoryColor: b.categoryColor,
      currentAllocatedPaise: b.allocatedPaise,
      currentSpentPaise: b.spentPaise,
      currentStatus: b.status,
      previousAllocatedPaise: b.previousMonthAllocatedPaise,
      previousSpentPaise: b.previousMonthSpentPaise,
      spentDeltaPaise: b.spentPaise - b.previousMonthSpentPaise,
    })
  );

  // Categories exceeding limits across the 6-month window
  const consistentlyOverBudget: ConsistentlyOverBudgetItem[] = Array.from(
    categoryExceedTracker.entries()
  )
    .filter(([, stats]) => stats.monthsExceededCount >= 1)
    .map(([categoryId, stats]) => {
      const cat = categoryById.get(categoryId);
      return {
        categoryId,
        categoryName: cat?.name ?? "Archived Category",
        categoryIcon: cat?.icon ?? "Tag",
        categoryColor: cat?.color ?? "#6366F1",
        monthsExceededCount: stats.monthsExceededCount,
        monthsBudgetedCount: stats.monthsBudgetedCount,
        totalExceededPaise: Number(stats.totalExceededBig),
        latestUtilizationPercentage: stats.latestUtilizationPercentage,
      };
    })
    .sort((a, b) => {
      if (b.monthsExceededCount !== a.monthsExceededCount) {
        return b.monthsExceededCount - a.monthsExceededCount;
      }
      return b.totalExceededPaise - a.totalExceededPaise;
    });

  // Categories with unused or very low (< 15%) allocations in the selected month (when not future)
  const unusedAllocations: UnusedAllocationItem[] =
    periodRelation === "future"
      ? []
      : budgets
          .filter(
            (b) => b.spentPaise === 0 || b.utilizationPercentage < 15
          )
          .map((b) => ({
            budgetId: b.id,
            categoryId: b.categoryId,
            categoryName: b.categoryName,
            categoryIcon: b.categoryIcon,
            categoryColor: b.categoryColor,
            allocatedPaise: b.allocatedPaise,
            spentPaise: b.spentPaise,
            unusedPaise: Math.max(0, b.remainingPaise),
            utilizationPercentage: b.utilizationPercentage,
          }))
          .sort((a, b) => b.unusedPaise - a.unusedPaise);

  // Expense categories that have spending in the selected month but no budget allocated
  const unbudgetedCategories: UnbudgetedCategorySpendItem[] = [];
  if (periodRelation !== "future") {
    for (const cat of allCategories) {
      if (cat.type !== "expense") continue;
      if (budgetedCategoryIdsInSelectedMonth.has(cat.id)) continue;

      const spendEntry = monthCategorySpendMap.get(
        `${selectedMonthKey}::${cat.id}`
      );
      if (spendEntry && spendEntry.paise > BigInt(0)) {
        unbudgetedCategories.push({
          categoryId: cat.id,
          categoryName: cat.name,
          categoryIcon: cat.icon,
          categoryColor: cat.color,
          isActive: cat.is_active !== false,
          spentPaise: Number(spendEntry.paise),
          transactionCount: spendEntry.count,
        });
      }
    }
    unbudgetedCategories.sort((a, b) => b.spentPaise - a.spentPaise);
  }

  const analytics: BudgetAnalyticsData = {
    selectedMonthKey,
    previousMonthKey,
    previousMonthLabel: previousBounds.label,
    previousMonthTotalBudgetPaise,
    previousMonthTotalSpentPaise,
    previousMonthUtilizationPercentage,
    monthOverMonthSpentDeltaPaise,
    monthlyTrend,
    categoryComparisons,
    consistentlyOverBudget,
    unusedAllocations,
    unbudgetedCategories,
  };

  return {
    overview,
    budgets,
    availableCategories,
    analytics,
  };
}

/**
 * Returns historical budget analytics for a given month.
 */
export async function getBudgetAnalytics(
  month?: string
): Promise<BudgetAnalyticsData> {
  const data = await getBudgetsData(month);
  return data.analytics;
}

/**
 * Server Action: Create a monthly expense budget for a category.
 */
export async function createBudgetAction(
  _prevState: BudgetActionState,
  formData: FormData
): Promise<BudgetActionState> {
  const user = await requireAuth();

  const rawData = {
    categoryId: String(formData.get("categoryId") ?? "").trim(),
    amount: String(formData.get("amount") ?? "").trim(),
    month: String(formData.get("month") ?? "").trim(),
  };

  const validation = createBudgetSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const moneyResult = parseRupeesToPaise(validation.data.amount, false);
  if (!moneyResult.success) {
    return {
      status: "error",
      message: moneyResult.error,
      fieldErrors: {
        amount: [moneyResult.error],
      },
    };
  }

  if (moneyResult.paise <= 0) {
    return {
      status: "error",
      message: "Monthly budget amount must be greater than ₹0.00.",
      fieldErrors: {
        amount: ["Budget amount must be greater than zero."],
      },
    };
  }

  const monthBounds = parseMonthBounds(validation.data.month);
  if (!monthBounds) {
    return {
      status: "error",
      message: "Invalid budget month selected.",
      fieldErrors: {
        month: ["Invalid month format."],
      },
    };
  }

  const supabase = await createClient();

  // 1. Verify category ownership, expense type, and active state
  const { data: category, error: catError } = await supabase
    .from("categories")
    .select("id, user_id, name, type, is_active")
    .eq("id", validation.data.categoryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (catError || !category) {
    return {
      status: "error",
      message: "Selected category does not exist or does not belong to you.",
      fieldErrors: {
        categoryId: ["Invalid category selected."],
      },
    };
  }

  if (category.type !== "expense") {
    return {
      status: "error",
      message: "Budgets can only be created for expense categories. Income categories cannot be budgeted.",
      fieldErrors: {
        categoryId: ["Only expense categories can have spending budgets."],
      },
    };
  }

  const rawCategory = category as RawCategoryRow;
  if (rawCategory.is_active === false) {
    return {
      status: "error",
      message: `Category "${category.name}" is archived. Reactivate it in Categories before setting a new budget.`,
      fieldErrors: {
        categoryId: ["Archived categories cannot be selected for new budgets."],
      },
    };
  }

  // 2. Check for existing budget for the same user, category, and month
  const { data: existingBudget } = await supabase
    .from("budgets")
    .select("id")
    .eq("user_id", user.id)
    .eq("category_id", validation.data.categoryId)
    .eq("period_start", monthBounds.periodStart)
    .maybeSingle();

  if (existingBudget) {
    return {
      status: "error",
      message: `A budget for "${category.name}" already exists for ${monthBounds.label}. Edit the existing budget instead.`,
      fieldErrors: {
        categoryId: [`Already budgeted for ${monthBounds.label}.`],
      },
    };
  }

  // 3. Insert budget
  const { error: insertError } = await supabase.from("budgets").insert({
    user_id: user.id,
    category_id: validation.data.categoryId,
    amount: moneyResult.paise,
    period_start: monthBounds.periodStart,
    period_end: monthBounds.periodEnd,
    category_type: "expense",
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return {
        status: "error",
        message: `A budget for "${category.name}" already exists for ${monthBounds.label}.`,
        fieldErrors: {
          categoryId: [`Duplicate budget for ${monthBounds.label}.`],
        },
      };
    }
    return {
      status: "error",
      message: insertError.message || "Failed to create budget. Please try again.",
    };
  }

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  revalidatePath("/categories");

  return {
    status: "success",
    message: `Budget of ₹${(moneyResult.paise / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} created for ${category.name} (${monthBounds.label}).`,
  };
}

/**
 * Server Action: Update an existing monthly budget.
 * Never modifies existing transactions, account balances, or categories.
 */
export async function updateBudgetAction(
  _prevState: BudgetActionState,
  formData: FormData
): Promise<BudgetActionState> {
  const user = await requireAuth();

  const rawCategoryId = formData.get("categoryId");
  const rawMonth = formData.get("month");

  const rawData = {
    budgetId: String(formData.get("budgetId") ?? "").trim(),
    categoryId:
      typeof rawCategoryId === "string" && rawCategoryId.trim() !== ""
        ? rawCategoryId.trim()
        : undefined,
    amount: String(formData.get("amount") ?? "").trim(),
    month:
      typeof rawMonth === "string" && rawMonth.trim() !== ""
        ? rawMonth.trim()
        : undefined,
  };

  const validation = updateBudgetSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const moneyResult = parseRupeesToPaise(validation.data.amount, false);
  if (!moneyResult.success) {
    return {
      status: "error",
      message: moneyResult.error,
      fieldErrors: {
        amount: [moneyResult.error],
      },
    };
  }

  if (moneyResult.paise <= 0) {
    return {
      status: "error",
      message: "Monthly budget amount must be greater than ₹0.00.",
      fieldErrors: {
        amount: ["Budget amount must be greater than zero."],
      },
    };
  }

  const supabase = await createClient();

  // 1. Verify budget exists and belongs to the authenticated user
  const { data: existingBudget, error: fetchError } = await supabase
    .from("budgets")
    .select("id, user_id, category_id, amount, period_start, period_end")
    .eq("id", validation.data.budgetId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !existingBudget) {
    return {
      status: "error",
      message: "Budget record not found or access denied.",
    };
  }

  const targetCategoryId =
    validation.data.categoryId ?? existingBudget.category_id;
  const existingMonthKey = existingBudget.period_start.slice(0, 7);
  const targetMonthKey = validation.data.month ?? existingMonthKey;
  const targetMonthBounds = parseMonthBounds(targetMonthKey);

  if (!targetMonthBounds) {
    return {
      status: "error",
      message: "Invalid month selected.",
      fieldErrors: {
        month: ["Invalid month format."],
      },
    };
  }

  // 2. Verify target category ownership & type
  const { data: category, error: catError } = await supabase
    .from("categories")
    .select("id, user_id, name, type, is_active")
    .eq("id", targetCategoryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (catError || !category) {
    return {
      status: "error",
      message: "Selected category does not exist or does not belong to you.",
      fieldErrors: {
        categoryId: ["Invalid category selected."],
      },
    };
  }

  if (category.type !== "expense") {
    return {
      status: "error",
      message: "Budgets can only be assigned to expense categories.",
      fieldErrors: {
        categoryId: ["Must be an expense category."],
      },
    };
  }

  // Allow updating the amount of a budget whose category was subsequently archived,
  // but reject switching a budget to a different archived category.
  const rawCategory = category as RawCategoryRow;
  if (
    rawCategory.is_active === false &&
    targetCategoryId !== existingBudget.category_id
  ) {
    return {
      status: "error",
      message: `Cannot reassign budget to archived category "${category.name}".`,
      fieldErrors: {
        categoryId: ["Please select an active expense category."],
      },
    };
  }

  // 3. If category or month changed, verify no duplicate budget exists for (user_id, targetCategoryId, targetPeriodStart)
  if (
    targetCategoryId !== existingBudget.category_id ||
    targetMonthBounds.periodStart !== existingBudget.period_start
  ) {
    const { data: conflictingBudget } = await supabase
      .from("budgets")
      .select("id")
      .eq("user_id", user.id)
      .eq("category_id", targetCategoryId)
      .eq("period_start", targetMonthBounds.periodStart)
      .neq("id", existingBudget.id)
      .maybeSingle();

    if (conflictingBudget) {
      return {
        status: "error",
        message: `A budget for "${category.name}" already exists in ${targetMonthBounds.label}.`,
        fieldErrors: {
          categoryId: [`Already budgeted in ${targetMonthBounds.label}.`],
        },
      };
    }
  }

  // 4. Update the budget record
  const { error: updateError } = await supabase
    .from("budgets")
    .update({
      category_id: targetCategoryId,
      amount: moneyResult.paise,
      period_start: targetMonthBounds.periodStart,
      period_end: targetMonthBounds.periodEnd,
      category_type: "expense",
    })
    .eq("id", existingBudget.id)
    .eq("user_id", user.id);

  if (updateError) {
    if (updateError.code === "23505") {
      return {
        status: "error",
        message: `A budget for "${category.name}" already exists in ${targetMonthBounds.label}.`,
      };
    }
    return {
      status: "error",
      message: updateError.message || "Failed to update budget.",
    };
  }

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  revalidatePath("/categories");

  return {
    status: "success",
    message: `Updated ${category.name} budget for ${targetMonthBounds.label}.`,
  };
}

/**
 * Server Action: Delete a budget record.
 * Deletes ONLY the budget row in public.budgets; never alters transactions, accounts, or categories.
 */
export async function deleteBudgetAction(
  budgetId: string
): Promise<BudgetActionState> {
  const user = await requireAuth();

  const validation = deleteBudgetSchema.safeParse({ budgetId });
  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid budget identifier.",
    };
  }

  const supabase = await createClient();

  const { data: existingBudget, error: fetchError } = await supabase
    .from("budgets")
    .select("id, user_id")
    .eq("id", validation.data.budgetId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !existingBudget) {
    return {
      status: "error",
      message: "Budget not found or access denied.",
    };
  }

  const { error: deleteError } = await supabase
    .from("budgets")
    .delete()
    .eq("id", existingBudget.id)
    .eq("user_id", user.id);

  if (deleteError) {
    return {
      status: "error",
      message: deleteError.message || "Failed to delete budget.",
    };
  }

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  revalidatePath("/categories");

  return {
    status: "success",
    message: "Budget deleted. Historical transactions and account balances remain untouched.",
  };
}

