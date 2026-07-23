import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { checkUsage, incrementUsage } from "@/lib/usage";
import type { UsageMetric } from "@/lib/plans";
import type { User } from "@prisma/client";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public extra?: Record<string, unknown>
  ) {
    super(message);
  }
}

interface AiRouteOptions<Input> {
  /** Route identifier used for burst rate limiting */
  route: string;
  /** Zod schema validating the request body */
  inputSchema: z.ZodType<Input>;
  /** Daily usage metric to check and increment (null = no daily limit) */
  metric: UsageMetric | null;
  /** Requests per minute burst limit */
  burstLimit?: number;
  handler: (input: Input, user: User) => Promise<unknown>;
}

/**
 * Shared wrapper for all AI API routes: authentication → burst rate limit →
 * input validation → daily plan limit → handler → usage increment.
 */
export function createAiRoute<Input>(opts: AiRouteOptions<Input>) {
  return async function POST(request: Request): Promise<NextResponse> {
    try {
      const user = await getApiUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const rl = rateLimit(`${opts.route}:${user.id}`, opts.burstLimit ?? 10);
      if (!rl.success) {
        return NextResponse.json(
          { error: "Too many requests. Please slow down." },
          { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
        );
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }

      const parsed = opts.inputSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      if (opts.metric) {
        const usage = await checkUsage(user.id, user.plan, opts.metric);
        if (!usage.allowed) {
          return NextResponse.json(
            {
              error:
                usage.limit === 0
                  ? "This feature requires the Pro plan."
                  : `Daily limit reached (${usage.limit}/day on the Free plan). Upgrade to Pro for unlimited access.`,
              code: "LIMIT_REACHED",
              usage,
            },
            { status: 402 }
          );
        }
      }

      const result = await opts.handler(parsed.data, user);

      if (opts.metric) {
        await incrementUsage(user.id, opts.metric);
      }

      return NextResponse.json({ data: result });
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message, ...error.extra },
          { status: error.status }
        );
      }
      console.error(`[${opts.route}]`, error);
      return NextResponse.json(
        { error: "Something went wrong generating your result. Please try again." },
        { status: 500 }
      );
    }
  };
}
