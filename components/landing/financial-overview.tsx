import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Building2,
  CreditCard,
  Banknote,
} from "lucide-react";
import { SAMPLE_FINANCIAL_DATA } from "./landing-sample-data";

export function FinancialOverview() {
  return (
    <section
      aria-labelledby="overview-heading"
      className="relative border-y border-border bg-card/20 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-secondary/30 bg-brand-secondary/10 px-3 py-1 text-xs font-medium text-brand-secondary">
            <span>Unified Financial Snapshot</span>
          </div>
          <h2
            id="overview-heading"
            className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Clear Metrics. Total Visibility.
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            See your true financial health at a glance — without logging into four different bank portals.
          </p>
          <div className="mt-2">
            <span className="inline-block rounded-full border border-border bg-background/80 px-3 py-0.5 text-xs text-muted-foreground">
              {SAMPLE_FINANCIAL_DATA.caption}
            </span>
          </div>
        </div>

        {/* 4 Top Metric Cards */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Net Worth */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Net Worth</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="size-4" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {SAMPLE_FINANCIAL_DATA.netWorth.formatted}
            </p>
            <p className="mt-1 text-xs text-emerald-500 font-medium">
              {SAMPLE_FINANCIAL_DATA.netWorth.change}
            </p>
          </div>

          {/* Monthly Inflow */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-emerald-500/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Monthly Inflow</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <ArrowDownLeft className="size-4" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-500 sm:text-3xl">
              {SAMPLE_FINANCIAL_DATA.monthlyInflow.formatted}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {SAMPLE_FINANCIAL_DATA.monthlyInflow.label}
            </p>
          </div>

          {/* Monthly Outflow */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-rose-500/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Monthly Outflow</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-rose-500 sm:text-3xl">
              {SAMPLE_FINANCIAL_DATA.monthlyOutflow.formatted}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {SAMPLE_FINANCIAL_DATA.monthlyOutflow.label}
            </p>
          </div>

          {/* Net Cash Flow */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-brand-secondary/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Net Cash Flow</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-brand-secondary/10 text-brand-secondary">
                <Wallet className="size-4" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-brand-secondary sm:text-3xl">
              {SAMPLE_FINANCIAL_DATA.netCashFlow.formatted}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {SAMPLE_FINANCIAL_DATA.netCashFlow.label}
            </p>
          </div>
        </div>

        {/* Accounts & Recent Transactions Two-Column Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Account Balances Breakdown */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Linked Accounts</h3>
                <p className="text-xs text-muted-foreground">Liquid assets and liabilities</p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">4 Active</span>
            </div>
            <div className="mt-4 space-y-3">
              {SAMPLE_FINANCIAL_DATA.accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-3.5 transition-colors hover:bg-background/80"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
                      {acc.type === "bank" && <Building2 className="size-4 text-primary" />}
                      {acc.type === "cash" && <Banknote className="size-4 text-emerald-500" />}
                      {acc.type === "credit" && <CreditCard className="size-4 text-amber-500" />}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{acc.name}</p>
                      <p className="text-xs text-muted-foreground">{acc.institution}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        acc.isCredit ? "text-amber-500" : "text-foreground"
                      }`}
                    >
                      {acc.balanceFormatted}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {acc.isCredit ? "Outstanding" : "Available"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Categorized Transactions */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Categorized Transactions</h3>
                <p className="text-xs text-muted-foreground">Clean, chronological money trail</p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">Recent</span>
            </div>
            <div className="mt-4 space-y-3">
              {SAMPLE_FINANCIAL_DATA.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-3.5 transition-colors hover:bg-background/80"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-9 items-center justify-center rounded-lg ${
                        tx.type === "income"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-rose-500/10 text-rose-500"
                      }`}
                    >
                      {tx.type === "income" ? (
                        <ArrowDownLeft className="size-4" aria-hidden="true" />
                      ) : (
                        <ArrowUpRight className="size-4" aria-hidden="true" />
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.category} • {tx.account}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        tx.type === "income" ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {tx.amountFormatted}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

