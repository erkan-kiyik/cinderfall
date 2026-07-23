"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const BEFORE = "Worked on web development.";
const AFTER =
  "Developed a Next.js platform that improved page load speed by 42% and increased user engagement by 18%.";

const demoTabs = [
  {
    id: "experience",
    label: "Experience Optimizer",
    before: BEFORE,
    after: AFTER,
  },
  {
    id: "headline",
    label: "Headline Generator",
    before: "Software developer at TechCorp",
    after:
      "Senior Software Engineer | React · Node.js · AWS | Building products used by 2M+ users",
  },
  {
    id: "about",
    label: "About Generator",
    before: "I am a hard-working professional with experience in marketing.",
    after:
      "I turn unknown brands into category leaders. Over 6 years I've built growth engines that took two startups from zero to $10M ARR — and I document every playbook along the way.",
  },
];

export function Demo() {
  const [active, setActive] = React.useState(demoTabs[0]);
  const [typed, setTyped] = React.useState("");

  React.useEffect(() => {
    setTyped("");
    let i = 0;
    const interval = setInterval(() => {
      i += 2;
      setTyped(active.after.slice(0, i));
      if (i >= active.after.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <section id="demo" className="relative overflow-hidden py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Watch AI transform <span className="gradient-text">boring into brilliant</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Real examples of how Coseade rewrites your profile content.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mt-12 max-w-3xl"
        >
          <div className="flex flex-wrap justify-center gap-2">
            {demoTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  active.id === tab.id
                    ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                    : "glass text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="glass-strong mt-6 rounded-3xl p-6 shadow-xl sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
              >
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-500">
                      Before
                    </div>
                    <div className="rounded-2xl border border-dashed bg-muted/50 p-4 text-sm text-muted-foreground line-through decoration-rose-400/60">
                      {active.before}
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
                      <Sparkles className="h-4 w-4" />
                    </span>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-500">
                      After — Coseade AI
                    </div>
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm font-medium leading-relaxed">
                      {typed}
                      <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-emerald-500 align-middle" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex justify-center">
              <Button variant="gradient" className="group" asChild>
                <Link href="/signup">
                  Try it on your profile
                  <ArrowRight className="transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
