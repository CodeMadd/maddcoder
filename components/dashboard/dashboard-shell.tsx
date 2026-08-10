"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Menu, X } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { NAV_ITEMS } from "@/components/dashboard/nav-items";
import { cn, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function DashboardShell({
  user,
  plan,
  children,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  plan: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Dashboard">
      {NAV_ITEMS.map((item) => {
        const active = item.match
          ? item.match(pathname)
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const userFooter = (
    <div className="border-t p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-medium text-white">
          {initials(user.name, user.email)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {user.name ?? "User"}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {user.email}
          </div>
        </div>
        <Badge variant="muted" className="shrink-0">
          {plan}
        </Badge>
      </div>
      <Button
        variant="ghost"
        className="mt-1 w-full justify-start text-muted-foreground"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <LogOut className="size-4" /> Log out
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center border-b px-5">
          <Logo href="/dashboard" />
        </div>
        {nav}
        {userFooter}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-card shadow-xl">
            <div className="flex h-16 items-center justify-between border-b px-5">
              <Logo href="/dashboard" />
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            {nav}
            {userFooter}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-2 hover:bg-accent"
          >
            <Menu className="size-5" />
          </button>
          <Logo href="/dashboard" />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
