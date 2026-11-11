import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Flame,
  PieChart,
  Plus,
} from "lucide-react";
import { CategoryIcon } from "@/components/categories/category-icon";
import { BudgetProgressBar } from "@/components/budgets/budget-progress-bar";
import { BudgetStatusBadge } from "@/components/budgets/budget-status-badge";
import { formatPaiseToRupees } from "@/lib/finance/money";
import type {
  BudgetOverviewMetrics,
  BudgetWithSpending,
} from "@/lib/budgets/actions";
import { cn } from "@/lib/utils";

interface BudgetSummaryWidgetProps {
  overview: BudgetOverviewMetrics;
  topBudgets: BudgetWithSpending[];
}

export function BudgetSummaryWidget({
  overview,
  topBudgets,
}: BudgetSummaryWidgetProps) {
  const hasBudgets = overview.totalBudgetsCount > 0;
  const isOverBudget = overview.remainingBudgetPaise < 0;

  return (
    <section
      id="budgets"
      aria-label="Monthly budget overview"
      className="glass-card relative overflow-hidden rounded-2xl p-5 sm:p-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />

      {/* Section Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
            <PieChart className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {overview.monthLabel} Budgets
            </h2>
            <p className="text-xs text-muted-foreground">
              Monthly category spending limits and live utilization tracking.
            </p>
          </div>
        </div>

        <Link
          href="/budgets"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          <span>{hasBudgets ? "Manage Budgets" : "Set Up Budgets"}</span>
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      {!hasBudgets ? (
        <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-xl border border-dashed border-border/70 bg-background/35 p-6 text-center sm:flex-row sm:text-left">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              No monthly budgets set for {overview.monthLabel}
            </p>
            <p className="text-xs text-muted-foreground">
              Create category spending limits to track monthly utilization and get alerted before overspending.
            </p>
          </div>
          <Link
            href="/budgets"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-3.5" />
            <span>Create Budget</span>
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Summary Totals & Status Alerts */}
          <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-background/45 p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Overall Utilization
                </span>
                <BudgetStatusBadge status={overview.overallStatus} size="sm" />
              </div>

              <div className="flex items-baseline justify-between">
                <p className="font-mono text-2xl font-bold tracking-tight text-foreground tabular-nums">
                  {overview.overallUtilizationPercentage.toFixed(1)}%
                </p>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {formatPaiseToRupees(overview.totalSpentPaise)} /{" "}
                  {formatPaiseToRupees(overview.totalBudgetPaise)}
                </span>
              </div>

              <BudgetProgressBar
                percentage={overview.overallUtilizationPercentage}
                progressBarPercent={overview.overallProgressBarPercent}
                status={overview.overallStatus}
                size="md"
                ariaLabel="Dashboard overall monthly budget utilization"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-3 text-xs">
              <div>
                <p className="text-[11px] text-muted-foreground">Total Budget</p>
                <p className="mt-0.5 font-mono font-semibold text-foreground tabular-nums">
                  {formatPaiseToRupees(overview.totalBudgetPaise)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Total Spent</p>
                <p className="mt-0.5 font-mono font-semibold text-foreground tabular-nums">
                  {formatPaiseToRupees(overview.totalSpentPaise)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground">
                  {isOverBudget ? "Exceeded" : "Remaining"}
                </p>
                <p
                  className={cn(
                    "mt-0.5 font-mono font-semibold tabular-nums",
                    isOverBudget
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {formatPaiseToRupees(overview.remainingBudgetPaise)}
                </p>
              </div>
            </div>

            {/* Alert Counts Pill */}
            <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-3 text-[11px]">
              {overview.overBudgetCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-medium text-rose-500">
                  <Flame className="size-3" />
                  {overview.overBudgetCount} Over Budget
                </span>
              )}
              {overview.approachingLimitCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-500">
                  <AlertTriangle className="size-3" />
                  {overview.approachingLimitCount} Approaching Limit
                </span>
              )}
              {overview.overBudgetCount === 0 &&
                overview.approachingLimitCount === 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-500">
                    <CheckCircle2 className="size-3" />
                    All {overview.totalBudgetsCount} categories on track
                  </span>
                )}
            </div>
          </div>

          {/* Right 2 Columns: Highest-Utilization Categories */}
          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                Highest-Utilization Categories
              </span>
              <span className="text-muted-foreground">
                Showing top {topBudgets.length} of {overview.totalBudgetsCount}
              </span>
            </div>

            <div className="space-y-3">
              {topBudgets.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-border/60 bg-background/40 px-3.5 py-2.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="flex size-5 shrink-0 items-center justify-center rounded-md text-white"
                        style={{ backgroundColor: b.categoryColor || "#6366F1" }}
                      >
                        <CategoryIcon
                          iconName={b.categoryIcon}
                          className="size-3"
                        />
                      </span>
                      <span className="truncate font-medium text-foreground">
                        {b.categoryName}
                      </span>
                      <BudgetStatusBadge status={b.status} size="sm" />
                    </div>

                    <div className="shrink-0 font-mono text-xs tabular-nums">
                      <span className="font-semibold text-foreground">
                        {formatPaiseToRupees(b.spentPaise)}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        / {formatPaiseToRupees(b.allocatedPaise)} (
                        {b.utilizationPercentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>

                  <BudgetProgressBar
                    percentage={b.utilizationPercentage}
                    progressBarPercent={b.progressBarPercent}
                    status={b.status}
                    size="sm"
                    ariaLabel={`${b.categoryName} budget utilization`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

