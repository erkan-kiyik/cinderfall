import Link from "next/link";
import { Rocket } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "AI Demo", href: "/#demo" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Tools",
    links: [
      { label: "Profile Analyzer", href: "/dashboard/analyzer" },
      { label: "ATS Checker", href: "/dashboard/ats" },
      { label: "Headline Generator", href: "/dashboard/headlines" },
      { label: "Post Generator", href: "/dashboard/posts" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/signup" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Billing", href: "/dashboard/billing" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t py-14">
      <div className="container">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
                <Rocket className="h-4 w-4" />
              </span>
              <span className="text-lg tracking-tight">
                Coseade <span className="gradient-text">AI</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI-powered LinkedIn optimization. Get recruiter-ready in under 60 seconds.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold">{column.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Coseade AI. All rights reserved.</p>
          <p>Not affiliated with LinkedIn Corporation.</p>
        </div>
      </div>
    </footer>
  );
}
