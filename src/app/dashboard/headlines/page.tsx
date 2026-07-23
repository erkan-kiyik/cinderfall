import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { HeadlinesClient } from "@/components/features/headlines-client";

export const metadata: Metadata = { title: "Headline Generator" };

export default function HeadlinesPage() {
  return (
    <div>
      <PageHeader
        title="Headline Generator"
        description="Generate 10 recruiter-optimized headlines in your style — keyword-stacked, value-led, or achievement-first."
      />
      <HeadlinesClient />
    </div>
  );
}
