"use client";

import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Eye,
  Lock,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPaiseToRupees } from "@/lib/finance/money";
import { CategoryIcon } from "@/components/categories/category-icon";
import type { CategoryWithStats } from "@/lib/categories/actions";

interface CategoryCardProps {
  category: CategoryWithStats;
  periodLabel: string;
  onInspect: (category: CategoryWithStats) => void;
  onEdit: (category: CategoryWithStats) => void;
  onArchiveToggle: (category: CategoryWithStats) => void;
}

export function CategoryCard({
  category,
  periodLabel,
  onInspect,
  onEdit,
  onArchiveToggle,
}: CategoryCardProps) {
  const isIncome = category.type === "income";
  const colorHex = category.color || (isIncome ? "#10B981" : "#6366F1");

  return (
    <div
      className={`glass-card group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:border-primary/35 ${
        !category.is_active ? "opacity-80 bg-card/30" : ""
      }`}
    >
      {/* Top Color Accent Line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-75"
        style={{ backgroundColor: colorHex }}
      />

      <div>
        {/* Card Header: Icon, Name, Type & Badges */}
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => onInspect(category)}
            className="flex items-center gap-3 text-left min-w-0 group/title focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
          >
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover/title:scale-105"
              style={{ backgroundColor: colorHex }}
            >
              <CategoryIcon iconName={category.icon} className="size-5" />
            </span>

            <div className="min-w-0">
              <h3 className="font-heading text-sm font-semibold tracking-tight text-foreground truncate group-hover/title:text-primary transition-colors">
                {category.name}
              </h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-0.5 capitalize">
                  {isIncome ? (
                    <ArrowUpRight className="size-3 text-emerald-500" aria-hidden="true" />
                  ) : (
                    <ArrowDownLeft className="size-3 text-rose-500" aria-hidden="true" />
                  )}
                  {category.type}
                </span>
                <span>•</span>
                <span>
                  {category.lifetimeTransactionCount}{" "}
                  {category.lifetimeTransactionCount === 1 ? "total entry" : "total entries"}
                </span>
              </div>
            </div>
          </button>

          {/* Status & Designation Badges */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {category.is_default ? (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-secondary/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                title="System default category — protected from deletion and renaming"
              >
                <Lock className="size-2.5" aria-hidden="true" />
                Default
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                Custom
              </span>
            )}

            {!category.is_active ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                Archived
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                Active
              </span>
            )}
          </div>
        </div>

        {/* Period Financial Metrics Box */}
        <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-3.5 space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {periodLabel} Total
              </p>
              <p
                className={`mt-0.5 font-mono text-lg font-bold tracking-tight tabular-nums ${
                  category.periodAmount > 0
                    ? isIncome
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {formatPaiseToRupees(category.periodAmount)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">
                {category.periodTransactionCount}{" "}
                {category.periodTransactionCount === 1 ? "tx" : "txs"} in period
              </p>
              <p className="mt-0.5 font-mono text-xs font-semibold text-muted-foreground tabular-nums">
                {category.percentageOfTotal}% of {category.type}s
              </p>
            </div>
          </div>

          {/* Share Progress Bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${
                  category.periodAmount > 0
                    ? Math.min(100, Math.max(3, category.percentageOfTotal))
                    : 0
                }%`,
                backgroundColor: colorHex,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            <span>Avg per transaction</span>
            <span className="font-mono font-medium text-foreground/90 tabular-nums">
              {formatPaiseToRupees(category.averageAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onInspect(category)}
            className="h-7 px-2.5 text-xs gap-1 text-muted-foreground hover:text-foreground"
          >
            <Eye className="size-3.5" aria-hidden="true" />
            <span>Details</span>
          </Button>

          <Link
            href={`/transactions?categoryId=${category.id}&type=${category.type}`}
            className="inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title={`View ${category.name} transactions`}
          >
            <span>Transactions</span>
            <ExternalLink className="size-3" aria-hidden="true" />
          </Link>
        </div>

        {/* Custom Category Controls */}
        {!category.is_default ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(category)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              title={`Edit ${category.name}`}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              <span className="sr-only">Edit {category.name}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onArchiveToggle(category)}
              className={`h-7 px-2 text-xs ${
                category.is_active
                  ? "text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              }`}
              title={
                category.is_active
                  ? `Archive ${category.name}`
                  : `Reactivate ${category.name}`
              }
            >
              {category.is_active ? (
                <Archive className="size-3.5" aria-hidden="true" />
              ) : (
                <ArchiveRestore className="size-3.5" aria-hidden="true" />
              )}
              <span className="sr-only">
                {category.is_active ? "Archive" : "Reactivate"} {category.name}
              </span>
            </Button>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground/70">System</span>
        )}
      </div>
    </div>
  );
}

