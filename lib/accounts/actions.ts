"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type {
  AccountBalance,
  NetWorthSummary,
  AccountType,
} from "@/src/types/database.types";
import { parseRupeesToPaise } from "@/lib/finance/money";
import {
  type AccountActionState,
  createAccountSchema,
  updateAccountSchema,
} from "@/lib/validations/accounts";

export interface AccountsPageData {
  accounts: AccountBalance[];
  netWorthSummary: {
    totalAssets: string;
    totalLiabilities: string;
    netWorth: string;
    activeAccountsCount: number;
  };
}

export interface AccountDetailData {
  account: AccountBalance | null;
  recentTransactions: {
    id: string;
    amount: number;
    type: "income" | "expense";
    description: string | null;
    transaction_date: string;
    source: string;
  }[];
}

/**
 * Data Loader: Loads all accounts (active and archived) and calculated net worth summary
 * strictly scoped to the authenticated user via Supabase SSR and RLS.
 */
export async function getAccountsData(): Promise<AccountsPageData> {
  const user = await requireAuth();
  const supabase = await createClient();

  const [accountsResult, netWorthResult] = await Promise.all([
    supabase
      .from("account_balances")
      .select("*")
      .eq("user_id", user.id)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("net_worth_summary")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (accountsResult.error) {
    throw new Error(
      `Database Configuration Error: Failed to query "account_balances" view (${accountsResult.error.message}). Please ensure migration 20261103100500_accounts_management.sql has been applied.`
    );
  }

  if (netWorthResult.error) {
    throw new Error(
      `Database Configuration Error: Failed to query "net_worth_summary" view (${netWorthResult.error.message}). Please ensure migration 20261103100500_accounts_management.sql has been applied.`
    );
  }

  const accounts = (accountsResult.data ?? []) as AccountBalance[];
  const nwRow = netWorthResult.data as NetWorthSummary | null;

  return {
    accounts,
    netWorthSummary: {
      totalAssets: nwRow?.total_assets ?? "0",
      totalLiabilities: nwRow?.total_liabilities ?? "0",
      netWorth: nwRow?.net_worth ?? "0",
      activeAccountsCount: nwRow?.active_accounts_count ?? 0,
    },
  };
}

/**
 * Data Loader: Loads single account details and recent transactions.
 */
export async function getAccountDetailData(accountId: string): Promise<AccountDetailData> {
  const user = await requireAuth();
  const supabase = await createClient();

  const [accountResult, txResult] = await Promise.all([
    supabase
      .from("account_balances")
      .select("*")
      .eq("account_id", accountId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("transactions")
      .select("id, amount, type, description, transaction_date, source")
      .eq("account_id", accountId)
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (accountResult.error) {
    throw new Error(
      `Database Configuration Error: Failed to query "account_balances" view (${accountResult.error.message}). Please ensure migration 20261103100500_accounts_management.sql has been applied.`
    );
  }

  if (txResult.error) {
    throw new Error(
      `Database Configuration Error: Failed to query "transactions" table (${txResult.error.message}).`
    );
  }

  return {
    account: (accountResult.data as AccountBalance | null) ?? null,
    recentTransactions: (txResult.data as AccountDetailData["recentTransactions"]) ?? [],
  };
}

/**
 * Server Action: Creates a new account.
 * Converts input Rupees to integer paise using safe decimal parsing without float multiplication.
 */
export async function createAccountAction(
  _prevState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const user = await requireAuth();

  const rawName = formData.get("name");
  const rawType = formData.get("accountType");
  const rawInstitution = formData.get("institution");
  const rawBalance = formData.get("openingBalance");
  const rawNotes = formData.get("notes");

  const validation = createAccountSchema.safeParse({
    name: typeof rawName === "string" ? rawName : "",
    accountType: typeof rawType === "string" ? rawType : "bank",
    institution: typeof rawInstitution === "string" ? rawInstitution : "",
    openingBalance: typeof rawBalance === "string" ? rawBalance : "",
    notes: typeof rawNotes === "string" ? rawNotes : "",
    currency: "INR",
  });

  if (!validation.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const isCreditCard = validation.data.accountType === "credit_card";
  const moneyResult = parseRupeesToPaise(validation.data.openingBalance, isCreditCard);

  if (!moneyResult.success) {
    return {
      status: "error",
      message: moneyResult.error,
      fieldErrors: {
        openingBalance: [moneyResult.error],
      },
    };
  }

  const supabase = await createClient();

  // Insert account
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      name: validation.data.name,
      account_type: validation.data.accountType,
      currency: "INR",
      opening_balance: moneyResult.paise,
      institution: validation.data.institution || null,
      institution_name: validation.data.institution || null,
      notes: validation.data.notes || null,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        message: `An active account named "${validation.data.name}" already exists. Please choose a distinct name.`,
        fieldErrors: {
          name: ["An active account with this name already exists."],
        },
      };
    }

    return {
      status: "error",
      message: error.message || "Failed to create account. Please try again.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: `Account "${validation.data.name}" created successfully.`,
    accountId: data?.id,
  };
}

/**
 * Server Action: Updates an existing account.
 * Enforces immutable fields if financial transactions or transfers exist.
 */
export async function updateAccountAction(
  _prevState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const user = await requireAuth();

  const accountId = formData.get("accountId");
  const rawName = formData.get("name");
  const rawInstitution = formData.get("institution");
  const rawNotes = formData.get("notes");
  const rawBalance = formData.get("openingBalance");
  const rawType = formData.get("accountType");

  const validation = updateAccountSchema.safeParse({
    accountId: typeof accountId === "string" ? accountId : "",
    name: typeof rawName === "string" ? rawName : "",
    institution: typeof rawInstitution === "string" ? rawInstitution : "",
    notes: typeof rawNotes === "string" ? rawNotes : "",
    openingBalance: typeof rawBalance === "string" ? rawBalance : null,
    accountType: typeof rawType === "string" ? (rawType as AccountType) : null,
  });

  if (!validation.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  // Fetch current account status to check activity
  const { data: currentAcc, error: fetchError } = await supabase
    .from("account_balances")
    .select("*")
    .eq("account_id", validation.data.accountId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !currentAcc) {
    return {
      status: "error",
      message: "Account not found or access denied.",
    };
  }

  const updatePayload: {
    name: string;
    institution: string | null;
    institution_name: string | null;
    notes: string | null;
    opening_balance?: number;
    account_type?: AccountType;
  } = {
    name: validation.data.name,
    institution: validation.data.institution || null,
    institution_name: validation.data.institution || null,
    notes: validation.data.notes || null,
  };

  // If account has NO activity, allow modifying opening balance and type
  if (!currentAcc.has_activity) {
    if (validation.data.openingBalance !== null && validation.data.openingBalance !== undefined) {
      const isCreditCard =
        (validation.data.accountType ?? currentAcc.account_type) === "credit_card";
      const moneyResult = parseRupeesToPaise(validation.data.openingBalance, isCreditCard);

      if (!moneyResult.success) {
        return {
          status: "error",
          message: moneyResult.error,
          fieldErrors: { openingBalance: [moneyResult.error] },
        };
      }
      updatePayload.opening_balance = moneyResult.paise;
    }

    if (validation.data.accountType) {
      updatePayload.account_type = validation.data.accountType;
    }
  }

  const { error: updateError } = await supabase
    .from("accounts")
    .update(updatePayload)
    .eq("id", validation.data.accountId)
    .eq("user_id", user.id);

  if (updateError) {
    if (updateError.code === "23505") {
      return {
        status: "error",
        message: `An active account named "${validation.data.name}" already exists.`,
        fieldErrors: { name: ["An active account with this name already exists."] },
      };
    }

    if (updateError.code === "23514" || updateError.message.includes("immutable")) {
      return {
        status: "error",
        message:
          "Opening balance, currency, and account type cannot be modified once transactions or transfers exist.",
      };
    }

    return {
      status: "error",
      message: updateError.message || "Failed to update account.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: `Account "${validation.data.name}" updated successfully.`,
    accountId: validation.data.accountId,
  };
}

/**
 * Server Action: Archives an account.
 * Preserves all historical transactions.
 */
export async function archiveAccountAction(accountId: string): Promise<AccountActionState> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("accounts")
    .update({ is_active: false })
    .eq("id", accountId)
    .eq("user_id", user.id);

  if (error) {
    return {
      status: "error",
      message: error.message || "Failed to archive account.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Account archived successfully. Its balance is now excluded from your active net worth.",
  };
}

/**
 * Server Action: Reactivates an archived account.
 */
export async function reactivateAccountAction(accountId: string): Promise<AccountActionState> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("accounts")
    .update({ is_active: true })
    .eq("id", accountId)
    .eq("user_id", user.id);

  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        message: "Another active account with the same name already exists. Please rename the account before reactivating.",
      };
    }

    return {
      status: "error",
      message: error.message || "Failed to reactivate account.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Account reactivated successfully. Its balance is now included in your net worth.",
  };
}

