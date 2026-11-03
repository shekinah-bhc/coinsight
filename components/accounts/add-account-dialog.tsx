"use client";

import { useActionState, useEffect, useState } from "react";
import { Building2, CreditCard, HelpCircle, Loader2, Plus, Wallet } from "lucide-react";
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
import { createAccountAction } from "@/lib/accounts/actions";
import { type AccountActionState } from "@/lib/validations/accounts";
import type { AccountType } from "@/src/types/database.types";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const initialState: AccountActionState = {
  status: "idle",
};

export function AddAccountDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddAccountDialogProps) {
  const [state, formAction, isPending] = useActionState(createAccountAction, initialState);
  const [accountType, setAccountType] = useState<AccountType>("bank");
  const [openingBalance, setOpeningBalance] = useState<string>("0");

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message || "Account created successfully.");
      onOpenChange(false);
      onSuccess?.();
    } else if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state, onOpenChange, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Plus className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Add Financial Account</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Link a new bank account, cash wallet, or credit card to your workspace.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form key={open ? "open" : "closed"} action={formAction} className="space-y-4 py-2">
          {state.status === "error" && state.message && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              {state.message}
            </div>
          )}

          {/* Account Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium">
              Account Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. HDFC Salary Account, Emergency Fund"
              required
              maxLength={100}
              autoComplete="off"
              className={state.fieldErrors?.name ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {state.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          {/* Account Type */}
          <div className="space-y-1.5">
            <Label htmlFor="accountType" className="text-xs font-medium">
              Account Type <span className="text-destructive">*</span>
            </Label>
            <input type="hidden" name="accountType" value={accountType} />
            <Select value={accountType} onValueChange={(val) => setAccountType(val as AccountType)}>
              <SelectTrigger id="accountType" className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-primary" />
                    <span>Bank Account (Savings / Current)</span>
                  </div>
                </SelectItem>
                <SelectItem value="credit_card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-4 text-amber-500" />
                    <span>Credit Card</span>
                  </div>
                </SelectItem>
                <SelectItem value="cash">
                  <div className="flex items-center gap-2">
                    <Wallet className="size-4 text-emerald-500" />
                    <span>Physical Cash</span>
                  </div>
                </SelectItem>
                <SelectItem value="wallet">
                  <div className="flex items-center gap-2">
                    <Wallet className="size-4 text-cyan-500" />
                    <span>Digital Wallet (Paytm, PhonePe, etc.)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Institution (Optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="institution" className="text-xs font-medium">
              Financial Institution / Issuer <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              id="institution"
              name="institution"
              placeholder="e.g. State Bank of India, ICICI Bank, Axis"
              maxLength={100}
            />
          </div>

          {/* Opening Balance */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="openingBalance" className="text-xs font-medium">
                {accountType === "credit_card" ? "Current Outstanding Debt (₹)" : "Initial / Opening Balance (₹)"}
              </Label>
              <span className="text-[11px] text-muted-foreground">Currency: INR</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                ₹
              </span>
              <Input
                id="openingBalance"
                name="openingBalance"
                type="text"
                inputMode="decimal"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
                className="pl-7"
                required
              />
            </div>
            {accountType === "credit_card" ? (
              <p className="flex items-start gap-1 text-[11px] text-amber-500/90 leading-tight">
                <HelpCircle className="size-3.5 shrink-0 mt-0.5" />
                <span>
                  Enter outstanding credit owed as a positive value (e.g. 15000). Coinsight records it as a liability (-₹15,000.00) in your net worth.
                </span>
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                The balance at the time of tracking. Will be locked once transactions are recorded.
              </p>
            )}
            {state.fieldErrors?.openingBalance && (
              <p className="text-xs text-destructive">{state.fieldErrors.openingBalance[0]}</p>
            )}
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-medium">
              Notes <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              id="notes"
              name="notes"
              placeholder="e.g. Primary salary account, linked to UPI"
              maxLength={255}
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
                  Creating...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
