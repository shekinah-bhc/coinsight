import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Coffee,
  CreditCard,
  Globe,
  Home,
  Landmark,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

interface PlaceholderTransaction {
  id: string;
  merchant: string;
  category: string;
  account: string;
  date: string;
  amount: string;
  type: "inflow" | "outflow";
  status: "Settled" | "Pending";
  icon: typeof Landmark;
}

const SAMPLE_TRANSACTIONS: PlaceholderTransaction[] = [
  {
    id: "tx-1",
    merchant: "Acme Corp Payroll",
    category: "Salary & Wages",
    account: "Checking ••4821",
    date: "Today, 09:15 AM",
    amount: "+$4,725.00",
    type: "inflow",
    status: "Settled",
    icon: Landmark,
  },
  {
    id: "tx-2",
    merchant: "Vanguard Index Fund",
    category: "Investments",
    account: "Brokerage ••9014",
    date: "Yesterday",
    amount: "-$1,250.00",
    type: "outflow",
    status: "Settled",
    icon: Building2,
  },
  {
    id: "tx-3",
    merchant: "Metropolitan Properties",
    category: "Housing & Rent",
    account: "Checking ••4821",
    date: "Nov 01",
    amount: "-$1,850.00",
    type: "outflow",
    status: "Settled",
    icon: Home,
  },
  {
    id: "tx-4",
    merchant: "Whole Foods Market",
    category: "Groceries",
    account: "Sapphire ••3310",
    date: "Oct 31",
    amount: "-$142.80",
    type: "outflow",
    status: "Settled",
    icon: ShoppingBag,
  },
  {
    id: "tx-5",
    merchant: "Cloud Infrastructure Services",
    category: "Software & Tech",
    account: "Sapphire ••3310",
    date: "Oct 30",
    amount: "-$64.00",
    type: "outflow",
    status: "Pending",
    icon: Globe,
  },
  {
    id: "tx-6",
    merchant: "Blue Bottle Coffee",
    category: "Dining & Cafe",
    account: "Sapphire ••3310",
    date: "Oct 29",
    amount: "-$14.50",
    type: "outflow",
    status: "Settled",
    icon: Coffee,
  },
];

interface AllocationItem {
  category: string;
  spent: string;
  limit: string;
  percent: number;
  accent: "primary" | "secondary";
}

const BUDGET_ALLOCATIONS: AllocationItem[] = [
  {
    category: "Housing & Utilities",
    spent: "$2,040",
    limit: "$2,200",
    percent: 92,
    accent: "primary",
  },
  {
    category: "Investments & Savings",
    spent: "$1,250",
    limit: "$1,500",
    percent: 83,
    accent: "secondary",
  },
  {
    category: "Groceries & Dining",
    spent: "$485",
    limit: "$750",
    percent: 65,
    accent: "primary",
  },
  {
    category: "Subscriptions & Cloud",
    spent: "$159",
    limit: "$250",
    percent: 64,
    accent: "secondary",
  },
];

export function RecentTransactions() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section
        id="transactions"
        aria-labelledby="recent-transactions-heading"
        className="glass-card flex flex-col justify-between rounded-2xl p-5 sm:p-6 lg:col-span-2"
      >
        <div>
          <div className="flex flex-col justify-between gap-2 border-b border-border pb-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="recent-transactions-heading"
                  className="font-heading text-base font-semibold tracking-tight text-foreground"
                >
                  Recent Transactions
                </h2>
                <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  Sample Preview
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Visual preview of categorized cash flow activity across accounts
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CreditCard className="size-3.5 text-primary" aria-hidden="true" />
              <span>All Accounts</span>
            </div>
          </div>

          <div className="mt-3 divide-y divide-border/60">
            {SAMPLE_TRANSACTIONS.map((tx) => {
              const Icon = tx.icon;
              const isInflow = tx.type === "inflow";

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 py-3.5 transition-colors first:pt-2 last:pb-1"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${
                        isInflow
                          ? "border-brand-secondary/25 bg-brand-secondary/10 text-brand-secondary"
                          : "border-border bg-surface-secondary/70 text-muted-foreground dark:bg-white/[0.03]"
                      }`}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground sm:text-sm">
                        {tx.merchant}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span>{tx.category}</span>
                        <span aria-hidden="true">&middot;</span>
                        <span>{tx.account}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 text-right">
                    <div className="hidden sm:block">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                          tx.status === "Settled"
                            ? "border-border bg-surface-secondary/60 text-muted-foreground dark:bg-white/[0.03]"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>

                    <div>
                      <p
                        className={`inline-flex items-center gap-0.5 font-mono text-xs font-semibold tabular-nums sm:text-sm ${
                          isInflow ? "text-brand-secondary" : "text-foreground"
                        }`}
                      >
                        {isInflow ? (
                          <ArrowDownLeft
                            className="size-3.5 shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <ArrowUpRight
                            className="size-3.5 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                        )}
                        <span>{tx.amount}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {tx.date}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-border/70 bg-surface-secondary/50 px-3.5 py-2.5 text-xs text-muted-foreground dark:bg-white/[0.02]">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            <span>
              Placeholder transactions shown for layout preview. No database
              records created.
            </span>
          </span>
        </div>
      </section>

      <section
        id="budgets"
        aria-labelledby="budget-allocation-heading"
        className="glass-card flex flex-col justify-between rounded-2xl p-5 sm:p-6"
      >
        <div>
          <div className="border-b border-border pb-4">
            <h2
              id="budget-allocation-heading"
              className="font-heading text-base font-semibold tracking-tight text-foreground"
            >
              Monthly Allocation
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Category targets and cash flow distribution
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {BUDGET_ALLOCATIONS.map((item) => {
              const isPrimary = item.accent === "primary";
              return (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">
                      {item.category}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                      <strong className="font-semibold text-foreground">
                        {item.spent}
                      </strong>{" "}
                      / {item.limit}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${item.category} budget usage`}
                    aria-valuenow={item.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2 w-full overflow-hidden rounded-full bg-surface-secondary dark:bg-white/[0.06]"
                  >
                    <div
                      className={`h-full rounded-full transition-all ${
                        isPrimary ? "bg-primary" : "bg-brand-secondary"
                      }`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          id="accounts"
          className="mt-6 rounded-xl border border-border bg-surface-secondary/50 p-4 dark:bg-white/[0.02]"
        >
          <p className="text-xs font-semibold text-foreground">
            Account Synchronization
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Ready to connect checking, savings, and investment ledgers in the
            next module.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg border border-border/70 bg-card px-2.5 py-2">
              <p className="font-mono text-xs font-semibold text-foreground tabular-nums">
                $18,420
              </p>
              <p className="text-[10px] text-muted-foreground">Liquid Cash</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card px-2.5 py-2">
              <p className="font-mono text-xs font-semibold text-brand-secondary tabular-nums">
                $30,500
              </p>
              <p className="text-[10px] text-muted-foreground">Investments</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

