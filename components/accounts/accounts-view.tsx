"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Filter,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NetWorthSummaryCards } from "@/components/accounts/net-worth-summary-cards";
import { AccountCard } from "@/components/accounts/account-card";
import { AddAccountDialog } from "@/components/accounts/add-account-dialog";
import { EditAccountDialog } from "@/components/accounts/edit-account-dialog";
import { ArchiveAccountDialog } from "@/components/accounts/archive-account-dialog";
import { AccountDrawer } from "@/components/accounts/account-drawer";
import type { AccountsPageData } from "@/lib/accounts/actions";
import type { AccountBalance } from "@/src/types/database.types";

interface AccountsViewProps {
  initialData: AccountsPageData;
}

export function AccountsView({ initialData }: AccountsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"active" | "archived">("active");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<AccountBalance | null>(null);
  const [editingAccount, setEditingAccount] = useState<AccountBalance | null>(null);
  const [archivingAccount, setArchivingAccount] = useState<AccountBalance | null>(null);

  const accounts = initialData.accounts;

  // Active vs Archived counts
  const activeCount = useMemo(
    () => accounts.filter((a) => a.is_active).length,
    [accounts]
  );
  const archivedCount = useMemo(
    () => accounts.filter((a) => !a.is_active).length,
    [accounts]
  );

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      // 1. Status filter (Active vs Archived)
      const matchesStatus =
        statusFilter === "active" ? account.is_active : !account.is_active;
      if (!matchesStatus) return false;

      // 2. Type filter
      if (selectedType !== "all" && account.account_type !== selectedType) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = account.account_name.toLowerCase().includes(query);
        const institutionMatch = account.institution?.toLowerCase().includes(query) ?? false;
        const notesMatch = account.notes?.toLowerCase().includes(query) ?? false;
        if (!nameMatch && !institutionMatch && !notesMatch) {
          return false;
        }
      }

      return true;
    });
  }, [accounts, statusFilter, selectedType, searchQuery]);

  return (
    <div className="space-y-8">
      {/* 1. Net Worth Summary 4-Card Deck */}
      <section aria-label="Net worth summary">
        <NetWorthSummaryCards {...initialData.netWorthSummary} />
      </section>

      {/* 2. Management Controls: Search, Filters, and Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or bank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Account Type Filter */}
          <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full sm:w-auto">
            <TabsList className="h-9 p-1">
              <TabsTrigger value="all" className="text-xs px-2.5">All Types</TabsTrigger>
              <TabsTrigger value="bank" className="text-xs px-2.5">Bank</TabsTrigger>
              <TabsTrigger value="credit_card" className="text-xs px-2.5">Credit Cards</TabsTrigger>
              <TabsTrigger value="cash" className="text-xs px-2.5">Cash</TabsTrigger>
              <TabsTrigger value="wallet" className="text-xs px-2.5">Wallet</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Status Toggle & CTA */}
        <div className="flex items-center gap-2.5">
          <Tabs
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as "active" | "archived")}
            className="w-auto"
          >
            <TabsList className="h-9 p-1">
              <TabsTrigger value="active" className="text-xs px-2.5 flex items-center gap-1.5">
                <CheckCircle2 className="size-3 text-emerald-500" />
                Active ({activeCount})
              </TabsTrigger>
              <TabsTrigger value="archived" className="text-xs px-2.5 flex items-center gap-1.5">
                <Archive className="size-3 text-muted-foreground" />
                Archived ({archivedCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            size="sm"
            className="h-9 gap-1.5 shadow-sm"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="size-4" />
            <span>Add Account</span>
          </Button>
        </div>
      </div>

      {/* 3. Accounts Grid */}
      <section aria-label="Accounts list">
        {filteredAccounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map((account) => (
              <AccountCard
                key={account.account_id}
                account={account}
                onView={(acc) => setViewingAccount(acc)}
                onEdit={(acc) => setEditingAccount(acc)}
                onArchiveToggle={(acc) => setArchivingAccount(acc)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4">
              {statusFilter === "archived" ? (
                <Archive className="size-6 opacity-60" />
              ) : selectedType !== "all" || searchQuery ? (
                <Filter className="size-6 opacity-60" />
              ) : (
                <Wallet className="size-6 opacity-60" />
              )}
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {statusFilter === "archived"
                ? "No archived accounts"
                : searchQuery || selectedType !== "all"
                ? "No matching accounts found"
                : "No accounts added yet"}
            </h3>
            <p className="mx-auto mt-1.5 max-w-sm text-xs text-muted-foreground">
              {statusFilter === "archived"
                ? "Accounts you archive will be preserved here and excluded from active net worth calculations."
                : searchQuery || selectedType !== "all"
                ? "Try adjusting your search terms or filters to find what you're looking for."
                : "Add your bank accounts, cash wallets, and credit cards to automatically calculate and track your real-time net worth."}
            </p>
            {statusFilter === "active" && !searchQuery && selectedType === "all" && (
              <Button
                size="sm"
                className="mt-5 gap-1.5"
                onClick={() => setIsAddOpen(true)}
              >
                <Plus className="size-4" />
                Add Your First Account
              </Button>
            )}
          </div>
        )}
      </section>

      {/* 4. Modals & Drawers */}
      <AddAccountDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
      />

      <EditAccountDialog
        account={editingAccount}
        open={Boolean(editingAccount)}
        onOpenChange={(open) => !open && setEditingAccount(null)}
      />

      <ArchiveAccountDialog
        account={archivingAccount}
        open={Boolean(archivingAccount)}
        onOpenChange={(open) => !open && setArchivingAccount(null)}
      />

      <AccountDrawer
        account={viewingAccount}
        open={Boolean(viewingAccount)}
        onOpenChange={(open) => !open && setViewingAccount(null)}
        onEdit={(acc) => {
          setViewingAccount(null);
          setEditingAccount(acc);
        }}
        onArchiveToggle={(acc) => {
          setViewingAccount(null);
          setArchivingAccount(acc);
        }}
      />
    </div>
  );
}
