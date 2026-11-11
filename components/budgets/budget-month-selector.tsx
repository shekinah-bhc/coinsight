"use client";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { shiftMonthKey } from "@/lib/validations/budgets";
import { cn } from "@/lib/utils";

interface BudgetMonthSelectorProps {
  monthKey: string;
  monthLabel: string;
  currentMonthKey: string;
  periodRelation: "past" | "current" | "future";
  timezone: string;
  isLoading?: boolean;
  onSelectMonth: (newMonthKey: string) => void;
}

export function BudgetMonthSelector({
  monthKey,
  monthLabel,
  currentMonthKey,
  periodRelation,
  timezone,
  isLoading = false,
  onSelectMonth,
}: BudgetMonthSelectorProps) {
  const prevMonthKey = shiftMonthKey(monthKey, -1);
  const nextMonthKey = shiftMonthKey(monthKey, 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 px-4 py-3 backdrop-blur-md">
      {/* Month Navigation Controls */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => onSelectMonth(prevMonthKey)}
          disabled={isLoading}
          aria-label="Previous month"
          title="Previous month"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div className="flex min-w-[180px] items-center justify-center gap-2 px-2 text-center">
          <Calendar className="size-4 text-primary shrink-0" aria-hidden="true" />
          <span className="font-heading text-sm font-semibold tracking-tight text-foreground sm:text-base">
            {monthLabel}
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => onSelectMonth(nextMonthKey)}
          disabled={isLoading}
          aria-label="Next month"
          title="Next month"
        >
          <ChevronRight className="size-4" />
        </Button>

        {monthKey !== currentMonthKey && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelectMonth(currentMonthKey)}
            disabled={isLoading}
            className="ml-1 h-7 gap-1.5 text-xs text-primary hover:text-primary"
          >
            <RotateCcw className="size-3" />
            <span>Current Month</span>
          </Button>
        )}
      </div>

      {/* Period Status & Timezone Metadata */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
            periodRelation === "current" &&
              "border-primary/30 bg-primary/10 text-primary",
            periodRelation === "past" &&
              "border-border bg-muted/60 text-muted-foreground",
            periodRelation === "future" &&
              "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
          )}
        >
          {periodRelation === "current" && (
            <>
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span>Active Period</span>
            </>
          )}
          {periodRelation === "past" && (
            <>
              <Clock className="size-3" />
              <span>Historical Month</span>
            </>
          )}
          {periodRelation === "future" && (
            <>
              <Sparkles className="size-3" />
              <span>Planned Future Month (₹0 Spent)</span>
            </>
          )}
        </span>

        <span className="hidden text-[11px] text-muted-foreground sm:inline">
          Timezone: {timezone}
        </span>
      </div>
    </div>
  );
}

