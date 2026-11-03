import { Suspense } from "react";
import type { Metadata } from "next";
import { ShieldCheck, Sparkles } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
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
  const displayName = getDisplayUserName(user.email);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <DashboardHeader
        userEmail={user.email}
        userId={user.id}
        userRole={user.role}
      />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-secondary/30 bg-brand-secondary/10 px-2.5 py-0.5 text-[11px] font-medium text-brand-secondary">
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  <span>Verified Session</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                  <Sparkles className="size-3" aria-hidden="true" />
                  <span>Financial Intelligence</span>
                </span>
              </div>
              <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Welcome back, {displayName}
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
                  Monthly Net Position
                </p>
                <p className="font-mono text-sm font-semibold text-brand-secondary tabular-nums">
                  +$5,765.80
                </p>
              </div>
              <div className="h-7 w-px bg-border" aria-hidden="true" />
              <div>
                <p className="text-[11px] text-muted-foreground">
                  Budget Health
                </p>
                <p className="font-medium text-foreground">On Track (88%)</p>
              </div>
            </div>
          </div>
        </section>

        <OverviewCards />

        <RecentTransactions />
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
