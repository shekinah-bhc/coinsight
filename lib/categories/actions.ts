"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Category, CategoryType } from "@/src/types/database.types";
import {
  type CategoryActionState,
  type CategoryAnalyticsFilter,
  type CategoryDatePreset,
  categoryAnalyticsFilterSchema,
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/validations/categories";

export interface CategoryWithStats extends Category {
  lifetimeTransactionCount: number;
  lifetimeBudgetCount: number;
  hasActivity: boolean;
  periodAmount: number; // integer paise
  periodTransactionCount: number;
  averageAmount: number; // integer paise
  percentageOfTotal: number; // 0 to 100 (1 decimal precision)
}

export interface CategoriesOverviewMetrics {
  totalActive: number;
  activeExpense: number;
  activeIncome: number;
  archivedCount: number;
}

export interface CategoryAnalyticsItem {
  categoryId: string;
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  isActive: boolean;
  amountPaise: number;
  transactionCount: number;
  averagePaise: number;
  percentage: number;
}

export interface CategoryAnalyticsSummary {
  datePreset: CategoryDatePreset;
  startDate: string;
  endDate: string;
  periodLabel: string;
  timezone: string;
  totalExpensePaise: number;
  totalIncomePaise: number;
  totalExpenseTransactions: number;
  totalIncomeTransactions: number;
  uncategorizedExpensePaise: number;
  uncategorizedExpenseCount: number;
  uncategorizedIncomePaise: number;
  uncategorizedIncomeCount: number;
  expenseBreakdown: CategoryAnalyticsItem[];
  incomeBreakdown: CategoryAnalyticsItem[];
}

export interface CategoriesPageData {
  categories: CategoryWithStats[];
  overview: CategoriesOverviewMetrics;
  analytics: CategoryAnalyticsSummary;
}

interface RawCategoryRow {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
  is_default: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  transactions?: { count: number }[] | null;
  budgets?: { count: number }[] | null;
}

function getDaysInMonth(year: number, month1Based: number): number {
  return new Date(Date.UTC(year, month1Based, 0)).getUTCDate();
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatMonthYearLabel(year: number, month1Based: number): string {
  const date = new Date(Date.UTC(year, month1Based - 1, 15));
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Resolves startDate, endDate, and human-readable label in the user's configured timezone.
 */
function resolveDateBounds(
  filter: CategoryAnalyticsFilter,
  timezone: string
): { startDate: string; endDate: string; periodLabel: string; datePreset: CategoryDatePreset } {
  const now = new Date();
  let tz = timezone || "Asia/Kolkata";

  // Validate timezone fallback
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(now);
  } catch {
    tz = "Asia/Kolkata";
  }

  const yearStr = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric" }).format(now);
  const monthStr = new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "2-digit" }).format(now);
  const currentYear = Number.parseInt(yearStr, 10);
  const currentMonth = Number.parseInt(monthStr, 10);

  switch (filter.datePreset) {
    case "last_month": {
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastDay = getDaysInMonth(prevYear, prevMonth);
      return {
        datePreset: "last_month",
        startDate: `${prevYear}-${pad2(prevMonth)}-01`,
        endDate: `${prevYear}-${pad2(prevMonth)}-${pad2(lastDay)}`,
        periodLabel: formatMonthYearLabel(prevYear, prevMonth),
      };
    }

    case "last_3_months": {
      let startYear = currentYear;
      let startMonth = currentMonth - 2;
      if (startMonth <= 0) {
        startMonth += 12;
        startYear -= 1;
      }
      const endDay = getDaysInMonth(currentYear, currentMonth);
      return {
        datePreset: "last_3_months",
        startDate: `${startYear}-${pad2(startMonth)}-01`,
        endDate: `${currentYear}-${pad2(currentMonth)}-${pad2(endDay)}`,
        periodLabel: `Last 3 Months (${formatMonthYearLabel(startYear, startMonth)} – ${formatMonthYearLabel(currentYear, currentMonth)})`,
      };
    }

    case "this_year": {
      return {
        datePreset: "this_year",
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
        periodLabel: `Calendar Year ${currentYear}`,
      };
    }

    case "custom": {
      const fallbackStart = `${currentYear}-${pad2(currentMonth)}-01`;
      const fallbackEnd = `${currentYear}-${pad2(currentMonth)}-${pad2(getDaysInMonth(currentYear, currentMonth))}`;
      let start = filter.startDate || fallbackStart;
      let end = filter.endDate || fallbackEnd;
      if (start > end) {
        const temp = start;
        start = end;
        end = temp;
      }
      return {
        datePreset: "custom",
        startDate: start,
        endDate: end,
        periodLabel: `${start} to ${end}`,
      };
    }

    case "this_month":
    default: {
      const endDay = getDaysInMonth(currentYear, currentMonth);
      return {
        datePreset: "this_month",
        startDate: `${currentYear}-${pad2(currentMonth)}-01`,
        endDate: `${currentYear}-${pad2(currentMonth)}-${pad2(endDay)}`,
        periodLabel: formatMonthYearLabel(currentYear, currentMonth),
      };
    }
  }
}

