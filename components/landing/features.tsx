"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  ArrowLeftRight,
  Check,
  Lock,
  PieChart,
  ReceiptText,
  Search,
  Sparkles,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useState, type KeyboardEvent, type ReactNode } from "react";

type Tone = "live" | "core" | "soon";

type Feature = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tag: string;
  tone: Tone;
};

const features: Feature[] = [
  {
    id: "accounts",
    title: "Account Management",
    description:
      "Manage cash, savings, current accounts, and credit cards. Track balances accurately with immutability guarantees once history begins.",
    icon: Wallet,
    tag: "Live",
    tone: "live",
  },
  {
    id: "transactions",
    title: "Transaction Tracking",
    description:
      "Record and classify every rupee. Filter by date, category, account, or type with sub-millisecond search across your entire financial trail.",
    icon: ReceiptText,
    tag: "Live",
    tone: "live",
  },
  {
    id: "transfers",
    title: "Transfers Separation",
    description:
      "Moving money between your own accounts never counts as income or an expense. Account-to-account transfers stay strictly neutral.",
    icon: ArrowLeftRight,
    tag: "Core Architecture",
    tone: "core",
  },
  {
    id: "overview",
    title: "Financial Overview",
    description:
      "Instant net worth calculation and monthly cash flow insights computed directly in the database without slow client recalculations.",
    icon: PieChart,
    tag: "Live",
    tone: "live",
  },
  {
    id: "budgets",
    title: "Category Budgets",
    description:
      "Set strict monthly allocation limits for dining, shopping, and utilities. Receive proactive alerts before overspending occurs.",
    icon: Sparkles,
    tag: "Coming soon",
    tone: "soon",
  },
  {
    id: "goals",
    title: "Milestone Financial Goals",
    description:
      "Define emergency funds, vacation savings, or debt payoffs with automated trajectory tracking towards your target dates.",
    icon: Target,
    tag: "Coming soon",
    tone: "soon",
  },
];

const tone: Record<Tone, { dot: string; text: string }> = {
  live: { dot: "bg-emerald-500", text: "text-emerald-500" },
  core: { dot: "bg-primary", text: "text-primary" },
  soon: { dot: "bg-amber-500", text: "text-amber-500" },
};

const EASE = [0.22, 1, 0.36, 1] as const;

/* ---------------- Bare visuals: type + lines, sample data ---------------- */

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
      {children}
    </p>
  );
}

function Row({
  left,
  right,
  rightClass = "text-foreground/90",
  delay = 0,
}: {
  left: string;
  right: string;
  rightClass?: string;
  delay?: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay, ease: EASE }}
      className="flex items-center justify-between border-b border-dashed border-border py-3"
    >
      <span className="text-muted-foreground">{left}</span>
      <span className={`tabular-nums ${rightClass}`}>{right}</span>
    </motion.li>
  );
}

function Bar({
  pct,
  delay = 0,
  className = "bg-primary",
}: {
  pct: number;
  delay?: number;
  className?: string;
}) {
  return (
    <div className="h-1.5 w-full rounded-full bg-border/70">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, delay, ease: EASE }}
        className={`h-full rounded-full ${className}`}
      />
    </div>
  );
}

function VisualAccounts() {
  return (
    <div className="font-mono text-base">
      <Label>Accounts</Label>
      <ul className="mt-1">
        <Row left="Cash" right="₹12,400" delay={0.05} />
        <Row left="Savings" right="₹2,35,000" delay={0.15} />
        <Row left="Credit card" right="−₹8,900" delay={0.25} />
      </ul>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="size-3.5 text-primary" aria-hidden="true" />
        Opening balance locks once history begins
      </p>
    </div>
  );
}

function VisualTransactions() {
  return (
    <div className="font-mono">
      <div className="flex items-center gap-3 border-b border-dashed border-border pb-3 text-lg text-foreground/90">
        <Search className="size-4 text-muted-foreground" aria-hidden="true" />
        <span>groceries</span>
        <span className="h-5 w-px animate-pulse bg-primary motion-reduce:animate-none" />
      </div>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] uppercase tracking-widest text-muted-foreground">
        <span className="text-primary">Date</span>
        <span>Category</span>
        <span>Account</span>
        <span>Type</span>
      </p>
      <ul className="mt-2 text-base">
        <Row left="Big Basket" right="−₹1,840" delay={0.05} />
        <Row left="Local market" right="−₹620" delay={0.15} />
        <Row left="Reliance Fresh" right="−₹2,140" delay={0.25} />
      </ul>
    </div>
  );
}

