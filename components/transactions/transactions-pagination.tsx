"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TransactionsPaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export function TransactionsPagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
}: TransactionsPaginationProps) {
  if (totalCount === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 text-xs text-muted-foreground border-t border-border/40">
      <p>
        Showing <span className="font-semibold text-foreground">{start}</span> to{" "}
        <span className="font-semibold text-foreground">{end}</span> of{" "}
        <span className="font-semibold text-foreground">{totalCount}</span> transactions
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5 text-xs gap-1"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="size-3.5" />
          Previous
        </Button>

        <span className="text-xs px-2">
          Page {page} of {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5 text-xs gap-1"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

