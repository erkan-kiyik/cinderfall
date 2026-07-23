import { z } from "zod";
import { createAiRoute } from "@/lib/ai/handler";
import { generateJSON } from "@/lib/ai/openrouter";
import { SKILLS_SYSTEM, skillsUser } from "@/lib/ai/prompts";
import { skillsSchema, type SkillsResult } from "@/lib/ai/schemas";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/utils";

const inputSchema = z.object({
  role: z.string().min(2).max(200),
  skills: z.string().min(3, "List at least one skill").max(3000),
  industry: z.string().max(200).optional(),
});

export const POST = createAiRoute({
  route: "skills",
  inputSchema,
  metric: "analysis",
  handler: async (input, user) => {
    const raw = await generateJSON<SkillsResult>({
      system: SKILLS_SYSTEM,
      user: skillsUser({
        role: sanitizeText(input.role, 200),
        skills: sanitizeText(input.skills, 3000),
        industry: input.industry ? sanitizeText(input.industry, 200) : undefined,
      }),
      temperature: 0.5,
      priority: user.plan === "PRO",
    });
    const result = skillsSchema.parse(raw);

    await prisma.$transaction([
      prisma.analysis.create({
        data: {
          userId: user.id,
          type: "SKILLS",
          result: result as object,
          inputSummary: input.skills.slice(0, 200),
        },
      }),
      prisma.history.create({
        data: {
          userId: user.id,
          action: "SKILLS_ANALYSIS",
          title: `Skills analyzed for ${input.role}`,
          meta: { role: input.role },
        },
      }),
    ]);

    return result;
  },
});
