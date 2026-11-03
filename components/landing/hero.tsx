import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Building2,
  CreditCard,
} from "lucide-react";
import { SAMPLE_FINANCIAL_DATA } from "./landing-sample-data";

interface HeroProps {
  isAuthenticated: boolean;
}

export function Hero({ isAuthenticated }: HeroProps) {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Copy & Actions */}
          <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary backdrop-blur-xs">
              <ShieldCheck className="size-3.5 text-brand-secondary" aria-hidden="true" />
              <span>Personal Finance OS Built for India</span>
            </div>

            {/* Main Headline */}
            <h1
              id="hero-heading"
              className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              Take Control of Your Money.{" "}
              <span className="bg-gradient-to-r from-primary via-primary/90 to-brand-secondary bg-clip-text text-transparent">
                Understand Every Rupee.
              </span>
            </h1>

            {/* Subcopy */}
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
              Track your income, manage expenses, monitor accounts, and understand your financial
              habits — all in one place.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col w-full gap-3 sm:w-auto sm:flex-row sm:items-center">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              )}
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/60 px-6 py-3.5 text-base font-medium text-foreground transition-all hover:bg-card hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <span>Explore Features</span>
              </a>
            </div>

            {/* Micro-assurances */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground sm:justify-start">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-brand-secondary" />
                Strict per-user data isolation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary" />
                Database-enforced access rules
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-brand-secondary" />
                INR (₹) and Indian banks
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Product Preview Card */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              {/* Subtle backglow */}
              <div
                aria-hidden="true"
                className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/20 to-brand-secondary/20 blur-2xl opacity-60"
              />

              {/* Surface Container */}
              <div className="glass-card relative rounded-2xl p-6 shadow-2xl transition-all duration-300 motion-safe:hover:-translate-y-1">
                {/* Header with live sample label */}
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
                      <TrendingUp className="size-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Live Financial Summary</p>
                      <p className="text-[11px] text-muted-foreground">Current month overview</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-border bg-background/60 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {SAMPLE_FINANCIAL_DATA.caption}
                  </span>
                </div>

                {/* Net Worth Card Metric */}
                <div className="mt-5 rounded-xl border border-border/70 bg-background/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Calculated Net Worth</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                      <ArrowUpRight className="size-3" aria-hidden="true" />
                      {SAMPLE_FINANCIAL_DATA.netWorth.change}
                    </span>
                  </div>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {SAMPLE_FINANCIAL_DATA.netWorth.formatted}
                  </p>
                </div>

                {/* Monthly Flow Grid */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ArrowDownLeft className="size-3 text-emerald-500" aria-hidden="true" />
                      <span>Inflow</span>
                    </div>
                    <p className="mt-1 text-base font-semibold text-emerald-500">
                      {SAMPLE_FINANCIAL_DATA.monthlyInflow.formatted}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ArrowUpRight className="size-3 text-rose-500" aria-hidden="true" />
                      <span>Outflow</span>
                    </div>
                    <p className="mt-1 text-base font-semibold text-rose-500">
                      {SAMPLE_FINANCIAL_DATA.monthlyOutflow.formatted}
                    </p>
                  </div>
                </div>

                {/* Recent Activity Snapshot */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Recent activity</p>
                  <div className="space-y-2">
                    {SAMPLE_FINANCIAL_DATA.recentTransactions.slice(0, 2).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between rounded-lg border border-border/40 bg-background/30 p-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex size-6 items-center justify-center rounded-md ${
                              tx.type === "income"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-rose-500/10 text-rose-500"
                            }`}
                          >
                            {tx.type === "income" ? (
                              <ArrowDownLeft className="size-3" aria-hidden="true" />
                            ) : (
                              <ArrowUpRight className="size-3" aria-hidden="true" />
                            )}
                          </span>
                          <div>
                            <p className="font-medium text-foreground">{tx.description}</p>
                            <p className="text-[11px] text-muted-foreground">{tx.category} • {tx.account}</p>
                          </div>
                        </div>
                        <span
                          className={`font-semibold ${
                            tx.type === "income" ? "text-emerald-500" : "text-rose-500"
                          }`}
                        >
                          {tx.amountFormatted}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Account Pills Preview */}
                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="size-3 text-primary" aria-hidden="true" />
                    HDFC, ICICI
                  </span>
                  <span className="flex items-center gap-1">
                    <CreditCard className="size-3 text-brand-secondary" aria-hidden="true" />
                    OneCard Metal
                  </span>
                  <span className="flex items-center gap-1">
                    <Wallet className="size-3 text-amber-500" aria-hidden="true" />
                    Cash
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

