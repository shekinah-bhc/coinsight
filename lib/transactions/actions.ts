"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { parseRupeesToPaise } from "@/lib/finance/money";
import type {
  AccountBalance,
  AccountType,
  Category,
  TransactionSource,
  TransactionType,
} from "@/src/types/database.types";
import {
  type TransactionActionState,
  type TransactionFilterParams,
  createTransactionSchema,
  updateTransactionSchema,
} from "@/lib/validations/transactions";

export interface TransactionItem {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  merchant: string | null;
  transaction_date: string;
  notes: string | null;
  source: TransactionSource;
  created_at: string;
  updated_at: string;
  account: {
    id: string;
    name: string;
    account_type: AccountType;
    institution: string | null;
    is_active: boolean;
  };
  category: {
    id: string;
    name: string;
    type: string;
    icon: string | null;
    color: string | null;
  } | null;
}

export interface RawJoinedTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: string;
  amount: number;
  description: string | null;
  merchant: string | null;
  transaction_date: string;
  notes: string | null;
  source: string;
  created_at: string;
  updated_at: string;
  accounts?: {
    id: string;
    name: string;
    account_type: AccountType;
    institution: string | null;
    is_active: boolean;
  } | null;
  categories?: {
    id: string;
    name: string;
    type: string;
    icon: string | null;
    color: string | null;
  } | null;
}

export interface TransactionsPageData {
  transactions: TransactionItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  accounts: AccountBalance[];
  categories: Category[];
}

/**
 * Ensures a user has default categories populated if none exist.
 */