function VisualTransfers() {
  return (
    <div className="font-mono">
      <Label>Transfer</Label>
      <p className="mt-2 flex flex-wrap items-center gap-3 text-xl text-foreground">
        Savings
        <ArrowLeftRight
          className="size-5 text-primary"
          aria-hidden="true"
        />
        Cash
        <span className="text-muted-foreground">₹5,000</span>
      </p>
      <ul className="mt-3 text-base">
        <Row left="Counted as income" right="₹0" delay={0.1} />
        <Row left="Counted as expense" right="₹0" delay={0.2} />
        <Row
          left="Net worth"
          right="Unchanged"
          rightClass="text-brand-secondary"
          delay={0.3}
        />
      </ul>
    </div>
  );
}

function VisualOverview() {
  return (
    <div className="font-mono">
      <Label>Net worth</Label>
      <p className="mt-1 text-5xl font-semibold tabular-nums tracking-tight text-foreground">
        ₹4,82,350
      </p>
      <div className="mt-6 space-y-4 text-sm">
        <div>
          <div className="mb-2 flex justify-between text-muted-foreground">
            <span>Money in</span>
            <span className="text-brand-secondary">₹85,000</span>
          </div>
          <Bar pct={100} className="bg-brand-secondary" />
        </div>
        <div>
          <div className="mb-2 flex justify-between text-muted-foreground">
            <span>Money out</span>
            <span className="text-foreground/80">₹22,200</span>
          </div>
          <Bar pct={26} delay={0.15} />
        </div>
      </div>
    </div>
  );
}

