"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Clock, Image as ImageIcon, Layers, MessageSquareText, Zap } from "lucide-react";
import { useAi } from "@/hooks/use-ai";
import type { PostResult } from "@/lib/ai/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/shared/score-ring";
import { CopyButton } from "@/components/shared/copy-button";

export function PostsClient() {
  const [topic, setTopic] = React.useState("");
  const [audience, setAudience] = React.useState("");
  const [goal, setGoal] = React.useState("");

  const { run, loading, result } = useAi<
    { topic: string; audience?: string; goal?: string },
    PostResult
  >({ endpoint: "/api/ai/post" });

  const generate = () => {
    if (topic.trim().length < 5) {
      toast.error("Describe your topic in a few words");
      return;
    }
    void run({ topic, audience: audience || undefined, goal: goal || undefined });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="topic">What do you want to post about?</Label>
            <Textarea
              id="topic"
              rows={3}
              placeholder={'e.g. "I got accepted for an internship at a fintech startup"'}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="audience">Target audience (optional)</Label>
              <Input
                id="audience"
                placeholder="e.g. Tech recruiters and engineers"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Goal (optional)</Label>
              <Input
                id="goal"
                placeholder="e.g. Grow my network, showcase expertise"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>
          </div>

          <Button variant="gradient" size="lg" onClick={generate} loading={loading}>
            {!loading && <MessageSquareText />}
            {loading ? "Crafting your post…" : "Generate post"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* The post */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Your post</CardTitle>
                <CopyButton text={result.post.fullText} />
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-line rounded-2xl border bg-muted/30 p-5 text-sm leading-relaxed">
                  {result.post.fullText}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {result.post.hashtags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Engagement forecast
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3">
                  <ScoreRing score={result.engagementScore} size={110} label="Score" />
                  <p className="text-center text-xs leading-relaxed text-muted-foreground">
                    {result.engagementReason}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4 text-violet-500" />
                    Best time to post
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">
                    {result.bestPostingTime.day}, {result.bestPostingTime.time}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {result.bestPostingTime.reason}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-500" />
                  Carousel ideas
                </CardTitle>
                <CardDescription>Turn this topic into a swipeable carousel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.carouselIdeas.map((idea, i) => (
                  <div key={i} className="rounded-xl border p-4">
                    <div className="font-medium">{idea.title}</div>
                    <ol className="mt-2 list-decimal space-y-1 pl-5">
                      {idea.slides.map((slide, s) => (
                        <li key={s} className="text-sm text-muted-foreground">
                          {slide}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-fuchsia-500" />
                  Image ideas
                </CardTitle>
                <CardDescription>Visuals that boost this post&apos;s reach</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.imageIdeas.map((idea, i) => (
                    <li key={i} className="rounded-xl border p-4 text-sm text-muted-foreground">
                      {idea}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}
