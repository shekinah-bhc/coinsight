import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, PieChart } from "lucide-react";

import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { resolveAvatarUrl } from "@/lib/onboarding/avatar-utils";
import { getBudgetsData } from "@/lib/budgets/actions";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { BudgetsView } from "@/components/budgets/budgets-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Budgets | Coinsight",
  description:
    "Create monthly spending budgets for your expense categories, track utilization progress, and review historical budget performance.",
};

function BudgetsLoadingSkeleton() {
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
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <Skeleton className="h-14 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}

interface BudgetsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function BudgetsContent({ searchParams }: BudgetsPageProps) {
  const user = await requireAuth();
  const supabase = await createClient();
  const resolvedParams = await searchParams;

  const requestedMonth =
    typeof resolvedParams.month === "string" && resolvedParams.month.trim() !== ""
      ? resolvedParams.month.trim()
      : undefined;

  const [{ data: profile }, budgetsData] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle(),
    getBudgetsData(requestedMonth),
  ]);

  const resolvedAvatarUrl = await resolveAvatarUrl(profile?.avatar_url);

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
        {/* Navigation Breadcrumb */}
        <nav
          aria-label="Budgets breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Link
            href="/dashboard"
            className="transition-colors hover:text-foreground"
          >
            Workspace
          </Link>
          <ChevronRight
            className="size-3.5 text-muted-foreground/60"
            aria-hidden="true"
          />
          <span className="flex items-center gap-1 font-semibold text-foreground">
            <PieChart className="size-3 text-primary" aria-hidden="true" />
            Budgets
          </span>
        </nav>

        {/* Page Heading */}
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Monthly Budgets
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Allocate monthly spending limits per expense category, monitor live utilization against actual transactions, and review historical performance.
          </p>
        </div>

        {/* Main Budgets Interactive View */}
        <BudgetsView initialData={budgetsData} />
      </main>
    </div>
  );
}

export default function BudgetsPage({ searchParams }: BudgetsPageProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <Suspense fallback={<BudgetsLoadingSkeleton />}>
        <BudgetsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

