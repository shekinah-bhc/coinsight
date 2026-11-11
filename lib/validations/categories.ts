import { z } from "zod";
import type { CategoryType } from "@/src/types/database.types";

export interface CategoryActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  categoryId?: string;
}

export const CATEGORY_TYPES: [CategoryType, ...CategoryType[]] = [
  "expense",
  "income",
];

export const CATEGORY_DATE_PRESETS = [
  "this_month",
  "last_month",
  "last_3_months",
  "this_year",
  "custom",
] as const;

export type CategoryDatePreset = (typeof CATEGORY_DATE_PRESETS)[number];

export type CategorySortOption =
  | "amount_desc"
  | "amount_asc"
  | "transactions_desc"
  | "name_asc"
  | "name_desc";

export const CATEGORY_ICON_OPTIONS = [
  { id: "Utensils", label: "Food & Dining" },
  { id: "ShoppingCart", label: "Groceries" },
  { id: "Coffee", label: "Coffee & Cafe" },
  { id: "Car", label: "Transport" },
  { id: "ShoppingBag", label: "Shopping" },
  { id: "Home", label: "Housing & Rent" },
  { id: "Zap", label: "Utilities" },
  { id: "HeartPulse", label: "Healthcare" },
  { id: "GraduationCap", label: "Education" },
  { id: "Film", label: "Entertainment" },
  { id: "Plane", label: "Travel" },
  { id: "Sparkles", label: "Personal Care" },
  { id: "CalendarSync", label: "Subscriptions" },
  { id: "Briefcase", label: "Salary & Work" },
  { id: "Laptop", label: "Freelance & Tech" },
  { id: "Building2", label: "Business" },
  { id: "TrendingUp", label: "Investments" },
  { id: "Gift", label: "Gifts" },
  { id: "RotateCcw", label: "Refunds" },
  { id: "Smartphone", label: "Mobile & Internet" },
  { id: "Dumbbell", label: "Fitness & Sports" },
  { id: "ShieldCheck", label: "Insurance" },
  { id: "Landmark", label: "Taxes & Banking" },
  { id: "Coins", label: "Dividends & Bonus" },
  { id: "Receipt", label: "Bills & Fees" },
  { id: "Wrench", label: "Repairs" },
  { id: "BookOpen", label: "Books & Learning" },
  { id: "Music", label: "Music & Media" },
  { id: "Gamepad2", label: "Gaming & Hobbies" },
  { id: "Shirt", label: "Clothing" },
  { id: "PiggyBank", label: "Savings" },
  { id: "Wallet", label: "Wallet" },
  { id: "PlusCircle", label: "Other Income" },
  { id: "MinusCircle", label: "Other Expense" },
  { id: "Tag", label: "General Tag" },
] as const;

export const CATEGORY_COLOR_OPTIONS = [
  { hex: "#F87171", label: "Coral Red" },
  { hex: "#FB923C", label: "Warm Orange" },
  { hex: "#FBBF24", label: "Amber Gold" },
  { hex: "#F59E0B", label: "Ochre Yellow" },
  { hex: "#34D399", label: "Emerald Green" },
  { hex: "#14B8A6", label: "Teal" },
  { hex: "#42D6C5", label: "Cyan Mint" },
  { hex: "#38BDF8", label: "Sky Blue" },
  { hex: "#60A5FA", label: "Royal Blue" },
  { hex: "#6366F1", label: "Indigo" },
  { hex: "#818CF8", label: "Soft Violet" },
  { hex: "#8B5CF6", label: "Purple" },
  { hex: "#A855F7", label: "Orchid" },
  { hex: "#E879F9", label: "Fuchsia" },
  { hex: "#EC4899", label: "Pink" },
  { hex: "#F472B6", label: "Rose" },
  { hex: "#94A3B8", label: "Slate" },
  { hex: "#64748B", label: "Cool Gray" },
] as const;

export const categoryNameSchema = z
  .string()
  .trim()
  .min(1, "Category name is required.")
  .max(60, "Category name must be 60 characters or fewer.");

export const categoryColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Please select a valid hex color (e.g. #6366F1).");

export const categoryIconSchema = z
  .string()
  .trim()
  .min(1, "Please select an icon.")
  .max(50, "Icon identifier cannot exceed 50 characters.");

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  type: z.enum(CATEGORY_TYPES, {
    error: "Category type must be expense or income.",
  }),
  icon: categoryIconSchema,
  color: categoryColorSchema,
});

export const updateCategorySchema = z.object({
  categoryId: z.string().uuid("Invalid category identifier."),
  name: categoryNameSchema,
  type: z
    .enum(CATEGORY_TYPES, {
      error: "Category type must be expense or income.",
    })
    .optional(),
  icon: categoryIconSchema,
  color: categoryColorSchema,
});

export const categoryAnalyticsFilterSchema = z.object({
  datePreset: z.enum(CATEGORY_DATE_PRESETS).default("this_month"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD.")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD.")
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryAnalyticsFilter = z.infer<typeof categoryAnalyticsFilterSchema>;