/**
 * Ensures the authenticated user has default categories initialized via `init_default_categories()`,
 * and fetches all category records with their relational reference counts.
 */
async function fetchUserCategoriesWithCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<RawCategoryRow[]> {
  // First check if user has any categories
  const { count: existingCount, error: countErr } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countErr) {
    throw new Error(`Database Error: Failed to check categories (${countErr.message}).`);
  }

  if (!existingCount || existingCount === 0) {
    await supabase.rpc("init_default_categories");
  }

  // Query categories with embedded counts for transactions and budgets
  const { data, error } = await supabase
    .from("categories")
    .select("*, transactions(count), budgets(count)")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (!error && data) {
    return data as unknown as RawCategoryRow[];
  }

  // Fallback if embedded count relationship cache is not yet refreshed
  const { data: plainCategories, error: plainError } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (plainError) {
    throw new Error(`Database Error: Failed to load categories (${plainError.message}).`);
  }

  return (plainCategories ?? []) as unknown as RawCategoryRow[];
}

/**
 * Data Loader: Fetches all user categories, overview counts, and period-scoped analytics.
 * Uses integer paise (BigInt arithmetic) for all monetary calculations.
 * Transfers are stored in `public.transfers` and are strictly excluded from income/expense analytics.
 */
export async function getCategoriesData(
  filterInput?: Partial<CategoryAnalyticsFilter>
): Promise<CategoriesPageData> {
  const user = await requireAuth();
  const supabase = await createClient();

  const parsedFilter = categoryAnalyticsFilterSchema.safeParse(filterInput ?? {});
  const filter: CategoryAnalyticsFilter = parsedFilter.success
    ? parsedFilter.data
    : { datePreset: "this_month" };

  // Fetch user profile timezone and categories in parallel
  const [{ data: profile }, rawCategories] = await Promise.all([
    supabase
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .maybeSingle(),
    fetchUserCategoriesWithCounts(supabase, user.id),
  ]);

  const userTimezone = profile?.timezone || "Asia/Kolkata";
  const bounds = resolveDateBounds(filter, userTimezone);

  // Fetch transactions within the selected date range (only category_id, type, amount)
  const { data: periodTransactions, error: txError } = await supabase
    .from("transactions")
    .select("category_id, type, amount")
    .eq("user_id", user.id)
    .gte("transaction_date", bounds.startDate)
    .lte("transaction_date", bounds.endDate);

  if (txError) {
    throw new Error(`Database Error: Failed to query transactions for category analytics (${txError.message}).`);
  }

  // Aggregate period transactions using exact BigInt paise arithmetic
  const periodStatsByCategory = new Map<
    string,
    { amountPaise: bigint; count: number }
  >();

  let totalExpensePaiseBig = BigInt(0);
  let totalIncomePaiseBig = BigInt(0);
  let totalExpenseTransactions = 0;
  let totalIncomeTransactions = 0;

  let uncategorizedExpensePaiseBig = BigInt(0);
  let uncategorizedExpenseCount = 0;
  let uncategorizedIncomePaiseBig = BigInt(0);
  let uncategorizedIncomeCount = 0;

  for (const tx of periodTransactions ?? []) {
    const amtBig = BigInt(Math.round(Number(tx.amount)));
    if (tx.type === "expense") {
      totalExpensePaiseBig += amtBig;
      totalExpenseTransactions += 1;
      if (!tx.category_id) {
        uncategorizedExpensePaiseBig += amtBig;
        uncategorizedExpenseCount += 1;
      }
    } else if (tx.type === "income") {
      totalIncomePaiseBig += amtBig;
      totalIncomeTransactions += 1;
      if (!tx.category_id) {
        uncategorizedIncomePaiseBig += amtBig;
        uncategorizedIncomeCount += 1;
      }
    }

    if (tx.category_id) {
      const existing = periodStatsByCategory.get(tx.category_id) ?? {
        amountPaise: BigInt(0),
        count: 0,
      };
      existing.amountPaise += amtBig;
      existing.count += 1;
      periodStatsByCategory.set(tx.category_id, existing);
    }
  }

  const totalExpensePaise = Number(totalExpensePaiseBig);
  const totalIncomePaise = Number(totalIncomePaiseBig);

  // Build enriched category list and overview counters
  let totalActive = 0;
  let activeExpense = 0;
  let activeIncome = 0;
  let archivedCount = 0;

  const categories: CategoryWithStats[] = rawCategories.map((row) => {
    const isActive = row.is_active !== false;
    if (isActive) {
      totalActive += 1;
      if (row.type === "expense") activeExpense += 1;
      else if (row.type === "income") activeIncome += 1;
    } else {
      archivedCount += 1;
    }

    const periodStat = periodStatsByCategory.get(row.id);
    const periodAmountBig = periodStat?.amountPaise ?? BigInt(0);
    const periodAmount = Number(periodAmountBig);
    const periodTransactionCount = periodStat?.count ?? 0;

    // Exact integer paise average: round(periodAmount / count) using BigInt
    const averageAmount =
      periodTransactionCount > 0
        ? Number(
            (periodAmountBig + BigInt(Math.floor(periodTransactionCount / 2))) /
              BigInt(periodTransactionCount)
          )
        : 0;

    // Embedded lifetime counts from PostgREST
    const embeddedTxCount =
      Array.isArray(row.transactions) && row.transactions.length > 0
        ? Number(row.transactions[0]?.count ?? 0)
        : periodTransactionCount;

    const embeddedBudgetCount =
      Array.isArray(row.budgets) && row.budgets.length > 0
        ? Number(row.budgets[0]?.count ?? 0)
        : 0;

    const lifetimeTransactionCount = Math.max(embeddedTxCount, periodTransactionCount);

    const typeTotalPaise = row.type === "expense" ? totalExpensePaise : totalIncomePaise;
    const percentageOfTotal =
      typeTotalPaise > 0
        ? Math.round((periodAmount / typeTotalPaise) * 1000) / 10
        : 0;

    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      type: row.type,
      icon: row.icon,
      color: row.color,
      is_default: Boolean(row.is_default),
      is_active: isActive,
      created_at: row.created_at,
      updated_at: row.updated_at,
      lifetimeTransactionCount,
      lifetimeBudgetCount: embeddedBudgetCount,
      hasActivity: lifetimeTransactionCount > 0 || embeddedBudgetCount > 0,
      periodAmount,
      periodTransactionCount,
      averageAmount,
      percentageOfTotal,
    };
  });

  // Build sorted expense and income breakdowns for analytics (includes archived categories if they have period activity)
  const expenseBreakdown: CategoryAnalyticsItem[] = categories
    .filter((c) => c.type === "expense" && c.periodAmount > 0)
    .map((c) => ({
      categoryId: c.id,
      name: c.name,
      type: c.type,
      icon: c.icon,
      color: c.color,
      isDefault: c.is_default,
      isActive: c.is_active,
      amountPaise: c.periodAmount,
      transactionCount: c.periodTransactionCount,
      averagePaise: c.averageAmount,
      percentage: c.percentageOfTotal,
    }))
    .sort((a, b) => b.amountPaise - a.amountPaise);

  if (uncategorizedExpenseCount > 0) {
    const uncatAmt = Number(uncategorizedExpensePaiseBig);
    const uncatAvg = Number(
      (uncategorizedExpensePaiseBig + BigInt(Math.floor(uncategorizedExpenseCount / 2))) /
        BigInt(uncategorizedExpenseCount)
    );
    expenseBreakdown.push({
      categoryId: "uncategorized",
      name: "Uncategorized",
      type: "expense",
      icon: "Tag",
      color: "#94A3B8",
      isDefault: true,
      isActive: true,
      amountPaise: uncatAmt,
      transactionCount: uncategorizedExpenseCount,
      averagePaise: uncatAvg,
      percentage:
        totalExpensePaise > 0
          ? Math.round((uncatAmt / totalExpensePaise) * 1000) / 10
          : 0,
    });
    expenseBreakdown.sort((a, b) => b.amountPaise - a.amountPaise);
  }

  const incomeBreakdown: CategoryAnalyticsItem[] = categories
    .filter((c) => c.type === "income" && c.periodAmount > 0)
    .map((c) => ({
      categoryId: c.id,
      name: c.name,
      type: c.type,
      icon: c.icon,
      color: c.color,
      isDefault: c.is_default,
      isActive: c.is_active,
      amountPaise: c.periodAmount,
      transactionCount: c.periodTransactionCount,
      averagePaise: c.averageAmount,
      percentage: c.percentageOfTotal,
    }))
    .sort((a, b) => b.amountPaise - a.amountPaise);

  if (uncategorizedIncomeCount > 0) {
    const uncatAmt = Number(uncategorizedIncomePaiseBig);
    const uncatAvg = Number(
      (uncategorizedIncomePaiseBig + BigInt(Math.floor(uncategorizedIncomeCount / 2))) /
        BigInt(uncategorizedIncomeCount)
    );
    incomeBreakdown.push({
      categoryId: "uncategorized",
      name: "Uncategorized",
      type: "income",
      icon: "Tag",
      color: "#94A3B8",
      isDefault: true,
      isActive: true,
      amountPaise: uncatAmt,
      transactionCount: uncategorizedIncomeCount,
      averagePaise: uncatAvg,
      percentage:
        totalIncomePaise > 0
          ? Math.round((uncatAmt / totalIncomePaise) * 1000) / 10
          : 0,
    });
    incomeBreakdown.sort((a, b) => b.amountPaise - a.amountPaise);
  }

  return {
    categories,
    overview: {
      totalActive,
      activeExpense,
      activeIncome,
      archivedCount,
    },
    analytics: {
      datePreset: bounds.datePreset,
      startDate: bounds.startDate,
      endDate: bounds.endDate,
      periodLabel: bounds.periodLabel,
      timezone: userTimezone,
      totalExpensePaise,
      totalIncomePaise,
      totalExpenseTransactions,
      totalIncomeTransactions,
      uncategorizedExpensePaise: Number(uncategorizedExpensePaiseBig),
      uncategorizedExpenseCount,
      uncategorizedIncomePaise: Number(uncategorizedIncomePaiseBig),
      uncategorizedIncomeCount,
      expenseBreakdown,
      incomeBreakdown,
    },
  };
}

