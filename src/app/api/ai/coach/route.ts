import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { checkUsage, incrementUsage } from "@/lib/usage";
import { PLAN_LIMITS } from "@/lib/plans";
import { streamChat } from "@/lib/ai/openrouter";
import { COACH_SYSTEM } from "@/lib/ai/prompts";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/utils";

const inputSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      })
    )
    .min(1)
    .max(40),
});

export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!PLAN_LIMITS[user.plan].careerCoach) {
      return NextResponse.json(
        { error: "The AI Career Coach requires the Pro plan.", code: "PRO_REQUIRED" },
        { status: 402 }
      );
    }

    const rl = rateLimit(`coach:${user.id}`, 20);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const usage = await checkUsage(user.id, user.plan, "coach");
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Daily coach limit reached.", code: "LIMIT_REACHED" },
        { status: 402 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const messages = parsed.data.messages.map((m) => ({
      role: m.role,
      content: sanitizeText(m.content, 8000),
    }));

    const stream = await streamChat({ system: COACH_SYSTEM, messages });

    await incrementUsage(user.id, "coach");
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    await prisma.history.create({
      data: {
        userId: user.id,
        action: "COACH_MESSAGE",
        title: `Coach: “${(lastUserMessage?.content ?? "").slice(0, 60)}”`,
      },
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.text;
            if (delta) controller.enqueue(encoder.encode(delta));
          }
        } catch (err) {
          console.error("[coach:stream]", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[coach]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
