import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck, TrendingUp } from "lucide-react";

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
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex h-14 items-center justify-between border-b border-border/70 px-6 lg:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-sm"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <TrendingUp className="size-4" aria-hidden="true" />
          </span>
          <span>Coinsight</span>
        </Link>
        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>256-bit encrypted session</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs">
            {children}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {footerText}{" "}
            <Link
              href={footerLinkHref}
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-xs"
            >
              {footerLinkText}
            </Link>
          </p>
        </div>
      </main>

      <footer className="border-t border-border/60 px-6 py-4 text-center text-xs text-muted-foreground">
        Coinsight Personal Finance &middot; Institutional-grade financial clarity
      </footer>
    </div>
  );
}

