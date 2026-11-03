"use client";

import { useTransition } from "react";
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
import { deleteTransactionAction, type TransactionItem } from "@/lib/transactions/actions";
import { formatPaiseToRupees } from "@/lib/finance/money";

interface DeleteTransactionDialogProps {
  transaction: TransactionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteTransactionDialog({
  transaction,
  open,
  onOpenChange,
  onSuccess,
}: DeleteTransactionDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!transaction) return null;

  const isIncome = transaction.type === "income";

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteTransactionAction(transaction.id);
      if (result.status === "success") {
        toast.success(result.message);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.message || "Failed to delete transaction.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Delete Transaction</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                This action will permanently remove this entry from your financial ledger.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs text-muted-foreground">
          <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>Balance Reversal Notice</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Deleting this {transaction.type} entry of{" "}
              <strong className="font-semibold text-foreground">
                {formatPaiseToRupees(transaction.amount)}
              </strong>{" "}
              will automatically{" "}
              {isIncome ? "decrease" : "restore"} the balance of{" "}
              <strong className="font-semibold text-foreground">
                {transaction.account.name}
              </strong>
              .
            </p>
          </div>

          <p className="leading-relaxed">
            All category reports, monthly totals, and net worth calculations will adjust automatically.
          </p>
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
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Confirm Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

