"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BarChart3, TrendingUp } from "lucide-react";
import { useAi } from "@/hooks/use-ai";
import type { SkillsResult } from "@/lib/ai/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SkillBarChart } from "@/components/dashboard/charts";
import { CopyButton } from "@/components/shared/copy-button";

export function SkillsClient() {
  const [role, setRole] = React.useState("");
  const [skills, setSkills] = React.useState("");
  const [industry, setIndustry] = React.useState("");

  const { run, loading, result } = useAi<
    { role: string; skills: string; industry?: string },
    SkillsResult
  >({ endpoint: "/api/ai/skills" });

  const analyze = () => {
    if (role.trim().length < 2) {
      toast.error("Tell us your target role");
      return;
    }
    if (skills.trim().length < 3) {
      toast.error("List your current skills");
      return;
    }
    void run({ role, skills, industry: industry || undefined });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role">Target role</Label>
              <Input
                id="role"
                placeholder="e.g. Data Scientist"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry (optional)</Label>
              <Input
                id="industry"
                placeholder="e.g. Healthcare"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Your current skills</Label>
            <Textarea
              id="skills"
              rows={3}
              placeholder="e.g. Python, SQL, Excel, Tableau, statistics, stakeholder communication…"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </div>

          <Button variant="gradient" size="lg" onClick={analyze} loading={loading}>
            {!loading && <BarChart3 />}
            {loading ? "Analyzing the market…" : "Analyze my skills"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Market demand for your skills</CardTitle>
                <CardDescription>Demand score per skill (0–100)</CardDescription>
              </CardHeader>
              <CardContent>
                <SkillBarChart
                  label="Market demand"
                  data={result.currentSkillsAssessment
                    .slice(0, 8)
                    .map((s) => ({ name: s.skill, value: s.marketDemand }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Missing skills</CardTitle>
                <CardDescription>Importance for your target role (0–100)</CardDescription>
              </CardHeader>
              <CardContent>
                <SkillBarChart
                  label="Importance"
                  data={result.missingSkills
                    .slice(0, 8)
                    .map((s) => ({ name: s.skill, value: s.importance }))}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Trending in your field
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {result.trendingSkills.map((skill) => (
                <div key={skill.skill} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{skill.skill}</span>
                    <Badge variant="success">{skill.trendScore}</Badge>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{skill.note}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>ATS keywords to add</CardTitle>
                <CardDescription className="mt-1">
                  Exact terms recruiters and ATS systems search for
                </CardDescription>
              </div>
              <CopyButton text={result.atsKeywords.join(", ")} />
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {result.atsKeywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="px-3 py-1">
                  {keyword}
                </Badge>
              ))}
            </CardContent>
          </Card>

          {result.missingSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Why these skills matter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.missingSkills.map((skill) => (
                  <div key={skill.skill} className="rounded-xl border p-4">
                    <div className="font-medium">{skill.skill}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{skill.reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
