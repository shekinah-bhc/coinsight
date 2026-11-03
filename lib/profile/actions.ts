"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  type FinancialGoalKey,
  type MonthlyIncomeRange,
  type Profile,
} from "@/src/types/database.types";
import {
  ALLOWED_AVATAR_MIME_TYPES,
  LOCKED_COUNTRY_CODE,
  LOCKED_CURRENCY_CODE,
  MAX_AVATAR_FILE_SIZE_BYTES,
  PRESET_AVATAR_IDS,
} from "@/lib/validations/onboarding";
import {
  type ProfileSettingsActionState,
  profileSettingsSchema,
} from "@/lib/validations/profile-settings";
import { resolveAvatarUrl } from "@/lib/onboarding/avatar-utils";

export interface ProfileSettingsData {
  profile: Profile | null;
  goals: FinancialGoalKey[];
  userEmail: string | undefined;
  resolvedAvatarUrl: string | null;
}

/**
 * Server Loader: Fetches the authenticated user's current profile, saved goals, and avatar.
 * Derives user ID strictly from the authenticated Supabase server session.
 */
export async function getProfileSettingsData(): Promise<ProfileSettingsData> {
  const user = await requireAuth();
  const supabase = await createClient();

  const [profileResult, goalsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_financial_goals").select("goal_key").eq("user_id", user.id),
  ]);

  const profile = profileResult.data;
  const goals = (goalsResult.data?.map((g) => g.goal_key) ?? []) as FinancialGoalKey[];
  const resolvedAvatarUrl = await resolveAvatarUrl(profile?.avatar_url);

  return {
    profile,
    goals,
    userEmail: user.email,
    resolvedAvatarUrl,
  };
}

/**
 * Server Action: Updates Profile Settings.
 * - Saves profile changes without resetting onboarding_completed or onboarding_completed_at.
 * - Enforces server-side country_code = 'IN' and currency = 'INR'.
 * - Handles preset avatars, custom photo uploads (up to 3MB) to Supabase Storage, and removals.
 * - Updates user_financial_goals cleanly without duplicate conflicts.
 */
