"use client";

import {
  Building2,
  CreditCard,
  Eye,
  History,
  Lock,
  MoreVertical,
  Pencil,
  RotateCcw,
  Archive,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatSqlNumericToRupees } from "@/lib/finance/money";
import type { AccountBalance, AccountType } from "@/src/types/database.types";

interface AccountCardProps {
  account: AccountBalance;
  onView: (account: AccountBalance) => void;
  onEdit: (account: AccountBalance) => void;
  onArchiveToggle: (account: AccountBalance) => void;
}

export function AccountCard({
  account,
  onView,
  onEdit,
  onArchiveToggle,
}: AccountCardProps) {
  const isCreditCard = account.account_type === "credit_card";
  const currentBalNumber = Number.parseFloat(account.current_balance || "0");
  const isNegative = currentBalNumber < 0;

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case "bank":
        return <Building2 className="size-4 text-primary" />;
      case "credit_card":
        return <CreditCard className="size-4 text-amber-500" />;
      case "cash":
        return <Wallet className="size-4 text-emerald-500" />;
      case "wallet":
        return <Wallet className="size-4 text-cyan-500" />;
      default:
        return <Wallet className="size-4 text-primary" />;
    }
  };

  const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
      case "bank":
        return "Bank";
      case "credit_card":
        return "Credit Card";
      case "cash":
        return "Cash";
      case "wallet":
        return "Wallet";
      default:
        return type;
    }
  };

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-md cursor-pointer ${
        !account.is_active ? "opacity-75 bg-muted/20 border-dashed" : "bg-card/80 backdrop-blur-sm"
      }`}
      onClick={() => onView(account)}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 pt-5 px-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 border border-border/50 group-hover:border-primary/30 transition-colors">
            {getAccountIcon(account.account_type)}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm tracking-tight text-foreground truncate">
                {account.account_name}
              </h3>
              {!account.is_active && (
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                  Archived
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{getAccountTypeLabel(account.account_type)}</span>
              {account.institution && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[140px]">{account.institution}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MoreVertical className="size-4" />
              <span className="sr-only">Account actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onView(account)}>
                <Eye className="mr-2 size-4 text-muted-foreground" />
                View Ledger
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(account)}>
                <Pencil className="mr-2 size-4 text-muted-foreground" />
                Edit Account
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onArchiveToggle(account)}
                className={account.is_active ? "text-destructive focus:text-destructive" : ""}
              >
                {account.is_active ? (
                  <>
                    <Archive className="mr-2 size-4" />
                    Archive Account
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 size-4 text-emerald-500" />
                    Reactivate Account
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 pt-0 space-y-3">
        {/* Balance Display */}
        <div>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {isCreditCard ? "Outstanding Balance" : "Current Balance"}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`font-mono text-2xl font-bold tracking-tight ${
                isNegative ? "text-amber-500" : "text-foreground"
              }`}
            >
              {formatSqlNumericToRupees(account.current_balance)}
            </span>
          </div>
        </div>

        {/* Card Footer Info */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <History className="size-3" />
            {account.transaction_count ?? 0} {account.transaction_count === 1 ? "entry" : "entries"}
          </span>

          {account.has_activity && (
            <span
              className="flex items-center gap-1 text-[10px] text-muted-foreground/70"
              title="Ledger locked: transactions exist"
            >
              <Lock className="size-2.5" /> Immutable
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
