import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
}

export function AuthShell({
  title,
  description,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthShellProps) {
  return (
    <div className="fintech-ambient relative flex min-h-svh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/75 px-6 backdrop-blur-md lg:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 rounded-md text-sm font-semibold tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <span className="flex size-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-primary shadow-2xs">
            <TrendingUp className="size-4" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-tight">
            Coinsight
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm sm:inline-flex">
            <ShieldCheck
              className="size-3.5 text-brand-secondary"
              aria-hidden="true"
            />
            <span>256-bit encrypted session</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-[420px] space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
              <span>Personal Finance Workspace</span>
            </div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="glass-card relative overflow-hidden rounded-2xl p-6 text-card-foreground shadow-xl shadow-black/5 dark:shadow-black/40 sm:p-7">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            />
            {children}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {footerText}{" "}
            <Link
              href={footerLinkHref}
              className="rounded-xs font-medium text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {footerLinkText}
            </Link>
          </p>
        </div>
      </main>

      <footer className="border-t border-border/70 px-6 py-4 text-center text-xs text-muted-foreground">
        Coinsight Personal Finance &middot; Institutional-grade financial clarity
      </footer>
    </div>
  );
}