/**
 * Server Action: Fetches category analytics and category stats for a specified date filter.
 */
export async function getCategoryAnalytics(
  filterInput: Partial<CategoryAnalyticsFilter>
): Promise<CategoriesPageData> {
  return getCategoriesData(filterInput);
}

/**
 * Server Action: Creates a new custom category.
 */
export async function createCategoryAction(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const user = await requireAuth();

  const rawName = formData.get("name");
  const rawType = formData.get("type");
  const rawIcon = formData.get("icon");
  const rawColor = formData.get("color");

  const validation = createCategorySchema.safeParse({
    name: typeof rawName === "string" ? rawName : "",
    type: typeof rawType === "string" ? rawType : "expense",
    icon: typeof rawIcon === "string" ? rawIcon : "Tag",
    color: typeof rawColor === "string" ? rawColor : "#6366F1",
  });

  if (!validation.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const normalizedName = validation.data.name.trim();
  const supabase = await createClient();

  // Check for existing active category with the same normalized name and type
  const { data: existingCategories, error: checkError } = await supabase
    .from("categories")
    .select("id, name, type, is_active")
    .eq("user_id", user.id)
    .eq("type", validation.data.type);

  if (checkError) {
    return {
      status: "error",
      message: `Database error while verifying category uniqueness: ${checkError.message}`,
    };
  }

  const duplicateActive = (existingCategories ?? []).find(
    (c) =>
      c.is_active !== false &&
      c.name.trim().toLowerCase() === normalizedName.toLowerCase()
  );

  if (duplicateActive) {
    return {
      status: "error",
      message: `An active ${validation.data.type} category named "${normalizedName}" already exists.`,
      fieldErrors: {
        name: [`An active ${validation.data.type} category with this name already exists.`],
      },
    };
  }

  const { data: created, error: insertError } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      name: normalizedName,
      type: validation.data.type,
      icon: validation.data.icon,
      color: validation.data.color,
      is_default: false,
      is_active: true,
    })
    .select("id")
    .single();

  if (insertError) {
    // Fallback if is_active column has not been migrated yet in remote DB
    if (insertError.message?.includes("is_active")) {
      const retry = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          name: normalizedName,
          type: validation.data.type,
          icon: validation.data.icon,
          color: validation.data.color,
          is_default: false,
        })
        .select("id")
        .single();

      if (!retry.error && retry.data) {
        revalidatePath("/categories");
        revalidatePath("/transactions");
        revalidatePath("/dashboard");
        return {
          status: "success",
          message: `Category "${normalizedName}" created successfully.`,
          categoryId: retry.data.id,
        };
      }
    }

    if (insertError.code === "23505") {
      return {
        status: "error",
        message: `A ${validation.data.type} category named "${normalizedName}" already exists.`,
        fieldErrors: {
          name: ["A category with this name already exists for this transaction type."],
        },
      };
    }

    return {
      status: "error",
      message: insertError.message || "Failed to create category.",
    };
  }

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: `Category "${normalizedName}" created successfully.`,
    categoryId: created?.id,
  };
}

