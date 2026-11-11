"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, AlertTriangle, Loader2 } from "lucide-react";
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
import {
  archiveCategoryAction,
  reactivateCategoryAction,
  type CategoryWithStats,
} from "@/lib/categories/actions";

interface CategoryArchiveDialogProps {
  category: CategoryWithStats | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CategoryArchiveDialog({
  category,
  open,
  onOpenChange,
  onSuccess,
}: CategoryArchiveDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!category) return null;

  const isArchiving = category.is_active;

  const handleConfirm = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const result = isArchiving
        ? await archiveCategoryAction(category.id)
        : await reactivateCategoryAction(category.id);

      if (result.status === "success") {
        toast.success(
          result.message ||
            (isArchiving ? "Category archived." : "Category reactivated.")
        );
        onOpenChange(false);
        onSuccess?.();
      } else {
        setErrorMsg(result.message || "Operation failed.");
        toast.error(result.message || "Operation failed.");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) setErrorMsg(null);
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isArchiving ? (
              <Archive className="size-4 text-amber-500" aria-hidden="true" />
            ) : (
              <ArchiveRestore className="size-4 text-emerald-500" aria-hidden="true" />
            )}
            <span>
              {isArchiving
                ? `Archive "${category.name}"?`
                : `Reactivate "${category.name}"?`}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isArchiving
              ? "Archiving hides this category from new transaction forms while preserving all historical records."
              : "Reactivating restores this category to active selection when recording new transactions."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {errorMsg && (
            <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          {/* Category Preview Pill */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary/50 p-3">
            <div className="flex items-center gap-3">
              <span
                className="flex size-9 items-center justify-center rounded-xl text-white shadow-2xs"
                style={{ backgroundColor: category.color || "#6366F1" }}
              >
                <CategoryIcon iconName={category.icon} className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{category.name}</p>
                <p className="text-[11px] text-muted-foreground capitalize">
                  {category.type} • {category.lifetimeTransactionCount} linked{" "}
                  {category.lifetimeTransactionCount === 1 ? "transaction" : "transactions"}
                </p>
              </div>
            </div>
          </div>

          {isArchiving ? (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                <span>What happens when you archive:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px]">
                <li>All historical transactions retain their link to &ldquo;{category.name}&rdquo;.</li>
                <li>Historical spending reports and balances are completely unaffected.</li>
                <li>&ldquo;{category.name}&rdquo; will not appear as a choice for new transactions.</li>
                <li>You can reactivate this category at any time from the Archived tab.</li>
              </ul>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
              <p className="text-[11px]">
                Once reactivated, &ldquo;{category.name}&rdquo; will immediately appear in your active{" "}
                <strong className="capitalize">{category.type}</strong> categories when creating or editing transactions.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={isArchiving ? "default" : "default"}
            onClick={handleConfirm}
            disabled={isPending}
            className="gap-1.5 text-xs"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>{isArchiving ? "Archiving..." : "Reactivating..."}</span>
              </>
            ) : isArchiving ? (
              <>
                <Archive className="size-3.5" />
                <span>Archive Category</span>
              </>
            ) : (
              <>
                <ArchiveRestore className="size-3.5" />
                <span>Reactivate Category</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

