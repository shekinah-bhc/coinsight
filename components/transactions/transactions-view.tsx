"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionsFilterBar } from "@/components/transactions/transactions-filter-bar";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { TransactionsPagination } from "@/components/transactions/transactions-pagination";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { EditTransactionDialog } from "@/components/transactions/edit-transaction-dialog";
import { DeleteTransactionDialog } from "@/components/transactions/delete-transaction-dialog";
import { TransactionDrawer } from "@/components/transactions/transaction-drawer";
import {
  getTransactionsData,
  type TransactionItem,
  type TransactionsPageData,
} from "@/lib/transactions/actions";
import type { TransactionFilterParams } from "@/lib/validations/transactions";

interface TransactionsViewProps {
  initialData: TransactionsPageData;
  initialFilters?: Partial<TransactionFilterParams>;
}

export function TransactionsView({ initialData, initialFilters }: TransactionsViewProps) {
  const [data, setData] = useState<TransactionsPageData>(initialData);
  const [filters, setFilters] = useState<TransactionFilterParams>({
    search: initialFilters?.search ?? "",
    type: initialFilters?.type ?? "all",
    accountId: initialFilters?.accountId ?? "all",
    categoryId: initialFilters?.categoryId ?? "all",
    startDate: initialFilters?.startDate,
    endDate: initialFilters?.endDate,
    sortBy: initialFilters?.sortBy ?? "date_desc",
    page: initialFilters?.page ?? 1,
    pageSize: initialFilters?.pageSize ?? 20,
  });

  const [isPending, startTransition] = useTransition();

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingTx, setViewingTx] = useState<TransactionItem | null>(null);
  const [editingTx, setEditingTx] = useState<TransactionItem | null>(null);
  const [deletingTx, setDeletingTx] = useState<TransactionItem | null>(null);

  const fetchWithFilters = (newFilters: TransactionFilterParams) => {
    startTransition(async () => {
      const updated = await getTransactionsData(newFilters);
      setData(updated);
    });
  };

  const handleFilterChange = (partial: Partial<TransactionFilterParams>) => {
    const updated = { ...filters, ...partial };
    setFilters(updated);
    fetchWithFilters(updated);
  };

  const handleRefresh = () => {
    fetchWithFilters(filters);
  };

  const hasFilters = useMemo(() => {
    return Boolean(
      (filters.search && filters.search.trim() !== "") ||
        (filters.type && filters.type !== "all") ||
        (filters.accountId && filters.accountId !== "all") ||
        (filters.categoryId && filters.categoryId !== "all") ||
        filters.startDate ||
        filters.endDate
    );
  }, [filters]);

  const handleClearFilters = () => {
    const resetFilters: TransactionFilterParams = {
      search: "",
      type: "all",
      accountId: "all",
      categoryId: "all",
      sortBy: "date_desc",
      page: 1,
      pageSize: 20,
    };
    setFilters(resetFilters);
    fetchWithFilters(resetFilters);
  };

  return (
    <div className="space-y-6">
      {/* Action Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Transaction Ledger
          </h2>
          <p className="text-xs text-muted-foreground">
            View, filter, and track all incoming and outgoing financial transactions.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="h-9 px-3 gap-1.5 text-xs"
            title="Refresh transactions"
          >
            <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="h-9 gap-1.5 shadow-sm text-xs flex-1 sm:flex-initial"
          >
            <Plus className="size-4" />
            <span>Add Transaction</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <TransactionsFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        accounts={data.accounts}
        categories={data.categories}
      />

      {/* Transactions Table / List */}
      <div className={`transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}>
        <TransactionsTable
          transactions={data.transactions}
          onView={(tx) => setViewingTx(tx)}
          onEdit={(tx) => setEditingTx(tx)}
          onDelete={(tx) => setDeletingTx(tx)}
          hasFilters={hasFilters}
          onClearFilters={handleClearFilters}
          onAddTransaction={() => setIsAddOpen(true)}
        />
      </div>

      {/* Pagination */}
      <TransactionsPagination
        page={data.page}
        pageSize={data.pageSize}
        totalCount={data.totalCount}
        totalPages={data.totalPages}
        onPageChange={(p) => handleFilterChange({ page: p })}
      />

      {/* Dialogs & Drawers */}
      <AddTransactionDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        accounts={data.accounts}
        categories={data.categories}
        onSuccess={handleRefresh}
      />

      <EditTransactionDialog
        transaction={editingTx}
        open={Boolean(editingTx)}
        onOpenChange={(open) => !open && setEditingTx(null)}
        accounts={data.accounts}
        categories={data.categories}
        onSuccess={handleRefresh}
      />

      <DeleteTransactionDialog
        transaction={deletingTx}
        open={Boolean(deletingTx)}
        onOpenChange={(open) => !open && setDeletingTx(null)}
        onSuccess={handleRefresh}
      />

      <TransactionDrawer
        transaction={viewingTx}
        open={Boolean(viewingTx)}
        onOpenChange={(open) => !open && setViewingTx(null)}
        onEdit={(tx) => {
          setViewingTx(null);
          setEditingTx(tx);
        }}
        onDelete={(tx) => {
          setViewingTx(null);
          setDeletingTx(tx);
        }}
      />
    </div>
  );
}

