"use client";

import { AlertTriangle, CheckCircle2, Flame } from "lucide-react";
import {
  type BudgetStatus,
  getBudgetStatusLabel,
} from "@/lib/validations/budgets";
import { cn } from "@/lib/utils";

interface BudgetStatusBadgeProps {
  status: BudgetStatus;
  size?: "sm" | "default";
  className?: string;
}

export function BudgetStatusBadge({
  status,
  size = "default",
  className,
}: BudgetStatusBadgeProps) {
  const label = getBudgetStatusLabel(status);

  const Icon =
    status === "over_budget"
      ? Flame
      : status === "approaching_limit"
        ? AlertTriangle
        : CheckCircle2;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
        status === "over_budget" &&
          "border-rose-500/35 bg-rose-500/12 text-rose-600 dark:text-rose-400",
        status === "approaching_limit" &&
          "border-amber-500/35 bg-amber-500/12 text-amber-600 dark:text-amber-400",
        status === "on_track" &&
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        className
      )}
    >
      <Icon
        className={cn(size === "sm" ? "size-3" : "size-3.5")}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}

