"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Loader2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createTransactionAction } from "@/lib/transactions/actions";
import { formatSqlNumericToRupees } from "@/lib/finance/money";
import { CategoryIcon } from "@/components/transactions/category-icon";
import type { TransactionActionState } from "@/lib/validations/transactions";
import type { AccountBalance, Category, TransactionType } from "@/src/types/database.types";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: AccountBalance[];
  categories: Category[];
  onSuccess?: () => void;
}

const initialState: TransactionActionState = {
  status: "idle",
};

interface AddTransactionFormProps {
  accounts: AccountBalance[];
  categories: Category[];
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function AddTransactionForm({
  accounts,
  categories,
  onOpenChange,
  onSuccess,
}: AddTransactionFormProps) {
  const [state, formAction, isPending] = useActionState(createTransactionAction, initialState);

  // Active accounts only
  const activeAccounts = useMemo(() => accounts.filter((a) => a.is_active), [accounts]);

  const [type, setType] = useState<TransactionType>("expense");
  const [accountId, setAccountId] = useState<string>(activeAccounts[0]?.account_id ?? "");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [amount, setAmount] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split("T")[0] ?? ""
  );

  // Filter active categories by selected transaction type
  const matchingCategories = useMemo(
    () => categories.filter((c) => c.type === type && c.is_active !== false),
    [categories, type]
  );

  // When type changes, reset category if it doesn't match
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategoryId("none");
  };

  const selectedAccount = useMemo(
    () => activeAccounts.find((a) => a.account_id === accountId),
    [activeAccounts, accountId]
  );

  const selectedCategory = useMemo(
    () => matchingCategories.find((c) => c.id === categoryId),
    [matchingCategories, categoryId]
  );

  const isCreditCard = selectedAccount?.account_type === "credit_card";

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message || "Transaction saved.");
      onOpenChange(false);
      onSuccess?.();
    } else if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state, onOpenChange, onSuccess]);

  return (
    <form action={formAction} className="space-y-4 py-2">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="categoryId" value={categoryId} />

      {state.status === "error" && state.message && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          {state.message}
        </div>
      )}

      {/* Transaction Type Selector */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Transaction Type</Label>
        <Tabs
          value={type}
          onValueChange={(val) => handleTypeChange(val as TransactionType)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 h-10 p-1">
            <TabsTrigger
              value="expense"
              className="text-xs font-medium data-[state=active]:bg-rose-500/15 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400 gap-1.5"
            >
              <ArrowDownLeft className="size-3.5" />
              Expense (Outflow)
            </TabsTrigger>
            <TabsTrigger
              value="income"
              className="text-xs font-medium data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 gap-1.5"
            >
              <ArrowUpRight className="size-3.5" />
              Income (Inflow)
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Amount Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="amount" className="text-xs font-medium">
            Amount (₹) <span className="text-destructive">*</span>
          </Label>
          <span className="text-[11px] text-muted-foreground">Currency: INR</span>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
            ₹
          </span>
          <Input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoComplete="off"
            className={`pl-7 font-mono text-base ${
              state.fieldErrors?.amount ? "border-destructive focus-visible:ring-destructive" : ""
            }`}
          />
        </div>
        {state.fieldErrors?.amount && (
          <p className="text-xs text-destructive">{state.fieldErrors.amount[0]}</p>
        )}
      </div>

      {/* Account Selection */}
      <div className="space-y-1.5">
        <Label htmlFor="account-select" className="text-xs font-medium">
          Account <span className="text-destructive">*</span>
        </Label>
        <Select value={accountId} onValueChange={(val) => setAccountId(val ?? "")}>
          <SelectTrigger id="account-select" className="w-full">
            <SelectValue placeholder="Select account">
              {selectedAccount ? (
                <div className="flex items-center justify-between w-full gap-3">
                  <span className="truncate font-medium">{selectedAccount.account_name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    ({formatSqlNumericToRupees(selectedAccount.current_balance)})
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">Select account</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {activeAccounts.map((acc) => (
              <SelectItem key={acc.account_id} value={acc.account_id}>
                <div className="flex items-center justify-between w-full gap-4">
                  <span>{acc.account_name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    ({formatSqlNumericToRupees(acc.current_balance)})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isCreditCard && (
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-2.5 flex items-start gap-2 text-[11px] text-amber-600 dark:text-amber-400">
            <CreditCard className="size-3.5 shrink-0 mt-0.5" />
            <span>
              <strong>Credit Card Notice:</strong> Recording an expense on this credit card increases your outstanding liability. Credit card bill payments will be handled under Transfers in a subsequent milestone.
            </span>
          </div>
        )}
        {state.fieldErrors?.accountId && (
          <p className="text-xs text-destructive">{state.fieldErrors.accountId[0]}</p>
        )}
      </div>

      {/* Category Selection */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="category-select" className="text-xs font-medium">
            Category
          </Label>
          <span className="text-[11px] text-muted-foreground capitalize">{type} categories</span>
        </div>
        <Select value={categoryId} onValueChange={(val) => setCategoryId(val ?? "none")}>
          <SelectTrigger id="category-select" className="w-full">
            <SelectValue placeholder="Select category">
              {selectedCategory ? (
                <div className="flex items-center gap-2">
                  <span
                    className="flex size-4 items-center justify-center rounded text-white text-[10px]"
                    style={{ backgroundColor: selectedCategory.color || "#6366F1" }}
                  >
                    <CategoryIcon iconName={selectedCategory.icon} className="size-2.5" />
                  </span>
                  <span className="truncate font-medium">{selectedCategory.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Uncategorized</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="text-muted-foreground">Uncategorized</span>
            </SelectItem>
            {matchingCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  <span
                    className="flex size-5 items-center justify-center rounded-md text-white text-[10px]"
                    style={{ backgroundColor: cat.color || "#6366F1" }}
                  >
                    <CategoryIcon iconName={cat.icon} className="size-3" />
                  </span>
                  <span>{cat.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.fieldErrors?.categoryId && (
          <p className="text-xs text-destructive">{state.fieldErrors.categoryId[0]}</p>
        )}
      </div>

      {/* Date & Merchant row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="transactionDate" className="text-xs font-medium">
            Transaction Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="transactionDate"
            name="transactionDate"
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            required
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="merchant" className="text-xs font-medium">
            Merchant / Payee <span className="text-muted-foreground font-normal">(Optional)</span>
          </Label>
          <Input
            id="merchant"
            name="merchant"
            placeholder="e.g. Swiggy, Amazon, Employer"
            maxLength={100}
            className="text-xs"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs font-medium">
          Description <span className="text-muted-foreground font-normal">(Optional)</span>
        </Label>
        <Input
          id="description"
          name="description"
          placeholder="e.g. Monthly groceries, Freelance project payout"
          maxLength={255}
          className="text-xs"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes" className="text-xs font-medium">
          Notes <span className="text-muted-foreground font-normal">(Optional)</span>
        </Label>
        <Input
          id="notes"
          name="notes"
          placeholder="e.g. Split with room partner, Tax deductible"
          maxLength={500}
          className="text-xs"
        />
      </div>

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Recording...
            </>
          ) : (
            `Record ${type === "income" ? "Income" : "Expense"}`
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  accounts,
  categories,
  onSuccess,
}: AddTransactionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Plus className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Record Transaction</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Add an income deposit or expense outflow to your ledger.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <AddTransactionForm
          key={open ? "opened" : "closed"}
          accounts={accounts}
          categories={categories}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
