"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPaiseToRupees } from "@/lib/finance/money";
import { CategoryIcon } from "@/components/transactions/category-icon";
import type { TransactionItem } from "@/lib/transactions/actions";

interface TransactionsTableProps {
  transactions: TransactionItem[];
  onView: (transaction: TransactionItem) => void;
  onEdit: (transaction: TransactionItem) => void;
  onDelete: (transaction: TransactionItem) => void;
  hasFilters: boolean;
  onClearFilters?: () => void;
  onAddTransaction?: () => void;
}

export function TransactionsTable({
  transactions,
  onView,
  onEdit,
  onDelete,
  hasFilters,
  onClearFilters,
  onAddTransaction,
}: TransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4">
          <Wallet className="size-6 opacity-60" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          {hasFilters ? "No matching transactions found" : "No transactions recorded yet"}
        </h3>
        <p className="mx-auto mt-1.5 max-w-sm text-xs text-muted-foreground">
          {hasFilters
            ? "Try resetting your search, type, account, or category filters to find what you are looking for."
            : "Record your first income deposit or expense outflow to begin tracking your financial activity."}
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          {hasFilters && onClearFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs text-primary hover:underline font-medium"
            >
              Clear all filters
            </button>
          ) : (
            onAddTransaction && (
              <button
                type="button"
                onClick={onAddTransaction}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                Record First Transaction
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 overflow-hidden shadow-sm">
      <div className="divide-y divide-border/40">
        {transactions.map((tx) => {
          const isIncome = tx.type === "income";

          return (
            <div
              key={tx.id}
              onClick={() => onView(tx)}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition-colors hover:bg-accent/40 cursor-pointer"
            >
              {/* Left Column: Icon + Description & Meta */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${
                    isIncome
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {isIncome ? (
                    <ArrowUpRight className="size-5" />
                  ) : (
                    <ArrowDownLeft className="size-5" />
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm tracking-tight text-foreground truncate">
                      {tx.description || tx.merchant || (isIncome ? "Income Deposit" : "Expense")}
                    </p>
                    {tx.merchant && tx.description && (
                      <span className="text-xs text-muted-foreground hidden md:inline">
                        • {tx.merchant}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {/* Category Badge */}
                    {tx.category ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/50 border border-border/40 px-2 py-0.5 text-[11px] font-medium text-foreground">
                        <span
                          className="flex size-3.5 items-center justify-center rounded-xs text-white"
                          style={{ backgroundColor: tx.category.color || "#6366F1" }}
                        >
                          <CategoryIcon iconName={tx.category.icon} className="size-2.5" />
                        </span>
                        <span>{tx.category.name}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Uncategorized</span>
                    )}

                    <span>•</span>
                    <span className="truncate max-w-[120px]">{tx.account.name}</span>

                    <span>•</span>
                    <span>
                      {new Date(tx.transaction_date).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Amount + Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pl-13 sm:pl-0">
                <div className="text-right">
                  <p
                    className={`font-mono text-base font-bold tracking-tight ${
                      isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatPaiseToRupees(tx.amount)}
                  </p>
                  <span className="text-[10px] text-muted-foreground font-mono">INR</span>
                </div>

                {/* Dropdown Menu */}
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <MoreVertical className="size-4" />
                      <span className="sr-only">Transaction actions</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => onView(tx)}>
                        <Eye className="mr-2 size-4 text-muted-foreground" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(tx)}>
                        <Pencil className="mr-2 size-4 text-muted-foreground" />
                        Edit Entry
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(tx)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete Entry
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
