import { z } from "zod";
import type { AccountType } from "@/src/types/database.types";

export const ACCOUNT_TYPES: {
  value: AccountType;
  label: string;
  description: string;
  iconName: string;
}[] = [
  {
    value: "bank",
    label: "Bank Account",
    description: "Savings, salary, or current accounts (e.g. HDFC, SBI, ICICI)",
    iconName: "Building2",
  },
  {
    value: "credit_card",
    label: "Credit Card",
    description: "Credit card with outstanding balances and billing cycle",
    iconName: "CreditCard",
  },
  {
    value: "wallet",
    label: "Digital Wallet",
    description: "Prepaid or UPI digital wallets (e.g. Paytm, Amazon Pay)",
    iconName: "Smartphone",
  },
  {
    value: "cash",
    label: "Cash in Hand",
    description: "Physical currency notes, coins, and household petty cash",
    iconName: "Wallet",
  },
];

export const createAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Account name is required")
    .max(100, "Account name must be 100 characters or fewer"),
  accountType: z.enum(["cash", "bank", "wallet", "credit_card"]),
  institution: z
    .string()
    .trim()
    .max(100, "Institution name must be 100 characters or fewer")
    .optional()
    .nullable(),
  openingBalance: z
    .string()
    .trim()
    .min(1, "Opening balance is required"),
  currency: z.literal("INR").default("INR"),
  notes: z
    .string()
    .trim()
    .max(500, "Notes must be 500 characters or fewer")
    .optional()
    .nullable(),
});

export const updateAccountSchema = z.object({
  accountId: z.string().uuid("Invalid account identifier"),
  name: z
    .string()
    .trim()
    .min(1, "Account name is required")
    .max(100, "Account name must be 100 characters or fewer"),
  institution: z
    .string()
    .trim()
    .max(100, "Institution name must be 100 characters or fewer")
    .optional()
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(500, "Notes must be 500 characters or fewer")
    .optional()
    .nullable(),
  // Optional when has_activity is false
  openingBalance: z.string().trim().optional().nullable(),
  accountType: z.enum(["cash", "bank", "wallet", "credit_card"]).optional().nullable(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

export interface AccountActionState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  accountId?: string;
}

export const initialAccountActionState: AccountActionState = {
  status: "idle",
};

