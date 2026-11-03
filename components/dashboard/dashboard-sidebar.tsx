"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  PieChart,
  Settings,
  TrendingUp,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const PRIMARY_NAV: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "Accounts & Cards",
    href: "/accounts",
    icon: CreditCard,
  },
  {
    label: "Budgets",
    href: "/dashboard#budgets",
    icon: PieChart,
    badge: "Preview",
  },
  {
    label: "Cash Flow Analytics",
    href: "/dashboard#analytics",
    icon: BarChart3,
    badge: "Soon",
  },
];

interface DashboardSidebarContentProps {
  onNavigate?: () => void;
}

export function DashboardSidebarContent({
  onNavigate,
}: DashboardSidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col justify-between bg-sidebar text-sidebar-foreground">
      <div className="space-y-6 p-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="inline-flex items-center gap-2.5 rounded-lg text-sm font-semibold tracking-tight text-sidebar-foreground outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
        >
          <span className="flex size-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-primary shadow-2xs">
            <TrendingUp className="size-4" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none tracking-tight">
              Coinsight
            </span>
            <span className="mt-1 text-[10px] font-medium text-muted-foreground">
              Personal Finance OS
            </span>
          </div>
        </Link>

        <div className="space-y-1">
          <p className="px-2.5 pb-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            Workspace
          </p>
          <nav aria-label="Main navigation" className="space-y-1">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      !item.href.includes("#") &&
                      pathname.startsWith(item.href));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50",
                    isActive
                      ? "border border-primary/25 bg-sidebar-accent text-foreground shadow-2xs"
                      : "border border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "size-4 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </span>
                  {item.badge ? (
                    <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-normal text-muted-foreground">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-1">
          <p className="px-2.5 pb-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            Preferences
          </p>
          <Link
            href="/settings/profile"
            onClick={onNavigate}
            aria-current={pathname === "/settings/profile" ? "page" : undefined}
            className={cn(
              "group flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50",
              pathname === "/settings/profile"
                ? "border-primary/25 bg-sidebar-accent text-foreground shadow-2xs"
                : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <User
              className={cn(
                "size-4 transition-colors",
                pathname === "/settings/profile"
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
              aria-hidden="true"
            />
            <span>Profile Settings</span>
          </Link>
          <Link
            href="/dashboard#settings"
            onClick={onNavigate}
            className="group flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
          >
            <Settings
              className="size-4 text-muted-foreground transition-colors group-hover:text-foreground"
              aria-hidden="true"
            />
            <span>Workspace Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  return (
    <aside
      aria-label="Sidebar"
      className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block"
    >
      <div className="sticky top-0 h-svh">
        <DashboardSidebarContent />
      </div>
    </aside>
  );
}
