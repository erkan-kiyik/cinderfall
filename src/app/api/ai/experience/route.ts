import { z } from "zod";
import { createAiRoute } from "@/lib/ai/handler";
import { generateJSON } from "@/lib/ai/openrouter";
import { EXPERIENCE_SYSTEM, experienceUser } from "@/lib/ai/prompts";
import { experienceSchema, type ExperienceResult } from "@/lib/ai/schemas";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/utils";

const inputSchema = z.object({
  role: z.string().min(2).max(200),
  bullets: z.string().min(10, "Paste at least one bullet point").max(6000),
  context: z.string().max(500).optional(),
});

export const POST = createAiRoute({
  route: "experience",
  inputSchema,
  metric: "generation",
  handler: async (input, user) => {
    const raw = await generateJSON<ExperienceResult>({
      system: EXPERIENCE_SYSTEM,
      user: experienceUser({
        role: sanitizeText(input.role, 200),
        bullets: sanitizeText(input.bullets, 6000),
        context: input.context ? sanitizeText(input.context, 500) : undefined,
      }),
      temperature: 0.6,
      priority: user.plan === "PRO",
    });
    const result = experienceSchema.parse(raw);

    await prisma.history.create({
      data: {
        userId: user.id,
        action: "EXPERIENCE_OPTIMIZATION",
        title: `Optimized ${result.optimized.length} experience bullets`,
        meta: { role: input.role },
      },
    });

    return result;
  },
});
