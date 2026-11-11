"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  PlusCircle,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";

type Step = {
  step: string;
  short: string;
  title: string;
  description: string;
  outcome: string;
  tag: string;
  icon: LucideIcon;
};

const steps: Step[] = [
  {
    step: "01",
    short: "Create account",
    title: "Create your secure account",
    description:
      "Sign up with your email in seconds. Your private database partition is provisioned immediately with strict Row-Level Security.",
    outcome: "A private, isolated workspace, ready instantly",
    tag: "Row-Level Security",
    icon: UserCheck,
  },
  {
    step: "02",
    short: "Add entries",
    title: "Add your accounts & entries",
    description:
      "Set up your bank accounts, credit cards, or cash balances. Log incoming salary and expenses with quick categorization.",
    outcome: "Every balance and transaction in one place",
    tag: "No bank scraping",
    icon: PlusCircle,
  },
  {
    step: "03",
    short: "See your position",
    title: "Understand your true position",
    description:
      "View accurate net worth, monthly cash flow, and spending patterns on your unified dashboard without guesswork.",
    outcome: "Net worth, cash flow and spending at a glance",
    tag: "Unified dashboard",
    icon: BarChart3,
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/* ---------- Bare visuals: type + lines only, no containers ---------- */

function CountUp({ to, active }: { to: number; active: boolean }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? to : 0);
  const text = useTransform(
    mv,
    (v) => "₹" + new Intl.NumberFormat("en-IN").format(Math.round(v)),
  );

  useEffect(() => {
    if (!active || reduce) return;
    const controls = animate(mv, to, { duration: 1.8, ease: EASE });
    return () => controls.stop();
  }, [active, reduce, to, mv]);

  return <motion.span>{text}</motion.span>;
}

function VisualAccount({ active }: { active: boolean }) {
  return (
    <div aria-hidden="true" className="font-mono">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
        Email
      </p>
      <div className="mt-2 flex items-center gap-1 border-b border-dashed border-border pb-3 text-xl text-foreground/90">
        <span>you@email.com</span>
        <span className="h-6 w-px animate-pulse bg-primary motion-reduce:animate-none" />
      </div>
      <motion.p
        initial={false}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 6 }}
        transition={{ duration: 0.5, delay: 0.5, ease: EASE }}
        className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"
      >
        <Check className="size-3.5 text-brand-secondary" />
        Partition provisioned · RLS enabled
      </motion.p>
    </div>
  );
}

function VisualLedger({ active }: { active: boolean }) {
  const rows = [
    { label: "Salary", amount: "+₹85,000", positive: true },
    { label: "Rent", amount: "−₹18,000", positive: false },
    { label: "Groceries", amount: "−₹4,200", positive: false },
  ];
  return (
    <div aria-hidden="true">
      <ul className="font-mono text-base">
        {rows.map((r, i) => (
          <motion.li
            key={r.label}
            initial={false}
            animate={{ opacity: active ? 1 : 0, x: active ? 0 : -10 }}
            transition={{ duration: 0.5, delay: 0.25 + i * 0.15, ease: EASE }}
            className="flex items-center justify-between border-b border-dashed border-border py-3"
          >
            <span className="text-muted-foreground">{r.label}</span>
            <span
              className={
                r.positive ? "text-brand-secondary" : "text-foreground/80"
              }
            >
              {r.amount}
            </span>
          </motion.li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground/60">
        Sample entries
      </p>
    </div>
  );
}

function VisualNetWorth({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  const line = "M0 40 C 20 38, 30 30, 50 32 S 80 18, 100 20 S 135 8, 160 4";
  return (
    <div aria-hidden="true">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
        Net worth
      </p>
      <p className="mt-1 text-5xl font-semibold tabular-nums tracking-tight text-foreground">
        <CountUp to={482350} active={active} />
      </p>
      <svg
        viewBox="0 0 160 48"
        className="mt-4 h-16 w-full overflow-visible text-primary"
        fill="none"
      >
        <defs>
          <linearGradient id="nw-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={`${line} L160 48 L0 48 Z`}
          fill="url(#nw-fill)"
          initial={false}
          animate={{ opacity: active ? 1 : 0 }}
          transition={{ duration: 0.8, delay: reduce ? 0 : 0.9 }}
        />
        <motion.path
          d={line}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: active ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 1.6, ease: EASE }}
        />
        <motion.circle
          cx="160"
          cy="4"
          r="3"
          fill="currentColor"
          initial={false}
          animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0 }}
          transition={{ duration: 0.4, delay: reduce ? 0 : 1.7 }}
        />
      </svg>
      <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground/60">
        Sample data
      </p>
    </div>
  );
}

const visuals = [VisualAccount, VisualLedger, VisualNetWorth];

/* ------------- Left: sticky stepper = the whole flow at a glance ------------- */

