"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  Building2,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { buildSparkline } from "@/lib/sparkline";
import {
  SAMPLE_FINANCIAL_DATA,
  type SampleAccount,
  type SampleTransaction,
} from "./landing-sample-data";

const EASE = [0.22, 1, 0.36, 1] as const;

const numberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

function rupees(value: number) {
  return `₹${numberFormatter.format(value)}`;
}

/* ----------------------------- Derived figures ----------------------------- */

const DATA = SAMPLE_FINANCIAL_DATA;
const NET_WORTH = DATA.netWorth;

const LIQUID_ASSETS = DATA.accounts
  .filter((account) => !account.isCredit)
  .reduce((total, account) => total + account.balance, 0);
const TOTAL_LIABILITIES = DATA.accounts
  .filter((account) => account.isCredit)
  .reduce((total, account) => total + account.balance, 0);
const BANK_ASSETS = DATA.accounts
  .filter((account) => account.type === "bank")
  .reduce((total, account) => total + account.balance, 0);

const PREVIOUS_NET_WORTH = NET_WORTH.amount - NET_WORTH.changeAmount;
const GROWTH_PCT = (NET_WORTH.changeAmount / PREVIOUS_NET_WORTH) * 100;
const OUTFLOW_PCT = (DATA.monthlyOutflow.amount / DATA.monthlyInflow.amount) * 100;
const SAVINGS_RATE =
  (DATA.netCashFlow.amount / DATA.monthlyInflow.amount) * 100;
const BANK_PCT = (BANK_ASSETS / LIQUID_ASSETS) * 100;

/* ------------------------------- Sparkline -------------------------------- */

const CHART_W = 600;
const CHART_H = 180;

const {
  line: LINE_PATH,
  area: AREA_PATH,
  last: LAST_POINT,
} = buildSparkline(NET_WORTH.trend, CHART_W, CHART_H);

/* --------------------------------- Atoms ---------------------------------- */

const CATEGORY_TONE: Record<string, string> = {
  Salary: "bg-brand-secondary",
  Housing: "bg-primary",
  "Food & Groceries": "bg-amber-500",
  Transportation: "bg-sky-500",
  Utilities: "bg-violet-500",
  Health: "bg-pink-500",
};

function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group/panel relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/70 p-5 backdrop-blur-sm transition-colors duration-300 hover:border-primary/30 sm:p-6",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity duration-500 group-hover/panel:opacity-100"
      />
      {children}
    </div>
  );
}

function PanelHeader({
  title,
  hint,
  meta,
}: {
  title: string;
  hint: string;
  meta: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
      <span className="shrink-0 pt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
        {meta}
      </span>
    </div>
  );
}

function Meter({
  pct,
  tone,
  delay = 0,
}: {
  pct: number;
  tone: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const width = Math.min(100, Math.max(0, pct));

  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/70">
      <motion.div
        initial={reduce ? false : { width: 0 }}
        whileInView={{ width: `${width}%` }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: reduce ? 0 : 1.1, delay, ease: EASE }}
        className={cn("h-full rounded-full", tone)}
      />
    </div>
  );
}

function AccountIcon({ type }: { type: SampleAccount["type"] }) {
  if (type === "bank") {
    return (
      <Building2 className="size-4 text-primary" aria-hidden="true" />
    );
  }
  if (type === "cash") {
    return (
      <Banknote className="size-4 text-brand-secondary" aria-hidden="true" />
    );
  }
  return <CreditCard className="size-4 text-amber-500" aria-hidden="true" />;
}

function TransactionIcon({ type }: { type: SampleTransaction["type"] }) {
  const isIncome = type === "income";

  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg",
        isIncome
          ? "bg-brand-secondary/10 text-brand-secondary"
          : "bg-rose-500/10 text-rose-500"
      )}
    >
      {isIncome ? (
        <ArrowDownLeft className="size-4" aria-hidden="true" />
      ) : (
        <ArrowUpRight className="size-4" aria-hidden="true" />
      )}
    </span>
  );
}

/* --------------------------------- Chart ---------------------------------- */

