import { z } from "zod";

export const profileSettingsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be 100 characters or fewer"),
  timezone: z.string().trim().min(1, "Timezone is required"),
  monthlyIncomeRange: z
    .enum([
      "below_20k",
      "20k_40k",
      "40k_60k",
      "60k_100k",
      "above_100k",
      "prefer_not_to_say",
    ])
    .optional()
    .nullable(),
  salaryCreditDay: z
    .number()
    .int()
    .min(1, "Day must be between 1 and 31")
    .max(31, "Day must be between 1 and 31")
    .optional()
    .nullable(),
  goals: z
    .array(
      z.enum([
        "track_expenses",
        "build_savings",
        "control_spending",
        "manage_subscriptions",
        "understand_spending",
        "track_debt",
        "plan_budgets",
      ])
    )
    .default([]),
});

export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;

export interface ProfileSettingsActionState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  resolvedAvatarUrl?: string | null;
}

export const initialProfileSettingsActionState: ProfileSettingsActionState = {
  status: "idle",
};

