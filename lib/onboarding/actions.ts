"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  type FinancialGoalKey,
  type MonthlyIncomeRange,
  type Profile,
} from "@/src/types/database.types";
import {
  type OnboardingActionState,
  ALLOWED_AVATAR_MIME_TYPES,
  LOCKED_COUNTRY_CODE,
  LOCKED_CURRENCY_CODE,
  MAX_AVATAR_FILE_SIZE_BYTES,
  PRESET_AVATAR_IDS,
  stepFinancialGoalsSchema,
  stepFinancialPreferencesSchema,
  stepPersonalInfoSchema,
} from "@/lib/validations/onboarding";
import { resolveAvatarUrl } from "@/lib/onboarding/avatar-utils";

export interface OnboardingData {
  profile: Profile | null;
  goals: FinancialGoalKey[];
  resolvedAvatarUrl: string | null;
}

/**
 * Server loader: Fetches the current authenticated user's profile and saved financial goals.
 */
export async function getOnboardingData(): Promise<OnboardingData> {
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
    resolvedAvatarUrl,
  };
}

/**
 * Action: Step 1 — Personal Information (Full name & Avatar selection/upload)
 */
export async function saveStep1Action(
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const user = await requireAuth();

  const rawFullName = formData.get("fullName");
  const avatarMode = formData.get("avatarMode"); // 'preset' | 'upload' | 'remove' | 'keep'
  const selectedPreset = formData.get("selectedPreset");
  const avatarFile = formData.get("avatarFile");

  const validation = stepPersonalInfoSchema.safeParse({
    fullName: typeof rawFullName === "string" ? rawFullName : "",
  });

  if (!validation.success) {
    return {
      status: "error",
      message: "Please enter a valid full name.",
      fieldErrors: validation.error.flatten().fieldErrors,
      step: 1,
    };
  }

  const supabase = await createClient();
  let avatarUrlToSave: string | null | undefined = undefined;

  // Option A: Preset avatar chosen
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
        step: 1,
      };
    }
  }
  // Option B: Custom avatar upload
  else if (avatarMode === "upload") {
    if (avatarFile instanceof File && avatarFile.size > 0) {
      // 1. Validate file size (max 3MB)
      if (avatarFile.size > MAX_AVATAR_FILE_SIZE_BYTES) {
        return {
          status: "error",
          message: "Uploaded image exceeds the 3 MB maximum size limit.",
          step: 1,
        };
      }

      // 2. Validate MIME type
      if (
        !(ALLOWED_AVATAR_MIME_TYPES as readonly string[]).includes(avatarFile.type)
      ) {
        return {
          status: "error",
          message: "Unsupported file type. Please upload a JPEG, PNG, or WebP image.",
          step: 1,
        };
      }

      // 3. Generate secure scoped path: {authenticated-user-id}/{unique-uuid}.{ext}
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
          step: 1,
        };
      }

      avatarUrlToSave = storagePath;
    }
  }
  // Option C: Remove avatar
  else if (avatarMode === "remove") {
    avatarUrlToSave = null;
  }

  // Update profile in database
  const updatePayload: {
    full_name: string;
    onboarding_step: number;
    avatar_url?: string | null;
  } = {
    full_name: validation.data.fullName,
    onboarding_step: 2,
  };

  if (avatarUrlToSave !== undefined) {
    updatePayload.avatar_url = avatarUrlToSave;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  if (updateError) {
    return {
      status: "error",
      message: updateError.message || "Failed to save profile information.",
      step: 1,
    };
  }

  revalidatePath("/onboarding");
  return {
    status: "success",
    message: "Personal details updated successfully.",
    step: 2,
    avatarUrl: avatarUrlToSave,
  };
}

/**
 * Action: Step 2 — Financial Preferences (Country & Currency locked to India / INR)
 */
export async function saveStep2Action(
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const user = await requireAuth();

  const rawTimezone = formData.get("timezone");
  const rawIncomeRange = formData.get("monthlyIncomeRange");
  const rawSalaryDay = formData.get("salaryCreditDay");

  const parsedSalaryDay =
    typeof rawSalaryDay === "string" && rawSalaryDay.trim() !== ""
      ? Number.parseInt(rawSalaryDay, 10)
      : null;

  // Server-side strict enforcement: countryCode and currency are locked to 'IN' / 'INR'
  const validation = stepFinancialPreferencesSchema.safeParse({
    countryCode: LOCKED_COUNTRY_CODE,
    currency: LOCKED_CURRENCY_CODE,
    timezone: typeof rawTimezone === "string" ? rawTimezone : "Asia/Kolkata",
    monthlyIncomeRange:
      typeof rawIncomeRange === "string" && rawIncomeRange.trim() !== ""
        ? (rawIncomeRange as MonthlyIncomeRange)
        : null,
    salaryCreditDay: Number.isNaN(parsedSalaryDay) ? null : parsedSalaryDay,
  });

  if (!validation.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: validation.error.flatten().fieldErrors,
      step: 2,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      country_code: LOCKED_COUNTRY_CODE,
      currency: LOCKED_CURRENCY_CODE,
      timezone: validation.data.timezone,
      monthly_income_range: validation.data.monthlyIncomeRange ?? null,
      salary_credit_day: validation.data.salaryCreditDay ?? null,
      onboarding_step: 3,
    })
    .eq("id", user.id);

  if (error) {
    return {
      status: "error",
      message: error.message || "Failed to save financial preferences.",
      step: 2,
    };
  }

  revalidatePath("/onboarding");
  return {
    status: "success",
    message: "Financial preferences updated successfully.",
    step: 3,
  };
}

/**
 * Action: Step 3 — Financial Goals & Atomic Onboarding Completion
 * Supports 0 to 7 goals. Empty goals selection is completely valid.
 */
export async function saveStep3Action(
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const user = await requireAuth();

  const rawGoals = formData.getAll("goals");
  const validation = stepFinancialGoalsSchema.safeParse({
    goals: rawGoals,
  });

  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid financial goals submission.",
      fieldErrors: validation.error.flatten().fieldErrors,
      step: 3,
    };
  }

  const supabase = await createClient();
  const selectedGoals = validation.data.goals as FinancialGoalKey[];

  // 1. Attempt atomic execution via RPC: complete_onboarding
  const { error: rpcError } = await supabase.rpc("complete_onboarding", {
    p_goal_keys: selectedGoals,
  });

  // 2. If RPC is not available yet (e.g. pending manual migration), use robust client-side fallback
  if (rpcError) {
    // Delete unselected goals
    if (selectedGoals.length === 0) {
      const { error: delError } = await supabase
        .from("user_financial_goals")
        .delete()
        .eq("user_id", user.id);
      if (delError) {
        return {
          status: "error",
          message: delError.message || "Failed to update financial goals.",
          step: 3,
        };
      }
    } else {
      await supabase
        .from("user_financial_goals")
        .delete()
        .eq("user_id", user.id);

      const goalRows = selectedGoals.map((key) => ({
        user_id: user.id,
        goal_key: key,
      }));

      const { error: insError } = await supabase
        .from("user_financial_goals")
        .insert(goalRows);

      if (insError) {
        return {
          status: "error",
          message: insError.message || "Failed to save financial goals.",
          step: 3,
        };
      }
    }

    // Mark profile completed
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_step: 3,
      })
      .eq("id", user.id);

    if (profileError) {
      return {
        status: "error",
        message: profileError.message || "Failed to finalize profile completion.",
        step: 3,
      };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  redirect("/dashboard");
}

/**
 * Action: Skip Onboarding directly to Dashboard
 */
export async function skipOnboardingAction(): Promise<void> {
  await requireAuth();
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
