"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronDown,
  LogOut,
  Menu,
  ShieldCheck,
  User,
} from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { DashboardSidebarContent } from "@/components/dashboard/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface DashboardHeaderProps {
  userEmail: string | undefined;
  userId: string;
  userRole: string | undefined;
  userName?: string | null;
  userAvatarUrl?: string | null;
  onboardingCompleted?: boolean;
}

function getInitials(name: string | null | undefined, email: string | undefined): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
    }
    return parts[0]?.slice(0, 2).toUpperCase() || "CS";
  }
  if (!email) {
    return "CS";
  }
  const localPart = email.split("@")[0] ?? "";
  const segments = localPart.split(/[._-]/).filter(Boolean);
  if (segments.length >= 2) {
    return `${segments[0][0] ?? ""}${segments[1][0] ?? ""}`.toUpperCase();
  }
  return localPart.slice(0, 2).toUpperCase() || "CS";
}

export function DashboardHeader({
  userEmail,
  userId,
  userRole,
  userName,
  userAvatarUrl,
  onboardingCompleted,
}: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const displayName = userName || userEmail || "Authenticated User";
  const initials = getInitials(userName, userEmail);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                aria-label="Open navigation menu"
                className="size-8 rounded-lg border-border bg-card/60 lg:hidden"
              />
            }
          >
            <Menu className="size-4" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 border-r border-sidebar-border bg-sidebar p-0"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>
                Navigate across your Coinsight workspace.
              </SheetDescription>
            </SheetHeader>
            <DashboardSidebarContent
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="font-medium text-muted-foreground">Workspace</span>
          <span className="text-muted-foreground/50" aria-hidden="true">
            /
          </span>
          <span className="font-semibold text-foreground">Overview</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="hidden items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground md:inline-flex">
          <Calendar className="size-3.5 text-primary" aria-hidden="true" />
          <span>Current Period</span>
        </div>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Account menu"
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-card/70 pr-2.5 pl-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            }
          >
            <Avatar className="size-5 shrink-0 rounded-md">
              {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={displayName} />}
              <AvatarFallback className="rounded-md bg-primary/20 text-[10px] font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-36 truncate sm:inline-block">
              {displayName}
            </span>
            <ChevronDown
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-64 rounded-xl border border-border bg-popover/95 p-1.5 backdrop-blur-md"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2.5 py-2">
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-8 shrink-0 rounded-lg border border-primary/30">
                    {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={displayName} />}
                    <AvatarFallback className="rounded-lg bg-primary/15 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {displayName}
                    </p>
                    <p className="truncate font-mono text-[10px] text-muted-foreground">
                      ID: {userId.slice(0, 8)}&hellip;{userId.slice(-4)}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <div className="p-0.5">
              <Link
                href={onboardingCompleted ? "/settings/profile" : "/onboarding"}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  <User className="size-3.5 text-primary" aria-hidden="true" />
                  <span>
                    {onboardingCompleted ? "Profile Settings" : "Complete Your Profile"}
                  </span>
                </span>
                {!onboardingCompleted && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                    Setup
                  </span>
                )}
              </Link>
            </div>

            <DropdownMenuSeparator />

            <div className="space-y-1 px-2.5 py-1.5 text-[11px]">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <User className="size-3" aria-hidden="true" />
                  <span>Role</span>
                </span>
                <span className="font-medium text-foreground">
                  {userRole ?? "authenticated"}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck
                    className="size-3 text-brand-secondary"
                    aria-hidden="true"
                  />
                  <span>Session</span>
                </span>
                <span className="font-medium text-brand-secondary">
                  JWT Verified
                </span>
              </div>
            </div>

            <DropdownMenuSeparator />

            <form action={logoutAction} className="p-0.5">
              <button
                type="submit"
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
              >
                <LogOut className="size-3.5" aria-hidden="true" />
                <span>Sign out of Coinsight</span>
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}

