"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/shared/score-ring";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 * i, duration: 0.6, ease: "easeOut" as const },
  }),
};

const stats = [
  { icon: Users, value: "27,000+", label: "Profiles optimized" },
  { icon: TrendingUp, value: "3.4×", label: "More recruiter views" },
  { icon: Zap, value: "<60s", label: "To first insights" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-40">
      <div className="aurora-bg" aria-hidden />
      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-violet-500" />
              Powered by the latest GPT models
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-6 text-balance text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Optimize Your LinkedIn Profile with <span className="gradient-text">AI</span>
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground sm:text-xl"
          >
            Get recruiter-ready in under 60 seconds.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button variant="gradient" size="lg" className="group w-full sm:w-auto" asChild>
              <Link href="/signup">
                Start Free
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
              <a href="#demo">See it in action</a>
            </Button>
          </motion.div>

          <motion.p
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-4 text-sm text-muted-foreground"
          >
            Free forever plan · No credit card required
          </motion.p>
        </div>

        {/* Floating preview card */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
          className="relative mx-auto mt-16 max-w-4xl"
        >
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-fuchsia-500/20 blur-2xl" aria-hidden />
          <div className="glass-strong relative rounded-3xl p-6 shadow-2xl shadow-violet-500/10 sm:p-8">
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
              <div className="flex flex-col items-center gap-2">
                <ScoreRing score={87} size={140} label="Overall" />
                <span className="text-sm font-medium text-muted-foreground">Profile Score</span>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  { label: "Recruiter Score", value: 91 },
                  { label: "ATS Score", value: 84 },
                  { label: "Keywords", value: 78 },
                  { label: "Branding", value: 88 },
                  { label: "Leadership", value: 82 },
                  { label: "Credibility", value: 90 },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.08 }}
                    className="glass rounded-2xl p-4 text-center"
                  >
                    <div className="text-2xl font-bold tabular-nums">{item.value}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{item.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-center gap-3 text-center sm:text-left">
              <stat.icon className="h-5 w-5 text-violet-500" />
              <div>
                <div className="font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
