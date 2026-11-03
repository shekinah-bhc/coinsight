"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CalendarSync,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Globe,
  ImageIcon,
  Loader2,
  Lock,
  Mail,
  PieChart,
  PiggyBank,
  Receipt,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  User,
} from "lucide-react";
import { cn } from "cn";
import type { FinancialGoalKey, Profile } from "@/src/types/database.types";
import {
  COMMON_TIMEZONES,
  FINANCIAL_GOALS_LIST,
  INCOME_RANGES,
  LOCKED_COUNTRY_CODE,
  LOCKED_COUNTRY_FLAG,
  LOCKED_COUNTRY_NAME,
  LOCKED_CURRENCY_CODE,
  LOCKED_CURRENCY_NAME,
  LOCKED_CURRENCY_SYMBOL,
  MAX_AVATAR_FILE_SIZE_BYTES,
  PRESET_AVATARS,
  type PresetAvatarId,
} from "@/lib/validations/onboarding";
import {
  type ProfileSettingsActionState,
  initialProfileSettingsActionState,
} from "@/lib/validations/profile-settings";
import { updateProfileSettingsAction } from "@/lib/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileSettingsFormProps {
  userEmail: string | undefined;
  initialProfile: Profile | null;
  initialGoals: FinancialGoalKey[];
  initialResolvedAvatarUrl: string | null;
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return parts[0]?.slice(0, 2).toUpperCase() || "CS";
}

