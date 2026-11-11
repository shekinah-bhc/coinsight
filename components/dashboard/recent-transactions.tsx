import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  PieChart,
  Wallet,
} from "lucide-react";
import { formatPaiseToRupees } from "@/lib/finance/money";
import { CategoryIcon } from "@/components/transactions/category-icon";
import type { CategorySpending } from "@/lib/dashboard/actions";
import type { TransactionItem } from "@/lib/transactions/actions";

interface RecentTransactionsProps {
  recentTransactions: TransactionItem[];
  categorySpending: CategorySpending[];
  currentMonthName: string;
}

export function RecentTransactions({
  recentTransactions,
  categorySpending,
  currentMonthName,
}: RecentTransactionsProps) {
  return (
    <section
      aria-label="Recent activity and category allocation"
      className="grid gap-6 lg:grid-cols-3"
    >
      {/* 1. Recent Transactions Ledger Feed (2 columns) */}
      <div className="glass-card relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 sm:p-6 lg:col-span-2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
                Recent Ledger Activity
              </h2>
              <p className="text-xs text-muted-foreground">
                Latest transactions recorded across your accounts.
              </p>
            </div>
            <Link
              href="/transactions"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="divide-y divide-border/40">
              {recentTransactions.map((tx) => {
                const isIncome = tx.type === "income";

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 py-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${
                          isIncome
                            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isIncome ? (
                          <ArrowUpRight className="size-4" />
                        ) : (
                          <ArrowDownLeft className="size-4" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <p className="font-medium text-foreground truncate">
                          {tx.description || tx.merchant || (isIncome ? "Income Deposit" : "Expense")}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          {tx.category ? (
                            <span>{tx.category.name}</span>
                          ) : (
                            <span>Uncategorized</span>
                          )}
                          <span>•</span>
                          <span className="truncate max-w-[100px]">{tx.account.name}</span>
                          <span>•</span>
                          <span>
                            {new Date(tx.transaction_date).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`font-mono text-sm font-bold tracking-tight ${
                          isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatPaiseToRupees(tx.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-xs text-muted-foreground">
              <Wallet className="size-6 mx-auto mb-2 opacity-40" />
              <p className="font-medium text-foreground">No recent transactions</p>
              <p className="mt-1 text-[11px]">
                Transactions you record will appear here with live balance updates.
              </p>
              <Link
                href="/transactions"
                className="inline-block mt-3 text-xs text-primary font-medium hover:underline"
              >
                Go to Transactions →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 2. Monthly Spending by Category (1 column) */}
      <div className="glass-card relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-secondary/30 to-transparent"
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
                Category Spending
              </h2>
              <p className="text-xs text-muted-foreground">
                {currentMonthName} expense breakdown.
              </p>
            </div>
            <span className="flex size-8 items-center justify-center rounded-xl border border-brand-secondary/25 bg-brand-secondary/10 text-brand-secondary">
              <PieChart className="size-4" aria-hidden="true" />
            </span>
          </div>

          {categorySpending.length > 0 ? (
            <div className="space-y-3.5 pt-1">
              {categorySpending.slice(0, 5).map((cat) => (
                <div key={cat.categoryId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <span
                        className="flex size-4 items-center justify-center rounded-xs text-white text-[10px]"
                        style={{ backgroundColor: cat.color || "#6366F1" }}
                      >
                        <CategoryIcon iconName={cat.icon} className="size-2.5" />
                      </span>
                      <span>{cat.categoryName}</span>
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {formatPaiseToRupees(cat.amount)} ({cat.percentage}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                        backgroundColor: cat.color || "#6366F1",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
              <p className="font-medium text-foreground">No expense data yet</p>
              <p className="mt-1 text-[11px]">
                Expense transactions for {currentMonthName} will display category allocation here.
              </p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border/50 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <p className="truncate">Transfers excluded from spending.</p>
          <Link
            href="/categories"
            className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <span>Categories</span>
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