/**
 * Server Action: Updates an existing user-created custom category.
 */
export async function updateCategoryAction(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const user = await requireAuth();

  const rawCategoryId = formData.get("categoryId");
  const rawName = formData.get("name");
  const rawType = formData.get("type");
  const rawIcon = formData.get("icon");
  const rawColor = formData.get("color");

  const validation = updateCategorySchema.safeParse({
    categoryId: typeof rawCategoryId === "string" ? rawCategoryId : "",
    name: typeof rawName === "string" ? rawName : "",
    type: typeof rawType === "string" && (rawType === "expense" || rawType === "income") ? rawType : undefined,
    icon: typeof rawIcon === "string" ? rawIcon : "Tag",
    color: typeof rawColor === "string" ? rawColor : "#6366F1",
  });

  if (!validation.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  // Fetch existing category to verify ownership and default status
  const { data: existing, error: fetchError } = await supabase
    .from("categories")
    .select("*")
    .eq("id", validation.data.categoryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !existing) {
    return {
      status: "error",
      message: "Category not found or access denied.",
    };
  }

  if (existing.is_default) {
    return {
      status: "error",
      message: "Default categories are fixed system categories and cannot be edited.",
    };
  }

  const targetType: CategoryType = validation.data.type ?? existing.type;
  const normalizedName = validation.data.name.trim();

  // If user is attempting to change transaction type (expense <-> income), check references
  if (targetType !== existing.type) {
    const [{ count: txCount }, { count: budgetCount }] = await Promise.all([
      supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("category_id", existing.id),
      supabase
        .from("budgets")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("category_id", existing.id),
    ]);

    if ((txCount ?? 0) > 0 || (budgetCount ?? 0) > 0) {
      return {
        status: "error",
        message:
          "Cannot change category type between Expense and Income because historical transactions or budgets already reference this category.",
        fieldErrors: {
          type: ["Category type is locked once transactions or budgets are linked."],
        },
      };
    }
  }

  // Check for duplicate active category name within the target type
  const isCurrentlyActive = existing.is_active !== false;
  if (isCurrentlyActive) {
    const { data: peers } = await supabase
      .from("categories")
      .select("id, name, is_active")
      .eq("user_id", user.id)
      .eq("type", targetType)
      .neq("id", existing.id);

    const duplicatePeer = (peers ?? []).find(
      (p) =>
        p.is_active !== false &&
        p.name.trim().toLowerCase() === normalizedName.toLowerCase()
    );

    if (duplicatePeer) {
      return {
        status: "error",
        message: `An active ${targetType} category named "${normalizedName}" already exists.`,
        fieldErrors: {
          name: [`An active ${targetType} category with this name already exists.`],
        },
      };
    }
  }

  const { error: updateError } = await supabase
    .from("categories")
    .update({
      name: normalizedName,
      type: targetType,
      icon: validation.data.icon,
      color: validation.data.color,
    })
    .eq("id", existing.id)
    .eq("user_id", user.id);

  if (updateError) {
    if (updateError.code === "23505") {
      return {
        status: "error",
        message: `An active ${targetType} category named "${normalizedName}" already exists.`,
        fieldErrors: {
          name: ["A category with this name already exists."],
        },
      };
    }

    if (updateError.code === "23503" || updateError.code === "23514") {
      return {
        status: "error",
        message:
          updateError.message ||
          "Category type cannot be changed while transactions or budgets reference this category.",
      };
    }

    return {
      status: "error",
      message: updateError.message || "Failed to update category.",
    };
  }

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: `Category "${normalizedName}" updated successfully.`,
    categoryId: existing.id,
  };
}

