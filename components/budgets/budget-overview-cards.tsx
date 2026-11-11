"use client";

import {
  AlertTriangle,
  Flame,
  Gauge,
  PiggyBank,
  Receipt,
  Wallet,
} from "lucide-react";
import { formatPaiseToRupees } from "@/lib/finance/money";
import { BudgetProgressBar } from "@/components/budgets/budget-progress-bar";
import { BudgetStatusBadge } from "@/components/budgets/budget-status-badge";
import type { BudgetOverviewMetrics } from "@/lib/budgets/actions";
import { cn } from "@/lib/utils";

interface BudgetOverviewCardsProps {
  overview: BudgetOverviewMetrics;
}

export function BudgetOverviewCards({ overview }: BudgetOverviewCardsProps) {
  const isOverBudget = overview.remainingBudgetPaise < 0;
  const hasBudgets = overview.totalBudgetsCount > 0;

  return (
    <section aria-label="Monthly budget overview" className="space-y-4">
      {/* Contextual Overspending / Approaching Limit Banner */}
      {hasBudgets && overview.periodRelation !== "future" && (
        <>
          {overview.overBudgetCount > 0 ? (
            <div
              role="status"
              className="flex flex-col justify-between gap-3 rounded-2xl border border-rose-500/35 bg-rose-500/10 px-4 py-3.5 text-xs sm:flex-row sm:items-center"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/15 text-rose-500">
                  <Flame className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-rose-600 dark:text-rose-300">
                    Overspending Alert: {overview.overBudgetCount}{" "}
                    {overview.overBudgetCount === 1
                      ? "category has"
                      : "categories have"}{" "}
                    exceeded the {overview.monthLabel} budget limit
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    Review the highlighted categories below to inspect recent expense transactions.
                  </p>
                </div>
              </div>
              {overview.exceededBudgetPaise > 0 && (
                <span className="shrink-0 rounded-lg border border-rose-500/30 bg-background/70 px-2.5 py-1 font-mono text-xs font-semibold text-rose-500 tabular-nums">
                  Total Exceeded: +{formatPaiseToRupees(overview.exceededBudgetPaise)}
                </span>
              )}
            </div>
          ) : overview.approachingLimitCount > 0 ? (
            <div
              role="status"
              className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3.5 text-xs sm:flex-row sm:items-center"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-500">
                  <AlertTriangle className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-amber-600 dark:text-amber-300">
                    Approaching Limit: {overview.approachingLimitCount}{" "}
                    {overview.approachingLimitCount === 1
                      ? "category is"
                      : "categories are"}{" "}
                    at 80% or higher utilization
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    Monitor upcoming expenses in these categories to stay within your monthly target.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Primary 4 Financial Metric Cards + 2 Alert Count Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* 1. Total Monthly Budget */}
        <div className="glass-card relative overflow-hidden rounded-2xl p-4 sm:p-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Total Monthly Budget
            </span>
            <span className="flex size-8 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
              <Wallet className="size-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 font-mono text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl">
            {formatPaiseToRupees(overview.totalBudgetPaise)}
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Across {overview.totalBudgetsCount}{" "}
            {overview.totalBudgetsCount === 1 ? "category" : "categories"}
          </p>
        </div>

        {/* 2. Total Spent (Against Budgets) */}
        <div className="glass-card relative overflow-hidden rounded-2xl p-4 sm:p-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-secondary/40 to-transparent"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Total Spent
            </span>
            <span className="flex size-8 items-center justify-center rounded-xl border border-brand-secondary/25 bg-brand-secondary/10 text-brand-secondary">
              <Receipt className="size-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 font-mono text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl">
            {formatPaiseToRupees(overview.totalSpentPaise)}
          </p>
          <p className="mt-2 truncate text-[11px] text-muted-foreground">
            {overview.unbudgetedSpentPaise > 0
              ? `+${formatPaiseToRupees(overview.unbudgetedSpentPaise)} unbudgeted`
              : overview.periodRelation === "future"
                ? "Planned period (₹0 spent)"
                : "Tracked budgeted expenses"}
          </p>
        </div>

        {/* 3. Remaining Budget */}
        <div className="glass-card relative overflow-hidden rounded-2xl p-4 sm:p-5">
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
              isOverBudget ? "via-rose-500/45" : "via-emerald-500/40"
            )}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {isOverBudget ? "Exceeded By" : "Remaining Budget"}
            </span>
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-xl border",
                isOverBudget
                  ? "border-rose-500/30 bg-rose-500/12 text-rose-500"
                  : "border-emerald-500/25 bg-emerald-500/10 text-emerald-500"
              )}
            >
              <PiggyBank className="size-4" aria-hidden="true" />
            </span>
          </div>
          <p
            className={cn(
              "mt-3 font-mono text-xl font-bold tracking-tight tabular-nums sm:text-2xl",
              isOverBudget
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {formatPaiseToRupees(overview.remainingBudgetPaise)}
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {!hasBudgets
              ? "No budgets configured"
              : isOverBudget
                ? "Over total monthly allocation"
                : "Available before limit"}
          </p>
        </div>

        {/* 4. Overall Utilization Percentage */}
        <div className="glass-card relative overflow-hidden rounded-2xl p-4 sm:p-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Utilization
            </span>
            <span className="flex size-8 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
              <Gauge className="size-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <p className="font-mono text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl">
              {overview.overallUtilizationPercentage.toFixed(1)}%
            </p>
            {hasBudgets && (
              <BudgetStatusBadge status={overview.overallStatus} size="sm" />
            )}
          </div>
          <div className="mt-2.5">
            <BudgetProgressBar
              percentage={overview.overallUtilizationPercentage}
              progressBarPercent={overview.overallProgressBarPercent}
              status={overview.overallStatus}
              size="sm"
              ariaLabel="Overall monthly budget utilization"
            />
          </div>
        </div>

        {/* 5. Categories Over Budget */}
        <div className="glass-card relative overflow-hidden rounded-2xl p-4 sm:p-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Over Budget
            </span>
            <span className="flex size-8 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/12 text-rose-500">
              <Flame className="size-4" aria-hidden="true" />
            </span>
          </div>
          <p
            className={cn(
              "mt-3 font-mono text-xl font-bold tracking-tight tabular-nums sm:text-2xl",
              overview.overBudgetCount > 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-foreground"
            )}
          >
            {overview.overBudgetCount}
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {overview.overBudgetCount === 1
              ? "Category ≥ 100% limit"
              : "Categories ≥ 100% limit"}
          </p>
        </div>

        {/* 6. Categories Approaching Limit */}
        <div className="glass-card relative overflow-hidden rounded-2xl p-4 sm:p-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Approaching Limit
            </span>
            <span className="flex size-8 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/12 text-amber-500">
              <AlertTriangle className="size-4" aria-hidden="true" />
            </span>
          </div>
          <p
            className={cn(
              "mt-3 font-mono text-xl font-bold tracking-tight tabular-nums sm:text-2xl",
              overview.approachingLimitCount > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-foreground"
            )}
          >
            {overview.approachingLimitCount}
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            80%–99.9% utilization
          </p>
        </div>
      </div>
    </section>
  );
}

