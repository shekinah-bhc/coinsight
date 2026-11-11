"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
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
import { CategoryIcon } from "@/components/categories/category-icon";
import { formatPaiseToRupees } from "@/lib/finance/money";
import {
  deleteBudgetAction,
  type BudgetWithSpending,
} from "@/lib/budgets/actions";
import { parseMonthBounds } from "@/lib/validations/budgets";

interface BudgetDeleteDialogProps {
  budget: BudgetWithSpending | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BudgetDeleteDialog({
  budget,
  open,
  onOpenChange,
  onSuccess,
}: BudgetDeleteDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!budget) return null;

  const monthBounds = parseMonthBounds(budget.monthKey);
  const monthLabel = monthBounds?.label ?? budget.monthKey;

  const handleConfirmDelete = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const result = await deleteBudgetAction(budget.id);
      if (result.status === "success") {
        toast.success(result.message || "Budget deleted.");
        onOpenChange(false);
        onSuccess?.();
      } else {
        setErrorMsg(result.message || "Failed to delete budget.");
        toast.error(result.message || "Failed to delete budget.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <Trash2 className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Delete Monthly Budget
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Remove the {monthLabel} spending limit for {budget.categoryName}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {errorMsg && (
            <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/50 p-3.5">
            <div className="flex items-center gap-2.5">
              <span
                className="flex size-9 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: budget.categoryColor || "#6366F1" }}
              >
                <CategoryIcon
                  iconName={budget.categoryIcon}
                  className="size-4.5"
                />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {budget.categoryName}
                </p>
                <p className="text-xs text-muted-foreground">{monthLabel}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Allocated Limit</p>
              <p className="font-mono text-sm font-semibold text-foreground">
                {formatPaiseToRupees(budget.allocatedPaise)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <p className="leading-relaxed">
              Deleting this budget removes only the monthly spending target for{" "}
              <strong className="font-medium text-foreground">
                {budget.categoryName}
              </strong>{" "}
              in {monthLabel}. Your recorded transactions (
              {formatPaiseToRupees(budget.spentPaise)}), categories, and account
              balances will not be modified.
            </p>
          </div>
        </div>

        <DialogFooter>
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
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirmDelete}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Budget"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