function Stepper({ current }: { current: number }) {
  const reduce = useReducedMotion();
  const progress = current / (steps.length - 1);

  return (
    <nav aria-label="Steps overview" className="relative mt-10">
      {/* track */}
      <span
        aria-hidden="true"
        className="absolute bottom-4 left-[15px] top-4 w-px bg-border"
      />
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ scaleY: progress }}
        transition={{ duration: reduce ? 0 : 0.6, ease: EASE }}
        style={{ transformOrigin: "top" }}
        className="absolute bottom-4 left-[15px] top-4 w-px bg-gradient-to-b from-primary to-brand-secondary"
      />
      <ol className="relative space-y-2">
        {steps.map((s, i) => {
          const state = i < current ? "done" : i === current ? "current" : "todo";
          return (
            <li key={s.step}>
              <a
                href={`#step-${s.step}`}
                aria-current={state === "current" ? "step" : undefined}
                className="group/nav flex items-center gap-4 rounded-lg py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span
                  className={`relative flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold transition-all duration-500 ${
                    state === "todo"
                      ? "border-border bg-background text-muted-foreground group-hover/nav:border-primary/60"
                      : "border-primary bg-primary text-primary-foreground"
                  } ${
                    state === "current"
                      ? "shadow-[0_0_0_6px_color-mix(in_oklab,var(--color-primary)_18%,transparent)]"
                      : ""
                  }`}
                >
                  {state === "done" ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    s.step
                  )}
                </span>
                <span
                  className={`text-base font-medium tracking-tight transition-colors duration-300 ${
                    state === "current"
                      ? "text-foreground"
                      : "text-muted-foreground group-hover/nav:text-foreground"
                  }`}
                >
                  {s.short}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ---------------------------- Right: one step ---------------------------- */

function StepBlock({
  item,
  index,
  onActive,
}: {
  item: Step;
  index: number;
  onActive: (i: number) => void;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLLIElement>(null);

  // thin band at viewport centre decides which step is "current"
  const isCurrent = useInView(ref, { margin: "-45% 0px -45% 0px" });
  // looser trigger plays the visual once
  const seen = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });

  useEffect(() => {
    if (isCurrent) onActive(index);
  }, [isCurrent, index, onActive]);

  const Icon = item.icon;
  const Visual = visuals[index];

  return (
    <motion.li
      ref={ref}
      id={`step-${item.step}`}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: reduce ? 0 : 0.7, ease: EASE }}
      className="scroll-mt-28 border-t border-border py-12 first:border-t-0 first:pt-0 lg:py-16 lg:first:pt-2"
    >
      {/* Step marker */}
      <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <span className="bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
          Step {item.step}
        </span>
        <span aria-hidden="true">/ 03</span>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <Icon aria-hidden="true" className="size-5 text-primary" />
      </div>

      <h3 className="mt-6 max-w-xl text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
        <span className="sr-only">Step {item.step}: </span>
        {item.title}
      </h3>

      <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
        {item.description}
      </p>

      {/* Visual sits on the page itself, separated by a single accent rule */}
      <div className="mt-10 grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="max-w-md border-l-2 border-primary/40 pl-6">
          <Visual active={seen} />
        </div>
      </div>

      {/* Plain-language outcome */}
      <dl className="mt-10 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-2">
          <dt className="sr-only">Outcome</dt>
          <dd className="flex items-center gap-2 font-medium text-foreground">
            <Check
              aria-hidden="true"
              className="size-4 shrink-0 text-brand-secondary"
            />
            {item.outcome}
          </dd>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary/80">
          <span aria-hidden="true" className="h-px w-6 bg-primary/60" />
          {item.tag}
        </div>
      </dl>
    </motion.li>
  );
}

/* ---------------------- Magnetic CTA ---------------------- */

function MagneticCTA({ href, children }: { href: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  const spring = { stiffness: 180, damping: 16, mass: 0.3 };
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);

  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.25);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.35);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a
      href={href}
      style={{ x, y }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="group/cta relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground shadow-[0_10px_40px_-10px_color-mix(in_oklab,var(--color-primary)_75%,transparent)] transition-shadow duration-300 hover:shadow-[0_14px_50px_-8px_color-mix(in_oklab,var(--color-primary)_90%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover/cta:translate-x-full motion-reduce:hidden"
      />
      <span className="relative">{children}</span>
      <ArrowRight
        aria-hidden="true"
        className="relative size-4 transition-transform duration-300 group-hover/cta:translate-x-1"
      />
    </motion.a>
  );
}

/* ---------------------------- Section ---------------------------- */

export function HowItWorks({ ctaHref = "/signup" }: { ctaHref?: string }) {
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(0);

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

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      // overflow-clip (not hidden) so the sticky column still works
      className="relative isolate scroll-mt-20 overflow-clip border-t border-border bg-background py-20 sm:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top_left,black_15%,transparent_65%)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-50" />
        <div className="absolute left-1/4 top-0 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:gap-20 lg:px-8">
        {/* LEFT: sticky overview */}
        <motion.div
          variants={list}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start"
        >
          <motion.p
            variants={rise}
            className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            3 steps · set up in minutes
          </motion.p>

          <motion.h2
            variants={rise}
            id="how-it-works-heading"
            className="mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl"
          >
            How{" "}
            <span className="bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
              Coinsight
            </span>{" "}
            Works
          </motion.h2>

          <motion.p
            variants={rise}
            className="mt-4 max-w-md text-pretty text-base text-muted-foreground sm:text-lg"
          >
            No complicated aggregators or third-party bank screen-scrapers. Take
            ownership in minutes.
          </motion.p>

          <motion.div variants={rise}>
            <Stepper current={current} />
          </motion.div>

          <motion.div variants={rise} className="mt-10 hidden lg:block">
            <MagneticCTA href={ctaHref}>Start tracking your net worth</MagneticCTA>
            <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground/70">
              No bank scraping · Row-Level Security
            </p>
          </motion.div>
        </motion.div>

        {/* RIGHT: the steps */}
        <ol className="lg:col-span-7">
          {steps.map((item, i) => (
            <StepBlock
              key={item.step}
              item={item}
              index={i}
              onActive={setCurrent}
            />
          ))}
        </ol>

        {/* Mobile/tablet CTA (the sticky one is desktop-only) */}
        <div className="lg:hidden">
          <MagneticCTA href={ctaHref}>Start tracking your net worth</MagneticCTA>
          <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground/70">
            No bank scraping · Row-Level Security
          </p>
        </div>
      </div>
    </section>
  );
}