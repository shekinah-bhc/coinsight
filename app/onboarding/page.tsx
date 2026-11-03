import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/session";
import { getOnboardingData } from "@/lib/onboarding/actions";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Complete Your Profile | Coinsight",
  description: "Personalize your Coinsight financial workspace and goals.",
};

function OnboardingSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background fintech-ambient">
      <header className="flex h-16 w-full items-center justify-between border-b border-border/60 bg-background/60 px-4 sm:px-8">
        <Skeleton className="h-9 w-36 rounded-xl" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </header>
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex justify-center">
            <Skeleton className="h-6 w-48 rounded-full" />
          </div>
          <div className="glass-card rounded-2xl border border-border p-6 space-y-6 sm:p-8">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-8 w-3/4 rounded-lg" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <div className="flex justify-between pt-4">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

async function OnboardingPageContent() {
  const user = await requireAuth();
  const { profile, goals, resolvedAvatarUrl } = await getOnboardingData();

  return (
    <OnboardingWizard
      userEmail={user.email}
      initialProfile={profile}
      initialGoals={goals}
      resolvedAvatarUrl={resolvedAvatarUrl}
    />
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <OnboardingPageContent />
    </Suspense>
  );
}
