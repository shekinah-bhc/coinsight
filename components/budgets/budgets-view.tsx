"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BudgetMonthSelector } from "@/components/budgets/budget-month-selector";
import { BudgetOverviewCards } from "@/components/budgets/budget-overview-cards";
import { BudgetCategoryList } from "@/components/budgets/budget-category-list";
import { BudgetEmptyState } from "@/components/budgets/budget-empty-state";
import { BudgetHistoryChart } from "@/components/budgets/budget-history-chart";
import { BudgetFormDialog } from "@/components/budgets/budget-form-dialog";
import { BudgetDeleteDialog } from "@/components/budgets/budget-delete-dialog";
import {
  getBudgetsData,
  type BudgetsPageData,
  type BudgetWithSpending,
} from "@/lib/budgets/actions";
import { cn } from "@/lib/utils";

interface BudgetsViewProps {
  initialData: BudgetsPageData;
}

export function BudgetsView({ initialData }: BudgetsViewProps) {
  const router = useRouter();
  const [data, setData] = React.useState<BudgetsPageData>(initialData);
  const [selectedMonthKey, setSelectedMonthKey] = React.useState<string>(
    initialData.overview.monthKey
  );
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [isRefreshing, startRefreshTransition] = React.useTransition();

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [preselectedCategoryId, setPreselectedCategoryId] = React.useState<
    string | null
  >(null);
  const [editingBudget, setEditingBudget] =
    React.useState<BudgetWithSpending | null>(null);
  const [deletingBudget, setDeletingBudget] =
    React.useState<BudgetWithSpending | null>(null);

  const loadMonthData = React.useCallback((monthKey: string) => {
    setFetchError(null);
    startRefreshTransition(async () => {
      try {
        const fresh = await getBudgetsData(monthKey);
        setData(fresh);
        setSelectedMonthKey(fresh.overview.monthKey);
      } catch (err) {
        setFetchError(
          err instanceof Error
            ? err.message
            : "Failed to load budget data for the selected month."
        );
      }
    });
  }, []);

  const handleSelectMonth = (nextMonthKey: string) => {
    setSelectedMonthKey(nextMonthKey);
    loadMonthData(nextMonthKey);
  };

  const handleOpenCreate = (categoryId?: string) => {
    setPreselectedCategoryId(categoryId ?? null);
    setIsCreateOpen(true);
  };

  const handleMutationSuccess = () => {
    loadMonthData(selectedMonthKey);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar & Month Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <BudgetMonthSelector
            monthKey={data.overview.monthKey}
            monthLabel={data.overview.monthLabel}
            currentMonthKey={data.overview.currentMonthKey}
            periodRelation={data.overview.periodRelation}
            timezone={data.overview.timezone}
            isLoading={isRefreshing}
            onSelectMonth={handleSelectMonth}
          />
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadMonthData(selectedMonthKey)}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCw
              className={cn("size-3.5", isRefreshing && "animate-spin")}
            />
            Refresh
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => handleOpenCreate()}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Create Budget
          </Button>
        </div>
      </div>

      {/* Error State with Retry Action */}
      {fetchError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadMonthData(selectedMonthKey)}
            className="h-7 text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Overview Metric Cards & Overspending Alerts */}
      <BudgetOverviewCards overview={data.overview} />

      {/* Budgeted Categories Grid or Empty State */}
      {data.budgets.length === 0 ? (
        <BudgetEmptyState
          monthLabel={data.overview.monthLabel}
          unbudgetedCategories={data.analytics.unbudgetedCategories}
          onCreateBudget={(catId) => handleOpenCreate(catId)}
        />
      ) : (
        <BudgetCategoryList
          budgets={data.budgets}
          unbudgetedCategories={data.analytics.unbudgetedCategories}
          periodRelation={data.overview.periodRelation}
          counts={{
            all: data.overview.totalBudgetsCount,
            over_budget: data.overview.overBudgetCount,
            approaching_limit: data.overview.approachingLimitCount,
            on_track: data.overview.onTrackCount,
          }}
          onEditBudget={(b) => setEditingBudget(b)}
          onDeleteBudget={(b) => setDeletingBudget(b)}
          onQuickCreateForCategory={(catId) => handleOpenCreate(catId)}
        />
      )}

      {/* Historical Trends & Month-over-Month Analytics */}
      <BudgetHistoryChart
        analytics={data.analytics}
        currentMonthLabel={data.overview.monthLabel}
        onSelectMonth={handleSelectMonth}
      />

      {/* Create Budget Dialog */}
      <BudgetFormDialog
        mode="create"
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) setPreselectedCategoryId(null);
        }}
        selectedMonthKey={data.overview.monthKey}
        availableCategories={data.availableCategories}
        preselectedCategoryId={preselectedCategoryId}
        onSuccess={handleMutationSuccess}
      />

      {/* Edit Budget Dialog */}
      <BudgetFormDialog
        mode="edit"
        open={Boolean(editingBudget)}
        onOpenChange={(open) => {
          if (!open) setEditingBudget(null);
        }}
        selectedMonthKey={data.overview.monthKey}
        availableCategories={data.availableCategories}
        budget={editingBudget}
        onSuccess={handleMutationSuccess}
      />

      {/* Delete Budget Confirmation Dialog */}
      <BudgetDeleteDialog
        budget={deletingBudget}
        open={Boolean(deletingBudget)}
        onOpenChange={(open) => {
          if (!open) setDeletingBudget(null);
        }}
        onSuccess={handleMutationSuccess}
      />
    </div>
  );
}

