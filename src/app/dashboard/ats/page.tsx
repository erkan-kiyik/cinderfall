import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PLAN_LIMITS } from "@/lib/plans";
import { PageHeader } from "@/components/dashboard/page-header";
import { AtsClient } from "@/components/features/ats-client";
import { ProGate } from "@/components/features/pro-gate";

export const metadata: Metadata = { title: "ATS Score" };

export default async function AtsPage() {
  const user = await requireUser();
  const hasAccess = PLAN_LIMITS[user.plan].atsChecker;

  return (
    <div>
      <PageHeader
        title="ATS Score"
        description="Upload your resume and compare it against a job description — see your match %, missing keywords, and exactly what to fix."
      />
      {hasAccess ? (
        <AtsClient />
      ) : (
        <ProGate
          feature="ATS Checker"
          description="See how applicant tracking systems rank your resume against any job description, with a prioritized fix list."
        />
      )}
    </div>
  );
}
