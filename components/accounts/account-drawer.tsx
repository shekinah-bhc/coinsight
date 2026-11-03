"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Archive,
  Building2,
  Calendar,
  CreditCard,
  History,
  Lock,
  Pencil,
  RotateCcw,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
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
import { getAccountDetailData, type AccountDetailData } from "@/lib/accounts/actions";
import { formatPaiseToRupees, formatSqlNumericToRupees } from "@/lib/finance/money";
import type { AccountBalance, AccountType } from "@/src/types/database.types";

interface AccountDrawerProps {
  account: AccountBalance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (account: AccountBalance) => void;
  onArchiveToggle?: (account: AccountBalance) => void;
}

interface AccountDrawerContentProps {
  account: AccountBalance;
  onEdit?: (account: AccountBalance) => void;
  onArchiveToggle?: (account: AccountBalance) => void;
}

function AccountDrawerContent({
  account,
  onEdit,
  onArchiveToggle,
}: AccountDrawerContentProps) {
  const [detailData, setDetailData] = useState<AccountDetailData | null>(null);
  const [isLoading, startTransition] = useTransition();

  useEffect(() => {
    let ignore = false;
    startTransition(async () => {
      const data = await getAccountDetailData(account.account_id);
      if (!ignore) {
        setDetailData(data);
      }
    });
    return () => {
      ignore = true;
    };
  }, [account.account_id]);

  const currentBalNumber = Number.parseFloat(account.current_balance || "0");
  const isCreditCard = account.account_type === "credit_card";
  const isNegative = currentBalNumber < 0;

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case "bank":
        return <Building2 className="size-5 text-primary" />;
      case "credit_card":
        return <CreditCard className="size-5 text-amber-500" />;
      case "cash":
        return <Wallet className="size-5 text-emerald-500" />;
      case "wallet":
        return <Wallet className="size-5 text-cyan-500" />;
      default:
        return <Wallet className="size-5 text-primary" />;
    }
  };

  const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
      case "bank":
        return "Bank Account";
      case "credit_card":
        return "Credit Card";
      case "cash":
        return "Physical Cash";
      case "wallet":
        return "Digital Wallet";
      default:
        return type;
    }
  };

  const formattedCreatedDate = account.created_at
    ? new Date(account.created_at).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently";

  return (
    <>
      {/* Drawer Header */}
      <div className="border-b border-border p-6 bg-card">
        <SheetHeader className="text-left space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted/60 border border-border/40">
                {getAccountIcon(account.account_type)}
              </div>
              <div>
                <Badge variant="outline" className="text-[10px] font-medium">
                  {getAccountTypeLabel(account.account_type)}
                </Badge>
                {account.institution && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {account.institution}
                  </span>
                )}
              </div>
            </div>
            <Badge
              variant={account.is_active ? "default" : "secondary"}
              className={`text-[10px] ${
                account.is_active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : ""
              }`}
            >
              {account.is_active ? "Active" : "Archived"}
            </Badge>
          </div>

          <div>
            <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
              {account.account_name}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Created on {formattedCreatedDate}
            </SheetDescription>
          </div>

          {/* Current Balance Display */}
          <div className="rounded-2xl border border-border/40 bg-background/50 p-4">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {isCreditCard ? "Outstanding Balance / Owed" : "Current Ledger Balance"}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className={`font-mono text-3xl font-extrabold tracking-tight ${
                  isNegative ? "text-amber-500" : "text-foreground"
                }`}
              >
                {formatSqlNumericToRupees(account.current_balance)}
              </span>
              <span className="text-xs text-muted-foreground">INR</span>
            </div>
            {isCreditCard && (
              <p className="mt-1.5 text-[11px] text-amber-500/80">
                Reflects your credit card obligation. Payments reduce this liability.
              </p>
            )}
          </div>
        </SheetHeader>
      </div>

      {/* Financial Flow Breakdown */}
      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Accounting Breakdown
          </h4>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-border/40 bg-card p-3">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Lock className="size-3 text-muted-foreground/60" /> Opening Balance
              </span>
              <p className="font-mono text-sm font-semibold text-foreground mt-0.5">
                {formatPaiseToRupees(account.opening_balance)}
              </p>
            </div>

            <div className="rounded-xl border border-border/40 bg-card p-3">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ArrowDownLeft className="size-3 text-emerald-500" /> Total Inflow
              </span>
              <p className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                +{formatSqlNumericToRupees(
                  (
                    Number.parseFloat(account.total_income || "0") +
                    Number.parseFloat(account.total_incoming_transfers || "0")
                  ).toString()
                )}
              </p>
            </div>

            <div className="rounded-xl border border-border/40 bg-card p-3">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="size-3 text-rose-500" /> Total Outflow
              </span>
              <p className="font-mono text-sm font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                -{formatSqlNumericToRupees(
                  (
                    Number.parseFloat(account.total_expense || "0") +
                    Number.parseFloat(account.total_outgoing_transfers || "0")
                  ).toString()
                )}
              </p>
            </div>

            <div className="rounded-xl border border-border/40 bg-card p-3">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <History className="size-3 text-primary" /> Transactions
              </span>
              <p className="font-mono text-sm font-semibold text-foreground mt-0.5">
                {account.transaction_count ?? 0} records
              </p>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {account.notes && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Notes
            </h4>
            <p className="text-xs text-muted-foreground bg-muted/30 border border-border/30 rounded-xl p-3 leading-relaxed">
              {account.notes}
            </p>
          </div>
        )}

        <Separator />

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Transactions
            </h4>
            <span className="text-[11px] text-muted-foreground">Latest 10</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-xs">
              <Loader2 className="size-4 animate-spin mr-2" />
              Loading ledger entries...
            </div>
          ) : detailData?.recentTransactions && detailData.recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {detailData.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground">
                      {tx.description || (tx.type === "income" ? "Income Deposit" : "Expense")}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-2.5" />
                        {new Date(tx.transaction_date).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{tx.source}</span>
                    </div>
                  </div>
                  <span
                    className={`font-mono font-semibold ${
                      tx.type === "income" ? "text-emerald-500" : "text-foreground"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatPaiseToRupees(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-xs text-muted-foreground">
              <History className="size-6 mx-auto mb-2 opacity-40" />
              <p className="font-medium text-foreground">No transactions recorded yet</p>
              <p className="mt-1 text-[11px]">
                When you record expenses, income, or transfers linked to this account, they will automatically appear here.
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Quick Actions in Drawer */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => onEdit?.(account)}
          >
            <Pencil className="size-3.5 text-muted-foreground" />
            <span>Edit Details</span>
          </Button>
          <Button
            type="button"
            variant={account.is_active ? "outline" : "default"}
            size="sm"
            className={`flex-1 gap-1.5 ${
              account.is_active ? "text-destructive hover:text-destructive hover:bg-destructive/10" : ""
            }`}
            onClick={() => onArchiveToggle?.(account)}
          >
            {account.is_active ? (
              <>
                <Archive className="size-3.5" />
                <span>Archive</span>
              </>
            ) : (
              <>
                <RotateCcw className="size-3.5" />
                <span>Reactivate</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

export function AccountDrawer({
  account,
  open,
  onOpenChange,
  onEdit,
  onArchiveToggle,
}: AccountDrawerProps) {
  if (!account) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        <AccountDrawerContent
          key={account.account_id}
          account={account}
          onEdit={onEdit}
          onArchiveToggle={onArchiveToggle}
        />
      </SheetContent>
    </Sheet>
  );
}
