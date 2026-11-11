"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AccountBalance, Category } from "@/src/types/database.types";
import type { TransactionFilterParams } from "@/lib/validations/transactions";

interface TransactionsFilterBarProps {
  filters: TransactionFilterParams;
  onFilterChange: (newFilters: Partial<TransactionFilterParams>) => void;
  accounts: AccountBalance[];
  categories: Category[];
}

export function TransactionsFilterBar({
  filters,
  onFilterChange,
  accounts,
  categories,
}: TransactionsFilterBarProps) {
  // Filter categories by selected transaction type (if income/expense selected)
  const filteredCategories =
    filters.type && filters.type !== "all"
      ? categories.filter((c) => c.type === filters.type)
      : categories;

  return (
    <div className="space-y-3">
      {/* Search & Type filter row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search transactions by description, merchant, or notes..."
            value={filters.search ?? ""}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Type Toggle Tabs */}
        <Tabs
          value={filters.type ?? "all"}
          onValueChange={(val) =>
            onFilterChange({
              type: val as "all" | "income" | "expense",
              categoryId: "all",
              page: 1,
            })
          }
          className="w-full sm:w-auto"
        >
          <TabsList className="h-9 p-1 w-full sm:w-auto grid grid-cols-3">
            <TabsTrigger value="all" className="text-xs px-3">
              All Types
            </TabsTrigger>
            <TabsTrigger value="expense" className="text-xs px-3">
              Expenses
            </TabsTrigger>
            <TabsTrigger value="income" className="text-xs px-3">
              Income
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Secondary Filters row */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
          <SlidersHorizontal className="size-3.5" />
          <span>Filters:</span>
        </div>

        {/* Account Selector */}
        <Select
          value={filters.accountId ?? "all"}
          onValueChange={(val) => onFilterChange({ accountId: val ?? "all", page: 1 })}
        >
          <SelectTrigger className="h-8 text-xs w-auto min-w-[130px]">
            <SelectValue placeholder="All Accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map((acc) => (
              <SelectItem key={acc.account_id} value={acc.account_id}>
                {acc.account_name} {!acc.is_active && "(Archived)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Selector */}
        <Select
          value={filters.categoryId ?? "all"}
          onValueChange={(val) => onFilterChange({ categoryId: val ?? "all", page: 1 })}
        >
          <SelectTrigger className="h-8 text-xs w-auto min-w-[130px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {filteredCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name} ({cat.type}){cat.is_active === false ? " [Archived]" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Selector */}
        <Select
          value={filters.sortBy ?? "date_desc"}
          onValueChange={(val) =>
            onFilterChange({
              sortBy: (val as "date_desc" | "date_asc" | "amount_desc" | "amount_asc") ?? "date_desc",
              page: 1,
            })
          }
        >
          <SelectTrigger className="h-8 text-xs w-auto min-w-[140px] ml-auto">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Date: Newest First</SelectItem>
            <SelectItem value="date_asc">Date: Oldest First</SelectItem>
            <SelectItem value="amount_desc">Amount: Highest First</SelectItem>
            <SelectItem value="amount_asc">Amount: Lowest First</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
