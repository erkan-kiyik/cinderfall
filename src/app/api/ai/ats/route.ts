import { z } from "zod";
import { createAiRoute, ApiError } from "@/lib/ai/handler";
import { generateJSON } from "@/lib/ai/openrouter";
import { ATS_SYSTEM, atsUser } from "@/lib/ai/prompts";
import { atsCheckSchema, type AtsCheckResult } from "@/lib/ai/schemas";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/utils";
import { PLAN_LIMITS } from "@/lib/plans";

const inputSchema = z.object({
  resume: z.string().min(100, "Please provide your full resume text").max(30000),
  jobDescription: z.string().min(50, "Paste the job description").max(20000),
});

export const POST = createAiRoute({
  route: "ats",
  inputSchema,
  metric: "analysis",
  handler: async (input, user) => {
    if (!PLAN_LIMITS[user.plan].atsChecker) {
      throw new ApiError(402, "The ATS Checker requires the Pro plan.", {
        code: "PRO_REQUIRED",
      });
    }

    const raw = await generateJSON<AtsCheckResult>({
      system: ATS_SYSTEM,
      user: atsUser({
        resume: sanitizeText(input.resume, 30000),
        jobDescription: sanitizeText(input.jobDescription, 20000),
      }),
      temperature: 0.3,
      priority: true,
    });
    const result = atsCheckSchema.parse(raw);

    await prisma.$transaction([
      prisma.analysis.create({
        data: {
          userId: user.id,
          type: "ATS",
          overallScore: result.matchPercentage,
          result: result as object,
          inputSummary: input.jobDescription.slice(0, 200),
        },
      }),
      prisma.history.create({
        data: {
          userId: user.id,
          action: "ATS_CHECK",
          title: `ATS check — ${result.matchPercentage}% match`,
          meta: { matchPercentage: result.matchPercentage },
        },
      }),
    ]);

    return result;
  },
});
