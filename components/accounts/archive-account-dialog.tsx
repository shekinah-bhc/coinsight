"use client";

import { useTransition } from "react";
import { AlertTriangle, Archive, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
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
import { archiveAccountAction, reactivateAccountAction } from "@/lib/accounts/actions";
import { formatSqlNumericToRupees } from "@/lib/finance/money";
import type { AccountBalance } from "@/src/types/database.types";

interface ArchiveAccountDialogProps {
  account: AccountBalance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ArchiveAccountDialog({
  account,
  open,
  onOpenChange,
  onSuccess,
}: ArchiveAccountDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!account) return null;

  const isArchiving = account.is_active;
  const currentBalanceNumeric = Number.parseFloat(account.current_balance || "0");
  const hasNonZeroBalance = Math.abs(currentBalanceNumeric) > 0.001;

  const handleAction = () => {
    if (!account.account_id) return;

    startTransition(async () => {
      const result = isArchiving
        ? await archiveAccountAction(account.account_id!)
        : await reactivateAccountAction(account.account_id!);

      if (result.status === "success") {
        toast.success(result.message);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.message || "Failed to update account status.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div
              className={`flex size-9 items-center justify-center rounded-lg ${
                isArchiving ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
              }`}
            >
              {isArchiving ? <Archive className="size-5" /> : <RotateCcw className="size-5" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {isArchiving ? "Archive Account" : "Reactivate Account"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {account.account_name} {account.institution ? `(${account.institution})` : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm text-muted-foreground">
          {isArchiving ? (
            <>
              {hasNonZeroBalance && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>Non-Zero Balance Notice</span>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    This account currently holds a balance of{" "}
                    <strong className="font-semibold text-foreground">
                      {formatSqlNumericToRupees(account.current_balance)}
                    </strong>
                    . Archiving it will exclude this amount from your active net worth and asset calculations.
                  </p>
                </div>
              )}

              <p className="text-xs leading-relaxed">
                Archiving hides this account from new transaction entries and quick pickers. All past financial records, statements, and category reports will remain completely intact.
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-xs leading-relaxed">
                Reactivating this account will restore it to your active accounts list and include its balance (
                <strong className="font-semibold text-foreground">
                  {formatSqlNumericToRupees(account.current_balance)}
                </strong>
                ) in your net worth calculations.
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/40 p-2.5 text-xs text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>You will immediately be able to record new transactions for this account.</span>
              </div>
            </div>
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
            type="button"
            variant={isArchiving ? "destructive" : "default"}
            size="sm"
            onClick={handleAction}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {isArchiving ? "Archiving..." : "Reactivating..."}
              </>
            ) : isArchiving ? (
              "Confirm Archive"
            ) : (
              "Confirm Reactivate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
