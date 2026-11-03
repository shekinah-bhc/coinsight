"use client";

import { useActionState, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Coins,
  Globe,
  Loader2,
  Lock,
  TrendingUp,
} from "lucide-react";
import {
  type OnboardingActionState,
  initialOnboardingActionState,
  COMMON_TIMEZONES,
  INCOME_RANGES,
  LOCKED_COUNTRY_CODE,
  LOCKED_COUNTRY_FLAG,
  LOCKED_COUNTRY_NAME,
  LOCKED_CURRENCY_CODE,
  LOCKED_CURRENCY_NAME,
  LOCKED_CURRENCY_SYMBOL,
} from "@/lib/validations/onboarding";
import { saveStep2Action, skipOnboardingAction } from "@/lib/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StepFinancialPreferencesProps {
  initialTimezone?: string | null;
  initialMonthlyIncomeRange?: string | null;
  initialSalaryCreditDay?: number | null;
  onSuccess: () => void;
  onBack: () => void;
}

export function StepFinancialPreferences({
  initialTimezone,
  initialMonthlyIncomeRange,
  initialSalaryCreditDay,
  onSuccess,
  onBack,
}: StepFinancialPreferencesProps) {
  const [timezone, setTimezone] = useState(
    initialTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata"
  );
  const [incomeRange, setIncomeRange] = useState(
    initialMonthlyIncomeRange || ""
  );
  const [salaryDay, setSalaryDay] = useState<string>(
    initialSalaryCreditDay ? String(initialSalaryCreditDay) : ""
  );
  const [isSkipping, setIsSkipping] = useState(false);

  const [state, formAction, isPending] = useActionState(
    async (prev: OnboardingActionState, formData: FormData) => {
      const result = await saveStep2Action(prev, formData);
      if (result.status === "success") {
        onSuccess();
      }
      return result;
    },
    initialOnboardingActionState
  );

  async function handleSkip() {
    setIsSkipping(true);
    await skipOnboardingAction();
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Configure Your Financial Base
        </h2>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Coinsight is currently optimized for India (INR). Configure your timezone and monthly cycle.
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

      {/* Grid: Country & Currency (Strictly Locked / Read-Only Controls) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Locked Country */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Globe className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span>Country / Region</span>
            <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
              <Lock className="size-2.5" aria-hidden="true" />
              Locked
            </span>
          </Label>
          <div className="flex h-10 w-full items-center justify-between rounded-md border border-input/60 bg-muted/40 px-3 py-2 text-xs font-medium text-foreground sm:text-sm cursor-not-allowed select-none">
            <div className="flex items-center gap-2">
              <span className="text-base" role="img" aria-label="India flag">
                {LOCKED_COUNTRY_FLAG}
              </span>
              <span>{LOCKED_COUNTRY_NAME} ({LOCKED_COUNTRY_CODE})</span>
            </div>
            <Lock className="size-3.5 text-muted-foreground/60" aria-hidden="true" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Initial release is restricted exclusively to Indian financial markets.
          </p>
        </div>

        {/* Locked Currency */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Coins className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span>Base Currency</span>
            <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
              <Lock className="size-2.5" aria-hidden="true" />
              Locked
            </span>
          </Label>
          <div className="flex h-10 w-full items-center justify-between rounded-md border border-input/60 bg-muted/40 px-3 py-2 text-xs font-medium text-foreground sm:text-sm cursor-not-allowed select-none">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">{LOCKED_CURRENCY_SYMBOL}</span>
              <span>{LOCKED_CURRENCY_NAME} ({LOCKED_CURRENCY_CODE})</span>
            </div>
            <Lock className="size-3.5 text-muted-foreground/60" aria-hidden="true" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            All accounts, categories, and budgets operate in Indian Rupees (INR).
          </p>
        </div>
      </div>

      {/* Timezone (Editable, Default Asia/Kolkata) */}
      <div className="space-y-1.5">
        <Label htmlFor="timezone" className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Clock className="size-3.5 text-muted-foreground" aria-hidden="true" />
          Timezone <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <select
            id="timezone"
            name="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-input/20 px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30 sm:text-sm"
          >
            {(COMMON_TIMEZONES as readonly string[]).includes(timezone) ? null : (
              <option value={timezone} className="bg-popover text-popover-foreground">
                {timezone} (Detected)
              </option>
            )}
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz} className="bg-popover text-popover-foreground">
                {tz} {tz === "Asia/Kolkata" ? "(IST, India Standard Time)" : ""}
              </option>
            ))}
          </select>
        </div>
        {state.fieldErrors?.timezone && (
          <p className="text-[11px] text-destructive">
            {state.fieldErrors.timezone[0]}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground">
          Accurately timestamps transactions, recurring bills, and month-end budget rollovers.
        </p>
      </div>

      {/* Section: Income & Cash flow preferences */}
      <div className="rounded-xl border border-border bg-surface-secondary/40 p-4 space-y-4 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-brand-secondary" aria-hidden="true" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Income & Cash Flow Cycle (Optional)
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Monthly Income Range */}
          <div className="space-y-1.5">
            <Label htmlFor="monthlyIncomeRange" className="text-xs font-medium text-foreground">
              Estimated Monthly Income
            </Label>
            <select
              id="monthlyIncomeRange"
              name="monthlyIncomeRange"
              value={incomeRange}
              onChange={(e) => setIncomeRange(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-input/20 px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30 sm:text-sm"
            >
              <option value="" className="bg-popover text-muted-foreground">
                Select an income bracket...
              </option>
              {INCOME_RANGES.map((r) => (
                <option key={r.value} value={r.value} className="bg-popover text-popover-foreground">
                  {r.label}
                </option>
              ))}
            </select>
            {state.fieldErrors?.monthlyIncomeRange && (
              <p className="text-[11px] text-destructive">
                {state.fieldErrors.monthlyIncomeRange[0]}
              </p>
            )}
          </div>

          {/* Salary Credit Day */}
          <div className="space-y-1.5">
            <Label htmlFor="salaryCreditDay" className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Calendar className="size-3.5 text-muted-foreground" aria-hidden="true" />
              Salary Credit Day (1–31)
            </Label>
            <Input
              id="salaryCreditDay"
              name="salaryCreditDay"
              type="number"
              min={1}
              max={31}
              placeholder="e.g. 1 or 28"
              value={salaryDay}
              onChange={(e) => setSalaryDay(e.target.value)}
              className="h-10 text-xs sm:text-sm"
            />
            {state.fieldErrors?.salaryCreditDay && (
              <p className="text-[11px] text-destructive">
                {state.fieldErrors.salaryCreditDay[0]}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Helps Coinsight align monthly budget calculations with your actual payday.
            </p>
          </div>
        </div>
      </div>

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
          className="gap-2 bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving Preferences...
            </>
          ) : (
            <>
              Continue to Goals
              <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
