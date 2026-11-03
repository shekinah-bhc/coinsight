"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label="Toggle color theme"
            className="relative size-8 rounded-lg border-border bg-card/60 text-foreground backdrop-blur-sm transition-colors hover:bg-accent"
          />
        }
      >
        <Sun
          className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
          aria-hidden="true"
        />
        <Moon
          className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
          aria-hidden="true"
        />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-36 rounded-xl border border-border bg-popover/95 p-1.5 backdrop-blur-md"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs"
        >
          <span className="flex items-center gap-2">
            <Sun className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span>Light</span>
          </span>
          {theme === "light" ? (
            <Check className="size-3.5 text-primary" aria-hidden="true" />
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs"
        >
          <span className="flex items-center gap-2">
            <Moon
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <span>Dark</span>
          </span>
          {theme === "dark" ? (
            <Check className="size-3.5 text-primary" aria-hidden="true" />
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs"
        >
          <span className="flex items-center gap-2">
            <Monitor
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <span>System</span>
          </span>
          {theme === "system" ? (
            <Check className="size-3.5 text-primary" aria-hidden="true" />
          ) : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

