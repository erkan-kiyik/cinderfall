import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { SkillsClient } from "@/components/features/skills-client";

export const metadata: Metadata = { title: "Skills Analyzer" };

export default function SkillsPage() {
  return (
    <div>
      <PageHeader
        title="Skills Analyzer"
        description="See how your skills stack up against the market — what's missing, what's trending, and the ATS keywords to add."
      />
      <SkillsClient />
    </div>
  );
}