/**
 * Server Action: Archives a custom category.
 * Preserves all historical transaction associations while removing the category from new transaction forms.
 */
export async function archiveCategoryAction(
  categoryId: string
): Promise<CategoryActionState> {
  const user = await requireAuth();

  if (!categoryId || !/^[0-9a-fA-F-]{36}$/.test(categoryId)) {
    return {
      status: "error",
      message: "Invalid category identifier.",
    };
  }

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("categories")
    .select("id, name, is_default, is_active")
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    if (fetchError.message?.includes("is_active")) {
      return {
        status: "error",
        message:
          "Database migration required: Please run supabase/migrations/20261111100000_categories_management.sql in your Supabase SQL Editor to enable category archiving.",
      };
    }
    return {
      status: "error",
      message: fetchError.message || "Failed to verify category.",
    };
  }

  if (!existing) {
    return {
      status: "error",
      message: "Category not found or access denied.",
    };
  }

  if (existing.is_default) {
    return {
      status: "error",
      message: "Default system categories cannot be archived.",
    };
  }

  const { error: updateError } = await supabase
    .from("categories")
    .update({ is_active: false })
    .eq("id", existing.id)
    .eq("user_id", user.id);

  if (updateError) {
    if (updateError.message?.includes("is_active")) {
      return {
        status: "error",
        message:
          "Database migration required: Please run supabase/migrations/20261111100000_categories_management.sql in your Supabase SQL Editor to enable category archiving.",
      };
    }
    return {
      status: "error",
      message: updateError.message || "Failed to archive category.",
    };
  }

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: `Category "${existing.name}" archived. Historical transactions remain intact.`,
    categoryId: existing.id,
  };
}

