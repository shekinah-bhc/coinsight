import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { formatPaiseToRupees, formatSqlNumericToRupees } from "@/lib/finance/money";
import type { DashboardMetrics } from "@/lib/dashboard/actions";

interface OverviewCardsProps {
  metrics: DashboardMetrics;
}

export function OverviewCards({ metrics }: OverviewCardsProps) {
  const isPositiveCashFlow = metrics.netCashFlow >= 0;

  const cardItems = [
    {
      id: "balance",
      label: "Total Net Balance",
      amount: formatSqlNumericToRupees(metrics.totalNetBalance),
      note: "Active accounts net worth",
      icon: Wallet,
      accent: "primary" as const,
      trendIcon: TrendingUp,
    },
    {
      id: "income",
      label: `${metrics.currentMonthName} Income`,
      amount: `+${formatPaiseToRupees(metrics.monthlyIncome)}`,
      note: "Total monthly deposits",
      icon: ArrowUpRight,
      accent: "secondary" as const,
      trendIcon: TrendingUp,
    },
    {
      id: "expenses",
      label: `${metrics.currentMonthName} Expenses`,
      amount: `-${formatPaiseToRupees(metrics.monthlyExpenses)}`,
      note: "Total monthly outflows",
      icon: ArrowDownRight,
      accent: "primary" as const,
      trendIcon: TrendingDown,
    },
    {
      id: "cashflow",
      label: "Net Cash Flow",
      amount: `${isPositiveCashFlow ? "+" : "-"}${formatPaiseToRupees(Math.abs(metrics.netCashFlow))}`,
      note: `${metrics.savingsRate}% monthly savings rate`,
      icon: PiggyBank,
      accent: "secondary" as const,
      trendIcon: isPositiveCashFlow ? TrendingUp : TrendingDown,
    },
  ];

  return (
    <section aria-label="Financial overview metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cardItems.map((metric) => {
        const Icon = metric.icon;
        const TrendIcon = metric.trendIcon;
        const isPrimary = metric.accent === "primary";

        return (
          <div
            key={metric.id}
            className="glass-card group relative overflow-hidden rounded-2xl p-5 transition-colors hover:border-primary/30"
          >
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${
                isPrimary ? "via-primary/35" : "via-brand-secondary/35"
              } to-transparent`}
            />

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {metric.label}
              </span>
              <span
                className={`flex size-8 items-center justify-center rounded-xl border ${
                  isPrimary
                    ? "border-primary/25 bg-primary/12 text-primary"
                    : "border-brand-secondary/25 bg-brand-secondary/12 text-brand-secondary"
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-2">
              <p className="font-mono text-2xl font-bold tracking-tight text-foreground tabular-nums">
                {metric.amount}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-[11px]">
              <span className="inline-flex items-center gap-1 font-medium text-brand-secondary">
                <TrendIcon className="size-3" aria-hidden="true" />
                <span>Verified</span>
              </span>
              <span className="text-muted-foreground">{metric.note}</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
