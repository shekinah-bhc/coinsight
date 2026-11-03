"use server";

import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { NetWorthSummary, TransactionSource, TransactionType } from "@/src/types/database.types";
import type { RawJoinedTransaction, TransactionItem } from "@/lib/transactions/actions";

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  icon: string | null;
  color: string | null;
  amount: number; // in integer paise
  percentage: number;
}

export interface DashboardMetrics {
  totalNetBalance: string;
  monthlyIncome: number; // in paise
  monthlyExpenses: number; // in paise
  netCashFlow: number; // in paise
  savingsRate: number; // percentage
  recentTransactions: TransactionItem[];
  categorySpending: CategorySpending[];
  currentMonthName: string;
}

/**
 * Data Loader: Loads live financial metrics for the current month strictly from Supabase.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const user = await requireAuth();
  const supabase = await createClient();

  // 1. Fetch user profile to get their configured timezone
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();

  const userTimezone = profile?.timezone || "Asia/Kolkata";

  // Calculate start of current month in user's timezone
  const now = new Date();
  const currentYear = new Intl.DateTimeFormat("en-US", { timeZone: userTimezone, year: "numeric" }).format(now);
  const currentMonthNum = new Intl.DateTimeFormat("en-US", { timeZone: userTimezone, month: "2-digit" }).format(now);
  const currentMonthName = new Intl.DateTimeFormat("en-US", { timeZone: userTimezone, month: "long" }).format(now);
  const startOfMonth = `${currentYear}-${currentMonthNum}-01`;

  // 2. Fetch net worth, current month's transactions, and recent transactions in parallel
  const [netWorthResult, currentMonthTxResult, recentTxResult] = await Promise.all([
    supabase
      .from("net_worth_summary")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("transactions")
      .select("amount, type, category_id, categories(id, name, icon, color)")
      .eq("user_id", user.id)
      .gte("transaction_date", startOfMonth),
    supabase
      .from("transactions")
      .select(
        `
        id,
        user_id,
        account_id,
        category_id,
        type,
        amount,
        description,
        merchant,
        transaction_date,
        notes,
        source,
        created_at,
        updated_at,
        accounts!inner(id, name, account_type, institution, is_active),
        categories(id, name, type, icon, color)
      `
      )
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  if (netWorthResult.error) {
    throw new Error(
      `Database Configuration Error: Failed to query "net_worth_summary" view (${netWorthResult.error.message}). Please ensure migration 20261103100500_accounts_management.sql has been applied.`
    );
  }

  const nwRow = netWorthResult.data as NetWorthSummary | null;
  const totalNetBalance = nwRow?.net_worth ?? "0";

  // Calculate monthly income and expenses
  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  const categoryMap = new Map<string, { name: string; icon: string | null; color: string | null; total: number }>();

  for (const tx of currentMonthTxResult.data ?? []) {
    const amt = Number(tx.amount);
    if (tx.type === "income") {
      monthlyIncome += amt;
    } else if (tx.type === "expense") {
      monthlyExpenses += amt;

      const catId = tx.category_id || "uncategorized";
      const catData = tx.categories as { id: string; name: string; icon: string | null; color: string | null } | null;
      const catName = catData?.name || "Uncategorized";
      const catIcon = catData?.icon || null;
      const catColor = catData?.color || "#94A3B8";

      const current = categoryMap.get(catId) || { name: catName, icon: catIcon, color: catColor, total: 0 };
      current.total += amt;
      categoryMap.set(catId, current);
    }
  }

  const netCashFlow = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? Math.max(0, Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)) : 0;

  // Build top categories sorted by spend
  const categorySpending: CategorySpending[] = Array.from(categoryMap.entries())
    .map(([id, data]) => ({
      categoryId: id,
      categoryName: data.name,
      icon: data.icon,
      color: data.color,
      amount: data.total,
      percentage: monthlyExpenses > 0 ? Math.round((data.total / monthlyExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Format recent transactions
  const recentTransactions: TransactionItem[] = (
    (recentTxResult.data as unknown as RawJoinedTransaction[]) ?? []
  ).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    account_id: row.account_id,
    category_id: row.category_id,
    type: row.type as TransactionType,
    amount: row.amount,
    description: row.description,
    merchant: row.merchant,
    transaction_date: row.transaction_date,
    notes: row.notes,
    source: row.source as TransactionSource,
    created_at: row.created_at,
    updated_at: row.updated_at,
    account: {
      id: row.accounts?.id ?? row.account_id,
      name: row.accounts?.name ?? "Account",
      account_type: row.accounts?.account_type ?? "bank",
      institution: row.accounts?.institution ?? null,
      is_active: Boolean(row.accounts?.is_active),
    },
    category: row.categories
      ? {
          id: row.categories.id,
          name: row.categories.name,
          type: row.categories.type,
          icon: row.categories.icon,
          color: row.categories.color,
        }
      : null,
  }));

  return {
    totalNetBalance,
    monthlyIncome,
    monthlyExpenses,
    netCashFlow,
    savingsRate,
    recentTransactions,
    categorySpending,
    currentMonthName,
  };
}
