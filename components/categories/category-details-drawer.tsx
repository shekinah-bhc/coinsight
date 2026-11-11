"use client"

import * as React from "react"
import Link from "next/link"
import {
  Archive,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  ExternalLink,
  Loader2,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { CategoryIcon } from "@/components/categories/category-icon"
import { formatPaiseToRupees } from "@/lib/finance/money"
import {
  getTransactionsData,
  type TransactionItem,
} from "@/lib/transactions/actions"
import type { CategoryWithStats } from "@/lib/categories/actions"
import { cn } from "@/lib/utils"

interface CategoryDetailsDrawerProps {
  category: CategoryWithStats | null
  periodLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (category: CategoryWithStats) => void
  onArchiveToggle: (category: CategoryWithStats) => void
}

function formatShortDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number)
    if (!year || !month || !day) return dateStr
    const date = new Date(year, month - 1, day)
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date)
  } catch {
    return dateStr
  }
}

export function CategoryDetailsDrawer({
  category,
  periodLabel,
  open,
  onOpenChange,
  onEdit,
  onArchiveToggle,
}: CategoryDetailsDrawerProps) {
  const [txState, setTxState] = React.useState<{
    categoryId: string | null
    transactions: TransactionItem[]
    totalCount: number
    loading: boolean
  }>({
    categoryId: null,
    transactions: [],
    totalCount: 0,
    loading: false,
  })

  const categoryId = category?.id ?? null

  React.useEffect(() => {
    if (!open || !categoryId) return

    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      setTxState((prev) => ({
        categoryId,
        transactions: prev.categoryId === categoryId ? prev.transactions : [],
        totalCount: prev.categoryId === categoryId ? prev.totalCount : 0,
        loading: true,
      }))
    })

    getTransactionsData({
      categoryId,
      page: 1,
      pageSize: 6,
      sortBy: "date_desc",
    })
      .then((res) => {
        if (cancelled) return
        setTxState({
          categoryId,
          transactions: res.transactions,
          totalCount: res.totalCount,
          loading: false,
        })
      })
      .catch(() => {
        if (cancelled) return
        setTxState({
          categoryId,
          transactions: [],
          totalCount: 0,
          loading: false,
        })
      })

    return () => {
      cancelled = true
    }
  }, [open, categoryId])

  if (!category) return null

  const badgeColor = category.color || "#7C3AED"
  const isExpense = category.type === "expense"
  const isDefault = category.is_default
  const isArchived = !category.is_active
  const periodAmountBig = BigInt(category.periodAmount)
  const avgAmountBig = BigInt(category.averageAmount)

  const isCurrentCategoryLoaded = txState.categoryId === category.id
  const isLoadingTx = txState.loading || !isCurrentCategoryLoaded
  const recentTransactions = isCurrentCategoryLoaded ? txState.transactions : []
  const totalTxCount = isCurrentCategoryLoaded
    ? txState.totalCount
    : category.lifetimeTransactionCount

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-l border-border/60 bg-card/95 p-0 backdrop-blur-xl sm:max-w-md"
      >
        <SheetHeader className="border-b border-border/60 p-6">
          <div className="flex items-start gap-3.5">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-xl border transition-transform"
              style={{
                backgroundColor: `${badgeColor}18`,
                borderColor: `${badgeColor}40`,
                color: badgeColor,
              }}
            >
              <CategoryIcon iconName={category.icon} className="size-6" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="truncate text-lg font-semibold text-foreground">
                  {category.name}
                </SheetTitle>
                {isDefault ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    <ShieldCheck className="size-3 text-primary" />
                    Default
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    <Sparkles className="size-2.5" />
                    Custom
                  </span>
                )}
                {isArchived && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                    <Archive className="size-2.5" />
                    Archived
                  </span>
                )}
              </div>
              <SheetDescription className="flex items-center gap-1.5 text-xs">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 font-medium capitalize",
                    isExpense ? "text-rose-400" : "text-emerald-400"
                  )}
                >
                  {isExpense ? (
                    <ArrowDownRight className="size-3.5" />
                  ) : (
                    <ArrowUpRight className="size-3.5" />
                  )}
                  {category.type} category
                </span>
                <span>•</span>
                <span>{periodLabel}</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Period Summary Card */}
          <div className="rounded-xl border border-border/60 bg-background/50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Total ({periodLabel})
              </p>
              <span className="rounded-md border border-border/60 bg-card px-2 py-0.5 font-mono text-xs font-medium text-foreground">
                {category.percentageOfTotal.toFixed(1)}% of {category.type}s
              </span>
            </div>
            <p
              className={cn(
                "mt-1.5 font-mono text-2xl font-bold tracking-tight tabular-nums",
                periodAmountBig === BigInt(0)
                  ? "text-muted-foreground"
                  : isExpense
                    ? "text-foreground"
                    : "text-emerald-400"
              )}
            >
              {formatPaiseToRupees(periodAmountBig)}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/50 pt-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Period Txns</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-foreground tabular-nums">
                  {category.periodTransactionCount}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Average Txn</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-foreground tabular-nums">
                  {category.periodTransactionCount > 0
                    ? formatPaiseToRupees(avgAmountBig)
                    : "₹0.00"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">All-Time</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-foreground tabular-nums">
                  {category.lifetimeTransactionCount}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Transactions Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Recent Transactions ({totalTxCount})
              </h4>
              <Link
                href={`/transactions?categoryId=${category.id}&type=${category.type}`}
                className="inline-flex items-center text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                View all
                <ExternalLink className="ml-1 size-3" />
              </Link>
            </div>

            {isLoadingTx ? (
              <div className="flex items-center justify-center rounded-xl border border-border/50 bg-background/30 py-10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-background/20 p-6 text-center">
                <p className="text-sm font-medium text-foreground">
                  No transactions recorded
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Transactions assigned to {category.name} will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50 rounded-xl border border-border/60 bg-background/40">
                {recentTransactions.map((tx) => {
                  const amountBig = BigInt(tx.amount)
                  const isTxIncome = tx.type === "income"
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-3 px-3.5 py-3 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {tx.description || category.name}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="size-3" />
                            {formatShortDate(tx.transaction_date)}
                          </span>
                          {tx.account && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 truncate">
                                <Wallet className="size-3" />
                                {tx.account.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 font-mono text-sm font-semibold tabular-nums",
                          isTxIncome ? "text-emerald-400" : "text-foreground"
                        )}
                      >
                        {isTxIncome ? "+" : "-"}
                        {formatPaiseToRupees(amountBig)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="border-t border-border/60 bg-background/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href={`/transactions?categoryId=${category.id}&type=${category.type}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5"
              )}
            >
              <ExternalLink className="size-3.5" />
              Open in Transactions
            </Link>

            {!isDefault && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false)
                    onEdit(category)
                  }}
                  className="gap-1.5"
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant={isArchived ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    onOpenChange(false)
                    onArchiveToggle(category)
                  }}
                  className={cn(
                    "gap-1.5",
                    !isArchived &&
                      "border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                  )}
                >
                  {isArchived ? (
                    <>
                      <RotateCcw className="size-3.5" />
                      Reactivate
                    </>
                  ) : (
                    <>
                      <Archive className="size-3.5" />
                      Archive
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
