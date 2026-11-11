"use client";

import {
  BUDGET_THRESHOLDS,
  type BudgetStatus,
} from "@/lib/validations/budgets";
import { cn } from "@/lib/utils";

interface BudgetProgressBarProps {
  percentage: number;
  progressBarPercent: number;
  status: BudgetStatus;
  showThresholdMarker?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
}

export function BudgetProgressBar({
  percentage,
  progressBarPercent,
  status,
  showThresholdMarker = true,
  size = "md",
  className,
  ariaLabel = "Budget utilization progress",
}: BudgetProgressBarProps) {
  const heightClass =
    size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  const barColorClass =
    status === "over_budget"
      ? "bg-gradient-to-r from-rose-500 to-rose-400"
      : status === "approaching_limit"
        ? "bg-gradient-to-r from-amber-500 to-amber-400"
        : "bg-gradient-to-r from-emerald-500 to-teal-400";

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-muted/70 dark:bg-white/[0.07]",
        heightClass,
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300",
          barColorClass
        )}
        style={{ width: `${Math.min(100, Math.max(0, progressBarPercent))}%` }}
      />

      {showThresholdMarker && (
        <div
          aria-hidden="true"
          title={`${BUDGET_THRESHOLDS.APPROACHING_LIMIT_PERCENT}% warning threshold`}
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-foreground/25"
          style={{ left: `${BUDGET_THRESHOLDS.APPROACHING_LIMIT_PERCENT}%` }}
        />
      )}
    </div>
  );
}

