import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { resolveAvatarUrl } from "@/lib/onboarding/avatar-utils";
import { getDashboardMetrics } from "@/lib/dashboard/actions";
import { formatPaiseToRupees } from "@/lib/finance/money";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Dashboard | Coinsight",
  description: "Your Coinsight personal finance dashboard.",
};

function getDisplayUserName(email: string | undefined): string {
  if (!email) {
    return "there";
  }
  const localPart = email.split("@")[0] ?? "";
  if (!localPart) {
    return "there";
  }
  return localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function DashboardSessionContent() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [{ data: profile }, metrics] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle(),
    getDashboardMetrics(),
  ]);

  const displayName = profile?.full_name || getDisplayUserName(user.email);
  const showOnboardingBanner = !profile?.onboarding_completed;
  const resolvedAvatarUrl = await resolveAvatarUrl(profile?.avatar_url);

  const formattedNetPosition = `${metrics.netCashFlow >= 0 ? "+" : "-"}${formatPaiseToRupees(
    Math.abs(metrics.netCashFlow)
  )}`;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <DashboardHeader
        userEmail={user.email}
        userId={user.id}
        userRole={user.role}
        userName={profile?.full_name}
        userAvatarUrl={resolvedAvatarUrl}
        onboardingCompleted={profile?.onboarding_completed}
      />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {showOnboardingBanner && (
          <div
            role="region"
            aria-label="Profile completion prompt"
            className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-brand-secondary/5 to-primary/5 p-4 sm:flex-row sm:items-center sm:px-6 sm:py-4 shadow-sm"
          >
            <div className="flex items-start gap-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-sm">
                <AlertCircle className="size-4.5" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground sm:text-sm">
                  Complete your profile setup
                </p>
                <p className="text-[11px] text-muted-foreground sm:text-xs">
                  Set up your preferred currency, income cycle, and financial focus to unlock tailored insights and automated budgeting.
                </p>
              </div>
            </div>

            <Link
              href="/onboarding"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-sm shadow-primary/25 transition-colors hover:bg-primary/90"
            >
              <span>Complete Profile</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        )}

        <section
          aria-label="Welcome summary"
          className="glass-card relative overflow-hidden rounded-2xl p-5 sm:p-6"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          />

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="space-y-1.5">
            
              <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Welcome, {displayName}
              </h1>
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Signed in as{" "}
                <span className="font-medium text-foreground">
                  {user.email ?? user.id}
                </span>
                . Here is your consolidated cash flow and balance overview.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-secondary/60 px-4 py-3 text-xs dark:bg-white/[0.02]">
              <div>
                <p className="text-[11px] text-muted-foreground">
                  Monthly Net Cash Flow
                </p>
                <p className="font-mono text-sm font-semibold text-brand-secondary tabular-nums">
                  {formattedNetPosition}
                </p>
              </div>
              <div className="h-7 w-px bg-border" aria-hidden="true" />
              <div>
                <p className="text-[11px] text-muted-foreground">
                  Savings Rate
                </p>
                <p className="font-medium text-foreground font-mono">
                  {metrics.savingsRate}%
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Real Live Database Metrics */}
        <OverviewCards metrics={metrics} />

        {/* Real Live Recent Transactions & Category Allocations */}
        <RecentTransactions
          recentTransactions={metrics.recentTransactions}
          categorySpending={metrics.categorySpending}
          currentMonthName={metrics.currentMonthName}
        />
      </main>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex min-w-0 flex-1 flex-col" aria-hidden="true">
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Skeleton className="h-5 w-40" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 w-full rounded-2xl lg:col-span-2" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="fintech-ambient flex min-h-svh bg-background text-foreground">
      <DashboardSidebar />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardSessionContent />
      </Suspense>
    </div>
  );
}
