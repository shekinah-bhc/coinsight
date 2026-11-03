"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { formatPaiseToRupees } from "@/lib/finance/money";

interface NetWorthSummaryCardsProps {
  totalAssets: string;
  totalLiabilities: string;
  netWorth: string;
  activeAccountsCount: number;
}

export function NetWorthSummaryCards({
  totalAssets,
  totalLiabilities,
  netWorth,
  activeAccountsCount,
}: NetWorthSummaryCardsProps) {
  const netWorthNum = Number.parseFloat(netWorth || "0");
  const isPositiveNetWorth = netWorthNum >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Net Worth Card */}
      <div className="glass-card relative overflow-hidden rounded-2xl border border-border/80 p-5 shadow-sm">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-brand-secondary to-primary"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Consolidated Net Worth</p>
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Landmark className="size-4" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-3 space-y-1">
          <p
            className={`font-mono text-2xl font-bold tracking-tight sm:text-3xl ${
              isPositiveNetWorth ? "text-foreground" : "text-destructive"
            }`}
          >
            {formatPaiseToRupees(netWorth)}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {isPositiveNetWorth ? (
              <span className="inline-flex items-center gap-0.5 text-brand-secondary font-medium">
                <ArrowUpRight className="size-3" aria-hidden="true" />
                Assets Exceed Debt
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-destructive font-medium">
                <ArrowDownRight className="size-3" aria-hidden="true" />
                Net Negative Position
              </span>
            )}
            <span>• Active accounts</span>
          </div>
        </div>
      </div>

      {/* 2. Total Assets Card */}
      <div className="glass-card relative overflow-hidden rounded-2xl border border-border/80 p-5 shadow-sm">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-secondary to-teal-400"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Total Assets</p>
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-secondary/10 text-brand-secondary">
            <TrendingUp className="size-4" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-3 space-y-1">
          <p className="font-mono text-2xl font-bold tracking-tight text-brand-secondary sm:text-3xl">
            {formatPaiseToRupees(totalAssets)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Sum of positive cash, bank & wallet balances
          </p>
        </div>
      </div>

      {/* 3. Total Liabilities Card */}
      <div className="glass-card relative overflow-hidden rounded-2xl border border-border/80 p-5 shadow-sm">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 to-rose-500"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Total Liabilities</p>
          <span className="flex size-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
            <TrendingDown className="size-4" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-3 space-y-1">
          <p className="font-mono text-2xl font-bold tracking-tight text-rose-500 sm:text-3xl">
            {formatPaiseToRupees(totalLiabilities, { absolute: true })}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Credit card balances & overdrafts
          </p>
        </div>
      </div>

      {/* 4. Active Accounts Count Card */}
      <div className="glass-card relative overflow-hidden rounded-2xl border border-border/80 p-5 shadow-sm">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 to-purple-400"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Active Accounts</p>
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="size-4" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-3 space-y-1">
          <p className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {activeAccountsCount}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3 text-brand-secondary" aria-hidden="true" />
            <span>INR Base • Excludes archived accounts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

