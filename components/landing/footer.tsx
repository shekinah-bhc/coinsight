"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

function emptySubscribe() {
  return () => {};
}

function getClientYear() {
  return new Date().getFullYear();
}

function getServerYear() {
  return 2026;
}

export function Footer() {
  const currentYear = useSyncExternalStore(emptySubscribe, getClientYear, getServerYear);

  return (
    <footer className="border-t border-border bg-background py-12 text-sm text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo & Description */}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-foreground font-semibold"
              aria-label="Coinsight Home"
            >
              <span className="flex size-7 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-primary">
                <TrendingUp className="size-3.5" aria-hidden="true" />
              </span>
              <span>Coinsight</span>
            </Link>
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              Personal finance intelligence and cash flow clarity for India.
            </p>
          </div>

          {/* Quick Links */}
          <nav aria-label="Footer Navigation" className="flex flex-wrap items-center justify-center gap-6 text-xs">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              How It Works
            </a>
            <a href="#privacy" className="transition-colors hover:text-foreground">
              Privacy & Security
            </a>
            <Link href="/login" className="transition-colors hover:text-foreground">
              Log In
            </Link>
            <Link href="/register" className="transition-colors hover:text-foreground">
              Get Started
            </Link>
          </nav>
        </div>

        {/* Copyright notice */}
        <div className="mt-8 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground/80">
          <p>© {currentYear} Coinsight. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
