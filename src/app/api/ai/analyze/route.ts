import { z } from "zod";
import { createAiRoute } from "@/lib/ai/handler";
import { generateJSON } from "@/lib/ai/openrouter";
import { PROFILE_ANALYZER_SYSTEM, profileAnalyzerUser } from "@/lib/ai/prompts";
import { profileAnalysisSchema, type ProfileAnalysis } from "@/lib/ai/schemas";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/utils";

const inputSchema = z.object({
  profileText: z.string().min(100, "Please provide at least 100 characters of profile content").max(30000),
  targetRole: z.string().max(200).optional(),
});

export const POST = createAiRoute({
  route: "analyze",
  inputSchema,
  metric: "analysis",
  handler: async (input, user) => {
    const profileText = sanitizeText(input.profileText, 30000);

    const raw = await generateJSON<ProfileAnalysis>({
      system: PROFILE_ANALYZER_SYSTEM,
      user: profileAnalyzerUser(profileText, input.targetRole),
      temperature: 0.4,
      priority: user.plan === "PRO",
    });
    const result = profileAnalysisSchema.parse(raw);

    await prisma.$transaction([
      prisma.analysis.create({
        data: {
          userId: user.id,
          type: "PROFILE",
          overallScore: result.overallScore,
          scores: result.scores,
          result: result as object,
          inputSummary: profileText.slice(0, 200),
        },
      }),
      prisma.profile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, rawText: profileText, lastScore: result.overallScore },
        update: { rawText: profileText, lastScore: result.overallScore },
      }),
      prisma.history.create({
        data: {
          userId: user.id,
          action: "PROFILE_ANALYSIS",
          title: `Profile analyzed — scored ${result.overallScore}/100`,
          meta: { overallScore: result.overallScore },
        },
      }),
    ]);

    return result;
  },
});
