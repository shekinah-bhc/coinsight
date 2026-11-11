"use client";

import { Archive, ArrowDownLeft, ArrowUpRight, Layers } from "lucide-react";
import type { CategoriesOverviewMetrics } from "@/lib/categories/actions";

interface CategoriesOverviewProps {
  overview: CategoriesOverviewMetrics;
}

export function CategoriesOverview({ overview }: CategoriesOverviewProps) {
  const cards = [
    {
      id: "total-active",
      label: "Total Active Categories",
      value: overview.totalActive,
      subtitle: "Available in transaction forms",
      icon: Layers,
      accentClass: "border-primary/25 bg-primary/12 text-primary",
      glowClass: "via-primary/35",
    },
    {
      id: "active-expense",
      label: "Active Expense Categories",
      value: overview.activeExpense,
      subtitle: "Outflow classifications",
      icon: ArrowDownLeft,
      accentClass: "border-rose-500/25 bg-rose-500/12 text-rose-600 dark:text-rose-400",
      glowClass: "via-rose-500/35",
    },
    {
      id: "active-income",
      label: "Active Income Categories",
      value: overview.activeIncome,
      subtitle: "Inflow classifications",
      icon: ArrowUpRight,
      accentClass: "border-emerald-500/25 bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
      glowClass: "via-emerald-500/35",
    },
    {
      id: "archived",
      label: "Archived Categories",
      value: overview.archivedCount,
      subtitle: "Preserved in historical records",
      icon: Archive,
      accentClass: "border-amber-500/25 bg-amber-500/12 text-amber-600 dark:text-amber-400",
      glowClass: "via-amber-500/35",
    },
  ];

  return (
    <section
      aria-label="Categories overview metrics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="glass-card relative overflow-hidden rounded-2xl p-5 transition-colors hover:border-primary/30"
          >
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${card.glowClass} to-transparent`}
            />

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {card.label}
              </span>
              <span
                className={`flex size-8 items-center justify-center rounded-xl border ${card.accentClass}`}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <p className="font-mono text-2xl font-bold tracking-tight text-foreground tabular-nums">
                {card.value}
              </p>
            </div>

            <div className="mt-3 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
              <span>{card.subtitle}</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}

