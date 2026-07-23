import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserMenu } from "@/components/dashboard/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar plan={user.plan} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-end gap-3 border-b bg-background/70 px-4 backdrop-blur-xl sm:px-8">
          {user.plan === "PRO" && (
            <Badge variant="gradient" className="hidden sm:inline-flex">
              PRO
            </Badge>
          )}
          <ThemeToggle />
          <UserMenu
            name={user.name}
            email={user.email}
            avatarUrl={user.avatarUrl}
            plan={user.plan}
          />
        </header>

        <main className="px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
