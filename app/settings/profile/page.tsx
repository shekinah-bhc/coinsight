import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Settings, User } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { resolveAvatarUrl } from "@/lib/onboarding/avatar-utils";
import type { FinancialGoalKey } from "@/src/types/database.types";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Profile Settings | Coinsight",
  description: "Manage your Coinsight profile, avatar, regional preferences, and financial priorities.",
};

function ProfileSettingsSkeleton() {
  return (
    <div className="flex min-w-0 flex-1 flex-col" aria-hidden="true">
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Skeleton className="h-5 w-40" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    </div>
  );
}

async function ProfileSettingsContent() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [profileResult, goalsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_financial_goals").select("goal_key").eq("user_id", user.id),
  ]);

  const profile = profileResult.data;

  // Route protection: Incomplete onboarding users must complete initial onboarding first
  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const goals = (goalsResult.data?.map((g) => g.goal_key) ?? []) as FinancialGoalKey[];
  const resolvedAvatarUrl = await resolveAvatarUrl(profile?.avatar_url);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <DashboardHeader
        userEmail={user.email}
        userId={user.id}
        userRole={user.role}
        userName={profile?.full_name}
        userAvatarUrl={resolvedAvatarUrl}
        onboardingCompleted={true}
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Navigation Breadcrumb */}
        <nav
          aria-label="Settings breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Link
            href="/dashboard"
            className="hover:text-foreground transition-colors"
          >
            Workspace
          </Link>
          <ChevronRight className="size-3.5 text-muted-foreground/60" aria-hidden="true" />
          <span className="flex items-center gap-1 text-muted-foreground">
            <Settings className="size-3" aria-hidden="true" />
            Settings
          </span>
          <ChevronRight className="size-3.5 text-muted-foreground/60" aria-hidden="true" />
          <span className="font-semibold text-foreground flex items-center gap-1">
            <User className="size-3 text-primary" aria-hidden="true" />
            Profile
          </span>
        </nav>

        {/* Heading Header */}
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Profile Settings
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Manage your personal details, anime preset avatar, cash flow preferences, and financial priorities.
          </p>
        </div>

        {/* Form Container */}
        <ProfileSettingsForm
          userEmail={user.email}
          initialProfile={profile}
          initialGoals={goals}
          initialResolvedAvatarUrl={resolvedAvatarUrl}
        />
      </main>
    </div>
  );
}

export default function ProfileSettingsPage() {
  return (
    <div className="fintech-ambient flex min-h-svh bg-background text-foreground">
      <DashboardSidebar />
      <Suspense fallback={<ProfileSettingsSkeleton />}>
        <ProfileSettingsContent />
      </Suspense>
    </div>
  );
}