/**
 * Server Action: Reactivates an archived custom category after checking for duplicate active names.
 */
export async function reactivateCategoryAction(
  categoryId: string
): Promise<CategoryActionState> {
  const user = await requireAuth();

  if (!categoryId || !/^[0-9a-fA-F-]{36}$/.test(categoryId)) {
    return {
      status: "error",
      message: "Invalid category identifier.",
    };
  }

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("categories")
    .select("id, name, type, is_default, is_active")
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !existing) {
    return {
      status: "error",
      message: "Category not found or access denied.",
    };
  }

  // Check for duplicate active category name before reactivating
  const normalizedName = existing.name.trim().toLowerCase();
  const { data: peers } = await supabase
    .from("categories")
    .select("id, name, is_active")
    .eq("user_id", user.id)
    .eq("type", existing.type)
    .neq("id", existing.id);

  const duplicateActive = (peers ?? []).find(
    (p) => p.is_active !== false && p.name.trim().toLowerCase() === normalizedName
  );

  if (duplicateActive) {
    return {
      status: "error",
      message: `Cannot reactivate "${existing.name}" because an active ${existing.type} category with the same name already exists.`,
    };
  }

  const { error: updateError } = await supabase
    .from("categories")
    .update({ is_active: true })
    .eq("id", existing.id)
    .eq("user_id", user.id);

  if (updateError) {
    if (updateError.code === "23505") {
      return {
        status: "error",
        message: `An active ${existing.type} category named "${existing.name}" already exists.`,
      };
    }

    return {
      status: "error",
      message: updateError.message || "Failed to reactivate category.",
    };
  }

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: `Category "${existing.name}" reactivated and available for new transactions.`,
    categoryId: existing.id,
  };
}

