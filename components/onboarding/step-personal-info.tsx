"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  ImageIcon,
  Loader2,
  Trash2,
  Upload,
  User,
  Sparkles,
} from "lucide-react";
import { cn } from "cn";
import {
  type OnboardingActionState,
  initialOnboardingActionState,
  MAX_AVATAR_FILE_SIZE_BYTES,
  PRESET_AVATARS,
  type PresetAvatarId,
} from "@/lib/validations/onboarding";
import { saveStep1Action, skipOnboardingAction } from "@/lib/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StepPersonalInfoProps {
  initialFullName?: string | null;
  initialAvatarUrl?: string | null;
  resolvedAvatarUrl?: string | null;
  onSuccess: (newAvatarUrl?: string | null) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return parts[0]?.slice(0, 2).toUpperCase() || "CS";
}

export function StepPersonalInfo({
  initialFullName,
  initialAvatarUrl,
  resolvedAvatarUrl,
  onSuccess,
}: StepPersonalInfoProps) {
  const isInitialPreset =
    typeof initialAvatarUrl === "string" &&
    initialAvatarUrl.startsWith("/avatars/");

  const [fullName, setFullName] = useState(initialFullName ?? "");
  const [selectedPreset, setSelectedPreset] = useState<PresetAvatarId | null>(
    isInitialPreset ? (initialAvatarUrl as PresetAvatarId) : "/avatars/avatar-1.webp"
  );
  const [avatarMode, setAvatarMode] = useState<"preset" | "upload" | "remove" | "keep">(
    isInitialPreset
      ? "preset"
      : resolvedAvatarUrl
        ? "keep"
        : "preset"
  );
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customPreviewUrl, setCustomPreviewUrl] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up blob URL on unmount or file change
  useEffect(() => {
    return () => {
      if (customPreviewUrl && customPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(customPreviewUrl);
      }
    };
  }, [customPreviewUrl]);

  const [state, formAction, isPending] = useActionState(
    async (prev: OnboardingActionState, formData: FormData) => {
      setClientError(null);
      const result = await saveStep1Action(prev, formData);
      if (result.status === "success") {
        onSuccess(result.avatarUrl);
      }
      return result;
    },
    initialOnboardingActionState
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

    // Client-side validations
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSkip() {
    setIsSkipping(true);
    await skipOnboardingAction();
  }

  // Determine current active preview
  let activePreviewUrl: string | null = null;
  if (avatarMode === "upload" && customPreviewUrl) {
    activePreviewUrl = customPreviewUrl;
  } else if (avatarMode === "preset" && selectedPreset) {
    activePreviewUrl = selectedPreset;
  } else if (avatarMode === "keep" && resolvedAvatarUrl) {
    activePreviewUrl = resolvedAvatarUrl;
  }

  const initials = getInitials(fullName);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Welcome to Coinsight! Set up your profile
        </h2>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Enter your name and pick an avatar to personalize your workspace.
        </p>
      </div>

      {(clientError || (state.status === "error" && state.message)) && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive dark:bg-destructive/15"
        >
          {clientError || state.message}
        </div>
      )}

      {/* Hidden inputs to pass avatar selection to Server Action */}
      <input type="hidden" name="avatarMode" value={avatarMode} />
      <input type="hidden" name="selectedPreset" value={selectedPreset ?? ""} />

      {/* Primary Profile Live Preview */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-secondary/50 p-4 sm:flex-row sm:items-center sm:p-5 dark:bg-white/[0.02]">
        <div className="relative flex shrink-0 justify-center">
          <Avatar className="size-20 ring-4 ring-primary/20 shadow-lg">
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
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {fullName.trim() ? fullName : "Your Name"}
              </p>
              <p className="text-xs text-muted-foreground">
                {avatarMode === "upload"
                  ? "Custom photo selected"
                  : avatarMode === "preset" && selectedPreset
                    ? `${PRESET_AVATARS.find((a) => a.id === selectedPreset)?.label} (Preset)`
                    : avatarMode === "keep"
                      ? "Current photo"
                      : "Default initials"}
              </p>
            </div>

            {activePreviewUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveAvatar}
                className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3" aria-hidden="true" />
                Remove avatar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Full Name Input */}
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
            autoFocus
            placeholder="e.g. Priya Sharma"
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

      {/* Avatar Options Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            Option A — Choose a Ghibli-Inspired Preset
          </Label>
        </div>

        {/* 5 Preset Avatars Grid */}
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

        {/* Option B — Custom Image Upload */}
        <div className="pt-2">
          <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            <ImageIcon className="size-3.5 text-brand-secondary" aria-hidden="true" />
            Option B — Upload Custom Photo
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
                  {customFile ? customFile.name : "Upload JPEG, PNG or WebP"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {customFile
                    ? `${(customFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to save`
                    : "Max file size: 3 MB • Strictly saved to your private folder"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                id="avatarFileInput"
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
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse justify-between gap-3 pt-4 sm:flex-row sm:items-center">
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
              Skipping to dashboard...
            </>
          ) : (
            "Skip for now"
          )}
        </Button>

        <Button
          type="submit"
          disabled={isPending || isSkipping}
          className="gap-2 bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving Profile...
            </>
          ) : (
            <>
              Continue to Financial Setup
              <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
