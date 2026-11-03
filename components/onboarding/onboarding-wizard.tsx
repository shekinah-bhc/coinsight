"use client";

import { useState } from "react";
import Link from "next/link";
import { Coins, ShieldCheck } from "lucide-react";
import type { FinancialGoalKey, Profile } from "@/src/types/database.types";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { StepPersonalInfo } from "@/components/onboarding/step-personal-info";
import { StepFinancialPreferences } from "@/components/onboarding/step-financial-preferences";
import { StepFinancialGoals } from "@/components/onboarding/step-financial-goals";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface OnboardingWizardProps {
  userEmail?: string;
  initialProfile: Profile | null;
  initialGoals: FinancialGoalKey[];
  resolvedAvatarUrl: string | null;
}

export function OnboardingWizard({
  userEmail,
  initialProfile,
  initialGoals,
  resolvedAvatarUrl,
}: OnboardingWizardProps) {
  // Start at user's current saved step (defaulting to 1, or clamped between 1 and 3)
  const initialStep = Math.min(Math.max(initialProfile?.onboarding_step ?? 1, 1), 3);
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [maxAccessibleStep, setMaxAccessibleStep] = useState<number>(
    Math.max(initialStep, initialProfile?.onboarding_completed ? 3 : initialStep)
  );
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(
    resolvedAvatarUrl || initialProfile?.avatar_url || null
  );

  function advanceToStep(nextStep: number) {
    setCurrentStep(nextStep);
    setMaxAccessibleStep((prev) => Math.max(prev, nextStep));
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background fintech-ambient">
      {/* Top Header */}
      <header className="flex h-16 w-full items-center justify-between border-b border-border/60 bg-background/60 px-4 backdrop-blur-md sm:px-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-brand-secondary text-primary-foreground shadow-md shadow-primary/25">
            <Coins className="size-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-base font-bold tracking-tight text-foreground">
              Coinsight
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Onboarding
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex dark:bg-white/[0.03]">
            <ShieldCheck className="size-3.5 text-brand-secondary" aria-hidden="true" />
            <span className="truncate max-w-[200px]">{userEmail ?? "Authenticated"}</span>
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-2xl space-y-6">
      

          {/* Stepper Card */}
          <div className="glass-card relative overflow-hidden rounded-2xl border border-border/80 p-5 sm:p-8 shadow-xl">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-brand-secondary to-primary/50"
            />

            {/* Stepper navigation */}
            <div className="mb-6">
              <StepIndicator
                currentStep={currentStep}
                maxAccessibleStep={maxAccessibleStep}
                onStepClick={(step) => setCurrentStep(step)}
              />
            </div>

            {/* Step 1: Personal Profile */}
            {currentStep === 1 && (
              <StepPersonalInfo
                initialFullName={initialProfile?.full_name}
                initialAvatarUrl={initialProfile?.avatar_url}
                resolvedAvatarUrl={currentAvatarUrl}
                onSuccess={(newAvatarUrl) => {
                  if (newAvatarUrl !== undefined) {
                    setCurrentAvatarUrl(newAvatarUrl);
                  }
                  advanceToStep(2);
                }}
              />
            )}

            {/* Step 2: Financial Setup (Locked to India / INR) */}
            {currentStep === 2 && (
              <StepFinancialPreferences
                initialTimezone={initialProfile?.timezone}
                initialMonthlyIncomeRange={initialProfile?.monthly_income_range}
                initialSalaryCreditDay={initialProfile?.salary_credit_day}
                onSuccess={() => advanceToStep(3)}
                onBack={() => setCurrentStep(1)}
              />
            )}

            {/* Step 3: Goals & Priorities (0 to 7 goals) */}
            {currentStep === 3 && (
              <StepFinancialGoals
                initialGoals={initialGoals}
                onBack={() => setCurrentStep(2)}
              />
            )}
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground">
            You can always update these preferences later from your account settings.
          </p>
        </div>
      </main>
    </div>
  );
}
