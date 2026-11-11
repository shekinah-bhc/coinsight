"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Archive,
  FolderOpen,
  Plus,
  RefreshCw,
  SearchX,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { CategoriesOverview } from "@/components/categories/categories-overview"
import {
  CategoriesTabs,
  type CategoryTabValue,
} from "@/components/categories/categories-tabs"
import { CategoryAnalytics } from "@/components/categories/category-analytics"
import { CategoryCard } from "@/components/categories/category-card"
import { CategoryFormDialog } from "@/components/categories/category-form-dialog"
import { CategoryArchiveDialog } from "@/components/categories/category-archive-dialog"
import { CategoryDetailsDrawer } from "@/components/categories/category-details-drawer"
import {
  getCategoriesData,
  type CategoriesPageData,
  type CategoryWithStats,
} from "@/lib/categories/actions"
import type {
  CategoryDatePreset,
  CategorySortOption,
} from "@/lib/validations/categories"
import { cn } from "@/lib/utils"

interface CategoriesViewProps {
  initialData: CategoriesPageData
}

export function CategoriesView({ initialData }: CategoriesViewProps) {
  const router = useRouter()
  const [data, setData] = React.useState<CategoriesPageData>(initialData)
  const [isRefreshing, startRefreshTransition] = React.useTransition()

  // Filter & view state
  const [activeTab, setActiveTab] = React.useState<CategoryTabValue>("expense")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortBy, setSortBy] = React.useState<CategorySortOption>("amount_desc")
  const [datePreset, setDatePreset] = React.useState<CategoryDatePreset>(
    initialData.analytics.datePreset
  )
  const [customStartDate, setCustomStartDate] = React.useState(
    initialData.analytics.startDate
  )
  const [customEndDate, setCustomEndDate] = React.useState(
    initialData.analytics.endDate
  )

  // Dialog & Drawer state
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] =
    React.useState<CategoryWithStats | null>(null)
  const [archivingCategory, setArchivingCategory] =
    React.useState<CategoryWithStats | null>(null)
  const [inspectingCategory, setInspectingCategory] =
    React.useState<CategoryWithStats | null>(null)

  const fetchUpdatedData = React.useCallback(
    (
      nextPreset: CategoryDatePreset,
      nextStart?: string,
      nextEnd?: string
    ) => {
      startRefreshTransition(async () => {
        try {
          const fresh = await getCategoriesData({
            datePreset: nextPreset,
            startDate: nextPreset === "custom" ? nextStart : undefined,
            endDate: nextPreset === "custom" ? nextEnd : undefined,
          })
          setData(fresh)
          if (nextPreset !== "custom") {
            setCustomStartDate(fresh.analytics.startDate)
            setCustomEndDate(fresh.analytics.endDate)
          }
        } catch {
          // Keep current state on transient error
        }
      })
    },
    []
  )

  function handleDatePresetChange(preset: CategoryDatePreset) {
    setDatePreset(preset)
    if (preset !== "custom") {
      fetchUpdatedData(preset)
    }
  }

  function handleCustomDateChange(start: string, end: string) {
    setCustomStartDate(start)
    setCustomEndDate(end)
  }

  function handleApplyCustomDates() {
    if (customStartDate && customEndDate) {
      fetchUpdatedData("custom", customStartDate, customEndDate)
    }
  }

  function handleMutationSuccess() {
    fetchUpdatedData(datePreset, customStartDate, customEndDate)
    router.refresh()
  }

  // Filter and sort categories for the active tab
  const filteredCategories = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const list = data.categories.filter((cat) => {
      if (activeTab === "archived") {
        if (cat.is_active) return false
      } else {
        if (!cat.is_active) return false
        if (cat.type !== activeTab) return false
      }

      if (query.length > 0 && !cat.name.toLowerCase().includes(query)) {
        return false
      }

      return true
    })

    return [...list].sort((a, b) => {
      if (sortBy === "name_asc") {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === "name_desc") {
        return b.name.localeCompare(a.name)
      }
      if (sortBy === "amount_desc") {
        const diff = BigInt(b.periodAmount) - BigInt(a.periodAmount)
        if (diff !== BigInt(0)) return diff > BigInt(0) ? 1 : -1
        return a.name.localeCompare(b.name)
      }
      if (sortBy === "amount_asc") {
        const diff = BigInt(a.periodAmount) - BigInt(b.periodAmount)
        if (diff !== BigInt(0)) return diff > BigInt(0) ? 1 : -1
        return a.name.localeCompare(b.name)
      }
      if (sortBy === "transactions_desc") {
        if (b.periodTransactionCount !== a.periodTransactionCount) {
          return b.periodTransactionCount - a.periodTransactionCount
        }
        return a.name.localeCompare(b.name)
      }
      return 0
    })
  }, [data.categories, activeTab, searchQuery, sortBy])

  const defaultCreateType: "expense" | "income" =
    activeTab === "income" ? "income" : "expense"

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            Showing analytics for{" "}
            <strong className="font-medium text-foreground">
              {data.analytics.periodLabel}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              fetchUpdatedData(datePreset, customStartDate, customEndDate)
            }
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCw
              className={cn("size-3.5", isRefreshing && "animate-spin")}
            />
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <CategoriesOverview overview={data.overview} />

      {/* Category Distribution Analytics */}
      {activeTab !== "archived" && (
        <CategoryAnalytics
          analytics={data.analytics}
          activeTab={activeTab}
          onSelectCategoryId={(catId) => {
            const found = data.categories.find((c) => c.id === catId)
            if (found) setInspectingCategory(found)
          }}
        />
      )}

      {/* Tabs, Period Selector, Search & Sort Controls */}
      <CategoriesTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={{
          expense: data.overview.activeExpense,
          income: data.overview.activeIncome,
          archived: data.overview.archivedCount,
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        datePreset={datePreset}
        onDatePresetChange={handleDatePresetChange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={handleCustomDateChange}
        onApplyCustomDates={handleApplyCustomDates}
        periodLabel={data.analytics.periodLabel}
      />

      {/* Category Grid or Empty State */}
      {filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 px-6 py-14 text-center">
          {searchQuery.trim().length > 0 ? (
            <>
              <div className="flex size-12 items-center justify-center rounded-full border border-border/60 bg-background/60 text-muted-foreground">
                <SearchX className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                No matching categories
              </h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                No {activeTab} categories matched &ldquo;{searchQuery}&rdquo;.
                Try clearing your search filter or switching tabs.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="mt-4"
              >
                Clear Search
              </Button>
            </>
          ) : activeTab === "archived" ? (
            <>
              <div className="flex size-12 items-center justify-center rounded-full border border-border/60 bg-background/60 text-muted-foreground">
                <Archive className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                No archived categories
              </h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Custom categories you archive will appear here. Archived
                categories keep their historical transactions intact while
                staying hidden from new transaction forms.
              </p>
            </>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-full border border-border/60 bg-background/60 text-muted-foreground">
                <FolderOpen className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                No {activeTab} categories found
              </h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Create a custom {activeTab} category to organize your
                transactions with custom icons and colors.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 gap-1.5"
              >
                <Plus className="size-4" />
                Add {activeTab === "income" ? "Income" : "Expense"} Category
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              periodLabel={data.analytics.periodLabel}
              onInspect={(cat) => setInspectingCategory(cat)}
              onEdit={(cat) => setEditingCategory(cat)}
              onArchiveToggle={(cat) => setArchivingCategory(cat)}
            />
          ))}
        </div>
      )}

      {/* Create Custom Category Modal */}
      <CategoryFormDialog
        mode="create"
        defaultType={defaultCreateType}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleMutationSuccess}
      />

      {/* Edit Custom Category Modal */}
      <CategoryFormDialog
        mode="edit"
        category={editingCategory}
        open={Boolean(editingCategory)}
        onOpenChange={(open) => {
          if (!open) setEditingCategory(null)
        }}
        onSuccess={handleMutationSuccess}
      />

      {/* Archive / Reactivate Confirmation Modal */}
      <CategoryArchiveDialog
        category={archivingCategory}
        open={Boolean(archivingCategory)}
        onOpenChange={(open) => {
          if (!open) setArchivingCategory(null)
        }}
        onSuccess={handleMutationSuccess}
      />

      {/* Category Details Slide-Over Drawer */}
      <CategoryDetailsDrawer
        category={inspectingCategory}
        periodLabel={data.analytics.periodLabel}
        open={Boolean(inspectingCategory)}
        onOpenChange={(open) => {
          if (!open) setInspectingCategory(null)
        }}
        onEdit={(cat) => setEditingCategory(cat)}
        onArchiveToggle={(cat) => setArchivingCategory(cat)}
      />
    </div>
  )
}
