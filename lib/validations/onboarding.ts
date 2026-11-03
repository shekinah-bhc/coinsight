import { z } from "zod";
import type { FinancialGoalKey, MonthlyIncomeRange } from "@/src/types/database.types";

/**
 * 5 Original, visually distinct Ghibli-inspired preset avatars.
 */
export const PRESET_AVATARS = [
  {
    id: "/avatars/avatar-1.webp",
    label: "Hana",
    description: "Thoughtful with chestnut bob & soft knit",
  },
  {
    id: "/avatars/avatar-2.webp",
    label: "Ren",
    description: "Quiet scholar with round glasses & linen shirt",
  },
  {
    id: "/avatars/avatar-3.webp",
    label: "Aoi",
    description: "Cheerful with amber braids & mustard cardigan",
  },
  {
    id: "/avatars/avatar-4.webp",
    label: "Kaito",
    description: "Calm observer with lavender waves & turtleneck",
  },
  {
    id: "/avatars/avatar-5.webp",
    label: "Sora",
    description: "Warm-spirited with curly hair & terracotta scarf",
  },
] as const;

export type PresetAvatarId = (typeof PRESET_AVATARS)[number]["id"];

export const PRESET_AVATAR_IDS = PRESET_AVATARS.map((a) => a.id) as [
  PresetAvatarId,
  ...PresetAvatarId[],
];

export const MAX_AVATAR_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB
export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const LOCKED_COUNTRY_CODE = "IN" as const;
export const LOCKED_COUNTRY_NAME = "India" as const;
export const LOCKED_COUNTRY_FLAG = "🇮🇳" as const;
export const LOCKED_CURRENCY_CODE = "INR" as const;
export const LOCKED_CURRENCY_SYMBOL = "₹" as const;
export const LOCKED_CURRENCY_NAME = "Indian Rupee" as const;

export const COMMON_TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Singapore",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
] as const;

export const INCOME_RANGES: { value: MonthlyIncomeRange; label: string }[] = [
  { value: "below_20k", label: "Below ₹20,000 / month" },
  { value: "20k_40k", label: "₹20,000 – ₹40,000 / month" },
  { value: "40k_60k", label: "₹40,000 – ₹60,000 / month" },
  { value: "60k_100k", label: "₹60,000 – ₹1,00,000 / month" },
  { value: "above_100k", label: "Above ₹1,00,000 / month" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const FINANCIAL_GOALS_LIST: {
  key: FinancialGoalKey;
  title: string;
  description: string;
  iconName: string;
}[] = [
  {
    key: "track_expenses",
    title: "Track Daily Expenses",
    description: "Keep tabs on routine cash flow and never lose track of small purchases.",
    iconName: "Receipt",
  },
  {
    key: "build_savings",
    title: "Build an Emergency Fund",
    description: "Grow liquid savings reserves for security and unexpected milestones.",
    iconName: "PiggyBank",
  },
  {
    key: "control_spending",
    title: "Control Overspending",
    description: "Set strict category limits and curb impulsive non-essential expenses.",
    iconName: "Sliders",
  },
  {
    key: "manage_subscriptions",
    title: "Manage Subscriptions",
    description: "Track monthly recurring digital services, gym memberships, and renewals.",
    iconName: "CalendarSync",
  },
  {
    key: "understand_spending",
    title: "Understand Financial Habits",
    description: "Gain clarity with detailed visual analytics and cash flow health indicators.",
    iconName: "BarChart3",
  },
  {
    key: "track_debt",
    title: "Track & Pay Off Debt",
    description: "Organize credit cards, personal loans, and recurring EMIs systematically.",
    iconName: "CreditCard",
  },
  {
    key: "plan_budgets",
    title: "Plan Monthly Budgets",
    description: "Allocate monthly budget envelopes across housing, food, and investments.",
    iconName: "PieChart",
  },
];

// Step 1: Personal Info
export const stepPersonalInfoSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be 100 characters or fewer"),
  avatarUrl: z
    .string()
    .trim()
    .max(500, "Avatar identifier is too long")
    .optional()
    .nullable(),
});

// Step 2: Financial Preferences (Strictly locked to India / INR)
export const stepFinancialPreferencesSchema = z.object({
  countryCode: z.literal(LOCKED_COUNTRY_CODE).default(LOCKED_COUNTRY_CODE),
  currency: z.literal(LOCKED_CURRENCY_CODE).default(LOCKED_CURRENCY_CODE),
  timezone: z
    .string()
    .trim()
    .min(1, "Timezone is required")
    .default("Asia/Kolkata"),
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
});

// Step 3: Financial Goals (Optional! 0 to 7 goals allowed)
export const stepFinancialGoalsSchema = z.object({
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

export type StepPersonalInfoInput = z.infer<typeof stepPersonalInfoSchema>;
export type StepFinancialPreferencesInput = z.infer<
  typeof stepFinancialPreferencesSchema
>;
export type StepFinancialGoalsInput = z.infer<typeof stepFinancialGoalsSchema>;

export interface OnboardingActionState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  step?: number;
  avatarUrl?: string | null;
}

export const initialOnboardingActionState: OnboardingActionState = {
  status: "idle",
};
