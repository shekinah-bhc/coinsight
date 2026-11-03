"use client";

import { Check, User, Wallet, Target } from "lucide-react";
import { cn } from "cn";

interface StepIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  maxAccessibleStep: number;
}

const STEPS = [
  {
    step: 1,
    title: "Personal Profile",
    description: "Name & Avatar",
    icon: User,
  },
  {
    step: 2,
    title: "Financial Setup",
    description: "Country, Currency & Cash Flow",
    icon: Wallet,
  },
  {
    step: 3,
    title: "Goals & Priorities",
    description: "Tailor your experience",
    icon: Target,
  },
];

export function StepIndicator({
  currentStep,
  onStepClick,
  maxAccessibleStep,
}: StepIndicatorProps) {
  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="w-full space-y-4">
      {/* Progress Track */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border/50">
        <div
          className="h-full bg-gradient-to-r from-primary to-brand-secondary transition-all duration-500 ease-out"
          style={{ width: `${Math.max(10, progressPercent)}%` }}
        />
      </div>

      {/* Step Buttons / Badges */}
      <div className="grid grid-cols-3 gap-2">
        {STEPS.map((item) => {
          const isCompleted = item.step < currentStep;
          const isCurrent = item.step === currentStep;
          const isAccessible = item.step <= maxAccessibleStep;
          const Icon = item.icon;

          return (
            <button
              key={item.step}
              type="button"
              disabled={!isAccessible}
              onClick={() => isAccessible && onStepClick?.(item.step)}
              className={cn(
                "group flex flex-col items-center rounded-xl p-2.5 text-center transition-all sm:flex-row sm:items-center sm:gap-3 sm:p-3 sm:text-left",
                isCurrent &&
                  "bg-primary/10 ring-1 ring-primary/40 dark:bg-primary/15",
                !isCurrent &&
                  isAccessible &&
                  "hover:bg-surface-secondary/70 cursor-pointer dark:hover:bg-white/[0.04]",
                !isAccessible && "opacity-50 cursor-not-allowed"
              )}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-colors sm:size-9",
                  isCompleted &&
                    "bg-brand-secondary/20 text-brand-secondary ring-1 ring-brand-secondary/40",
                  isCurrent &&
                    "bg-primary text-primary-foreground shadow-sm shadow-primary/30",
                  !isCompleted &&
                    !isCurrent &&
                    "bg-card text-muted-foreground ring-1 ring-border"
                )}
              >
                {isCompleted ? (
                  <Check className="size-4 stroke-[2.5]" aria-hidden="true" />
                ) : (
                  <Icon className="size-4" aria-hidden="true" />
                )}
              </div>

              <div className="mt-1 min-w-0 sm:mt-0">
                <p
                  className={cn(
                    "text-xs font-medium tracking-tight truncate",
                    isCurrent
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  <span className="hidden sm:inline">Step {item.step}: </span>
                  {item.title}
                </p>
                <p className="hidden text-[11px] text-muted-foreground/80 truncate lg:block">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

