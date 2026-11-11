"use client";

import { useActionState, useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Loader2,
  Lock,
  Plus,
  Pencil,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryIcon } from "@/components/categories/category-icon";
import {
  createCategoryAction,
  updateCategoryAction,
  type CategoryWithStats,
} from "@/lib/categories/actions";
import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  type CategoryActionState,
} from "@/lib/validations/categories";
import type { CategoryType } from "@/src/types/database.types";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  defaultType?: CategoryType;
  category?: CategoryWithStats | null;
  onSuccess?: () => void;
}

const initialState: CategoryActionState = {
  status: "idle",
};

interface CategoryFormInnerProps {
  mode: "create" | "edit";
  defaultType: CategoryType;
  category?: CategoryWithStats | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function CategoryFormInner({
  mode,
  defaultType,
  category,
  onOpenChange,
  onSuccess,
}: CategoryFormInnerProps) {
  const actionFn = mode === "create" ? createCategoryAction : updateCategoryAction;
  const [state, formAction, isPending] = useActionState(actionFn, initialState);

  const [name, setName] = useState<string>(category?.name ?? "");
  const [type, setType] = useState<CategoryType>(category?.type ?? defaultType);
  const [icon, setIcon] = useState<string>(category?.icon || "Utensils");
  const [color, setColor] = useState<string>(category?.color || "#6366F1");

  const isTypeLocked = mode === "edit" && Boolean(category?.hasActivity);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(
        state.message ||
          (mode === "create"
            ? "Category created successfully."
            : "Category updated successfully.")
      );
      onOpenChange(false);
      onSuccess?.();
    } else if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state, mode, onOpenChange, onSuccess]);

  return (
    <form action={formAction} className="space-y-4 py-1">
      {mode === "edit" && category && (
        <input type="hidden" name="categoryId" value={category.id} />
      )}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="color" value={color} />

      {state.status === "error" && state.message && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-xs text-destructive">
          {state.message}
        </div>
      )}

      {/* Live Preview Banner */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary/50 p-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-colors"
            style={{ backgroundColor: color }}
          >
            <CategoryIcon iconName={icon} className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {name.trim() || "Category Preview"}
            </p>
            <p className="text-[11px] text-muted-foreground capitalize">
              Custom {type} category
            </p>
          </div>
        </div>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
          Preview
        </span>
      </div>

      {/* Category Name */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="cat-name" className="text-xs font-medium">
            Category Name <span className="text-destructive">*</span>
          </Label>
          <span className="text-[11px] text-muted-foreground">
            {name.trim().length}/60
          </span>
        </div>
        <Input
          id="cat-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Groceries, Cloud Hosting, Dividends"
          maxLength={60}
          required
          autoFocus
          className={`text-sm ${
            state.fieldErrors?.name ? "border-destructive focus-visible:ring-destructive" : ""
          }`}
        />
        {state.fieldErrors?.name && (
          <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      {/* Transaction Type */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Transaction Type</Label>
          {isTypeLocked && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
              <Lock className="size-3" aria-hidden="true" />
              Locked (has history)
            </span>
          )}
        </div>

        <Tabs
          value={type}
          onValueChange={(val) => {
            if (!isTypeLocked) {
              setType(val as CategoryType);
            }
          }}
          className="w-full"
        >
          <TabsList className="grid h-10 w-full grid-cols-2 p-1">
            <TabsTrigger
              value="expense"
              disabled={isTypeLocked && type !== "expense"}
              className="gap-1.5 text-xs font-medium data-[state=active]:bg-rose-500/15 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400"
            >
              <ArrowDownLeft className="size-3.5" aria-hidden="true" />
              Expense (Outflow)
            </TabsTrigger>
            <TabsTrigger
              value="income"
              disabled={isTypeLocked && type !== "income"}
              className="gap-1.5 text-xs font-medium data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400"
            >
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
              Income (Inflow)
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isTypeLocked && (
          <p className="text-[11px] text-muted-foreground">
            This category already has linked transactions or budgets, so its transaction type cannot be changed.
          </p>
        )}
      </div>

      {/* Color Swatch Picker */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Category Color</Label>
        <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-background/50 p-3">
          {CATEGORY_COLOR_OPTIONS.map((swatch) => {
            const isSelected = color.toLowerCase() === swatch.hex.toLowerCase();
            return (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => setColor(swatch.hex)}
                title={swatch.label}
                aria-label={`Select color ${swatch.label}`}
                aria-pressed={isSelected}
                className={`flex size-7 items-center justify-center rounded-lg transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected ? "scale-110 ring-2 ring-foreground" : "hover:scale-105 opacity-85 hover:opacity-100"
                }`}
                style={{ backgroundColor: swatch.hex }}
              >
                {isSelected && <Check className="size-3.5 text-white drop-shadow" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Icon Picker Grid */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Category Icon</Label>
        <div className="grid max-h-44 grid-cols-6 gap-2 overflow-y-auto rounded-xl border border-border bg-background/50 p-3 sm:grid-cols-8">
          {CATEGORY_ICON_OPTIONS.map((opt) => {
            const isSelected = icon.toLowerCase() === opt.id.toLowerCase();
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setIcon(opt.id)}
                title={opt.label}
                aria-label={`Select icon ${opt.label}`}
                aria-pressed={isSelected}
                className={`flex h-9 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? "border-primary bg-primary/15 text-primary shadow-2xs"
                    : "border-transparent bg-card/60 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <CategoryIcon iconName={opt.id} className="size-4" />
              </button>
            );
          })}
        </div>
      </div>

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
          className="text-xs"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="gap-1.5 text-xs">
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>{mode === "create" ? "Creating..." : "Saving..."}</span>
            </>
          ) : (
            <>
              {mode === "create" ? (
                <Plus className="size-3.5" />
              ) : (
                <Pencil className="size-3.5" />
              )}
              <span>{mode === "create" ? "Create Category" : "Save Changes"}</span>
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  mode,
  defaultType = "expense",
  category,
  onSuccess,
}: CategoryFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Custom Category" : `Edit "${category?.name ?? "Category"}"`}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {mode === "create"
              ? "Add a personalized category to organize your income or expenses."
              : "Update the display name, icon, or color. Historical transaction amounts remain unchanged."}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <CategoryFormInner
            key={`${mode}-${category?.id ?? "new"}-${defaultType}`}
            mode={mode}
            defaultType={defaultType}
            category={category}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

