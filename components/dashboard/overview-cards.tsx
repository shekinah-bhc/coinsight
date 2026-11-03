import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";

interface OverviewMetric {
  id: string;
  label: string;
  amount: string;
  change: string;
  changeNote: string;
  trend: "positive" | "neutral";
  accent: "primary" | "secondary";
  icon: typeof Wallet;
}

const OVERVIEW_METRICS: OverviewMetric[] = [
  {
    id: "balance",
    label: "Total Net Balance",
    amount: "$48,920.50",
    change: "+12.4%",
    changeNote: "vs. previous 30 days",
    trend: "positive",
    accent: "primary",
    icon: Wallet,
  },
  {
    id: "income",
    label: "Monthly Income",
    amount: "$9,450.00",
    change: "+4.8%",
    changeNote: "2 recurring inflows",
    trend: "positive",
    accent: "secondary",
    icon: ArrowUpRight,
  },
  {
    id: "expenses",
    label: "Monthly Expenses",
    amount: "$3,684.20",
    change: "-3.2%",
    changeNote: "Under $4,200 target",
    trend: "positive",
    accent: "primary",
    icon: ArrowDownRight,
  },
  {
    id: "savings",
    label: "Net Cash Flow",
    amount: "+$5,765.80",
    change: "61.0%",
    changeNote: "Monthly savings rate",
    trend: "positive",
    accent: "secondary",
    icon: PiggyBank,
  },
];

export function OverviewCards() {
  return (
    <section aria-label="Financial overview metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {OVERVIEW_METRICS.map((metric) => {
        const Icon = metric.icon;
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
              <p className="font-mono text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                {metric.amount}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-[11px]">
              <span className="inline-flex items-center gap-1 font-medium text-brand-secondary">
                <TrendingUp className="size-3" aria-hidden="true" />
                <span>{metric.change}</span>
              </span>
              <span className="text-muted-foreground">{metric.changeNote}</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}

