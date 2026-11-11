"use client";

import { PieChart, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/categories/category-icon";
import { formatPaiseToRupees } from "@/lib/finance/money";
import type { UnbudgetedCategorySpendItem } from "@/lib/budgets/actions";

interface BudgetEmptyStateProps {
  monthLabel: string;
  unbudgetedCategories: UnbudgetedCategorySpendItem[];
  onCreateBudget: (preselectedCategoryId?: string) => void;
}

export function BudgetEmptyState({
  monthLabel,
  unbudgetedCategories,
  onCreateBudget,
}: BudgetEmptyStateProps) {
  return (
    <div className="glass-card relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/75 px-6 py-14 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />

      <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-sm">
        <PieChart className="size-6" aria-hidden="true" />
      </div>

      <h2 className="mt-4 font-heading text-lg font-semibold text-foreground sm:text-xl">
        No budgets configured for {monthLabel}
      </h2>
      <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
        Set monthly spending limits for your expense categories to monitor utilization, catch overspending early, and compare month-over-month progress.
      </p>

      <Button
        type="button"
        onClick={() => onCreateBudget()}
        className="mt-5 gap-1.5"
      >
        <Plus className="size-4" />
        Create Monthly Budget
      </Button>

      {unbudgetedCategories.length > 0 && (
        <div className="mt-8 w-full max-w-2xl border-t border-border/60 pt-6">
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            <span>
              Active spending detected in {monthLabel} — click a category to set its budget:
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {unbudgetedCategories
              .filter((c) => c.isActive)
              .slice(0, 6)
              .map((cat) => (
                <button
                  key={cat.categoryId}
                  type="button"
                  onClick={() => onCreateBudget(cat.categoryId)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <span
                    className="flex size-5 items-center justify-center rounded-md text-white"
                    style={{ backgroundColor: cat.categoryColor || "#6366F1" }}
                  >
                    <CategoryIcon
                      iconName={cat.categoryIcon}
                      className="size-3"
                    />
                  </span>
                  <span className="font-medium text-foreground">
                    {cat.categoryName}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    ({formatPaiseToRupees(cat.spentPaise)} spent)
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

