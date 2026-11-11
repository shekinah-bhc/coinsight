"use client";

import Link from "next/link";
import {
  Archive,
  ExternalLink,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/categories/category-icon";
import { BudgetProgressBar } from "@/components/budgets/budget-progress-bar";
import { BudgetStatusBadge } from "@/components/budgets/budget-status-badge";
import { formatPaiseToRupees } from "@/lib/finance/money";
import type { BudgetWithSpending } from "@/lib/budgets/actions";
import { cn } from "@/lib/utils";

interface BudgetCategoryCardProps {
  budget: BudgetWithSpending;
  periodRelation: "past" | "current" | "future";
  onEdit: (budget: BudgetWithSpending) => void;
  onDelete: (budget: BudgetWithSpending) => void;
}

export function BudgetCategoryCard({
  budget,
  periodRelation,
  onEdit,
  onDelete,
}: BudgetCategoryCardProps) {
  const colorHex = budget.categoryColor || "#6366F1";
  const isOverBudget = budget.status === "over_budget";
  const isApproaching = budget.status === "approaching_limit";
  const spendDelta = budget.spentPaise - budget.previousMonthSpentPaise;

  return (
    <div
      className={cn(
        "glass-card group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:border-primary/35",
        isOverBudget && "border-rose-500/35",
        isApproaching && "border-amber-500/30"
      )}
    >
      {/* Top Color Accent Bar */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-80"
        style={{
          backgroundColor: isOverBudget
            ? "#F43F5E"
            : isApproaching
              ? "#F59E0B"
              : colorHex,
        }}
      />

      <div className="space-y-4">
        {/* Header: Category Icon, Name, Badges & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ backgroundColor: colorHex }}
            >
              <CategoryIcon iconName={budget.categoryIcon} className="size-5" />
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="truncate font-heading text-sm font-semibold text-foreground sm:text-base">
                  {budget.categoryName}
                </h3>
                {!budget.categoryIsActive && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-500">
                    <Archive className="size-2.5" />
                    Archived
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {periodRelation === "future"
                  ? "Planned monthly allocation"
                  : budget.transactionCount === 0
                    ? "No expenses recorded this month"
                    : `${budget.transactionCount} ${
                        budget.transactionCount === 1
                          ? "expense transaction"
                          : "expense transactions"
                      }`}
              </p>
            </div>
          </div>

          <BudgetStatusBadge status={budget.status} size="sm" />
        </div>

        {/* Allocated vs Spent vs Remaining Metrics */}
        <div className="rounded-xl border border-border/60 bg-background/45 p-3.5 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[11px] text-muted-foreground">Allocated</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-foreground tabular-nums">
                {formatPaiseToRupees(budget.allocatedPaise)}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-muted-foreground">Spent</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-foreground tabular-nums">
                {formatPaiseToRupees(budget.spentPaise)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">
                {budget.remainingPaise < 0 ? "Exceeded By" : "Remaining"}
              </p>
              <p
                className={cn(
                  "mt-0.5 font-mono text-sm font-bold tabular-nums",
                  budget.remainingPaise < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : isApproaching
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {budget.remainingPaise < 0
                  ? formatPaiseToRupees(budget.remainingPaise)
                  : formatPaiseToRupees(budget.remainingPaise)}
              </p>
            </div>
          </div>

          {/* Utilization Bar & Percentage */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Utilization</span>
              <span
                className={cn(
                  "font-mono font-semibold tabular-nums",
                  isOverBudget
                    ? "text-rose-600 dark:text-rose-400"
                    : isApproaching
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-foreground"
                )}
              >
                {budget.utilizationPercentage.toFixed(1)}%
              </span>
            </div>

            <BudgetProgressBar
              percentage={budget.utilizationPercentage}
              progressBarPercent={budget.progressBarPercent}
              status={budget.status}
              size="md"
              ariaLabel={`${budget.categoryName} budget utilization`}
            />
          </div>

          {/* Contextual Alert or Previous Month Comparison */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2.5 text-[11px]">
            {isOverBudget ? (
              <span className="font-medium text-rose-600 dark:text-rose-400">
                Over budget by {formatPaiseToRupees(budget.exceededPaise)}
              </span>
            ) : isApproaching ? (
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {formatPaiseToRupees(budget.remainingPaise)} left before limit
              </span>
            ) : (
              <span className="text-muted-foreground">
                Within 80% warning threshold
              </span>
            )}

            {periodRelation !== "future" && budget.previousMonthSpentPaise > 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-mono text-[10px]",
                  spendDelta > 0
                    ? "text-rose-500"
                    : spendDelta < 0
                      ? "text-emerald-500"
                      : "text-muted-foreground"
                )}
                title={`Previous month spend: ${formatPaiseToRupees(
                  budget.previousMonthSpentPaise
                )}`}
              >
                {spendDelta > 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                <span>
                  {spendDelta > 0 ? "+" : ""}
                  {formatPaiseToRupees(spendDelta)} vs last mo
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
        <Link
          href={`/transactions?categoryId=${budget.categoryId}&type=expense&startDate=${budget.periodStart}&endDate=${budget.periodEnd}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <span>View Transactions</span>
          <ExternalLink className="size-3" aria-hidden="true" />
        </Link>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(budget)}
            aria-label={`Edit ${budget.categoryName} budget`}
            title="Edit budget amount"
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(budget)}
            aria-label={`Delete ${budget.categoryName} budget`}
            title="Delete budget"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

