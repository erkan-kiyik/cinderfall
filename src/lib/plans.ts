export type PlanId = "FREE" | "PRO";

export interface PlanLimits {
  /** Profile / ATS / skills analyses per day */
  analysesPerDay: number;
  /** AI post generations per day */
  postsPerDay: number;
  /** Generic generations (headlines, about, experience, toolkit) per day */
  generationsPerDay: number;
  /** Career coach messages per day */
  coachMessagesPerDay: number;
  atsChecker: boolean;
  careerCoach: boolean;
  priorityAI: boolean;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  FREE: {
    analysesPerDay: 3,
    postsPerDay: 3,
    generationsPerDay: 10,
    coachMessagesPerDay: 0,
    atsChecker: false,
    careerCoach: false,
    priorityAI: false,
  },
  PRO: {
    analysesPerDay: Infinity,
    postsPerDay: Infinity,
    generationsPerDay: Infinity,
    coachMessagesPerDay: Infinity,
    atsChecker: true,
    careerCoach: true,
    priorityAI: true,
  },
};

export const PRO_PRICE_MONTHLY = 12;

export const PLAN_FEATURES = {
  FREE: [
    "3 profile analyses per day",
    "3 AI posts per day",
    "Headline & About generator",
    "Experience optimizer",
    "Skills analyzer",
    "Basic score history",
  ],
  PRO: [
    "Unlimited analyses & posts",
    "Priority AI (fastest model queue)",
    "ATS Checker with job matching",
    "AI Career Coach",
    "Resume & cover letter optimizer",
    "Networking & referral toolkit",
    "Weekly content calendar",
    "Exportable PDF reports",
  ],
} as const;

export type UsageMetric = "analysis" | "post" | "generation" | "coach";

export function metricLimit(plan: PlanId, metric: UsageMetric): number {
  const limits = PLAN_LIMITS[plan];
  switch (metric) {
    case "analysis":
      return limits.analysesPerDay;
    case "post":
      return limits.postsPerDay;
    case "generation":
      return limits.generationsPerDay;
    case "coach":
      return limits.coachMessagesPerDay;
  }
}
