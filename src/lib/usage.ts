import { prisma } from "@/lib/prisma";
import { metricLimit, type PlanId, type UsageMetric } from "@/lib/plans";

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export interface UsageCheck {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}

export async function checkUsage(
  userId: string,
  plan: PlanId,
  metric: UsageMetric
): Promise<UsageCheck> {
  const limit = metricLimit(plan, metric);
  if (limit === Infinity) {
    return { allowed: true, used: 0, limit: Infinity, remaining: Infinity };
  }
  if (limit <= 0) {
    return { allowed: false, used: 0, limit: 0, remaining: 0 };
  }
  const row = await prisma.usage.findUnique({
    where: {
      userId_date_metric: { userId, date: todayUtc(), metric },
    },
  });
  const used = row?.count ?? 0;
  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

export async function incrementUsage(userId: string, metric: UsageMetric): Promise<void> {
  const date = todayUtc();
  await prisma.usage.upsert({
    where: { userId_date_metric: { userId, date, metric } },
    create: { userId, date, metric, count: 1 },
    update: { count: { increment: 1 } },
  });
}

export async function getTodayUsage(userId: string) {
  const rows = await prisma.usage.findMany({
    where: { userId, date: todayUtc() },
  });
  const byMetric: Record<string, number> = {};
  for (const row of rows) byMetric[row.metric] = row.count;
  return byMetric;
}
