"use client";

import * as React from "react";
import {
  AlertCircle,
  Plus,
  Search,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryIcon } from "@/components/categories/category-icon";
import { BudgetCategoryCard } from "@/components/budgets/budget-category-card";
import { formatPaiseToRupees } from "@/lib/finance/money";
import type {
  BudgetWithSpending,
  UnbudgetedCategorySpendItem,
} from "@/lib/budgets/actions";
import type {
  BudgetSortOption,
  BudgetStatusFilter,
} from "@/lib/validations/budgets";

interface BudgetCategoryListProps {
  budgets: BudgetWithSpending[];
  unbudgetedCategories: UnbudgetedCategorySpendItem[];
  periodRelation: "past" | "current" | "future";
  counts: {
    all: number;
    over_budget: number;
    approaching_limit: number;
    on_track: number;
  };
  onEditBudget: (budget: BudgetWithSpending) => void;
  onDeleteBudget: (budget: BudgetWithSpending) => void;
  onQuickCreateForCategory: (categoryId: string) => void;
}

const SORT_LABELS: Record<BudgetSortOption, string> = {
  utilization_desc: "Utilization: Highest First",
  spent_desc: "Spent: Highest First",
  allocated_desc: "Budget: Highest First",
  name_asc: "Category: A to Z",
};

export function BudgetCategoryList({
  budgets,
  unbudgetedCategories,
  periodRelation,
  counts,
  onEditBudget,
  onDeleteBudget,
  onQuickCreateForCategory,
}: BudgetCategoryListProps) {
  const [statusFilter, setStatusFilter] =
    React.useState<BudgetStatusFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] =
    React.useState<BudgetSortOption>("utilization_desc");

  const filteredBudgets = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = budgets.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) {
        return false;
      }
      if (q.length > 0 && !b.categoryName.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "utilization_desc") {
        if (b.utilizationPercentage !== a.utilizationPercentage) {
          return b.utilizationPercentage - a.utilizationPercentage;
        }
        return b.spentPaise - a.spentPaise;
      }
      if (sortBy === "spent_desc") {
        if (b.spentPaise !== a.spentPaise) {
          return b.spentPaise - a.spentPaise;
        }
        return b.allocatedPaise - a.allocatedPaise;
      }
      if (sortBy === "allocated_desc") {
        if (b.allocatedPaise !== a.allocatedPaise) {
          return b.allocatedPaise - a.allocatedPaise;
        }
        return b.spentPaise - a.spentPaise;
      }
      return a.categoryName.localeCompare(b.categoryName);
    });
  }, [budgets, statusFilter, searchQuery, sortBy]);

  return (
    <section aria-label="Budgeted categories" className="space-y-5">
      {/* Filter & Sort Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as BudgetStatusFilter)}
          className="w-full lg:w-auto"
        >
          <TabsList className="h-10 w-full justify-start overflow-x-auto p-1 sm:w-auto">
            <TabsTrigger value="all" className="gap-1.5 px-3 text-xs">
              <span>All</span>
              <span className="rounded-full bg-background/60 px-1.5 py-0.2 font-mono text-[10px]">
                {counts.all}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="over_budget"
              className="gap-1.5 px-3 text-xs data-[state=active]:bg-rose-500/15 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400"
            >
              <span>Over Budget</span>
              <span className="rounded-full bg-background/60 px-1.5 py-0.2 font-mono text-[10px]">
                {counts.over_budget}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="approaching_limit"
              className="gap-1.5 px-3 text-xs data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400"
            >
              <span>Approaching</span>
              <span className="rounded-full bg-background/60 px-1.5 py-0.2 font-mono text-[10px]">
                {counts.approaching_limit}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="on_track"
              className="gap-1.5 px-3 text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400"
            >
              <span>On Track</span>
              <span className="rounded-full bg-background/60 px-1.5 py-0.2 font-mono text-[10px]">
                {counts.on_track}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:w-64">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search budgeted categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal
              className="size-3.5 text-muted-foreground shrink-0"
              aria-hidden="true"
            />
            <Select
              value={sortBy}
              onValueChange={(val) =>
                setSortBy((val as BudgetSortOption) ?? "utilization_desc")
              }
            >
              <SelectTrigger className="h-9 min-w-[185px] text-xs">
                <SelectValue placeholder="Sort budgets">
                  {SORT_LABELS[sortBy]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utilization_desc">
                  Utilization: Highest First
                </SelectItem>
                <SelectItem value="spent_desc">Spent: Highest First</SelectItem>
                <SelectItem value="allocated_desc">
                  Budget: Highest First
                </SelectItem>
                <SelectItem value="name_asc">Category: A to Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Budget Cards Grid */}
      {filteredBudgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/30 px-6 py-12 text-center">
          <div className="flex size-11 items-center justify-center rounded-full border border-border/60 bg-background/60 text-muted-foreground">
            <SearchX className="size-5" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-foreground">
            No matching budgets found
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            No budgets matched your current status or search filter.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setSearchQuery("");
            }}
            className="mt-3"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredBudgets.map((budget) => (
            <BudgetCategoryCard
              key={budget.id}
              budget={budget}
              periodRelation={periodRelation}
              onEdit={onEditBudget}
              onDelete={onDeleteBudget}
            />
          ))}
        </div>
      )}

      {/* Unbudgeted Spending Callout (if user spent in categories that don't have a budget this month) */}
      {unbudgetedCategories.length > 0 && (
        <div className="rounded-2xl border border-border/70 bg-card/45 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <div>
                <h3 className="text-xs font-semibold text-foreground sm:text-sm">
                  Unbudgeted Category Spending ({unbudgetedCategories.length})
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  These expense categories have recorded spending this month without a monthly budget limit.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {unbudgetedCategories.map((item) => (
              <div
                key={item.categoryId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 text-xs"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: item.categoryColor || "#6366F1" }}
                  >
                    <CategoryIcon
                      iconName={item.categoryIcon}
                      className="size-3.5"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {item.categoryName}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {formatPaiseToRupees(item.spentPaise)} ({item.transactionCount}{" "}
                      {item.transactionCount === 1 ? "txn" : "txns"})
                    </p>
                  </div>
                </div>

                {item.isActive && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onQuickCreateForCategory(item.categoryId)}
                    className="h-7 shrink-0 gap-1 px-2.5 text-[11px]"
                  >
                    <Plus className="size-3" />
                    Set Limit
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

