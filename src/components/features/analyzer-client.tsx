"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  FileUp,
  Lightbulb,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAi } from "@/hooks/use-ai";
import type { ProfileAnalysis } from "@/lib/ai/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/shared/score-ring";
import { scoreLabel } from "@/lib/utils";

const SUB_SCORES: Array<{ key: keyof ProfileAnalysis["scores"]; label: string }> = [
  { key: "recruiterScore", label: "Recruiter Score" },
  { key: "atsScore", label: "ATS Score" },
  { key: "keywordOptimization", label: "Keyword Optimization" },
  { key: "personalBranding", label: "Personal Branding" },
  { key: "leadership", label: "Leadership" },
  { key: "credibility", label: "Credibility" },
];

const SECTIONS: Array<{ key: keyof ProfileAnalysis["sections"]; label: string }> = [
  { key: "headline", label: "Headline" },
  { key: "about", label: "About" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "skills", label: "Skills" },
  { key: "certifications", label: "Certifications" },
  { key: "projects", label: "Projects" },
];

export function AnalyzerClient() {
  const [profileText, setProfileText] = React.useState("");
  const [targetRole, setTargetRole] = React.useState("");
  const [extracting, setExtracting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { run, loading, result } = useAi<
    { profileText: string; targetRole?: string },
    ProfileAnalysis
  >({ endpoint: "/api/ai/analyze" });

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/extract-pdf", { method: "POST", body: formData });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? "Could not read the PDF");
        return;
      }
      setProfileText(body.data.text);
      toast.success("PDF text extracted — review it below, then analyze");
    } catch {
      toast.error("Could not read the PDF");
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const analyze = () => {
    if (profileText.trim().length < 100) {
      toast.error("Please provide at least 100 characters of profile content");
      return;
    }
    void run({ profileText, targetRole: targetRole || undefined });
  };

  return (
    <div className="space-y-8">
      {/* Input */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="target-role">Target role (optional)</Label>
              <Input
                id="target-role"
                placeholder="e.g. Senior Product Manager"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={onFileChange}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={extracting}
              >
                {extracting ? <Loader2 className="animate-spin" /> : <FileUp />}
                Upload LinkedIn PDF
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-text">Profile content</Label>
            <Textarea
              id="profile-text"
              rows={10}
              placeholder={
                "Paste your LinkedIn profile here — headline, about, experience, education, skills, certifications, projects…\n\nTip: on LinkedIn go to your profile → More → Save to PDF, then upload it above."
              }
              value={profileText}
              onChange={(e) => setProfileText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {profileText.length.toLocaleString()} characters
            </p>
          </div>

          <Button variant="gradient" size="lg" onClick={analyze} loading={loading}>
            {!loading && <Sparkles />}
            {loading ? "Analyzing your profile…" : "Analyze my profile"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Overall + sub-scores */}
          <Card className="overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col items-center gap-8 lg:flex-row">
                <div className="flex flex-col items-center gap-2 text-center">
                  <ScoreRing score={result.overallScore} size={160} label="Overall" />
                  <Badge
                    variant={result.overallScore >= 80 ? "success" : result.overallScore >= 60 ? "warning" : "destructive"}
                  >
                    {scoreLabel(result.overallScore)}
                  </Badge>
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {SUB_SCORES.map((sub, i) => {
                      const value = result.scores[sub.key];
                      return (
                        <motion.div
                          key={sub.key}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.07 }}
                        >
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span>{sub.label}</span>
                            <span className="font-semibold tabular-nums">{value}</span>
                          </div>
                          <Progress
                            value={value}
                            indicatorClassName={
                              value >= 80
                                ? "bg-emerald-500"
                                : value >= 60
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                            }
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Highest-impact improvements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.topActions.map((action, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border p-4">
                  <Badge
                    variant={
                      action.impact === "high"
                        ? "destructive"
                        : action.impact === "medium"
                          ? "warning"
                          : "secondary"
                    }
                    className="mt-0.5 shrink-0 uppercase"
                  >
                    {action.impact}
                  </Badge>
                  <div>
                    <div className="font-medium">{action.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section-by-section */}
          <Card>
            <CardHeader>
              <CardTitle>Section breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="headline">
                <TabsList className="h-auto flex-wrap">
                  {SECTIONS.map((section) => (
                    <TabsTrigger key={section.key} value={section.key} className="gap-1.5">
                      {section.label}
                      <span className="tabular-nums text-xs text-muted-foreground">
                        {result.sections[section.key].score}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                {SECTIONS.map((section) => {
                  const data = result.sections[section.key];
                  return (
                    <TabsContent key={section.key} value={section.key} className="mt-4 space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <FeedbackList
                          title="Strengths"
                          items={data.strengths}
                          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        />
                        <FeedbackList
                          title="Issues"
                          items={data.issues}
                          icon={<AlertTriangle className="h-4 w-4 text-rose-500" />}
                        />
                        <FeedbackList
                          title="Suggestions"
                          items={data.suggestions}
                          icon={<Lightbulb className="h-4 w-4 text-amber-500" />}
                        />
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>

          {/* Missing keywords */}
          <Card>
            <CardHeader>
              <CardTitle>Missing keywords</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {result.missingKeywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="px-3 py-1">
                  {keyword}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function FeedbackList({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      {items.length ? (
        <ul className="mt-3 space-y-2">
          {items.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Nothing flagged.</p>
      )}
    </div>
  );
}
