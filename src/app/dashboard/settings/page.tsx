import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsClient } from "@/components/features/settings-client";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await prisma.setting.findUnique({ where: { userId: user.id } });

  return (
    <div>
      <PageHeader title="Settings" description="Your profile, preferences, and account." />
      <SettingsClient
        email={user.email}
        initial={{
          name: user.name ?? "",
          targetRole: settings?.targetRole ?? "",
          industry: settings?.industry ?? "",
          language: (settings?.language ?? "en") as
            | "en"
            | "es"
            | "de"
            | "fr"
            | "pt"
            | "tr"
            | "hi",
          emailReports: settings?.emailReports ?? true,
          marketingEmails: settings?.marketingEmails ?? false,
        }}
      />
    </div>
  );
}