export function ProfileSettingsForm({
  userEmail,
  initialProfile,
  initialGoals,
  initialResolvedAvatarUrl,
}: ProfileSettingsFormProps) {
  const isInitialPreset =
    typeof initialProfile?.avatar_url === "string" &&
    initialProfile.avatar_url.startsWith("/avatars/");

  const [fullName, setFullName] = useState(initialProfile?.full_name ?? "");
  const [timezone, setTimezone] = useState(
    initialProfile?.timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "Asia/Kolkata"
  );
  const [incomeRange, setIncomeRange] = useState(
    initialProfile?.monthly_income_range || ""
  );
  const [salaryDay, setSalaryDay] = useState<string>(
    initialProfile?.salary_credit_day
      ? String(initialProfile.salary_credit_day)
      : ""
  );
  const [selectedGoals, setSelectedGoals] = useState<FinancialGoalKey[]>(initialGoals);

  // Avatar Management
  const [selectedPreset, setSelectedPreset] = useState<PresetAvatarId | null>(
    isInitialPreset ? (initialProfile.avatar_url as PresetAvatarId) : null
  );
  const [avatarMode, setAvatarMode] = useState<"preset" | "upload" | "remove" | "keep">(
    isInitialPreset
      ? "preset"
      : initialResolvedAvatarUrl
        ? "keep"
        : "preset"
  );
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customPreviewUrl, setCustomPreviewUrl] = useState<string | null>(null);
  const [currentResolvedUrl, setCurrentResolvedUrl] = useState<string | null>(
    initialResolvedAvatarUrl
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URL on change/unmount
  useEffect(() => {
    return () => {
      if (customPreviewUrl && customPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(customPreviewUrl);
      }
    };
  }, [customPreviewUrl]);

  const [state, formAction, isPending] = useActionState(
    async (prev: ProfileSettingsActionState, formData: FormData) => {
      setClientError(null);
      setShowSavedToast(false);
      const result = await updateProfileSettingsAction(prev, formData);
      if (result.status === "success") {
        setShowSavedToast(true);
        if (result.resolvedAvatarUrl !== undefined) {
          setCurrentResolvedUrl(result.resolvedAvatarUrl);
        }
      }
      return result;
    },
    initialProfileSettingsActionState
  );

  function handleSelectPreset(presetId: PresetAvatarId) {
    setClientError(null);
    setSelectedPreset(presetId);
    setAvatarMode("preset");
    if (customPreviewUrl && customPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(customPreviewUrl);
    }
    setCustomFile(null);
    setCustomPreviewUrl(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setClientError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setClientError("Please select a JPEG, PNG, or WebP image file.");
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
      setClientError("Image size must be less than 3 MB.");
      return;
    }

    if (customPreviewUrl && customPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(customPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setCustomFile(file);
    setCustomPreviewUrl(previewUrl);
    setAvatarMode("upload");
  }

  function handleRemoveAvatar() {
    setClientError(null);
    setSelectedPreset(null);
    setAvatarMode("remove");
    if (customPreviewUrl && customPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(customPreviewUrl);
    }
    setCustomFile(null);
    setCustomPreviewUrl(null);
    setCurrentResolvedUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function toggleGoal(key: FinancialGoalKey) {
    setSelectedGoals((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  // Determine active visual preview
  let activePreviewUrl: string | null = null;
  if (avatarMode === "upload" && customPreviewUrl) {
    activePreviewUrl = customPreviewUrl;
  } else if (avatarMode === "preset" && selectedPreset) {
    activePreviewUrl = selectedPreset;
  } else if (avatarMode === "keep" && currentResolvedUrl) {
    activePreviewUrl = currentResolvedUrl;
  }

  const initials = getInitials(fullName);

  return (
    <form action={formAction} className="space-y-8 pb-16">
      {/* Notifications / Alerts */}
      {showSavedToast && state.status === "success" && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-xl border border-brand-secondary/40 bg-brand-secondary/15 p-4 text-xs font-medium text-brand-secondary shadow-sm sm:text-sm"
        >
          <CheckCircle2 className="size-4.5 shrink-0" aria-hidden="true" />
          <span>{state.message || "Your profile settings have been saved successfully."}</span>
        </div>
      )}

      {(clientError || (state.status === "error" && state.message)) && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive dark:bg-destructive/15 sm:text-sm"
        >
          {clientError || state.message}
        </div>
      )}

      {/* Hidden inputs to feed Server Action */}
      <input type="hidden" name="avatarMode" value={avatarMode} />
      <input type="hidden" name="selectedPreset" value={selectedPreset ?? ""} />
      {selectedGoals.map((g) => (
        <input key={g} type="hidden" name="goals" value={g} />
      ))}

      {/* 1. Profile Picture & Identity Card */}
      <section
        aria-labelledby="section-profile-identity"
        className="glass-card relative overflow-hidden rounded-2xl border border-border/80 p-5 sm:p-6 shadow-md"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="size-20 shrink-0 ring-4 ring-primary/20 shadow-lg">
              {activePreviewUrl ? (
                <AvatarImage
                  src={activePreviewUrl}
                  alt={fullName || "User avatar"}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-primary/15 text-lg font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <h2
                id="section-profile-identity"
                className="font-heading text-lg font-semibold tracking-tight text-foreground"
              >
                {fullName.trim() ? fullName : "Your Name"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {avatarMode === "upload"
                  ? "Custom photo uploaded"
                  : avatarMode === "preset" && selectedPreset
                    ? `${PRESET_AVATARS.find((a) => a.id === selectedPreset)?.label} (Preset)`
                    : avatarMode === "keep" && currentResolvedUrl
                      ? "Custom active photo"
                      : "Default monogram initials"}
              </p>
              <div className="pt-0.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2 py-0.5 text-[11px] font-mono text-muted-foreground dark:bg-white/[0.03]">
                  ID: {initialProfile?.id.slice(0, 8)}&hellip;{initialProfile?.id.slice(-4)}
                </span>
              </div>
            </div>
          </div>

          {activePreviewUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveAvatar}
              className="self-start sm:self-center h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Remove avatar
            </Button>
          )}
        </div>

        {/* Avatar Preset Grid */}
        <div className="mt-6 pt-5 border-t border-border/60 space-y-3.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            Choose a Ghibli-Inspired Preset
          </Label>

          <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
            {PRESET_AVATARS.map((preset) => {
              const isSelected =
                avatarMode === "preset" && selectedPreset === preset.id;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  className={cn(
                    "group relative flex flex-col items-center rounded-xl p-1.5 transition-all outline-none",
                    isSelected
                      ? "bg-primary/15 ring-2 ring-primary shadow-sm"
                      : "bg-surface-secondary/40 hover:bg-surface-secondary/80 ring-1 ring-border/60 dark:bg-white/[0.02] dark:hover:bg-white/[0.06]"
                  )}
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                    <Image
                      src={preset.id}
                      alt={preset.label}
                      width={96}
                      height={96}
                      className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    {isSelected && (
                      <div className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="size-2.5 stroke-[3]" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-1.5 text-[11px] font-medium truncate w-full text-center",
                      isSelected
                        ? "text-primary font-semibold"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Photo Upload */}
        <div className="mt-4 pt-4 border-t border-border/60">
          <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            <ImageIcon className="size-3.5 text-brand-secondary" aria-hidden="true" />
            Upload Custom Photo
          </Label>

          <div
            className={cn(
              "flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-dashed p-3.5 transition-colors",
              avatarMode === "upload"
                ? "border-primary/60 bg-primary/5"
                : "border-border hover:border-muted-foreground/50 bg-surface-secondary/30 dark:bg-white/[0.01]"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-muted-foreground dark:bg-white/5">
                <Upload className="size-4" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-foreground">
                  {customFile ? customFile.name : "Select JPEG, PNG, or WebP"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {customFile
                    ? `${(customFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to save`
                    : "Max file size: 3 MB • Saved to your secure private storage"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                id="avatarSettingsFileInput"
                name="avatarFile"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="sr-only"
              />
              <Button
                type="button"
                variant={avatarMode === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 gap-1.5 text-xs"
              >
                <Upload className="size-3.5" aria-hidden="true" />
                <span>{customFile ? "Change Photo" : "Select Photo"}</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Personal & Account Information */}
      <section
        aria-labelledby="section-account-info"
        className="glass-card rounded-2xl border border-border/80 p-5 sm:p-6 shadow-md space-y-4"
      >
        <div className="flex items-center gap-2">
          <User className="size-4 text-primary" aria-hidden="true" />
          <h3
            id="section-account-info"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Personal & Account Details
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-medium text-foreground">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 pl-9 text-xs sm:text-sm"
              />
            </div>
            {state.fieldErrors?.fullName && (
              <p className="text-[11px] text-destructive">
                {state.fieldErrors.fullName[0]}
              </p>
            )}
          </div>

          {/* Account Email (Read-only) */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Mail className="size-3.5 text-muted-foreground" aria-hidden="true" />
              <span>Registered Email</span>
              <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
                <Lock className="size-2.5" aria-hidden="true" />
                Verified
              </span>
            </Label>
            <div className="flex h-10 w-full items-center justify-between rounded-md border border-input/60 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground sm:text-sm cursor-not-allowed select-none">
              <span className="truncate">{userEmail || "No email"}</span>
              <Lock className="size-3.5 text-muted-foreground/60 shrink-0" aria-hidden="true" />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Managed via your Supabase authentication credentials.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Regional & Currency Base (Locked to India / INR) */}
      <section
        aria-labelledby="section-regional-base"
        className="glass-card rounded-2xl border border-border/80 p-5 sm:p-6 shadow-md space-y-4"
      >
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-brand-secondary" aria-hidden="true" />
          <h3
            id="section-regional-base"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Regional & Accounting Jurisdiction
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Locked Country */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Globe className="size-3.5 text-muted-foreground" aria-hidden="true" />
              <span>Country / Jurisdiction</span>
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
          </div>

          {/* Locked Currency */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Coins className="size-3.5 text-muted-foreground" aria-hidden="true" />
              <span>Primary Operating Currency</span>
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
          </div>
        </div>

        {/* Timezone (Editable) */}
        <div className="space-y-1.5">
          <Label htmlFor="timezone" className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Clock className="size-3.5 text-muted-foreground" aria-hidden="true" />
            Timezone <span className="text-destructive">*</span>
          </Label>
          <select
            id="timezone"
            name="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-input/20 px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30 sm:text-sm"
          >
            {(COMMON_TIMEZONES as readonly string[]).includes(timezone) ? null : (
              <option value={timezone} className="bg-popover text-popover-foreground">
                {timezone} (Custom)
              </option>
            )}
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz} className="bg-popover text-popover-foreground">
                {tz} {tz === "Asia/Kolkata" ? "(IST, India Standard Time)" : ""}
              </option>
            ))}
          </select>
          {state.fieldErrors?.timezone && (
            <p className="text-[11px] text-destructive">
              {state.fieldErrors.timezone[0]}
            </p>
          )}
        </div>
      </section>

      {/* 4. Cash Flow & Income Cycle */}
      <section
        aria-labelledby="section-income-cycle"
        className="glass-card rounded-2xl border border-border/80 p-5 sm:p-6 shadow-md space-y-4"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-brand-secondary" aria-hidden="true" />
          <h3
            id="section-income-cycle"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Cash Flow & Payroll Cycle
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Monthly Income Bracket */}
          <div className="space-y-1.5">
            <Label htmlFor="monthlyIncomeRange" className="text-xs font-medium text-foreground">
              Estimated Monthly Income Bracket
            </Label>
            <select
              id="monthlyIncomeRange"
              name="monthlyIncomeRange"
              value={incomeRange}
              onChange={(e) => setIncomeRange(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-input/20 px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30 sm:text-sm"
            >
              <option value="" className="bg-popover text-muted-foreground">
                Not specified
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
          </div>
        </div>
      </section>

      {/* 5. Financial Goals & Priorities */}
      <section
        aria-labelledby="section-financial-goals"
        className="glass-card rounded-2xl border border-border/80 p-5 sm:p-6 shadow-md space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            <h3
              id="section-financial-goals"
              className="text-sm font-semibold tracking-tight text-foreground"
            >
              Active Financial Goals & Priorities
            </h3>
          </div>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {selectedGoals.length} selected
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Toggle which metrics, reminders, and cash flow budgets Coinsight should emphasize in your dashboard.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
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
      </section>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-4 z-20 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/80 p-4 shadow-xl backdrop-blur-md">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          <span>Return to Dashboard</span>
        </Link>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto gap-2 bg-gradient-to-r from-primary to-brand-secondary text-primary-foreground shadow-md shadow-primary/25 hover:opacity-95"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="size-4" aria-hidden="true" />
                Save Profile Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

