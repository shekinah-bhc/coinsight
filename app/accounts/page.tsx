import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, CreditCard } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { resolveAvatarUrl } from "@/lib/onboarding/avatar-utils";
import { getAccountsData } from "@/lib/accounts/actions";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AccountsView } from "@/components/accounts/accounts-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Accounts & Cards | Coinsight",
  description: "Manage your bank accounts, credit cards, and cash wallets with real-time net worth tracking.",
};

function AccountsLoadingSkeleton() {
  return (
    <div className="flex min-w-0 flex-1 flex-col" aria-hidden="true">
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Skeleton className="h-5 w-40" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        {/* 4 Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        {/* Filter bar */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-72 rounded-lg" />
          <Skeleton className="h-10 w-44 rounded-lg" />
        </div>
        {/* Account Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

async function AccountsContent() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [{ data: profile }, accountsData] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle(),
    getAccountsData(),
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
        {/* Breadcrumb */}
        <nav
          aria-label="Accounts breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Workspace
          </Link>
          <ChevronRight className="size-3.5 text-muted-foreground/60" aria-hidden="true" />
          <span className="font-semibold text-foreground flex items-center gap-1">
            <CreditCard className="size-3 text-primary" aria-hidden="true" />
            Accounts & Cards
          </span>
        </nav>

        {/* Page Heading */}
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Accounts & Cards
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Track and manage your liquid bank accounts, physical cash, digital wallets, and credit cards.
          </p>
        </div>

        {/* Main Accounts Interactive View */}
        <AccountsView initialData={accountsData} />
      </main>
    </div>
  );
}

export default function AccountsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <Suspense fallback={<AccountsLoadingSkeleton />}>
        <AccountsContent />
      </Suspense>
    </div>
  );
}
