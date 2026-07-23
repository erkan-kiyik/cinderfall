"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  CalendarDays,
  FileText,
  HandshakeIcon,
  Map,
  MessageCircle,
  Mic2,
  Sparkles,
} from "lucide-react";
import { useAi } from "@/hooks/use-ai";
import type { ToolkitResult, ToolkitTool } from "@/lib/ai/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/shared/copy-button";
import { cn } from "@/lib/utils";

const TOOLS: Array<{
  id: ToolkitTool;
  label: string;
  icon: React.ElementType;
  placeholder: string;
}> = [
  {
    id: "cover-letter",
    label: "Cover Letter",
    icon: FileText,
    placeholder:
      "Paste the job title + company and a summary of your relevant experience…",
  },
  {
    id: "networking-message",
    label: "Networking Message",
    icon: MessageCircle,
    placeholder:
      "Who do you want to reach (role/company), and why? Any common ground?",
  },
  {
    id: "referral-request",
    label: "Referral Request",
    icon: HandshakeIcon,
    placeholder:
      "Which job are you targeting, who could refer you, and what's your relationship with them?",
  },
  {
    id: "interview-questions",
    label: "Interview Prep",
    icon: Mic2,
    placeholder:
      "What role are you interviewing for? Include seniority, company type, and your background…",
  },
  {
    id: "content-calendar",
    label: "Content Calendar",
    icon: CalendarDays,
    placeholder:
      "What's your field, target audience, and personal brand angle?",
  },
  {
    id: "career-roadmap",
    label: "Career Roadmap",
    icon: Map,
    placeholder:
      "Where are you now, and where do you want to be? Include current role, skills, and goals…",
  },
];

export function ToolkitClient() {
  const [tool, setTool] = React.useState<ToolkitTool>("cover-letter");
  const [details, setDetails] = React.useState("");

  const { run, loading, result, setResult } = useAi<
    { tool: ToolkitTool; details: string },
    ToolkitResult
  >({ endpoint: "/api/ai/toolkit" });

  const active = TOOLS.find((t) => t.id === tool)!;

  const generate = () => {
    if (details.trim().length < 20) {
      toast.error("Add a bit more context so the result is tailored to you");
      return;
    }
    void run({ tool, details });
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTool(t.id);
              setResult(null);
            }}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-4 text-left transition-all",
              tool === t.id
                ? "border-transparent bg-gradient-to-r from-indigo-500/15 to-fuchsia-500/10 ring-2 ring-primary"
                : "hover:bg-accent/50"
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                tool === t.id
                  ? "bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              <t.icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium">{t.label}</span>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="details">Your context</Label>
            <Textarea
              id="details"
              rows={5}
              placeholder={active.placeholder}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
          <Button variant="gradient" size="lg" onClick={generate} loading={loading}>
            {!loading && <Sparkles />}
            {loading ? "Generating…" : `Generate ${active.label}`}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{result.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="0">
                <TabsList className="h-auto flex-wrap">
                  {result.variants.map((variant, i) => (
                    <TabsTrigger key={i} value={String(i)}>
                      {variant.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {result.variants.map((variant, i) => (
                  <TabsContent key={i} value={String(i)} className="mt-4">
                    <div className="flex justify-end">
                      <CopyButton text={variant.content} />
                    </div>
                    <div className="mt-2 whitespace-pre-line rounded-2xl border bg-muted/30 p-5 text-sm leading-relaxed">
                      {variant.content}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {result.tips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
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
          )}
        </motion.div>
      )}
    </div>
  );
}
