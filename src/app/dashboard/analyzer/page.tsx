import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { AnalyzerClient } from "@/components/features/analyzer-client";

export const metadata: Metadata = { title: "Profile Analyzer" };

export default function AnalyzerPage() {
  return (
    <div>
      <PageHeader
        title="Profile Analyzer"
        description="Upload your LinkedIn PDF export or paste your profile text. Get scored the way recruiters and ATS systems see you."
      />
      <AnalyzerClient />
    </div>
  );
}
