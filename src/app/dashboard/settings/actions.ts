"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  name: z.string().trim().min(1).max(80),
  targetRole: z.string().trim().max(120).optional().or(z.literal("")),
  industry: z.string().trim().max(120).optional().or(z.literal("")),
  language: z.enum(["en", "es", "de", "fr", "pt", "tr", "hi"]),
  emailReports: z.boolean(),
  marketingEmails: z.boolean(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export async function updateSettings(
  input: SettingsInput
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input" };
  }
  const data = parsed.data;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { name: data.name },
    }),
    prisma.setting.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        targetRole: data.targetRole || null,
        industry: data.industry || null,
        language: data.language,
        emailReports: data.emailReports,
        marketingEmails: data.marketingEmails,
      },
      update: {
        targetRole: data.targetRole || null,
        industry: data.industry || null,
        language: data.language,
        emailReports: data.emailReports,
        marketingEmails: data.marketingEmails,
      },
    }),
  ]);

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function deleteAccountData(): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  // Cascading deletes remove profile, analyses, posts, usage, payments,
  // settings, and history along with the user row.
  await prisma.user.delete({ where: { id: user.id } });

  return { ok: true };
}
