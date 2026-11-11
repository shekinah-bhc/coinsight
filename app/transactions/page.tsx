import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftRight, ChevronRight } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { resolveAvatarUrl } from "@/lib/onboarding/avatar-utils";
import { getTransactionsData } from "@/lib/transactions/actions";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { TransactionsView } from "@/components/transactions/transactions-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Transactions | Coinsight",
  description: "View and manage all income, expense, and financial ledger entries in Coinsight.",
};

function TransactionsLoadingSkeleton() {
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
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

interface TransactionsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function TransactionsContent({ searchParams }: TransactionsPageProps) {
  const user = await requireAuth();
  const supabase = await createClient();
  const resolvedParams = await searchParams;

  const initialCategoryId =
    typeof resolvedParams.categoryId === "string" && resolvedParams.categoryId.trim() !== ""
      ? resolvedParams.categoryId.trim()
      : "all";

  const initialType =
    resolvedParams.type === "income" || resolvedParams.type === "expense"
      ? resolvedParams.type
      : "all";

  const initialAccountId =
    typeof resolvedParams.accountId === "string" && resolvedParams.accountId.trim() !== ""
      ? resolvedParams.accountId.trim()
      : "all";

  const initialSearch =
    typeof resolvedParams.search === "string" ? resolvedParams.search : "";

  const initialFilters = {
    categoryId: initialCategoryId,
    type: initialType as "all" | "income" | "expense",
    accountId: initialAccountId,
    search: initialSearch,
    page: 1,
    pageSize: 20,
  };

  const [{ data: profile }, transactionsData] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle(),
    getTransactionsData(initialFilters),
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
          aria-label="Transactions breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Workspace
          </Link>
          <ChevronRight className="size-3.5 text-muted-foreground/60" aria-hidden="true" />
          <span className="font-semibold text-foreground flex items-center gap-1">
            <ArrowLeftRight className="size-3 text-primary" aria-hidden="true" />
            Transactions
          </span>
        </nav>

        {/* Page Heading */}
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Transactions
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Complete transaction ledger with real-time balance propagation and category tracking.
          </p>
        </div>

        {/* Main Transactions Interactive View */}
        <TransactionsView initialData={transactionsData} initialFilters={initialFilters} />
      </main>
    </div>
  );
}

export default function TransactionsPage({ searchParams }: TransactionsPageProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <Suspense fallback={<TransactionsLoadingSkeleton />}>
        <TransactionsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