export async function updateProfileSettingsAction(
  _prevState: ProfileSettingsActionState,
  formData: FormData
): Promise<ProfileSettingsActionState> {
  const user = await requireAuth();

  const rawFullName = formData.get("fullName");
  const rawTimezone = formData.get("timezone");
  const rawIncomeRange = formData.get("monthlyIncomeRange");
  const rawSalaryDay = formData.get("salaryCreditDay");
  const avatarMode = formData.get("avatarMode"); // 'preset' | 'upload' | 'remove' | 'keep'
  const selectedPreset = formData.get("selectedPreset");
  const avatarFile = formData.get("avatarFile");
  const rawGoals = formData.getAll("goals");

  const parsedSalaryDay =
    typeof rawSalaryDay === "string" && rawSalaryDay.trim() !== ""
      ? Number.parseInt(rawSalaryDay, 10)
      : null;

  const validation = profileSettingsSchema.safeParse({
    fullName: typeof rawFullName === "string" ? rawFullName : "",
    timezone: typeof rawTimezone === "string" ? rawTimezone : "Asia/Kolkata",
    monthlyIncomeRange:
      typeof rawIncomeRange === "string" && rawIncomeRange.trim() !== ""
        ? (rawIncomeRange as MonthlyIncomeRange)
        : null,
    salaryCreditDay: Number.isNaN(parsedSalaryDay) ? null : parsedSalaryDay,
    goals: rawGoals,
  });

  if (!validation.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  let avatarUrlToSave: string | null | undefined = undefined;

  // Process Avatar: Option A (Preset)
  if (avatarMode === "preset") {
    if (
      typeof selectedPreset === "string" &&
      (PRESET_AVATAR_IDS as readonly string[]).includes(selectedPreset)
    ) {
      avatarUrlToSave = selectedPreset;
    } else {
      return {
        status: "error",
        message: "Invalid preset avatar selected.",
      };
    }
  }
  // Process Avatar: Option B (Custom Upload)
  else if (avatarMode === "upload") {
    if (avatarFile instanceof File && avatarFile.size > 0) {
      if (avatarFile.size > MAX_AVATAR_FILE_SIZE_BYTES) {
        return {
          status: "error",
          message: "Uploaded image exceeds the 3 MB maximum size limit.",
        };
      }

      if (
        !(ALLOWED_AVATAR_MIME_TYPES as readonly string[]).includes(avatarFile.type)
      ) {
        return {
          status: "error",
          message: "Unsupported file type. Please upload a JPEG, PNG, or WebP image.",
        };
      }

      const extension = avatarFile.name.split(".").pop()?.toLowerCase() || "webp";
      const sanitizedExt = ["jpg", "jpeg", "png", "webp"].includes(extension)
        ? extension
        : "webp";
      const uniqueFileName = `${crypto.randomUUID()}.${sanitizedExt}`;
      const storagePath = `${user.id}/${uniqueFileName}`;

      const arrayBuffer = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(storagePath, buffer, {
          contentType: avatarFile.type,
          upsert: false,
        });

      if (uploadError) {
        return {
          status: "error",
          message: `Storage upload failed: ${uploadError.message}`,
        };
      }

      avatarUrlToSave = storagePath;
    }
  }
  // Process Avatar: Option C (Remove)
  else if (avatarMode === "remove") {
    avatarUrlToSave = null;
  }

  // 1. Update Profile table (preserving onboarding_completed & onboarding_completed_at)
  const updatePayload: {
    full_name: string;
    country_code: string;
    currency: string;
    timezone: string;
    monthly_income_range: MonthlyIncomeRange | null;
    salary_credit_day: number | null;
    avatar_url?: string | null;
  } = {
    full_name: validation.data.fullName,
    country_code: LOCKED_COUNTRY_CODE,
    currency: LOCKED_CURRENCY_CODE,
    timezone: validation.data.timezone,
    monthly_income_range: validation.data.monthlyIncomeRange ?? null,
    salary_credit_day: validation.data.salaryCreditDay ?? null,
  };

  if (avatarUrlToSave !== undefined) {
    updatePayload.avatar_url = avatarUrlToSave;
  }

  let { error: profileError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  // Schema cache resilience: if extended columns aren't migrated yet
  if (
    profileError &&
    (profileError.code === "PGRST204" ||
      profileError.message.includes("schema cache") ||
      profileError.message.includes("Could not find"))
  ) {
    const fallbackPayload: {
      full_name: string;
      currency: string;
      timezone: string;
      avatar_url?: string | null;
    } = {
      full_name: validation.data.fullName,
      currency: LOCKED_CURRENCY_CODE,
      timezone: validation.data.timezone,
    };
    if (avatarUrlToSave !== undefined) {
      fallbackPayload.avatar_url = avatarUrlToSave;
    }
    const fallbackRes = await supabase
      .from("profiles")
      .update(fallbackPayload)
      .eq("id", user.id);
    profileError = fallbackRes.error;
  }

  if (profileError) {
    return {
      status: "error",
      message: profileError.message || "Failed to update profile settings.",
    };
  }

  // 2. Synchronize Financial Goals
  const selectedGoals = validation.data.goals as FinancialGoalKey[];
  if (selectedGoals.length === 0) {
    await supabase
      .from("user_financial_goals")
      .delete()
      .eq("user_id", user.id);
  } else {
    // Delete goals no longer selected
    await supabase
      .from("user_financial_goals")
      .delete()
      .eq("user_id", user.id)
      .not("goal_key", "in", `(${selectedGoals.join(",")})`);

    // Insert newly selected goals without duplicating existing rows
    const goalRows = selectedGoals.map((key) => ({
      user_id: user.id,
      goal_key: key,
    }));

    await supabase
      .from("user_financial_goals")
      .upsert(goalRows, {
        onConflict: "user_id,goal_key",
        ignoreDuplicates: true,
      });
  }

  // Resolve updated avatar URL for client state
  const newResolvedAvatarUrl = await resolveAvatarUrl(avatarUrlToSave);

  revalidatePath("/settings/profile");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Your profile settings have been updated successfully.",
    resolvedAvatarUrl: newResolvedAvatarUrl,
  };
}

