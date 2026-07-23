import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { AboutClient } from "@/components/features/about-client";

export const metadata: Metadata = { title: "About Generator" };

export default function AboutPage() {
  return (
    <div>
      <PageHeader
        title="About Generator"
        description="Story-driven About sections that stop the scroll — generated in your tone, grounded in your real experience."
      />
      <AboutClient />
    </div>
  );
}
