import { z } from "zod";
import { createAiRoute } from "@/lib/ai/handler";
import { generateJSON } from "@/lib/ai/openrouter";
import { toolkitSystem, toolkitUser } from "@/lib/ai/prompts";
import { toolkitSchema, TOOLKIT_TOOLS, type ToolkitResult } from "@/lib/ai/schemas";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/utils";

const inputSchema = z.object({
  tool: z.enum(TOOLKIT_TOOLS),
  details: z.string().min(20, "Add a bit more context so the result is tailored to you").max(6000),
});

export const POST = createAiRoute({
  route: "toolkit",
  inputSchema,
  metric: "generation",
  handler: async (input, user) => {
    const raw = await generateJSON<ToolkitResult>({
      system: toolkitSystem(input.tool),
      user: toolkitUser({ details: sanitizeText(input.details, 6000) }),
      temperature: 0.8,
      priority: user.plan === "PRO",
    });
    const result = toolkitSchema.parse(raw);

    await prisma.history.create({
      data: {
        userId: user.id,
        action: "TOOLKIT_GENERATION",
        title: `${result.title}`,
        meta: { tool: input.tool },
      },
    });

    return result;
  },
});
