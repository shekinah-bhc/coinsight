"use client";

import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useRef, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { buildSparkline } from "@/lib/sparkline";
import { SAMPLE_FINANCIAL_DATA } from "./landing-sample-data";

const DATA = SAMPLE_FINANCIAL_DATA;

const SPARK_W = 320;
const SPARK_H = 88;
const SPARK = buildSparkline(DATA.netWorth.trend, SPARK_W, SPARK_H, 0.3);

const OUTFLOW_SHARE =
  (DATA.monthlyOutflow.amount / DATA.monthlyInflow.amount) * 100;
const SAVINGS_RATE =
  (DATA.netCashFlow.amount / DATA.monthlyInflow.amount) * 100;
const RECENT = DATA.recentTransactions.slice(0, 2);

export function HeroShowcase() {
  const reduce = useReducedMotion();
  const glowRef = useRef<HTMLDivElement>(null);

  const rotateX = useSpring(0, { stiffness: 140, damping: 18, mass: 0.5 });
  const rotateY = useSpring(0, { stiffness: 140, damping: 18, mass: 0.5 });

  // Floating chips drift against the tilt for a layered, parallax feel.
  const chipX = useTransform(rotateY, [-3.5, 3.5], [12, -12]);
  const chipY = useTransform(rotateX, [-3.5, 3.5], [-10, 10]);
  const chipXAlt = useTransform(rotateY, [-3.5, 3.5], [-16, 16]);
  const chipYAlt = useTransform(rotateX, [-3.5, 3.5], [8, -8]);

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== "mouse") return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    rotateY.set((x - 0.5) * 7);
    rotateX.set((0.5 - y) * 7);
    glowRef.current?.style.setProperty("--spot-x", `${x * 100}%`);
    glowRef.current?.style.setProperty("--spot-y", `${y * 100}%`);
  };

  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
    glowRef.current?.style.setProperty("--spot-x", "50%");
    glowRef.current?.style.setProperty("--spot-y", "0%");
  };

  return (
    <div className="relative mx-auto w-full max-w-[34rem] lg:max-w-none">
      {/* Slow conic glow that bleeds through the glass card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-10 -z-10 opacity-40 blur-2xl motion-reduce:hidden"
      >
        <div
          className="absolute inset-0 animate-[spin_32s_linear_infinite] rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--color-primary) 45%, transparent) 70deg, transparent 160deg, color-mix(in oklab, var(--color-brand-secondary) 38%, transparent) 250deg, transparent 340deg)",
          }}
        />
      </div>

      {/* Depth chips */}
      <motion.div
        aria-hidden="true"
        style={{ x: chipX, y: chipY }}
        className="pointer-events-none absolute -right-5 -top-6 z-20 hidden xl:block"
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={
            reduce
              ? undefined
              : { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }
          className="rounded-2xl border border-border bg-popover/95 px-3 py-2 shadow-xl backdrop-blur"
        >
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-lg bg-brand-secondary/10 text-brand-secondary">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-semibold leading-tight text-foreground">
                RLS protected
              </p>
              <p className="text-[10px] leading-tight text-muted-foreground">
                Per-user isolation
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        aria-hidden="true"
        style={{ x: chipXAlt, y: chipYAlt }}
        className="pointer-events-none absolute -bottom-7 -left-6 z-20 hidden xl:block"
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, 5, 0] }}
          transition={
            reduce
              ? undefined
              : {
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.2,
                }
          }
          className="rotate-[-2deg] rounded-2xl border border-border bg-popover/95 px-3 py-2 shadow-xl backdrop-blur"
        >
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-semibold leading-tight text-foreground">
                Auto-categorised
              </p>
              <p className="text-[10px] leading-tight text-muted-foreground">
                Every entry sorted
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Card */}
      <motion.div
        onPointerMove={handleMove}
        onPointerLeave={reset}
        style={{ rotateX, rotateY, transformPerspective: 1200 }}
        className="relative will-change-transform"
      >
        <div className="glass-card relative overflow-hidden rounded-3xl shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] dark:shadow-[0_30px_80px_-24px_rgba(0,0,0,0.9)]">
          {/* Cursor spotlight */}
          <div
            ref={glowRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(460px circle at var(--spot-x, 50%) var(--spot-y, 0%), color-mix(in oklab, var(--color-primary) 18%, transparent), transparent 62%)",
            }}
          />
          <span
            aria-hidden="true"
            className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
          />

          <div className="relative p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25">
                  <TrendingUp className="size-4.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold tracking-tight text-foreground">
                    Net worth
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    4 linked accounts
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <span
                  className="size-1.5 rounded-full bg-brand-secondary"
                  aria-hidden="true"
                />
                Sample data
              </span>
            </div>

            <div className="mt-5">
              <p className="text-[2.5rem] font-semibold leading-none tracking-tight tabular-nums text-foreground sm:text-[2.75rem]">
                {DATA.netWorth.formatted}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="size-3" aria-hidden="true" />
                  {DATA.netWorth.changeFormatted}
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </p>
            </div>

            <div className="relative mt-5 h-24">
              <svg
                viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
                preserveAspectRatio="none"
                className="h-full w-full"
                fill="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id="hero-spark-area"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      style={{
                        stopColor: "var(--color-primary)",
                        stopOpacity: 0.28,
                      }}
                    />
                    <stop
                      offset="100%"
                      style={{
                        stopColor: "var(--color-primary)",
                        stopOpacity: 0,
                      }}
                    />
                  </linearGradient>
                  <linearGradient
                    id="hero-spark-line"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
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
                <path d={SPARK.area} fill="url(#hero-spark-area)" />
                <path
                  d={SPARK.line}
                  stroke="url(#hero-spark-line)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              <span
                aria-hidden="true"
                className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(SPARK.last.x / SPARK_W) * 100}%`,
                  top: `${(SPARK.last.y / SPARK_H) * 100}%`,
                }}
              >
                <span className="absolute inset-0 animate-ping rounded-full bg-brand-secondary/50 motion-reduce:hidden" />
                <span className="relative block size-2.5 rounded-full bg-brand-secondary ring-4 ring-brand-secondary/20" />
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
              <span>{DATA.netWorth.trendMonths[0]}</span>
              <span>
                {DATA.netWorth.trendMonths[DATA.netWorth.trendMonths.length - 1]}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-border/70 bg-background/40 p-2.5">
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <ArrowDownLeft
                    className="size-3 text-brand-secondary"
                    aria-hidden="true"
                  />
                  Money in
                </div>
                <p className="mt-1 font-mono text-[13px] font-semibold tabular-nums text-brand-secondary">
                  {DATA.monthlyInflow.formatted}
                </p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-border/60">
                  <div className="h-full w-full rounded-full bg-brand-secondary" />
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/40 p-2.5">
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <ArrowUpRight
                    className="size-3 text-rose-500"
                    aria-hidden="true"
                  />
                  Money out
                </div>
                <p className="mt-1 font-mono text-[13px] font-semibold tabular-nums text-rose-500">
                  {DATA.monthlyOutflow.formatted}
                </p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-border/60">
                  <div
                    className="h-full rounded-full bg-rose-500/80"
                    style={{ width: `${OUTFLOW_SHARE}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                <span>Recent activity</span>
                <span>November</span>
              </div>
              <ul className="mt-1">
                {RECENT.map((transaction) => {
                  const isIncome = transaction.type === "income";

                  return (
                    <li
                      key={transaction.id}
                      className="flex items-center justify-between gap-3 border-b border-dashed border-border/60 py-2.5 last:border-b-0"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={cn(
                            "grid size-7 shrink-0 place-items-center rounded-lg",
                            isIncome
                              ? "bg-brand-secondary/10 text-brand-secondary"
                              : "bg-rose-500/10 text-rose-500"
                          )}
                        >
                          {isIncome ? (
                            <ArrowDownLeft
                              className="size-3.5"
                              aria-hidden="true"
                            />
                          ) : (
                            <ArrowUpRight
                              className="size-3.5"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-foreground">
                            {transaction.description}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {transaction.category} · {transaction.date}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 font-mono text-xs font-semibold tabular-nums",
                          isIncome ? "text-brand-secondary" : "text-rose-500"
                        )}
                      >
                        {transaction.amountFormatted}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Wallet
                  className="size-3.5 text-brand-secondary"
                  aria-hidden="true"
                />
                Net cash flow
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums text-brand-secondary">
                {DATA.netCashFlow.formatted}
                <span className="ml-1.5 font-sans text-[10px] font-medium text-muted-foreground">
                  {SAVINGS_RATE.toFixed(0)}% saved
                </span>
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
