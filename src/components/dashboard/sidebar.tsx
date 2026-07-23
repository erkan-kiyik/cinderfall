"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  CreditCard,
  FileSearch,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  PenLine,
  Briefcase,
  Rocket,
  ScanSearch,
  Settings,
  Sparkles,
  Type,
  Wrench,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  {
    section: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Optimize",
    items: [
      { href: "/dashboard/analyzer", label: "Profile Analyzer", icon: ScanSearch },
      { href: "/dashboard/ats", label: "ATS Score", icon: FileSearch, pro: true },
      { href: "/dashboard/headlines", label: "Headline Generator", icon: Type },
      { href: "/dashboard/about", label: "About Generator", icon: PenLine },
      { href: "/dashboard/experience", label: "Experience Optimizer", icon: Briefcase },
      { href: "/dashboard/skills", label: "Skills Analyzer", icon: BarChart3 },
    ],
  },
  {
    section: "Create",
    items: [
      { href: "/dashboard/posts", label: "Post Generator", icon: MessageSquareText },
      { href: "/dashboard/coach", label: "Career Coach", icon: Bot, pro: true },
      { href: "/dashboard/toolkit", label: "Career Toolkit", icon: Wrench },
    ],
  },
  {
    section: "Account",
    items: [
      { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

function NavLinks({ plan, onNavigate }: { plan: string; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4 scrollbar-thin">
      {nav.map((group) => (
        <div key={group.section}>
          <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.section}
          </div>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-gradient-to-r from-indigo-500/15 to-fuchsia-500/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", active && "text-primary")} />
                  <span className="flex-1">{item.label}</span>
                  {item.pro && plan !== "PRO" && (
                    <Badge variant="gradient" className="px-1.5 py-0 text-[10px]">
                      PRO
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ plan }: { plan: string }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => setOpen(false), [pathname]);

  const brand = (
    <div className="flex h-16 items-center gap-2 border-b px-6">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
        <Rocket className="h-4 w-4" />
      </span>
      <span className="font-semibold tracking-tight">
        Coseade <span className="gradient-text">AI</span>
      </span>
    </div>
  );

  const upgradeCard = plan !== "PRO" && (
    <div className="m-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-fuchsia-500/10 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="h-4 w-4 text-violet-500" />
        Go unlimited
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Unlock the ATS Checker, Career Coach, and unlimited AI generations.
      </p>
      <Button variant="gradient" size="sm" className="mt-3 w-full" asChild>
        <Link href="/dashboard/billing">Upgrade to Pro</Link>
      </Button>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r bg-background shadow-2xl">
            <div className="relative">
              {brand}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-3"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavLinks plan={plan} onNavigate={() => setOpen(false)} />
            {upgradeCard}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card/50 backdrop-blur-xl lg:flex">
        {brand}
        <NavLinks plan={plan} />
        {upgradeCard}
      </aside>
    </>
  );
}
