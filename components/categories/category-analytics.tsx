"use client";

import { ArrowDownLeft, ArrowUpRight, PieChart } from "lucide-react";
import { formatPaiseToRupees } from "@/lib/finance/money";
import { CategoryIcon } from "@/components/categories/category-icon";
import type { CategoryAnalyticsSummary } from "@/lib/categories/actions";
import type { CategoryTabValue } from "@/components/categories/categories-tabs";

interface CategoryAnalyticsProps {
  analytics: CategoryAnalyticsSummary;
  activeTab: CategoryTabValue;
  onSelectCategoryId?: (categoryId: string) => void;
}

export function CategoryAnalytics({
  analytics,
  activeTab,
  onSelectCategoryId,
}: CategoryAnalyticsProps) {
  const isIncomeView = activeTab === "income";
  const breakdown = isIncomeView
    ? analytics.incomeBreakdown
    : analytics.expenseBreakdown;

  const totalPaise = isIncomeView
    ? analytics.totalIncomePaise
    : analytics.totalExpensePaise;

  const totalTxCount = isIncomeView
    ? analytics.totalIncomeTransactions
    : analytics.totalExpenseTransactions;

  return (
    <section
      aria-label="Category distribution analytics"
      className="glass-card relative overflow-hidden rounded-2xl p-5 sm:p-6"
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${
          isIncomeView ? "via-emerald-500/40" : "via-primary/40"
        } to-transparent`}
      />

      {/* Analytics Header */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
              <PieChart className="size-3.5" aria-hidden="true" />
            </span>
            <h2 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {isIncomeView ? "Income Distribution" : "Spending Distribution"}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {analytics.periodLabel} • Timezone: {analytics.timezone} • Transfers excluded
          </p>
        </div>

        {/* Period Totals Pill */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface-secondary/60 px-4 py-2.5 text-xs dark:bg-white/[0.02]">
          <div>
            <p className="text-[11px] text-muted-foreground">
              Period {isIncomeView ? "Income" : "Spending"}
            </p>
            <p
              className={`font-mono text-sm font-bold tabular-nums ${
                isIncomeView
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatPaiseToRupees(totalPaise)}
            </p>
          </div>
          <div className="h-6 w-px bg-border" aria-hidden="true" />
          <div>
            <p className="text-[11px] text-muted-foreground">Transactions</p>
            <p className="font-mono text-sm font-semibold text-foreground tabular-nums">
              {totalTxCount}
            </p>
          </div>
        </div>
      </div>

      {/* Distribution Bars */}
      {breakdown.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {breakdown.slice(0, 8).map((item) => {
            const isClickable =
              item.categoryId !== "uncategorized" && Boolean(onSelectCategoryId);

            return (
              <div
                key={item.categoryId}
                onClick={() => {
                  if (isClickable) {
                    onSelectCategoryId?.(item.categoryId);
                  }
                }}
                role={isClickable ? "button" : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelectCategoryId?.(item.categoryId);
                  }
                }}
                className={`rounded-xl border border-border/60 bg-background/40 p-3.5 transition-colors ${
                  isClickable ? "cursor-pointer hover:border-primary/40 hover:bg-background/70" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-white shadow-2xs"
                      style={{ backgroundColor: item.color || "#6366F1" }}
                    >
                      <CategoryIcon iconName={item.icon} className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground truncate">
                          {item.name}
                        </span>
                        {!item.isActive && (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-medium text-amber-600 dark:text-amber-400">
                            Archived
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {item.transactionCount}{" "}
                        {item.transactionCount === 1 ? "entry" : "entries"} • Avg{" "}
                        <span className="font-mono">{formatPaiseToRupees(item.averagePaise)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-mono text-xs font-bold text-foreground tabular-nums">
                      {formatPaiseToRupees(item.amountPaise)}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
                      {item.percentage}%
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(2, item.percentage))}%`,
                      backgroundColor: item.color || "#6366F1",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-border/70 p-8 text-center text-xs text-muted-foreground">
          {isIncomeView ? (
            <ArrowUpRight className="mx-auto mb-2 size-6 text-emerald-500/50" />
          ) : (
            <ArrowDownLeft className="mx-auto mb-2 size-6 text-rose-500/50" />
          )}
          <p className="font-medium text-foreground">
            No {isIncomeView ? "income" : "expense"} activity recorded in {analytics.periodLabel}
          </p>
          <p className="mt-1 text-[11px]">
            Record transactions or select a wider date range above to inspect category distribution.
          </p>
        </div>
      )}
    </section>
  );
}

