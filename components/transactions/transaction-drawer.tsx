"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Calendar,
  Clock,
  CreditCard,
  Pencil,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPaiseToRupees } from "@/lib/finance/money";
import { CategoryIcon } from "@/components/transactions/category-icon";
import type { TransactionItem } from "@/lib/transactions/actions";
import type { AccountType } from "@/src/types/database.types";

interface TransactionDrawerProps {
  transaction: TransactionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (transaction: TransactionItem) => void;
  onDelete?: (transaction: TransactionItem) => void;
}

export function TransactionDrawer({
  transaction,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: TransactionDrawerProps) {
  if (!transaction) return null;

  const isIncome = transaction.type === "income";

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case "bank":
        return <Building2 className="size-4 text-primary" />;
      case "credit_card":
        return <CreditCard className="size-4 text-amber-500" />;
      case "cash":
        return <Wallet className="size-4 text-emerald-500" />;
      case "wallet":
        return <Wallet className="size-4 text-cyan-500" />;
      default:
        return <Wallet className="size-4 text-primary" />;
    }
  };

  const formattedDate = new Date(transaction.transaction_date).toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedCreated = new Date(transaction.created_at).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
        {/* Drawer Header */}
        <div className="border-b border-border p-6 bg-card">
          <SheetHeader className="text-left space-y-3">
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className={`text-[11px] font-semibold gap-1.5 py-1 px-2.5 ${
                  isIncome
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}
              >
                {isIncome ? <ArrowUpRight className="size-3.5" /> : <ArrowDownLeft className="size-3.5" />}
                {isIncome ? "Income Deposit" : "Expense Outflow"}
              </Badge>

              <span className="text-[11px] text-muted-foreground capitalize flex items-center gap-1">
                <Sparkles className="size-3" />
                {transaction.source} entry
              </span>
            </div>

            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Transaction Amount
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span
                  className={`font-mono text-3xl font-extrabold tracking-tight ${
                    isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                  }`}
                >
                  {isIncome ? "+" : "-"}
                  {formatPaiseToRupees(transaction.amount)}
                </span>
                <span className="text-xs text-muted-foreground">INR</span>
              </div>
            </div>

            <SheetTitle className="text-base font-semibold text-foreground pt-1">
              {transaction.description || transaction.merchant || (isIncome ? "Income" : "Expense")}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Recorded for {formattedDate}
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Details List */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Account Details */}
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-3.5">
              <span className="text-xs font-medium text-muted-foreground">Account</span>
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 border border-border/40">
                  {getAccountIcon(transaction.account.account_type)}
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-foreground">{transaction.account.name}</p>
                  {transaction.account.institution && (
                    <p className="text-[10px] text-muted-foreground">{transaction.account.institution}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Category Details */}
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-3.5">
              <span className="text-xs font-medium text-muted-foreground">Category</span>
              {transaction.category ? (
                <div className="flex items-center gap-2">
                  <span
                    className="flex size-7 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: transaction.category.color || "#6366F1" }}
                  >
                    <CategoryIcon iconName={transaction.category.icon} className="size-4" />
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {transaction.category.name}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Uncategorized</span>
              )}
            </div>

            {/* Merchant Details */}
            {transaction.merchant && (
              <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-3.5">
                <span className="text-xs font-medium text-muted-foreground">Merchant / Payee</span>
                <span className="text-xs font-semibold text-foreground">{transaction.merchant}</span>
              </div>
            )}

            {/* Date Details */}
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-3.5">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground/60" /> Date
              </span>
              <span className="text-xs font-semibold text-foreground">
                {transaction.transaction_date}
              </span>
            </div>

            {/* Timestamps */}
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-3.5">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground/60" /> Created
              </span>
              <span className="text-xs text-muted-foreground font-mono">{formattedCreated}</span>
            </div>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Notes
              </h4>
              <p className="text-xs text-muted-foreground bg-muted/30 border border-border/30 rounded-xl p-3 leading-relaxed">
                {transaction.notes}
              </p>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => onEdit?.(transaction)}
            >
              <Pencil className="size-3.5 text-muted-foreground" />
              <span>Edit Entry</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete?.(transaction)}
            >
              <Trash2 className="size-3.5" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

