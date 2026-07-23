"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_FEATURES, PRO_PRICE_MONTHLY } from "@/lib/plans";

export function ProGate({ feature, description }: { feature: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-auto max-w-xl"
    >
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 blur-2xl" aria-hidden />
      <div className="glass-strong relative rounded-3xl p-8 text-center shadow-xl">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg">
          <Lock className="h-6 w-6" />
        </span>
        <h2 className="mt-5 text-xl font-bold">{feature} is a Pro feature</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>

        <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left">
          {PLAN_FEATURES.PRO.slice(0, 4).map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
              {item}
            </li>
          ))}
        </ul>

        <Button variant="gradient" size="lg" className="mt-8 w-full" asChild>
          <Link href="/dashboard/billing">
            <Sparkles /> Upgrade to Pro — ${PRO_PRICE_MONTHLY}/month
          </Link>
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">Cancel anytime, in one click.</p>
      </div>
    </motion.div>
  );
}
