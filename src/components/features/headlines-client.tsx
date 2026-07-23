"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, Type } from "lucide-react";
import { useAi } from "@/hooks/use-ai";
import { HEADLINE_STYLES, type HeadlinesResult } from "@/lib/ai/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CopyButton } from "@/components/shared/copy-button";

type Style = (typeof HEADLINE_STYLES)[number];

export function HeadlinesClient() {
  const [style, setStyle] = React.useState<Style>("Software Engineer");
  const [role, setRole] = React.useState("");
  const [background, setBackground] = React.useState("");
  const [keywords, setKeywords] = React.useState("");

  const { run, loading, result } = useAi<
    { style: Style; role: string; background?: string; keywords?: string },
    HeadlinesResult
  >({ endpoint: "/api/ai/headlines" });

  const generate = () => {
    if (role.trim().length < 2) {
      toast.error("Tell us your current or target role");
      return;
    }
    void run({
      style,
      role,
      background: background || undefined,
      keywords: keywords || undefined,
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Style</Label>
              <Select value={style} onValueChange={(v) => setStyle(v as Style)}>
                <SelectTrigger aria-label="Headline style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HEADLINE_STYLES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Current or target role</Label>
              <Input
                id="role"
                placeholder="e.g. Full-Stack Developer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="background">Background & achievements (optional)</Label>
            <Textarea
              id="background"
              rows={3}
              placeholder="e.g. 5 years building fintech products, led a team of 4, shipped an app with 1M downloads…"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Must-include keywords (optional)</Label>
            <Input
              id="keywords"
              placeholder="e.g. React, AWS, Team Leadership"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>

          <Button variant="gradient" size="lg" onClick={generate} loading={loading}>
            {!loading && <Sparkles />}
            {loading ? "Writing headlines…" : "Generate 10 headlines"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid gap-3">
            {result.headlines.map((headline, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="group">
                  <CardContent className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-relaxed">{headline.text}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          <Type className="mr-1 h-3 w-3" />
                          {headline.charCount}/220
                        </Badge>
                        {headline.keywords.slice(0, 4).map((keyword) => (
                          <Badge key={keyword} variant="secondary" className="text-[10px]">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <CopyButton text={headline.text} className="shrink-0" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pro tips</CardTitle>
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
