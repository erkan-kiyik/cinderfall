import { z } from "zod";
import { createAiRoute } from "@/lib/ai/handler";
import { generateJSON } from "@/lib/ai/openrouter";
import { ABOUT_SYSTEM, aboutUser } from "@/lib/ai/prompts";
import { aboutSchema, ABOUT_TONES, type AboutResult } from "@/lib/ai/schemas";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/utils";

const inputSchema = z.object({
  tone: z.enum(ABOUT_TONES),
  role: z.string().min(2).max(200),
  background: z.string().min(30, "Tell us a bit more about your background").max(5000),
  goals: z.string().max(1000).optional(),
});

export const POST = createAiRoute({
  route: "about",
  inputSchema,
  metric: "generation",
  handler: async (input, user) => {
    const raw = await generateJSON<AboutResult>({
      system: ABOUT_SYSTEM,
      user: aboutUser({
        tone: input.tone,
        role: sanitizeText(input.role, 200),
        background: sanitizeText(input.background, 5000),
        goals: input.goals ? sanitizeText(input.goals, 1000) : undefined,
      }),
      temperature: 0.8,
      priority: user.plan === "PRO",
    });
    const result = aboutSchema.parse(raw);

    await prisma.history.create({
      data: {
        userId: user.id,
        action: "ABOUT_GENERATION",
        title: `Generated ${result.variants.length} About variants (${input.tone})`,
        meta: { tone: input.tone },
      },
    });

    return result;
  },
});
