import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  KeyRound,
  MessageSquareText,
  ScanSearch,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayUsage } from "@/lib/usage";
import { PLAN_LIMITS } from "@/lib/plans";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ScoreTrendChart,
  ActivityChart,
  type ActivityPoint,
  type ScorePoint,
} from "@/components/dashboard/charts";

export const metadata: Metadata = { title: "Dashboard" };

function shortDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function DashboardPage() {
  const user = await requireUser();

  const since = new Date();
  since.setDate(since.getDate() - 14);

  const [profileAnalyses, usageRows, recentPosts, recentHistory] = await Promise.all([
    prisma.analysis.findMany({
      where: { userId: user.id, type: "PROFILE" },
      orderBy: { createdAt: "asc" },
      take: 20,
      select: { createdAt: true, overallScore: true, scores: true },
    }),
    prisma.usage.findMany({
      where: { userId: user.id, date: { gte: since } },
      orderBy: { date: "asc" },
    }),
    prisma.post.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, topic: true, engagementScore: true, createdAt: true },
    }),
    prisma.history.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  // ── Stat tiles ────────────────────────────────────────────────────
  const latest = profileAnalyses.at(-1);
  const previous = profileAnalyses.at(-2);
  const latestScores = (latest?.scores ?? null) as Record<string, number> | null;

  const currentScore = latest?.overallScore ?? null;
  const scoreDelta =
    latest?.overallScore != null && previous?.overallScore != null
      ? latest.overallScore - previous.overallScore
      : null;

  const recruiterVisibility = latestScores?.recruiterScore ?? null;
  const keywordScore = latestScores?.keywordOptimization ?? null;
  const avgEngagement = recentPosts.length
    ? Math.round(
        recentPosts.reduce((sum, p) => sum + (p.engagementScore ?? 0), 0) / recentPosts.length
      )
    : null;

  // ── Score trend ───────────────────────────────────────────────────
  const trendData: ScorePoint[] = profileAnalyses
    .filter((a) => a.overallScore != null)
    .map((a) => ({ date: shortDate(a.createdAt), score: a.overallScore! }));

  // ── Activity (last 14 days, stacked by metric) ────────────────────
  const activityByDay = new Map<string, ActivityPoint>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = shortDate(d);
    activityByDay.set(key, { date: key, analyses: 0, generations: 0, posts: 0, coach: 0 });
  }
  for (const row of usageRows) {
    const key = shortDate(row.date);
    const point = activityByDay.get(key);
    if (!point) continue;
    if (row.metric === "analysis") point.analyses += row.count;
    else if (row.metric === "generation") point.generations += row.count;
    else if (row.metric === "post") point.posts += row.count;
    else if (row.metric === "coach") point.coach += row.count;
  }
  const activityData = Array.from(activityByDay.values());
  const hasActivity = activityData.some(
    (p) => p.analyses + p.generations + p.posts + p.coach > 0
  );

  // ── Usage limits ──────────────────────────────────────────────────
  const todayUsage = await getTodayUsage(user.id);
  const limits = PLAN_LIMITS[user.plan];

  const usageItems = [
    { label: "Analyses today", used: todayUsage.analysis ?? 0, limit: limits.analysesPerDay },
    { label: "Posts today", used: todayUsage.post ?? 0, limit: limits.postsPerDay },
    { label: "Generations today", used: todayUsage.generation ?? 0, limit: limits.generationsPerDay },
  ];

  const firstName = user.name?.split(" ")[0];

  const statTiles = [
    {
      label: "Profile score",
      icon: ScanSearch,
      value: currentScore != null ? `${currentScore}` : "—",
      sub:
        scoreDelta != null ? (
          <span
            className={`inline-flex items-center gap-1 ${
              scoreDelta >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {scoreDelta >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {scoreDelta >= 0 ? "+" : ""}
            {scoreDelta} vs last analysis
          </span>
        ) : (
          "Run an analysis to start tracking"
        ),
    },
    {
      label: "Recruiter visibility",
      icon: Eye,
      value: recruiterVisibility != null ? `${recruiterVisibility}` : "—",
      sub: "How likely recruiters shortlist you",
    },
    {
      label: "Keyword optimization",
      icon: KeyRound,
      value: keywordScore != null ? `${keywordScore}` : "—",
      sub: "Search keywords covered",
    },
    {
      label: "Content performance",
      icon: MessageSquareText,
      value: avgEngagement != null ? `${avgEngagement}` : "—",
      sub: "Avg. predicted engagement",
    },
  ];

  return (
    <div>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName} 👋` : "Welcome back 👋"}
        description="Your career growth at a glance."
      >
        <Button variant="gradient" asChild>
          <Link href="/dashboard/analyzer">
            Analyze profile <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </PageHeader>

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statTiles.map((tile) => (
          <Card key={tile.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{tile.label}</span>
                <tile.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 text-3xl font-bold">{tile.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{tile.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile score trend</CardTitle>
            <CardDescription>Overall score across your analyses</CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length >= 2 ? (
              <ScoreTrendChart data={trendData} />
            ) : (
              <EmptyChart
                message="Run at least two analyses to see your improvement trend."
                href="/dashboard/analyzer"
                cta="Analyze now"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI activity</CardTitle>
            <CardDescription>Your usage over the last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            {hasActivity ? (
              <ActivityChart data={activityData} />
            ) : (
              <EmptyChart
                message="Your AI activity will appear here once you start generating."
                href="/dashboard/headlines"
                cta="Generate headlines"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s usage</CardTitle>
            <CardDescription>
              {user.plan === "PRO" ? "Unlimited on Pro ✨" : "Free plan daily limits"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {usageItems.map((item) => {
              const unlimited = item.limit === Infinity;
              const pct = unlimited ? 0 : Math.min(100, (item.used / item.limit) * 100);
              return (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {item.used}
                      {unlimited ? "" : ` / ${item.limit}`}
                    </span>
                  </div>
                  {!unlimited && <Progress value={pct} />}
                </div>
              );
            })}
            {user.plan !== "PRO" && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/dashboard/billing">Remove limits</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Recent posts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent posts</CardTitle>
            <CardDescription>Predicted engagement scores</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPosts.length ? (
              <ul className="space-y-3">
                {recentPosts.map((post) => (
                  <li key={post.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm">{post.topic}</span>
                    <Badge
                      variant={
                        (post.engagementScore ?? 0) >= 75
                          ? "success"
                          : (post.engagementScore ?? 0) >= 50
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {post.engagementScore ?? "—"}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyChart
                message="No posts yet. Turn any topic into a scroll-stopper."
                href="/dashboard/posts"
                cta="Create a post"
              />
            )}
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Your latest AI actions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentHistory.length ? (
              <ul className="space-y-3">
                {recentHistory.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Your activity history will appear here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyChart({ message, href, cta }: { message: string; href: string; cta: string }) {
  return (
    <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-center">
      <p className="max-w-[240px] text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" asChild>
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}
