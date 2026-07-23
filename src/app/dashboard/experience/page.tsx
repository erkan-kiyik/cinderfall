import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExperienceClient } from "@/components/features/experience-client";

export const metadata: Metadata = { title: "Experience Optimizer" };

export default function ExperiencePage() {
  return (
    <div>
      <PageHeader
        title="Experience Optimizer"
        description="Turn boring bullet points into measurable achievements using the STAR format."
      />
      <ExperienceClient />
    </div>
  );
}
