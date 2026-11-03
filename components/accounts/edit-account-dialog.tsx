"use client";

import { useActionState, useEffect, useState } from "react";
import { Building2, CreditCard, Lock, Loader2, Save, Wallet } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { updateAccountAction } from "@/lib/accounts/actions";
import { type AccountActionState } from "@/lib/validations/accounts";
import type { AccountBalance, AccountType } from "@/src/types/database.types";

interface EditAccountDialogProps {
  account: AccountBalance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const initialState: AccountActionState = {
  status: "idle",
};

interface EditAccountFormProps {
  account: AccountBalance;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function EditAccountForm({
  account,
  onOpenChange,
  onSuccess,
}: EditAccountFormProps) {
  const [state, formAction, isPending] = useActionState(updateAccountAction, initialState);

  const [name, setName] = useState(account.account_name ?? "");
  const [institution, setInstitution] = useState(account.institution ?? "");
  const [notes, setNotes] = useState(account.notes ?? "");
  const [accountType, setAccountType] = useState<AccountType>(account.account_type ?? "bank");
  const [openingBalance, setOpeningBalance] = useState(
    (Math.abs(account.opening_balance ?? 0) / 100).toFixed(2)
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message || "Account updated successfully.");
      onOpenChange(false);
      onSuccess?.();
    } else if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state, onOpenChange, onSuccess]);

  const hasActivity = Boolean(account.has_activity);

  return (
    <form action={formAction} className="space-y-4 py-2">
      <input type="hidden" name="accountId" value={account.account_id ?? ""} />

      {state.status === "error" && state.message && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          {state.message}
        </div>
      )}

      {/* Account Name */}
      <div className="space-y-1.5">
        <Label htmlFor="edit-name" className="text-xs font-medium">
          Account Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="edit-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          className={state.fieldErrors?.name ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {state.fieldErrors?.name && (
          <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      {/* Account Type */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="edit-type" className="text-xs font-medium">
            Account Type
          </Label>
          {hasActivity && (
            <Badge variant="outline" className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Lock className="size-2.5" /> Immutable
            </Badge>
          )}
        </div>
        <input type="hidden" name="accountType" value={accountType} />
        <Select
          value={accountType}
          onValueChange={(val) => setAccountType(val as AccountType)}
          disabled={hasActivity}
        >
          <SelectTrigger id="edit-type" className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bank">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                <span>Bank Account</span>
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
                <span>Digital Wallet</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Institution */}
      <div className="space-y-1.5">
        <Label htmlFor="edit-institution" className="text-xs font-medium">
          Financial Institution / Issuer
        </Label>
        <Input
          id="edit-institution"
          name="institution"
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          placeholder="e.g. HDFC Bank, ICICI, SBI"
          maxLength={100}
        />
      </div>

      {/* Opening Balance */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="edit-openingBalance" className="text-xs font-medium">
            Initial / Opening Balance (₹)
          </Label>
          {hasActivity ? (
            <Badge variant="outline" className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Lock className="size-2.5" /> Immutable
            </Badge>
          ) : (
            <span className="text-[11px] text-muted-foreground">Editable (No activity)</span>
          )}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
            ₹
          </span>
          <Input
            id="edit-openingBalance"
            name="openingBalance"
            type="text"
            inputMode="decimal"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            disabled={hasActivity}
            className="pl-7"
          />
        </div>
        {hasActivity ? (
          <p className="flex items-start gap-1 text-[11px] text-muted-foreground/80 leading-tight">
            <Lock className="size-3 shrink-0 mt-0.5 text-muted-foreground" />
            <span>
              This account has active transactions or transfers. To preserve audit and ledger integrity, opening balance and account type cannot be modified.
            </span>
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            You can adjust this initial balance since no transactions exist for this account yet.
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="edit-notes" className="text-xs font-medium">
          Notes
        </Label>
        <Input
          id="edit-notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Primary salary account"
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
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditAccountDialog({
  account,
  open,
  onOpenChange,
  onSuccess,
}: EditAccountDialogProps) {
  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Save className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Edit Account</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update account details, notes, or institution naming.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <EditAccountForm
          key={account.account_id}
          account={account}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