function VisualBudgets() {
  const items = [
    { label: "Dining", pct: 80, warn: true },
    { label: "Shopping", pct: 45, warn: false },
    { label: "Utilities", pct: 60, warn: false },
  ];
  return (
    <div className="font-mono text-sm">
      <Label>This month · preview</Label>
      <div className="mt-3 space-y-4">
        {items.map((b, i) => (
          <div key={b.label}>
            <div className="mb-2 flex justify-between text-muted-foreground">
              <span>{b.label}</span>
              <span className={b.warn ? "text-amber-500" : ""}>{b.pct}%</span>
            </div>
            <Bar
              pct={b.pct}
              delay={i * 0.12}
              className={b.warn ? "bg-amber-500" : "bg-primary"}
            />
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-amber-500">
        Alert: Dining is at 80% of its limit
      </p>
    </div>
  );
}

function VisualGoals() {
  const items = [
    { label: "Emergency fund", pct: 62 },
    { label: "Vacation", pct: 35 },
    { label: "Debt payoff", pct: 78 },
  ];
  return (
    <div className="font-mono text-sm">
      <Label>Goals · preview</Label>
      <div className="mt-3 space-y-4">
        {items.map((g, i) => (
          <div key={g.label}>
            <div className="mb-2 flex justify-between text-muted-foreground">
              <span>{g.label}</span>
              <span>{g.pct}%</span>
            </div>
            <Bar pct={g.pct} delay={i * 0.12} />
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Trajectory tracked towards each target date
      </p>
    </div>
  );
}

const visuals: Record<string, () => ReactNode> = {
  accounts: () => <VisualAccounts />,
  transactions: () => <VisualTransactions />,
  transfers: () => <VisualTransfers />,
  overview: () => <VisualOverview />,
  budgets: () => <VisualBudgets />,
  goals: () => <VisualGoals />,
};

/* ---------------------------- Shared bits ---------------------------- */

function Status({ f }: { f: Feature }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest ${tone[f.tone].text}`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${tone[f.tone].dot}`}
      />
      {f.tag}
    </span>
  );
}

/* ---------------------------- Section ---------------------------- */

export function Features() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const current = features[active];
  const CurrentIcon = current.icon;

  const list: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.12 } },
  };
  const rise: Variants = {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.7, ease: EASE },
    },
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const next =
      (active + (e.key === "ArrowDown" ? 1 : -1) + features.length) %
      features.length;
    setActive(next);
    document.getElementById(`feat-tab-${features[next].id}`)?.focus();
  };

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="relative isolate scroll-mt-20 overflow-clip py-20 sm:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top_right,black_15%,transparent_65%)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-50" />
        <div className="absolute right-1/4 top-0 h-72 w-[44rem] translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          variants={list}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid items-end gap-8 lg:grid-cols-12 lg:gap-12"
        >
          <div className="lg:col-span-7">
            <motion.p
              variants={rise}
              className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Engineered for Clarity
            </motion.p>
            <motion.h2
              variants={rise}
              id="features-heading"
              className="mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl"
            >
              Built for Exacting{" "}
              <span className="bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
                Financial Discipline
              </span>
            </motion.h2>
          </div>
          <motion.p
            variants={rise}
            className="text-pretty text-base text-muted-foreground sm:text-lg lg:col-span-5 lg:pb-2"
          >
            Every feature in Coinsight is built around mathematical precision,
            data isolation, and actionable clarity.
          </motion.p>
        </motion.div>

        {/* Desktop: master / detail */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: reduce ? 0 : 0.7, ease: EASE }}
          className="mt-16 hidden border-t border-border pt-4 lg:grid lg:grid-cols-12 lg:gap-16"
        >
          <div
            role="tablist"
            aria-label="Features"
            aria-orientation="vertical"
            onKeyDown={onKey}
            className="lg:col-span-5"
          >
            {features.map((f, i) => {
              const Icon = f.icon;
              const selected = i === active;
              return (
                <button
                  key={f.id}
                  id={`feat-tab-${f.id}`}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls="feat-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  className="group/tab relative flex w-full items-center gap-4 border-b border-border py-5 pl-5 pr-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
                >
                  {selected && (
                    <motion.span
                      layoutId="feat-bar"
                      aria-hidden="true"
                      transition={{
                        duration: reduce ? 0 : 0.4,
                        ease: EASE,
                      }}
                      className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-primary to-brand-secondary"
                    />
                  )}
                  <Icon
                    aria-hidden="true"
                    className={`size-5 shrink-0 transition-colors ${
                      selected
                        ? "text-primary"
                        : "text-muted-foreground group-hover/tab:text-foreground"
                    }`}
                  />
                  <span
                    className={`flex-1 text-lg font-medium tracking-tight transition-colors ${
                      selected
                        ? "text-foreground"
                        : "text-muted-foreground group-hover/tab:text-foreground"
                    }`}
                  >
                    {f.title}
                  </span>
                  <span
                    className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest ${tone[f.tone].text}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`size-1.5 rounded-full ${tone[f.tone].dot}`}
                    />
                    <span className={selected ? "" : "opacity-70"}>
                      {f.tag}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div
            id="feat-panel"
            role="tabpanel"
            aria-labelledby={`feat-tab-${current.id}`}
            className="relative min-h-[26rem] lg:col-span-7"
          >
            <div className="sticky top-28">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={current.id}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
                  className="pt-6"
                >
                  <div className="flex items-center gap-3">
                    <CurrentIcon
                      aria-hidden="true"
                      className="size-6 text-primary"
                    />
                    <Status f={current} />
                  </div>
                  <h3 className="mt-5 max-w-xl text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
                    {current.title}
                  </h3>
                  <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {current.description}
                  </p>
                  <div
                    aria-hidden="true"
                    className="mt-10 max-w-md border-l-2 border-primary/40 pl-6"
                  >
                    {visuals[current.id]()}
                    <p className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground/60">
                      Sample data
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Mobile / tablet: every feature, stacked and fully readable */}
        <ul className="mt-14 border-t border-border lg:hidden">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <motion.li
                key={f.id}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                transition={{ duration: reduce ? 0 : 0.6, ease: EASE }}
                className="border-b border-border py-10"
              >
                <div className="flex items-center gap-3">
                  <Icon aria-hidden="true" className="size-5 text-primary" />
                  <Status f={f} />
                </div>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                  {f.title}
                </h3>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
                <div
                  aria-hidden="true"
                  className="mt-8 max-w-sm border-l-2 border-primary/40 pl-5"
                >
                  {visuals[f.id]()}
                </div>
              </motion.li>
            );
          })}
        </ul>

        {/* Shared guarantees, said once instead of repeated per feature */}
        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.8 }}
          className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium uppercase tracking-widest text-muted-foreground"
        >
          <span className="flex items-center gap-2">
            <Check className="size-4 text-brand-secondary" aria-hidden="true" />
            INR currency native
          </span>
          <span className="flex items-center gap-2">
            <Check className="size-4 text-brand-secondary" aria-hidden="true" />
            Realtime balance sync
          </span>
          <span className="ml-auto hidden text-muted-foreground/70 sm:inline">
            4 live · 2 coming soon
          </span>
        </motion.p>
      </div>
    </section>
  );
}