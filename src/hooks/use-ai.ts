"use client";

import * as React from "react";
import { toast } from "sonner";

interface UseAiOptions {
  endpoint: string;
}

interface AiError {
  error: string;
  code?: "LIMIT_REACHED" | "PRO_REQUIRED";
}

/**
 * Client hook for calling AI API routes: handles loading state, error toasts,
 * and upgrade prompts when plan limits are hit.
 */
export function useAi<Input extends object, Result>({ endpoint }: UseAiOptions) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<Result | null>(null);
  const [limitHit, setLimitHit] = React.useState(false);

  const run = React.useCallback(
    async (input: Input): Promise<Result | null> => {
      setLoading(true);
      setLimitHit(false);
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({ error: "Request failed" }))) as AiError;
          if (res.status === 402) {
            setLimitHit(true);
            toast.error(body.error, {
              action: {
                label: "Upgrade",
                onClick: () => (window.location.href = "/dashboard/billing"),
              },
            });
          } else {
            toast.error(body.error ?? "Something went wrong");
          }
          return null;
        }

        const { data } = (await res.json()) as { data: Result };
        setResult(data);
        return data;
      } catch {
        toast.error("Network error — please try again");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  return { run, loading, result, setResult, limitHit };
}
