"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryIcon } from "@/components/categories/category-icon";
import {
  createBudgetAction,
  updateBudgetAction,
  type BudgetWithSpending,
  type SelectableBudgetCategory,
} from "@/lib/budgets/actions";
import { formatPaiseToRupees } from "@/lib/finance/money";
import {
  type BudgetActionState,
  parseMonthBounds,
} from "@/lib/validations/budgets";

interface BudgetFormDialogProps {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMonthKey: string;
  availableCategories: SelectableBudgetCategory[];
  budget?: BudgetWithSpending | null;
  preselectedCategoryId?: string | null;
  onSuccess?: () => void;
}

const initialActionState: BudgetActionState = {
  status: "idle",
};

const QUICK_AMOUNT_PRESETS = [2000, 5000, 10000, 15000, 25000, 50000];

interface BudgetFormInnerProps {
  mode: "create" | "edit";
  selectedMonthKey: string;
  availableCategories: SelectableBudgetCategory[];
  budget?: BudgetWithSpending | null;
  preselectedCategoryId?: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function BudgetFormInner({
  mode,
  selectedMonthKey,
  availableCategories,
  budget,
  preselectedCategoryId,
  onOpenChange,
  onSuccess,
}: BudgetFormInnerProps) {
  const serverAction =
    mode === "edit" ? updateBudgetAction : createBudgetAction;
  const [state, formAction, isPending] = useActionState(
    serverAction,
    initialActionState
  );

  // Determine default category for create mode (prefer preselected or first unbudgeted category)
  const initialCategoryId = useMemo(() => {
    if (mode === "edit" && budget) {
      return budget.categoryId;
    }
    if (
      preselectedCategoryId &&
      availableCategories.some((c) => c.id === preselectedCategoryId)
    ) {
      return preselectedCategoryId;
    }
    const firstUnbudgeted = availableCategories.find(
      (c) => !c.hasBudgetInSelectedMonth
    );
    return firstUnbudgeted?.id ?? availableCategories[0]?.id ?? "";
  }, [mode, budget, preselectedCategoryId, availableCategories]);

  const [categoryId, setCategoryId] = useState<string>(initialCategoryId);
  const [monthKey, setMonthKey] = useState<string>(
    mode === "edit" && budget ? budget.monthKey : selectedMonthKey
  );
  const [amount, setAmount] = useState<string>(
    mode === "edit" && budget ? (budget.allocatedPaise / 100).toFixed(2) : ""
  );

  // Include the budget's current category even if archived when in edit mode
  const categoryOptions = useMemo(() => {
    if (mode === "edit" && budget) {
      const existsInAvailable = availableCategories.some(
        (c) => c.id === budget.categoryId
      );
      if (!existsInAvailable) {
        return [
          {
            id: budget.categoryId,
            name: budget.categoryName,
            icon: budget.categoryIcon,
            color: budget.categoryColor,
            isDefault: budget.categoryIsDefault,
            isActive: budget.categoryIsActive,
            hasBudgetInSelectedMonth: true,
            existingBudgetId: budget.id,
            existingAllocatedPaise: budget.allocatedPaise,
            selectedMonthSpentPaise: budget.spentPaise,
          },
          ...availableCategories,
        ];
      }
    }
    return availableCategories;
  }, [mode, budget, availableCategories]);

  const selectedCategory = useMemo(
    () => categoryOptions.find((c) => c.id === categoryId) ?? null,
    [categoryOptions, categoryId]
  );

  const selectedMonthBounds = useMemo(
    () => parseMonthBounds(monthKey),
    [monthKey]
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.success(
        state.message ||
          (mode === "edit" ? "Budget updated." : "Budget created.")
      );
      onOpenChange(false);
      onSuccess?.();
    } else if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state, mode, onOpenChange, onSuccess]);

  return (
    <form action={formAction} className="space-y-4 py-2">
      {mode === "edit" && budget && (
        <input type="hidden" name="budgetId" value={budget.id} />
      )}
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="month" value={monthKey} />

      {state.status === "error" && state.message && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-xs text-destructive">
          {state.message}
        </div>
      )}

      {/* Expense Category Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="budget-category-select" className="text-xs font-medium">
            Expense Category <span className="text-destructive">*</span>
          </Label>
          <span className="text-[11px] text-muted-foreground">
            Expense categories only
          </span>
        </div>

        <Select
          value={categoryId}
          onValueChange={(val) => setCategoryId(val ?? "")}
        >
          <SelectTrigger id="budget-category-select" className="h-9 w-full">
            <SelectValue placeholder="Select expense category">
              {selectedCategory ? (
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="flex size-4 shrink-0 items-center justify-center rounded text-white text-[10px]"
                      style={{
                        backgroundColor: selectedCategory.color || "#6366F1",
                      }}
                    >
                      <CategoryIcon
                        iconName={selectedCategory.icon}
                        className="size-2.5"
                      />
                    </span>
                    <span className="truncate font-medium">
                      {selectedCategory.name}
                      {!selectedCategory.isActive ? " (Archived)" : ""}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground">
                  Select expense category
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((cat) => {
              const isAlreadyBudgetedInCreate =
                mode === "create" &&
                monthKey === selectedMonthKey &&
                cat.hasBudgetInSelectedMonth;

              return (
                <SelectItem
                  key={cat.id}
                  value={cat.id}
                  disabled={isAlreadyBudgetedInCreate}
                >
                  <div className="flex items-center justify-between w-full gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex size-5 items-center justify-center rounded-md text-white text-[10px]"
                        style={{ backgroundColor: cat.color || "#6366F1" }}
                      >
                        <CategoryIcon iconName={cat.icon} className="size-3" />
                      </span>
                      <span>
                        {cat.name}
                        {!cat.isActive ? " (Archived)" : ""}
                      </span>
                    </div>

                    {isAlreadyBudgetedInCreate ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <CheckCircle2 className="size-3 text-emerald-500" />
                        Budgeted
                      </span>
                    ) : cat.selectedMonthSpentPaise > 0 &&
                      monthKey === selectedMonthKey ? (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {formatPaiseToRupees(cat.selectedMonthSpentPaise)} spent
                      </span>
                    ) : null}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {selectedCategory &&
          monthKey === selectedMonthKey &&
          selectedCategory.selectedMonthSpentPaise > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Current spending in{" "}
              <strong className="font-medium text-foreground">
                {selectedCategory.name}
              </strong>{" "}
              for {selectedMonthBounds?.label ?? monthKey}:{" "}
              <span className="font-mono font-semibold text-foreground">
                {formatPaiseToRupees(selectedCategory.selectedMonthSpentPaise)}
              </span>
            </p>
          )}

        {state.fieldErrors?.categoryId && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.categoryId[0]}
          </p>
        )}
      </div>

      {/* Month & Year Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="budget-month-input" className="text-xs font-medium">
            Budget Month <span className="text-destructive">*</span>
          </Label>
          {selectedMonthBounds && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="size-3 text-primary" />
              {selectedMonthBounds.periodStart} to{" "}
              {selectedMonthBounds.periodEnd}
            </span>
          )}
        </div>
        <Input
          id="budget-month-input"
          type="month"
          value={monthKey}
          onChange={(e) => setMonthKey(e.target.value)}
          required
          className="h-9 text-xs font-mono"
        />
        {state.fieldErrors?.month && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.month[0]}
          </p>
        )}
      </div>

      {/* Monthly Budget Allocation Amount */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="budget-amount-input" className="text-xs font-medium">
            Monthly Limit (₹) <span className="text-destructive">*</span>
          </Label>
          <span className="text-[11px] text-muted-foreground">
            Currency: INR
          </span>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
            ₹
          </span>
          <Input
            id="budget-amount-input"
            name="amount"
            type="text"
            inputMode="decimal"
            placeholder="5000.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoComplete="off"
            className="h-10 pl-7 font-mono text-base"
          />
        </div>

        {/* Quick Preset Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] text-muted-foreground mr-1">
            Quick set:
          </span>
          {QUICK_AMOUNT_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className="rounded-lg border border-border/70 bg-background/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              ₹{preset.toLocaleString("en-IN")}
            </button>
          ))}
        </div>

        {state.fieldErrors?.amount && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.amount[0]}
          </p>
        )}
      </div>

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !categoryId || !monthKey}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 size-4 animate-spin" />
              {mode === "edit" ? "Updating..." : "Saving..."}
            </>
          ) : mode === "edit" ? (
            "Save Changes"
          ) : (
            "Create Budget"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function BudgetFormDialog({
  mode,
  open,
  onOpenChange,
  selectedMonthKey,
  availableCategories,
  budget,
  preselectedCategoryId,
  onSuccess,
}: BudgetFormDialogProps) {
  const formKey = `${mode}-${budget?.id ?? "new"}-${
    preselectedCategoryId ?? "default"
  }-${selectedMonthKey}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
              {mode === "edit" ? (
                <Pencil className="size-4.5" />
              ) : (
                <Plus className="size-5" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {mode === "edit" ? "Edit Monthly Budget" : "Create Monthly Budget"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {mode === "edit"
                  ? "Adjust the spending limit for this expense category. Existing transactions are never modified."
                  : "Set a monthly spending allocation for an active expense category."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <BudgetFormInner
          key={formKey}
          mode={mode}
          selectedMonthKey={selectedMonthKey}
          availableCategories={availableCategories}
          budget={budget}
          preselectedCategoryId={preselectedCategoryId}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

