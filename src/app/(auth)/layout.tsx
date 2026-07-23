import Link from "next/link";
import { Rocket } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="aurora-bg" aria-hidden />
      <Link href="/" className="relative mb-8 flex items-center gap-2 font-semibold">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
          <Rocket className="h-4 w-4" />
        </span>
        <span className="text-xl tracking-tight">
          Coseade <span className="gradient-text">AI</span>
        </span>
      </Link>
      <div className="glass-strong relative w-full max-w-md rounded-3xl p-8 shadow-2xl shadow-violet-500/10">
        {children}
      </div>
    </div>
  );
}
