import { z } from "zod";
import { createAiRoute } from "@/lib/ai/handler";
import { generateJSON } from "@/lib/ai/openrouter";
import { HEADLINE_SYSTEM, headlineUser } from "@/lib/ai/prompts";
import { headlinesSchema, HEADLINE_STYLES, type HeadlinesResult } from "@/lib/ai/schemas";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/utils";

const inputSchema = z.object({
  style: z.enum(HEADLINE_STYLES),
  role: z.string().min(2).max(200),
  background: z.string().max(3000).optional(),
  keywords: z.string().max(500).optional(),
});

export const POST = createAiRoute({
  route: "headlines",
  inputSchema,
  metric: "generation",
  handler: async (input, user) => {
    const raw = await generateJSON<HeadlinesResult>({
      system: HEADLINE_SYSTEM,
      user: headlineUser({
        style: input.style,
        role: sanitizeText(input.role, 200),
        background: input.background ? sanitizeText(input.background, 3000) : undefined,
        keywords: input.keywords ? sanitizeText(input.keywords, 500) : undefined,
      }),
      temperature: 0.8,
      priority: user.plan === "PRO",
    });
    const result = headlinesSchema.parse(raw);

    await prisma.history.create({
      data: {
        userId: user.id,
        action: "HEADLINE_GENERATION",
        title: `Generated ${result.headlines.length} ${input.style} headlines`,
        meta: { style: input.style, role: input.role },
      },
    });

    return result;
  },
});
