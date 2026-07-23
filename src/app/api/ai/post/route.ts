import { z } from "zod";
import { createAiRoute } from "@/lib/ai/handler";
import { generateJSON } from "@/lib/ai/openrouter";
import { POST_SYSTEM, postUser } from "@/lib/ai/prompts";
import { postSchema, type PostResult } from "@/lib/ai/schemas";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/utils";

const inputSchema = z.object({
  topic: z.string().min(5, "Describe your topic in a few words").max(1000),
  audience: z.string().max(300).optional(),
  goal: z.string().max(300).optional(),
});

export const POST = createAiRoute({
  route: "post",
  inputSchema,
  metric: "post",
  handler: async (input, user) => {
    const topic = sanitizeText(input.topic, 1000);

    const raw = await generateJSON<PostResult>({
      system: POST_SYSTEM,
      user: postUser({
        topic,
        audience: input.audience ? sanitizeText(input.audience, 300) : undefined,
        goal: input.goal ? sanitizeText(input.goal, 300) : undefined,
      }),
      temperature: 0.9,
      priority: user.plan === "PRO",
    });
    const result = postSchema.parse(raw);

    await prisma.$transaction([
      prisma.post.create({
        data: {
          userId: user.id,
          topic,
          content: result as object,
          engagementScore: result.engagementScore,
        },
      }),
      prisma.history.create({
        data: {
          userId: user.id,
          action: "POST_GENERATION",
          title: `Post generated: “${topic.slice(0, 60)}”`,
          meta: { engagementScore: result.engagementScore },
        },
      }),
    ]);

    return result;
  },
});
