import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToolkitClient } from "@/components/features/toolkit-client";

export const metadata: Metadata = { title: "Career Toolkit" };

export default function ToolkitPage() {
  return (
    <div>
      <PageHeader
        title="Career Toolkit"
        description="Cover letters, networking messages, referral requests, interview prep, content calendars, and career roadmaps — generated for your situation."
      />
      <ToolkitClient />
    </div>
  );
}
