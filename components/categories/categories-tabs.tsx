"use client";

import {
  Archive,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CategoryDatePreset,
  CategorySortOption,
} from "@/lib/validations/categories";

export type CategoryTabValue = "expense" | "income" | "archived";

interface CategoriesTabsProps {
  activeTab: CategoryTabValue;
  onTabChange: (tab: CategoryTabValue) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: CategorySortOption;
  onSortChange: (sort: CategorySortOption) => void;
  datePreset: CategoryDatePreset;
  customStartDate: string;
  customEndDate: string;
  onDatePresetChange: (preset: CategoryDatePreset) => void;
  onCustomDateChange: (start: string, end: string) => void;
  onApplyCustomDates: () => void;
  counts: {
    expense: number;
    income: number;
    archived: number;
  };
  periodLabel: string;
}

export function CategoriesTabs({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  datePreset,
  customStartDate,
  customEndDate,
  onDatePresetChange,
  onCustomDateChange,
  onApplyCustomDates,
  counts,
  periodLabel,
}: CategoriesTabsProps) {
  return (
    <div className="space-y-4">
      {/* Primary Row: Category Tabs & Date Period Selector */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={activeTab}
          onValueChange={(val) => onTabChange(val as CategoryTabValue)}
          className="w-full lg:w-auto"
        >
          <TabsList className="grid h-10 w-full grid-cols-3 p-1 lg:w-auto lg:inline-flex">
            <TabsTrigger
              value="expense"
              className="gap-1.5 px-3.5 text-xs font-medium data-[state=active]:bg-rose-500/15 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400"
            >
              <ArrowDownLeft className="size-3.5" aria-hidden="true" />
              <span>Expenses</span>
              <span className="ml-1 rounded-full bg-background/60 px-1.5 py-0.2 font-mono text-[10px]">
                {counts.expense}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="income"
              className="gap-1.5 px-3.5 text-xs font-medium data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400"
            >
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
              <span>Income</span>
              <span className="ml-1 rounded-full bg-background/60 px-1.5 py-0.2 font-mono text-[10px]">
                {counts.income}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="archived"
              className="gap-1.5 px-3.5 text-xs font-medium data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400"
            >
              <Archive className="size-3.5" aria-hidden="true" />
              <span>Archived</span>
              <span className="ml-1 rounded-full bg-background/60 px-1.5 py-0.2 font-mono text-[10px]">
                {counts.archived}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Analytics Date Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5 text-primary" aria-hidden="true" />
            <span className="hidden sm:inline">Analytics Period:</span>
            <span className="font-medium text-foreground sm:hidden">{periodLabel}</span>
          </div>

          <Select
            value={datePreset}
            onValueChange={(val) => onDatePresetChange((val as CategoryDatePreset) ?? "this_month")}
          >
            <SelectTrigger className="h-9 min-w-[160px] text-xs">
              <SelectValue placeholder="Select period">
                {{
                  this_month: "This Month",
                  last_month: "Last Month",
                  last_3_months: "Last 3 Months",
                  this_year: "This Year",
                  custom: "Custom Date Range",
                }[datePreset] ?? "This Month"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
              <SelectItem value="custom">Custom Date Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom Date Range Picker Row (shown when custom is active) */}
      {datePreset === "custom" && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/80 bg-card/60 p-3.5">
          <div className="space-y-1">
            <label htmlFor="cat-custom-start" className="text-[11px] font-medium text-muted-foreground">
              Start Date
            </label>
            <Input
              id="cat-custom-start"
              type="date"
              value={customStartDate}
              onChange={(e) => onCustomDateChange(e.target.value, customEndDate)}
              className="h-8 w-40 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="cat-custom-end" className="text-[11px] font-medium text-muted-foreground">
              End Date
            </label>
            <Input
              id="cat-custom-end"
              type="date"
              value={customEndDate}
              onChange={(e) => onCustomDateChange(customStartDate, e.target.value)}
              className="h-8 w-40 text-xs"
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onApplyCustomDates}
            className="h-8 text-xs px-3.5"
          >
            Apply Range
          </Button>
        </div>
      )}

      {/* Secondary Row: Search & Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search categories by name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-9 text-xs"
            aria-label="Search categories"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            <span>Sort:</span>
          </div>
          <Select
            value={sortBy}
            onValueChange={(val) => onSortChange((val as CategorySortOption) ?? "amount_desc")}
          >
            <SelectTrigger className="h-9 min-w-[175px] text-xs">
              <SelectValue placeholder="Sort categories">
                {{
                  amount_desc: "Amount: Highest First",
                  amount_asc: "Amount: Lowest First",
                  transactions_desc: "Most Transactions",
                  name_asc: "Name: A to Z",
                  name_desc: "Name: Z to A",
                }[sortBy] ?? "Amount: Highest First"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="amount_desc">Amount: Highest First</SelectItem>
              <SelectItem value="amount_asc">Amount: Lowest First</SelectItem>
              <SelectItem value="transactions_desc">Most Transactions</SelectItem>
              <SelectItem value="name_asc">Name: A to Z</SelectItem>
              <SelectItem value="name_desc">Name: Z to A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

