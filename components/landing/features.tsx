import {
  Wallet,
  ReceiptText,
  ArrowLeftRight,
  PieChart,
  Target,
  Sparkles,
} from "lucide-react";

export function Features() {
  const coreFeatures = [
    {
      title: "Account Management",
      description:
        "Manage cash, savings, current accounts, and credit cards. Track balances accurately with immutability guarantees once history begins.",
      icon: Wallet,
      tag: "Live",
      tagColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
    },
    {
      title: "Transaction Tracking",
      description:
        "Record and classify every rupee. Filter by date, category, account, or type with sub-millisecond search across your entire financial trail.",
      icon: ReceiptText,
      tag: "Live",
      tagColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
    },
    {
      title: "Transfers Separation",
      description:
        "Moving money between your own accounts never counts as income or an expense. Account-to-account transfers stay strictly neutral.",
      icon: ArrowLeftRight,
      tag: "Core Architecture",
      tagColor: "border-primary/30 bg-primary/10 text-primary",
    },
    {
      title: "Financial Overview",
      description:
        "Instant net worth calculation and monthly cash flow insights computed directly in the database without slow client recalculations.",
      icon: PieChart,
      tag: "Live",
      tagColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
    },
    {
      title: "Category Budgets",
      description:
        "Set strict monthly allocation limits for dining, shopping, and utilities. Receive proactive alerts before overspending occurs.",
      icon: Sparkles,
      tag: "Coming soon",
      tagColor: "border-amber-500/30 bg-amber-500/10 text-amber-500",
    },
    {
      title: "Milestone Financial Goals",
      description:
        "Define emergency funds, vacation savings, or debt payoffs with automated trajectory tracking towards your target dates.",
      icon: Target,
      tag: "Coming soon",
      tagColor: "border-amber-500/30 bg-amber-500/10 text-amber-500",
    },
  ];

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="scroll-mt-20 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span>Engineered for Clarity</span>
          </div>
          <h2
            id="features-heading"
            className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Built for Exacting Financial Discipline
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Every feature in Coinsight is built around mathematical precision, data isolation, and
            actionable clarity.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {coreFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs transition-all duration-200 hover:border-primary/40 hover:bg-card/90"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${feat.tagColor}`}
                    >
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/40 text-xs text-muted-foreground/80 flex items-center justify-between">
                  <span>INR currency native</span>
                  <span className="size-1 rounded-full bg-border" />
                  <span>Realtime balance sync</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

