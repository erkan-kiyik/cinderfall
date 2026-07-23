"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowDown, Briefcase, Sparkles } from "lucide-react";
import { useAi } from "@/hooks/use-ai";
import type { ExperienceResult } from "@/lib/ai/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/shared/copy-button";

const EXAMPLE = "Worked on web development.\nResponsible for customer support tickets.\nHelped with marketing campaigns.";

export function ExperienceClient() {
  const [role, setRole] = React.useState("");
  const [bullets, setBullets] = React.useState("");
  const [context, setContext] = React.useState("");

  const { run, loading, result } = useAi<
    { role: string; bullets: string; context?: string },
    ExperienceResult
  >({ endpoint: "/api/ai/experience" });

  const optimize = () => {
    if (role.trim().length < 2) {
      toast.error("Tell us which role these bullets belong to");
      return;
    }
    if (bullets.trim().length < 10) {
      toast.error("Paste at least one bullet point");
      return;
    }
    void run({ role, bullets, context: context || undefined });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                placeholder="e.g. Frontend Developer at Acme"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="context">Company / industry context (optional)</Label>
              <Input
                id="context"
                placeholder="e.g. B2B SaaS startup, 40 employees"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bullets">Bullet points (one per line)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setBullets(EXAMPLE)}
              >
                Try an example
              </Button>
            </div>
            <Textarea
              id="bullets"
              rows={6}
              placeholder={"Worked on web development.\nManaged social media accounts.\n…"}
              value={bullets}
              onChange={(e) => setBullets(e.target.value)}
            />
          </div>

          <Button variant="gradient" size="lg" onClick={optimize} loading={loading}>
            {!loading && <Briefcase />}
            {loading ? "Rewriting with STAR…" : "Optimize my experience"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {result.optimized.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card>
                <CardContent className="space-y-4 p-6">
                  <div>
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-rose-500">
                      Before
                    </div>
                    <p className="rounded-xl border border-dashed bg-muted/50 p-3 text-sm text-muted-foreground">
                      {item.original}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </span>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
                        After
                      </span>
                      <CopyButton text={item.rewritten} />
                    </div>
                    <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm font-medium leading-relaxed">
                      {item.rewritten}
                    </p>
                  </div>

                  <details className="group rounded-xl border p-4">
                    <summary className="cursor-pointer select-none text-sm font-medium">
                      STAR breakdown
                    </summary>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          ["Situation", item.star.situation],
                          ["Task", item.star.task],
                          ["Action", item.star.action],
                          ["Result", item.star.result],
                        ] as const
                      ).map(([label, value]) => (
                        <div key={label} className="rounded-lg bg-muted/50 p-3">
                          <div className="text-xs font-semibold text-primary">{label}</div>
                          <p className="mt-1 text-sm text-muted-foreground">{value}</p>
                        </div>
                      ))}
                    </div>
                  </details>

                  <div className="flex flex-wrap gap-1.5">
                    {item.metricsAdded.map((metric) => (
                      <Badge key={metric} variant="warning" className="text-[10px]">
                        {metric}
                      </Badge>
                    ))}
                    {item.keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="text-[10px]">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-500" />
                Overall advice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-4">
                {result.overallAdvice.map((advice, i) => (
                  <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                    {advice}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
