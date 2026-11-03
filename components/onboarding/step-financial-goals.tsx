"use client";

import { useActionState, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CalendarSync,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  PieChart,
  PiggyBank,
  Receipt,
  Sliders,
  Sparkles,
} from "lucide-react";
import { cn } from "cn";
import {
  initialOnboardingActionState,
  FINANCIAL_GOALS_LIST,
} from "@/lib/validations/onboarding";
import { saveStep3Action, skipOnboardingAction } from "@/lib/onboarding/actions";
import type { FinancialGoalKey } from "@/src/types/database.types";
import { Button } from "@/components/ui/button";

interface StepFinancialGoalsProps {
  initialGoals?: FinancialGoalKey[];
  onBack: () => void;
}

const GOAL_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>
> = {
  Receipt,
  PiggyBank,
  Sliders,
  CalendarSync,
  BarChart3,
  CreditCard,
  PieChart,
};

export function StepFinancialGoals({
  initialGoals = [],
  onBack,
}: StepFinancialGoalsProps) {
  // Respect previously selected goals. If none, start with empty array (0 goals is completely valid)
  const [selectedGoals, setSelectedGoals] = useState<FinancialGoalKey[]>(initialGoals);
  const [isSkipping, setIsSkipping] = useState(false);

  const [state, formAction, isPending] = useActionState(
    saveStep3Action,
    initialOnboardingActionState
  );

  async function handleSkip() {
    setIsSkipping(true);
    await skipOnboardingAction();
  }

  function toggleGoal(key: FinancialGoalKey) {
    setSelectedGoals((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            What are your financial priorities?
          </h2>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {selectedGoals.length} selected
          </span>
        </div>
        <p className="text-xs text-muted-foreground sm:text-sm">
          All goals are optional. Select any areas you want Coinsight to focus on, or complete onboarding directly.
        </p>
      </div>

      {state.status === "error" && state.message && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive dark:bg-destructive/15"
        >
          {state.message}
        </div>
      )}

      {/* Hidden inputs to feed formData for each selected goal */}
      {selectedGoals.map((key) => (
        <input key={key} type="hidden" name="goals" value={key} />
      ))}

      {/* Interactive Goal Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FINANCIAL_GOALS_LIST.map((goal) => {
          const isSelected = selectedGoals.includes(goal.key);
          const IconComponent = GOAL_ICONS[goal.iconName] || Sparkles;

          return (
            <div
              key={goal.key}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => toggleGoal(goal.key)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  toggleGoal(goal.key);
                }
              }}
              className={cn(
                "group relative flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all outline-none select-none",
                isSelected
                  ? "border-primary/50 bg-primary/10 shadow-sm shadow-primary/10 dark:bg-primary/15"
                  : "border-border bg-card/60 hover:border-border/80 hover:bg-surface-secondary/60 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"
              )}
            >
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "bg-surface-secondary text-muted-foreground group-hover:text-foreground dark:bg-white/5"
                )}
              >
                <IconComponent className="size-4.5" aria-hidden="true" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      "text-xs font-semibold sm:text-sm",
                      isSelected ? "text-foreground" : "text-foreground/90"
                    )}
                  >
                    {goal.title}
                  </p>

                  <div
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-md border transition-all",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-transparent group-hover:border-muted-foreground/40"
                    )}
                  >
                    {isSelected && <Check className="size-3 stroke-[3]" aria-hidden="true" />}
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                  {goal.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {state.fieldErrors?.goals && (
        <p className="text-xs text-destructive">
          {state.fieldErrors.goals[0]}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col-reverse justify-between gap-3 pt-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isPending || isSkipping}
            className="gap-1.5 text-xs"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={isPending || isSkipping}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {isSkipping ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Skipping...
              </>
            ) : (
              "Skip for now"
            )}
          </Button>
        </div>

        <Button
          type="submit"
          disabled={isPending || isSkipping}
          className="gap-2 bg-gradient-to-r from-primary to-brand-secondary text-primary-foreground shadow-md shadow-primary/25 hover:opacity-95"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Finalizing Profile...
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Complete My Profile
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
