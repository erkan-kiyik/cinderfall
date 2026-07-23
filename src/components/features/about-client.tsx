"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PenLine, Sparkles } from "lucide-react";
import { useAi } from "@/hooks/use-ai";
import { ABOUT_TONES, type AboutResult } from "@/lib/ai/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/shared/copy-button";

type Tone = (typeof ABOUT_TONES)[number];

export function AboutClient() {
  const [tone, setTone] = React.useState<Tone>("Professional");
  const [role, setRole] = React.useState("");
  const [background, setBackground] = React.useState("");
  const [goals, setGoals] = React.useState("");

  const { run, loading, result } = useAi<
    { tone: Tone; role: string; background: string; goals?: string },
    AboutResult
  >({ endpoint: "/api/ai/about" });

  const generate = () => {
    if (role.trim().length < 2) {
      toast.error("Tell us your role");
      return;
    }
    if (background.trim().length < 30) {
      toast.error("Add a bit more about your background (min. 30 characters)");
      return;
    }
    void run({ tone, role, background, goals: goals || undefined });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Label>Tone</Label>
            <div className="flex flex-wrap gap-2">
              {ABOUT_TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    tone === t
                      ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25"
                      : "border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Your role</Label>
            <Input
              id="role"
              placeholder="e.g. Growth Marketing Manager"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="background">Background, experience & achievements</Label>
            <Textarea
              id="background"
              rows={5}
              placeholder="Your career story so far: key roles, wins with numbers if you have them, what drives you…"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">What should this About achieve? (optional)</Label>
            <Input
              id="goals"
              placeholder="e.g. Attract recruiters for senior PM roles"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
            />
          </div>

          <Button variant="gradient" size="lg" onClick={generate} loading={loading}>
            {!loading && <PenLine />}
            {loading ? "Writing your story…" : "Generate About sections"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Tabs defaultValue="0">
            <TabsList>
              {result.variants.map((variant, i) => (
                <TabsTrigger key={i} value={String(i)}>
                  Variant {i + 1}
                </TabsTrigger>
              ))}
            </TabsList>
            {result.variants.map((variant, i) => (
              <TabsContent key={i} value={String(i)}>
                <Card>
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="gradient">{variant.tone}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {variant.wordCount} words
                      </span>
                    </div>
                    <CopyButton text={variant.content} />
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-sm font-medium">
                      <Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-violet-500" />
                      Hook: {variant.hook}
                    </div>
                    <div className="mt-4 whitespace-pre-line text-sm leading-relaxed">
                      {variant.content}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Personalization tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-4">
                {result.tips.map((tip, i) => (
                  <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                    {tip}
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