async function ensureCategories(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<Category[]> {
  const { data: existing, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Database Error: Failed to load categories (${error.message}).`);
  }

  if (existing && existing.length > 0) {
    return (existing as Category[]).map((c) => ({
      ...c,
      is_active: c.is_active !== false,
    }));
  }

  // Idempotently initialize default categories
  await supabase.rpc("init_default_categories");

  const { data: seeded } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  return ((seeded ?? []) as Category[]).map((c) => ({
    ...c,
    is_active: c.is_active !== false,
  }));
}

/**
 * Data Loader: Loads paginated transactions, filtered and sorted,
 * along with available user accounts and categories.
 */
export async function getTransactionsData(
  params: TransactionFilterParams = {}
): Promise<TransactionsPageData> {
  const user = await requireAuth();
  const supabase = await createClient();

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  // 1. Fetch user's active accounts and categories in parallel
  const [accountsResult, categories] = await Promise.all([
    supabase
      .from("account_balances")
      .select("*")
      .eq("user_id", user.id)
      .order("is_active", { ascending: false })
      .order("account_name", { ascending: true }),
    ensureCategories(supabase, user.id),
  ]);

  if (accountsResult.error) {
    throw new Error(
      `Database Configuration Error: Failed to query "account_balances" view (${accountsResult.error.message}).`
    );
  }

  const accounts = (accountsResult.data ?? []) as AccountBalance[];

  // 2. Build transactions query
  let query = supabase
    .from("transactions")
    .select(
      `
      id,
      user_id,
      account_id,
      category_id,
      type,
      amount,
      description,
      merchant,
      transaction_date,
      notes,
      source,
      created_at,
      updated_at,
      accounts!inner(id, name, account_type, institution, is_active),
      categories(id, name, type, icon, color)
    `,
      { count: "exact" }
    )
    .eq("user_id", user.id);

  // Filter: Type (income / expense)
  if (params.type && params.type !== "all") {
    query = query.eq("type", params.type);
  }

  // Filter: Account
  if (params.accountId && params.accountId !== "all") {
    query = query.eq("account_id", params.accountId);
  }

  // Filter: Category
  if (params.categoryId && params.categoryId !== "all") {
    query = query.eq("category_id", params.categoryId);
  }

  // Filter: Date Range
  if (params.startDate) {
    query = query.gte("transaction_date", params.startDate);
  }
  if (params.endDate) {
    query = query.lte("transaction_date", params.endDate);
  }

  // Filter: Text Search (description or merchant)
  if (params.search && params.search.trim() !== "") {
    const s = params.search.trim();
    query = query.or(`description.ilike.%${s}%,merchant.ilike.%${s}%,notes.ilike.%${s}%`);
  }

  // Sorting
  switch (params.sortBy) {
    case "date_asc":
      query = query.order("transaction_date", { ascending: true }).order("created_at", { ascending: true });
      break;
    case "amount_desc":
      query = query.order("amount", { ascending: false });
      break;
    case "amount_asc":
      query = query.order("amount", { ascending: true });
      break;
    case "date_desc":
    default:
      query = query.order("transaction_date", { ascending: false }).order("created_at", { ascending: false });
      break;
  }

  // Pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data: rawTransactions, count, error: txError } = await query;

  if (txError) {
    throw new Error(`Database Error: Failed to fetch transactions (${txError.message}).`);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Format relation data cleanly
  const transactions: TransactionItem[] = (
    (rawTransactions as unknown as RawJoinedTransaction[]) ?? []
  ).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    account_id: row.account_id,
    category_id: row.category_id,
    type: row.type as TransactionType,
    amount: row.amount,
    description: row.description,
    merchant: row.merchant,
    transaction_date: row.transaction_date,
    notes: row.notes,
    source: row.source as TransactionSource,
    created_at: row.created_at,
    updated_at: row.updated_at,
    account: {
      id: row.accounts?.id ?? row.account_id,
      name: row.accounts?.name ?? "Unknown Account",
      account_type: row.accounts?.account_type ?? "bank",
      institution: row.accounts?.institution ?? null,
      is_active: Boolean(row.accounts?.is_active),
    },
    category: row.categories
      ? {
          id: row.categories.id,
          name: row.categories.name,
          type: row.categories.type,
          icon: row.categories.icon,
          color: row.categories.color,
        }
      : null,
  }));

  return {
    transactions,
    totalCount,
    page,
    pageSize,
    totalPages,
    accounts,
    categories,
  };
}

/**
 * Server Action: Creates a new transaction with strict financial validation.
 */
export async function createTransactionAction(
  _prevState: TransactionActionState,
  formData: FormData
): Promise<TransactionActionState> {
  const user = await requireAuth();

  const rawType = formData.get("type");
  const rawAmount = formData.get("amount");
  const rawAccountId = formData.get("accountId");
  const rawCategoryId = formData.get("categoryId");
  const rawDescription = formData.get("description");
  const rawMerchant = formData.get("merchant");
  const rawDate = formData.get("transactionDate");
  const rawNotes = formData.get("notes");

  const validation = createTransactionSchema.safeParse({
    type: typeof rawType === "string" ? rawType : "expense",
    amount: typeof rawAmount === "string" ? rawAmount : "",
    accountId: typeof rawAccountId === "string" ? rawAccountId : "",
    categoryId:
      typeof rawCategoryId === "string" && rawCategoryId !== "" && rawCategoryId !== "none"
        ? rawCategoryId
        : null,
    description: typeof rawDescription === "string" ? rawDescription : null,
    merchant: typeof rawMerchant === "string" ? rawMerchant : null,
    transactionDate: typeof rawDate === "string" ? rawDate : new Date().toISOString().split("T")[0],
    notes: typeof rawNotes === "string" ? rawNotes : null,
  });

  if (!validation.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  // Convert amount string to integer paise via strict string decomposition
  const moneyResult = parseRupeesToPaise(validation.data.amount);
  if (!moneyResult.success) {
    return {
      status: "error",
      message: moneyResult.error,
      fieldErrors: {
        amount: [moneyResult.error],
      },
    };
  }

  if (moneyResult.paise <= 0) {
    return {
      status: "error",
      message: "Transaction amount must be strictly greater than zero.",
      fieldErrors: {
        amount: ["Amount must be greater than zero."],
      },
    };
  }

  const supabase = await createClient();

  // Validate account ownership and active status
  const { data: account, error: accError } = await supabase
    .from("accounts")
    .select("id, is_active, user_id")
    .eq("id", validation.data.accountId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (accError || !account) {
    return {
      status: "error",
      message: "Selected account does not exist or does not belong to you.",
      fieldErrors: {
        accountId: ["Invalid account selected."],
      },
    };
  }

  if (!account.is_active) {
    return {
      status: "error",
      message: "Transactions cannot be recorded against an archived account. Please select an active account.",
      fieldErrors: {
        accountId: ["This account is archived."],
      },
    };
  }

  // Validate category ownership, active status, and type compatibility (if category provided)
  if (validation.data.categoryId) {
    const { data: category, error: catError } = await supabase
      .from("categories")
      .select("*")
      .eq("id", validation.data.categoryId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (catError || !category) {
      return {
        status: "error",
        message: "Selected category does not exist or does not belong to you.",
        fieldErrors: {
          categoryId: ["Invalid category selected."],
        },
      };
    }

    if (category.is_active === false) {
      return {
        status: "error",
        message: "Archived categories cannot be selected for new transactions.",
        fieldErrors: {
          categoryId: ["This category is archived. Please select an active category."],
        },
      };
    }

    if (category.type !== validation.data.type) {
      return {
        status: "error",
        message: `Category type mismatch: Cannot assign an ${category.type} category to an ${validation.data.type} transaction.`,
        fieldErrors: {
          categoryId: [`Must be an ${validation.data.type} category.`],
        },
      };
    }
  }

  // Insert transaction
  const { data: newTx, error: insertError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      account_id: validation.data.accountId,
      category_id: validation.data.categoryId,
      type: validation.data.type,
      amount: moneyResult.paise,
      description: validation.data.description || null,
      merchant: validation.data.merchant || null,
      transaction_date: validation.data.transactionDate,
      notes: validation.data.notes || null,
      source: "manual",
    })
    .select("id")
    .single();

  if (insertError) {
    return {
      status: "error",
      message: insertError.message || "Failed to record transaction.",
    };
  }

  revalidatePath("/transactions");
  revalidatePath("/categories");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");

  return {
    status: "success",
    message: `${validation.data.type === "income" ? "Income" : "Expense"} transaction recorded successfully.`,
    transactionId: newTx?.id,
  };
}

/**
 * Server Action: Updates an existing transaction.
 */
export async function updateTransactionAction(
  _prevState: TransactionActionState,
  formData: FormData
): Promise<TransactionActionState> {
  const user = await requireAuth();

  const rawTxId = formData.get("transactionId");
  const rawType = formData.get("type");
  const rawAmount = formData.get("amount");
  const rawAccountId = formData.get("accountId");
  const rawCategoryId = formData.get("categoryId");
  const rawDescription = formData.get("description");
  const rawMerchant = formData.get("merchant");
  const rawDate = formData.get("transactionDate");
  const rawNotes = formData.get("notes");

  const validation = updateTransactionSchema.safeParse({
    transactionId: typeof rawTxId === "string" ? rawTxId : "",
    type: typeof rawType === "string" ? rawType : "expense",
    amount: typeof rawAmount === "string" ? rawAmount : "",
    accountId: typeof rawAccountId === "string" ? rawAccountId : "",
    categoryId:
      typeof rawCategoryId === "string" && rawCategoryId !== "" && rawCategoryId !== "none"
        ? rawCategoryId
        : null,
    description: typeof rawDescription === "string" ? rawDescription : null,
    merchant: typeof rawMerchant === "string" ? rawMerchant : null,
    transactionDate: typeof rawDate === "string" ? rawDate : new Date().toISOString().split("T")[0],
    notes: typeof rawNotes === "string" ? rawNotes : null,
  });

  if (!validation.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const moneyResult = parseRupeesToPaise(validation.data.amount);
  if (!moneyResult.success) {
    return {
      status: "error",
      message: moneyResult.error,
      fieldErrors: {
        amount: [moneyResult.error],
      },
    };
  }

  if (moneyResult.paise <= 0) {
    return {
      status: "error",
      message: "Transaction amount must be strictly greater than zero.",
      fieldErrors: {
        amount: ["Amount must be greater than zero."],
      },
    };
  }

  const supabase = await createClient();

  // Fetch existing transaction to preserve historical archived category if unchanged
  const { data: existingTx, error: existingTxError } = await supabase
    .from("transactions")
    .select("id, category_id, account_id, type")
    .eq("id", validation.data.transactionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingTxError || !existingTx) {
    return {
      status: "error",
      message: "Transaction not found or access denied.",
    };
  }

  // Validate account ownership and active status
  const { data: account, error: accError } = await supabase
    .from("accounts")
    .select("id, is_active, user_id")
    .eq("id", validation.data.accountId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (accError || !account) {
    return {
      status: "error",
      message: "Selected account does not exist or does not belong to you.",
      fieldErrors: {
        accountId: ["Invalid account selected."],
      },
    };
  }

  if (!account.is_active) {
    return {
      status: "error",
      message: "Cannot move transaction to an archived account.",
      fieldErrors: {
        accountId: ["This account is archived."],
      },
    };
  }

  // Validate category ownership and type compatibility (if category provided)
  if (validation.data.categoryId) {
    const { data: category, error: catError } = await supabase
      .from("categories")
      .select("*")
      .eq("id", validation.data.categoryId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (catError || !category) {
      return {
        status: "error",
        message: "Selected category does not exist or does not belong to you.",
        fieldErrors: {
          categoryId: ["Invalid category selected."],
        },
      };
    }

    if (category.type !== validation.data.type) {
      return {
        status: "error",
        message: `Category type mismatch: Cannot assign an ${category.type} category to an ${validation.data.type} transaction.`,
        fieldErrors: {
          categoryId: [`Must be an ${validation.data.type} category.`],
        },
      };
    }

    // Allow preserving existing archived category, but block assigning a different archived category
    if (
      category.is_active === false &&
      validation.data.categoryId !== existingTx.category_id
    ) {
      return {
        status: "error",
        message: "Archived categories cannot be newly assigned to transactions.",
        fieldErrors: {
          categoryId: ["Please select an active category."],
        },
      };
    }
  }

  // Update transaction
  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      account_id: validation.data.accountId,
      category_id: validation.data.categoryId,
      type: validation.data.type,
      amount: moneyResult.paise,
      description: validation.data.description || null,
      merchant: validation.data.merchant || null,
      transaction_date: validation.data.transactionDate,
      notes: validation.data.notes || null,
    })
    .eq("id", validation.data.transactionId)
    .eq("user_id", user.id);

  if (updateError) {
    return {
      status: "error",
      message: updateError.message || "Failed to update transaction.",
    };
  }

  revalidatePath("/transactions");
  revalidatePath("/categories");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");

  return {
    status: "success",
    message: "Transaction updated successfully.",
    transactionId: validation.data.transactionId,
  };
}

/**
 * Server Action: Deletes a transaction with ownership enforcement.
 */
export async function deleteTransactionAction(
  transactionId: string
): Promise<TransactionActionState> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("user_id", user.id);

  if (error) {
    return {
      status: "error",
      message: error.message || "Failed to delete transaction.",
    };
  }

  revalidatePath("/transactions");
  revalidatePath("/categories");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");

  return {
    status: "success",
    message: "Transaction deleted successfully. Account balance has been updated.",
  };
}
