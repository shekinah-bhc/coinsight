"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Flame,
  History,
  Sparkles,
} from "lucide-react";
import { CategoryIcon } from "@/components/categories/category-icon";
import { BudgetStatusBadge } from "@/components/budgets/budget-status-badge";
import { formatPaiseToRupees } from "@/lib/finance/money";
import type { BudgetAnalyticsData } from "@/lib/budgets/actions";
import { cn } from "@/lib/utils";

interface BudgetHistoryChartProps {
  analytics: BudgetAnalyticsData;
  currentMonthLabel: string;
  onSelectMonth: (monthKey: string) => void;
}

export function BudgetHistoryChart({
  analytics,
  currentMonthLabel,
  onSelectMonth,
}: BudgetHistoryChartProps) {
  const maxTrendPaise = Math.max(
    1,
    ...analytics.monthlyTrend.map((pt) =>
      Math.max(pt.totalBudgetPaise, pt.totalBudgetedSpentPaise)
    )
  );

  const hasAnyTrendData = analytics.monthlyTrend.some(
    (pt) => pt.totalBudgetPaise > 0 || pt.totalBudgetedSpentPaise > 0
  );

  return (
    <section aria-label="Budget history and analytics" className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 1. 6-Month Budget vs Actual Spending Trend (2 columns) */}
        <div className="glass-card relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 sm:p-6 lg:col-span-2">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          />

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                    <BarChart3 className="size-3.5" aria-hidden="true" />
                  </span>
                  <h2 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
                    6-Month Budget Utilization Trend
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Allocated monthly budgets versus actual category spending. Click any month to inspect it.
                </p>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-primary/45 border border-primary/60" />
                  <span>Allocated</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-emerald-500" />
                  <span>On Track</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-rose-500" />
                  <span>Over Limit</span>
                </span>
              </div>
            </div>

            {!hasAnyTrendData ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-12 text-center">
                <History className="size-6 text-muted-foreground/50" />
                <p className="mt-2 text-xs font-medium text-foreground">
                  No 6-month budget history yet
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Create monthly category budgets to compare allocation vs spending over time.
                </p>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {/* Bar Chart Columns */}
                <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-44 pt-4 px-1">
                  {analytics.monthlyTrend.map((pt) => {
                    const isSelected = pt.monthKey === analytics.selectedMonthKey;
                    const allocHeightPct =
                      pt.totalBudgetPaise > 0
                        ? Math.max(
                            6,
                            Math.round((pt.totalBudgetPaise / maxTrendPaise) * 100)
                          )
                        : 0;
                    const spentHeightPct =
                      pt.totalBudgetedSpentPaise > 0
                        ? Math.max(
                            6,
                            Math.round(
                              (pt.totalBudgetedSpentPaise / maxTrendPaise) * 100
                            )
                          )
                        : 0;

                    const spentBarColor =
                      pt.status === "over_budget"
                        ? "bg-rose-500"
                        : pt.status === "approaching_limit"
                          ? "bg-amber-500"
                          : "bg-emerald-500";

                    return (
                      <button
                        key={pt.monthKey}
                        type="button"
                        onClick={() => onSelectMonth(pt.monthKey)}
                        className={cn(
                          "group flex h-full flex-col items-center justify-end rounded-xl border p-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                          isSelected
                            ? "border-primary/45 bg-primary/10"
                            : "border-transparent hover:border-border/70 hover:bg-background/40"
                        )}
                        title={`${pt.label}: Budget ${formatPaiseToRupees(
                          pt.totalBudgetPaise
                        )} | Spent ${formatPaiseToRupees(
                          pt.totalBudgetedSpentPaise
                        )} (${pt.utilizationPercentage.toFixed(1)}%)`}
                      >
                        <div className="flex h-28 w-full items-end justify-center gap-1.5">
                          {/* Allocated Bar */}
                          <div
                            className="w-3 sm:w-4 rounded-t-md bg-primary/35 border border-primary/50 transition-all duration-300"
                            style={{ height: `${allocHeightPct}%` }}
                          />
                          {/* Spent Bar */}
                          <div
                            className={cn(
                              "w-3 sm:w-4 rounded-t-md transition-all duration-300",
                              spentBarColor
                            )}
                            style={{ height: `${spentHeightPct}%` }}
                          />
                        </div>

                        <span
                          className={cn(
                            "mt-2 text-[11px] font-medium truncate w-full",
                            isSelected
                              ? "text-primary font-semibold"
                              : "text-muted-foreground group-hover:text-foreground"
                          )}
                        >
                          {pt.shortLabel}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                          {pt.totalBudgetPaise > 0
                            ? `${pt.utilizationPercentage.toFixed(0)}%`
                            : "—"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Previous Month vs Current Month Summary Strip */}
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/60 bg-background/45 p-3.5 sm:grid-cols-3 text-xs">
                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      {analytics.previousMonthLabel} Budget
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-foreground tabular-nums">
                      {formatPaiseToRupees(analytics.previousMonthTotalBudgetPaise)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      {analytics.previousMonthLabel} Actual Spend
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-foreground tabular-nums">
                      {formatPaiseToRupees(analytics.previousMonthTotalSpentPaise)}{" "}
                      <span className="text-[11px] text-muted-foreground">
                        ({analytics.previousMonthUtilizationPercentage.toFixed(1)}%)
                      </span>
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      Month-over-Month Spend Change
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 inline-flex items-center gap-1 font-mono text-sm font-semibold tabular-nums",
                        analytics.monthOverMonthSpentDeltaPaise > 0
                          ? "text-rose-500"
                          : analytics.monthOverMonthSpentDeltaPaise < 0
                            ? "text-emerald-500"
                            : "text-muted-foreground"
                      )}
                    >
                      {analytics.monthOverMonthSpentDeltaPaise > 0 ? (
                        <ArrowUpRight className="size-3.5" />
                      ) : analytics.monthOverMonthSpentDeltaPaise < 0 ? (
                        <ArrowDownRight className="size-3.5" />
                      ) : null}
                      <span>
                        {analytics.monthOverMonthSpentDeltaPaise > 0 ? "+" : ""}
                        {formatPaiseToRupees(analytics.monthOverMonthSpentDeltaPaise)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Insights Column: Consistently Over Budget & Unused Allocations (1 column) */}
        <div className="glass-card relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 sm:p-6 space-y-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-secondary/40 to-transparent"
          />

          {/* Top Section: Categories Exceeding Limits */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-500">
                <Flame className="size-3.5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  Categories Exceeding Limits
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  6-month overspending frequency
                </p>
              </div>
            </div>

            {analytics.consistentlyOverBudget.length === 0 ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>No categories have exceeded their monthly budgets in the last 6 months.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {analytics.consistentlyOverBudget.slice(0, 4).map((item) => (
                  <div
                    key={item.categoryId}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/45 px-3 py-2 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-md text-white"
                        style={{ backgroundColor: item.categoryColor || "#6366F1" }}
                      >
                        <CategoryIcon
                          iconName={item.categoryIcon}
                          className="size-3"
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {item.categoryName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Exceeded in {item.monthsExceededCount} of{" "}
                          {item.monthsBudgetedCount}{" "}
                          {item.monthsBudgetedCount === 1 ? "month" : "months"}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 font-mono text-xs font-semibold text-rose-500 tabular-nums">
                      +{formatPaiseToRupees(item.totalExceededPaise)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Section: Unused / Low-Utilization Allocations */}
          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg border border-brand-secondary/25 bg-brand-secondary/10 text-brand-secondary">
                <Sparkles className="size-3.5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  Unused & Low-Utilization Budgets
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Under 15% spent in {currentMonthLabel}
                </p>
              </div>
            </div>

            {analytics.unusedAllocations.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 p-3 text-center text-[11px] text-muted-foreground">
                All active budgets in {currentMonthLabel} have at least 15% utilization.
              </p>
            ) : (
              <div className="space-y-2">
                {analytics.unusedAllocations.slice(0, 4).map((item) => (
                  <div
                    key={item.budgetId}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/45 px-3 py-2 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-md text-white"
                        style={{ backgroundColor: item.categoryColor || "#6366F1" }}
                      >
                        <CategoryIcon
                          iconName={item.categoryIcon}
                          className="size-3"
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {item.categoryName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.utilizationPercentage.toFixed(1)}% used
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 font-mono text-xs font-medium text-emerald-500 tabular-nums">
                      {formatPaiseToRupees(item.unusedPaise)} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Category-wise Month-over-Month Comparison Table */}
      {analytics.categoryComparisons.length > 0 && (
        <div className="glass-card relative overflow-hidden rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-2 border-b border-border/60 pb-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Category Spending Comparison ({currentMonthLabel} vs{" "}
                {analytics.previousMonthLabel})
              </h3>
              <p className="text-xs text-muted-foreground">
                Compare each budgeted category&apos;s current spending against last month&apos;s actual expenses.
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-[11px] font-medium text-muted-foreground uppercase">
                  <th className="pb-2.5 pr-4">Category</th>
                  <th className="pb-2.5 px-3 text-right">
                    {currentMonthLabel} Budget
                  </th>
                  <th className="pb-2.5 px-3 text-right">
                    {currentMonthLabel} Spent
                  </th>
                  <th className="pb-2.5 px-3 text-right">
                    {analytics.previousMonthLabel} Spent
                  </th>
                  <th className="pb-2.5 px-3 text-right">Change</th>
                  <th className="pb-2.5 pl-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/45">
                {analytics.categoryComparisons.map((row) => (
                  <tr key={row.categoryId} className="hover:bg-muted/20">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex size-6 shrink-0 items-center justify-center rounded-md text-white"
                          style={{ backgroundColor: row.categoryColor || "#6366F1" }}
                        >
                          <CategoryIcon
                            iconName={row.categoryIcon}
                            className="size-3.5"
                          />
                        </span>
                        <span className="font-medium text-foreground">
                          {row.categoryName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-foreground tabular-nums">
                      {formatPaiseToRupees(row.currentAllocatedPaise)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-foreground tabular-nums">
                      {formatPaiseToRupees(row.currentSpentPaise)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-muted-foreground tabular-nums">
                      {formatPaiseToRupees(row.previousSpentPaise)}
                    </td>
                    <td
                      className={cn(
                        "py-3 px-3 text-right font-mono font-medium tabular-nums",
                        row.spentDeltaPaise > 0
                          ? "text-rose-500"
                          : row.spentDeltaPaise < 0
                            ? "text-emerald-500"
                            : "text-muted-foreground"
                      )}
                    >
                      {row.spentDeltaPaise > 0 ? "+" : ""}
                      {formatPaiseToRupees(row.spentDeltaPaise)}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <BudgetStatusBadge status={row.currentStatus} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

