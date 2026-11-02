import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LogOut, ShieldCheck, TrendingUp, UserCheck } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Dashboard | Coinsight",
  description: "Your Coinsight personal finance dashboard.",
};

async function DashboardSessionContent() {
  const user = await requireAuth();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              Financial Overview
            </h1>
            <Badge variant="outline" className="gap-1">
              <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>Authenticated</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user.email ?? user.id}</span>
          </p>
        </div>

        <form action={logoutAction}>
          <Button
            type="submit"
            variant="outline"
            size="lg"
            className="h-9 gap-2 px-3 text-xs font-medium"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            <span>Sign out</span>
          </Button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="size-4 text-muted-foreground" aria-hidden="true" />
              <span>Account Session</span>
            </CardTitle>
            <CardDescription>
              Verified server-side via Supabase JWT claims
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">
                {user.email ?? "Not provided"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-[11px] text-foreground">
                {user.id}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium text-foreground">
                {user.role ?? "authenticated"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace Status</CardTitle>
            <CardDescription>
              Ready for financial accounts, transactions, and budgets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p>
              Your Coinsight authentication session is active and protected by
              both Next.js proxy validation and server-side claim checks.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-44 w-full rounded-lg" />
        <Skeleton className="h-44 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex h-14 items-center justify-between border-b border-border/70 px-6 lg:px-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-sm"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <TrendingUp className="size-4" aria-hidden="true" />
          </span>
          <span>Coinsight</span>
        </Link>
      </header>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardSessionContent />
      </Suspense>
    </div>
  );
}

