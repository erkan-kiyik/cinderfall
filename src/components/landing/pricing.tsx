"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAN_FEATURES, PRO_PRICE_MONTHLY } from "@/lib/plans";

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Simple pricing, <span className="gradient-text">serious results</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade when you&apos;re ready to go unlimited.
          </p>
        </motion.div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="glass flex flex-col rounded-3xl p-8"
          >
            <h3 className="text-lg font-semibold">Free</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything you need to get started
            </p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tight">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="mt-8 flex-1 space-y-3">
              {PLAN_FEATURES.FREE.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button variant="outline" size="lg" className="mt-8 w-full" asChild>
              <Link href="/signup">Start Free</Link>
            </Button>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="relative flex flex-col rounded-3xl bg-gradient-to-b from-indigo-500/10 via-violet-500/10 to-fuchsia-500/10 p-[1.5px]"
          >
            <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-r from-indigo-500/25 to-fuchsia-500/25 blur-2xl" aria-hidden />
            <div className="glass-strong flex flex-1 flex-col rounded-3xl p-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Pro</h3>
                <Badge variant="gradient" className="gap-1">
                  <Sparkles className="h-3 w-3" /> Most popular
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Unlimited power for serious career growth
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tight">${PRO_PRICE_MONTHLY}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {PLAN_FEATURES.PRO.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="gradient" size="lg" className="mt-8 w-full" asChild>
                <Link href="/signup?plan=pro">Get Pro</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