function NetWorthChart() {
  const reduce = useReducedMotion();

  return (
    <div className="mt-6">
      <div className="relative h-36 w-full sm:h-40">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="fo-nw-area" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                style={{ stopColor: "var(--color-primary)", stopOpacity: 0.24 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "var(--color-primary)", stopOpacity: 0 }}
              />
            </linearGradient>
            <linearGradient id="fo-nw-line" x1="0" y1="0" x2="1" y2="0">
              <stop
                offset="0%"
                style={{ stopColor: "var(--color-primary)" }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "var(--color-brand-secondary)" }}
              />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              x2={CHART_W}
              y1={CHART_H * ratio}
              y2={CHART_H * ratio}
              strokeWidth="1"
              strokeDasharray="4 8"
              vectorEffect="non-scaling-stroke"
              className="stroke-border"
            />
          ))}

          <motion.path
            d={AREA_PATH}
            fill="url(#fo-nw-area)"
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: reduce ? 0 : 0.9, delay: 0.35, ease: EASE }}
          />
          <motion.path
            d={LINE_PATH}
            stroke="url(#fo-nw-line)"
            strokeWidth="2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={reduce ? false : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: reduce ? 0 : 1.5, ease: EASE }}
          />
        </svg>

        <motion.span
          initial={reduce ? false : { opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 1.5 }}
          style={{
            left: `${(LAST_POINT.x / CHART_W) * 100}%`,
            top: `${(LAST_POINT.y / CHART_H) * 100}%`,
          }}
          className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-secondary ring-4 ring-brand-secondary/20"
          aria-hidden="true"
        />
      </div>

      <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
        {NET_WORTH.trendMonths.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- Section --------------------------------- */

export function FinancialOverview() {
  const reduce = useReducedMotion();

  const rise = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: reduce ? 0 : 0.7, delay, ease: EASE },
  });

  return (
    <section
      id="overview"
      aria-labelledby="overview-heading"
      className="relative isolate overflow-clip scroll-mt-20 border-y border-border bg-surface-secondary/40 py-20 sm:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_70%)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-50" />
        <div className="absolute left-1/2 top-0 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-[32rem] translate-x-1/4 rounded-full bg-brand-secondary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          {...rise()}
          className="grid items-end gap-8 lg:grid-cols-12 lg:gap-12"
        >
          <div className="lg:col-span-7">
            <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-secondary/60 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-brand-secondary" />
              </span>
              Unified financial snapshot
            </p>
            <h2
              id="overview-heading"
              className="mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl"
            >
              Clear Metrics.{" "}
              <span className="bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
                Total Visibility.
              </span>
            </h2>
          </div>

          <div className="lg:col-span-5 lg:pb-2">
            <p className="text-pretty text-base text-muted-foreground sm:text-lg">
              See your true financial health at a glance — without logging into
              four different bank portals.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/80">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              {DATA.caption}
            </p>
          </div>
        </motion.div>

        {/* Bento dashboard */}
        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
          {/* Net worth */}
          <motion.div {...rise(0.05)} className="lg:col-span-7">
            <Panel>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <TrendingUp className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">
                      Total net worth
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Assets minus outstanding credit
                    </p>
                  </div>
                </div>
                <span className="shrink-0 pt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  6-month trend
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <p className="text-4xl font-semibold tabular-nums tracking-tight text-foreground sm:text-5xl">
                  {NET_WORTH.formatted}
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  {rupees(NET_WORTH.changeAmount)}
                  <span className="text-emerald-600/70 dark:text-emerald-400/70">
                    · {GROWTH_PCT.toFixed(1)}%
                  </span>
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                vs. {rupees(PREVIOUS_NET_WORTH)} last month
              </p>

              <NetWorthChart />

              <dl className="mt-auto grid grid-cols-2 gap-4 border-t border-border/70 pt-5">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                    Assets
                  </dt>
                  <dd className="mt-1 flex items-center gap-2 font-mono text-sm font-semibold tabular-nums text-foreground">
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                    {rupees(LIQUID_ASSETS)}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                    Liabilities
                  </dt>
                  <dd className="mt-1 flex items-center gap-2 font-mono text-sm font-semibold tabular-nums text-foreground">
                    <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                    {rupees(TOTAL_LIABILITIES)}
                  </dd>
                </div>
              </dl>
            </Panel>
          </motion.div>

          {/* Monthly cash flow */}
          <motion.div {...rise(0.12)} className="lg:col-span-5">
            <Panel>
              <PanelHeader
                title="Monthly cash flow"
                hint="Money in versus money out"
                meta="November"
              />

              <div className="mt-6 space-y-5">
                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ArrowDownLeft
                        className="size-3.5 text-brand-secondary"
                        aria-hidden="true"
                      />
                      Money in
                    </span>
                    <span className="font-mono text-sm font-semibold tabular-nums text-brand-secondary">
                      {DATA.monthlyInflow.formatted}
                    </span>
                  </div>
                  <Meter pct={100} tone="bg-brand-secondary" delay={0.1} />
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ArrowUpRight
                        className="size-3.5 text-rose-500"
                        aria-hidden="true"
                      />
                      Money out
                    </span>
                    <span className="font-mono text-sm font-semibold tabular-nums text-rose-500">
                      {DATA.monthlyOutflow.formatted}
                    </span>
                  </div>
                  <Meter
                    pct={OUTFLOW_PCT}
                    tone="bg-rose-500/80"
                    delay={0.2}
                  />
                </div>
              </div>

              <div className="mt-6 flex items-end justify-between gap-4 border-t border-border/70 pt-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                    Net cash flow
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-brand-secondary">
                    {DATA.netCashFlow.formatted}
                  </p>
                </div>
                <p className="max-w-[9rem] text-right text-[11px] leading-snug text-muted-foreground">
                  {DATA.netCashFlow.label}
                </p>
              </div>

              <div className="mt-auto pt-5">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">Savings rate</span>
                  <span className="font-mono font-semibold tabular-nums text-foreground">
                    {SAVINGS_RATE.toFixed(1)}%
                  </span>
                </div>
                <Meter
                  pct={SAVINGS_RATE}
                  tone="bg-gradient-to-r from-brand-secondary to-primary"
                  delay={0.3}
                />
                <p className="mt-2 text-[11px] text-muted-foreground/80">
                  {rupees(DATA.netCashFlow.amount)} kept of{" "}
                  {rupees(DATA.monthlyInflow.amount)} earned
                </p>
              </div>
            </Panel>
          </motion.div>

          {/* Linked accounts */}
          <motion.div {...rise(0.18)} className="lg:col-span-5">
            <Panel>
              <PanelHeader
                title="Linked accounts"
                hint="Liquid assets and liabilities"
                meta="4 accounts"
              />

              <div className="mt-5 flex h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                <motion.span
                  initial={reduce ? false : { width: 0 }}
                  whileInView={{ width: `${BANK_PCT}%` }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: reduce ? 0 : 1, delay: 0.15, ease: EASE }}
                  className="h-full bg-primary"
                />
                <motion.span
                  initial={reduce ? false : { width: 0 }}
                  whileInView={{ width: `${100 - BANK_PCT}%` }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: reduce ? 0 : 1, delay: 0.35, ease: EASE }}
                  className="h-full bg-brand-secondary"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                  Bank accounts
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="size-1.5 rounded-full bg-brand-secondary"
                    aria-hidden="true"
                  />
                  Cash
                </span>
              </div>

              <ul className="mt-3">
                {DATA.accounts.map((account) => (
                  <li
                    key={account.id}
                    className="group/row flex items-center justify-between gap-4 border-b border-dashed border-border/80 py-4 last:border-b-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background/70 transition-colors duration-300 group-hover/row:border-primary/30">
                        <AccountIcon type={account.type} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {account.name}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {account.institution}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          "font-mono text-sm font-semibold tabular-nums",
                          account.isCredit ? "text-amber-500" : "text-foreground"
                        )}
                      >
                        {account.balanceFormatted}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                        {account.isCredit ? "Outstanding" : "Available"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="mt-auto pt-4 text-[11px] leading-relaxed text-muted-foreground">
                Credit balances count as liabilities and reduce net worth.
              </p>
            </Panel>
          </motion.div>

          {/* Categorized transactions */}
          <motion.div {...rise(0.24)} className="lg:col-span-7">
            <Panel>
              <PanelHeader
                title="Categorized transactions"
                hint="Clean, chronological money trail"
                meta="Recent"
              />

              <ul className="mt-4">
                {DATA.recentTransactions.map((transaction) => {
                  const isIncome = transaction.type === "income";

                  return (
                    <li
                      key={transaction.id}
                      className="group/row flex items-center justify-between gap-4 border-b border-dashed border-border/80 py-3 last:border-b-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <TransactionIcon type={transaction.type} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {transaction.description}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span
                              className={cn(
                                "size-1.5 shrink-0 rounded-full",
                                CATEGORY_TONE[transaction.category] ??
                                  "bg-muted-foreground"
                              )}
                              aria-hidden="true"
                            />
                            <span className="truncate">{transaction.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{transaction.account}</span>
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={cn(
                            "font-mono text-sm font-semibold tabular-nums",
                            isIncome ? "text-brand-secondary" : "text-rose-500"
                          )}
                        >
                          {transaction.amountFormatted}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                          {transaction.date}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-auto flex items-center gap-2 pt-4 text-[11px] text-muted-foreground">
                <ArrowLeftRight className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                Own-account transfers never count as income or expenses.
              </p>
            </Panel>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
