import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PLAN_LIMITS } from "@/lib/plans";
import { PageHeader } from "@/components/dashboard/page-header";
import { CoachClient } from "@/components/features/coach-client";
import { ProGate } from "@/components/features/pro-gate";

export const metadata: Metadata = { title: "Career Coach" };

export default async function CoachPage() {
  const user = await requireUser();
  const hasAccess = PLAN_LIMITS[user.plan].careerCoach;

  return (
    <div>
      <PageHeader
        title="AI Career Coach"
        description="Interview prep, salary negotiation, career roadmaps, networking — ask anything."
      />
      {hasAccess ? (
        <CoachClient userName={user.name} />
      ) : (
        <ProGate
          feature="AI Career Coach"
          description="Get personalized coaching on interviews, salary negotiation, career pivots, resumes, and networking — with scripts you can copy."
        />
      )}
    </div>
  );
}
