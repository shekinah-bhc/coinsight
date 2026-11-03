import { z } from "zod";
import type { TransactionSource, TransactionType } from "@/src/types/database.types";

export interface TransactionActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  transactionId?: string;
}

export const TRANSACTION_TYPES: [TransactionType, ...TransactionType[]] = [
  "expense",
  "income",
];

export const TRANSACTION_SOURCES: [TransactionSource, ...TransactionSource[]] = [
  "manual",
  "ai",
  "receipt",
];

/**
 * Validates a currency amount string:
 * - Must be a positive number > 0
 * - Maximum 2 decimal places
 * - Upper bound checked during paise conversion
 */
export const amountStringSchema = z
  .string()
  .trim()
  .min(1, "Amount is required.")
  .regex(
    /^[0-9]+(\.[0-9]{1,2})?$/,
    "Please enter a valid amount with up to two decimal places (e.g. 250 or 1250.50)."
  )
  .refine(
    (val) => {
      const num = Number.parseFloat(val);
      return !Number.isNaN(num) && num > 0;
    },
    { message: "Amount must be greater than zero." }
  );

export const createTransactionSchema = z.object({
  type: z.enum(TRANSACTION_TYPES, {
    error: "Transaction type must be income or expense.",
  }),
  amount: amountStringSchema,
  accountId: z
    .string()
    .uuid("Please select a valid account."),
  categoryId: z
    .string()
    .uuid("Please select a valid category.")
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .max(255, "Description cannot exceed 255 characters.")
    .nullable()
    .optional(),
  merchant: z
    .string()
    .trim()
    .max(100, "Merchant cannot exceed 100 characters.")
    .nullable()
    .optional(),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please select a valid date (YYYY-MM-DD)."),
  notes: z
    .string()
    .trim()
    .max(500, "Notes cannot exceed 500 characters.")
    .nullable()
    .optional(),
});

export const updateTransactionSchema = createTransactionSchema.extend({
  transactionId: z.string().uuid("Invalid transaction identifier."),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export interface TransactionFilterParams {
  search?: string;
  type?: "all" | "income" | "expense";
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
  page?: number;
  pageSize?: number;
}

