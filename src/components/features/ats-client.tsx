"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  FileUp,
  Loader2,
  ScanSearch,
  Wrench,
} from "lucide-react";
import { useAi } from "@/hooks/use-ai";
import type { AtsCheckResult } from "@/lib/ai/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/shared/score-ring";

export function AtsClient() {
  const [resume, setResume] = React.useState("");
  const [jobDescription, setJobDescription] = React.useState("");
  const [extracting, setExtracting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { run, loading, result } = useAi<
    { resume: string; jobDescription: string },
    AtsCheckResult
  >({ endpoint: "/api/ai/ats" });

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
      setResume(body.data.text);
      toast.success("Resume text extracted");
    } catch {
      toast.error("Could not read the PDF");
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const check = () => {
    if (resume.trim().length < 100) {
      toast.error("Please provide your full resume text (min. 100 characters)");
      return;
    }
    if (jobDescription.trim().length < 50) {
      toast.error("Paste the job description you're targeting");
      return;
    }
    void run({ resume, jobDescription });
  };

  const importanceVariant = (importance: string) =>
    importance === "critical" ? "destructive" : importance === "important" ? "warning" : "secondary";

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Your resume</CardTitle>
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
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={extracting}
              >
                {extracting ? <Loader2 className="animate-spin" /> : <FileUp />}
                Upload PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={12}
              placeholder="Paste your resume text here, or upload the PDF above…"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              aria-label="Resume text"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="jd" className="sr-only">
                Job description
              </Label>
              <Textarea
                id="jd"
                rows={12}
                placeholder="Paste the full job description you're applying to…"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Button variant="gradient" size="lg" onClick={check} loading={loading}>
        {!loading && <ScanSearch />}
        {loading ? "Running ATS analysis…" : "Check my match"}
      </Button>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <Card>
            <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
              <ScoreRing score={result.matchPercentage} size={150} label="Match" />
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-semibold">
                  {result.matchPercentage >= 75
                    ? "Strong match — polish and apply"
                    : result.matchPercentage >= 50
                      ? "Decent match — close the gaps below"
                      : "Weak match — significant tailoring needed"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {result.summary}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Missing keywords</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.missingKeywords.length ? (
                result.missingKeywords.map((keyword, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border p-4">
                    <Badge variant={importanceVariant(keyword.importance)} className="mt-0.5 shrink-0 uppercase">
                      {keyword.importance}
                    </Badge>
                    <div>
                      <div className="font-medium">{keyword.keyword}</div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{keyword.whereToAdd}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No missing keywords — excellent coverage.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {result.strengths.map((item, i) => (
                    <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-500" /> Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {result.weaknesses.map((item, i) => (
                    <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-violet-500" /> Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.suggestions.map((suggestion, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border p-4">
                  <Badge
                    variant={
                      suggestion.impact === "high"
                        ? "destructive"
                        : suggestion.impact === "medium"
                          ? "warning"
                          : "secondary"
                    }
                    className="mt-0.5 shrink-0 uppercase"
                  >
                    {suggestion.impact}
                  </Badge>
                  <div>
                    <div className="font-medium">{suggestion.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{suggestion.description}</p>
                  </div>
                </div>
              ))}
              {result.formattingIssues.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <div className="text-sm font-semibold">Formatting issues that break ATS parsing</div>
                  <ul className="mt-2 space-y-1.5">
                    {result.formattingIssues.map((issue, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {result.matchedKeywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Matched keywords</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {result.matchedKeywords.map((keyword) => (
                  <Badge key={keyword} variant="success" className="px-3 py-1">
                    {keyword}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
