"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Check, CreditCard, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PLAN_FEATURES, PLAN_LIMITS, PRO_PRICE_MONTHLY, type PlanId } from "@/lib/plans";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BillingClientProps {
  plan: PlanId;
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    hasStripeSubscription: boolean;
  } | null;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
  todayUsage: Record<string, number>;
}

export function BillingClient({ plan, subscription, payments, todayUsage }: BillingClientProps) {
  const [loading, setLoading] = React.useState<"checkout" | "portal" | null>(null);
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Welcome to Pro! 🎉 Your subscription is active.");
    } else if (searchParams.get("canceled") === "true") {
      toast.info("Checkout canceled — you're still on your current plan.");
    }
  }, [searchParams]);

  const startCheckout = async () => {
    setLoading("checkout");
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? "Could not start checkout");
        return;
      }
      window.location.href = body.data.url;
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setLoading(null);
    }
  };

  const openPortal = async () => {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? "Could not open the billing portal");
        return;
      }
      window.location.href = body.data.url;
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setLoading(null);
    }
  };

  const isPro = plan === "PRO";
  const limits = PLAN_LIMITS[plan];

  const usageItems = [
    { label: "Analyses", used: todayUsage.analysis ?? 0, limit: limits.analysesPerDay },
    { label: "AI posts", used: todayUsage.post ?? 0, limit: limits.postsPerDay },
    { label: "Generations", used: todayUsage.generation ?? 0, limit: limits.generationsPerDay },
    { label: "Coach messages", used: todayUsage.coach ?? 0, limit: limits.coachMessagesPerDay },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {/* Current plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current plan
                  <Badge variant={isPro ? "gradient" : "secondary"}>{plan}</Badge>
                </CardTitle>
                <CardDescription className="mt-1.5">
                  {isPro ? (
                    subscription?.cancelAtPeriodEnd ? (
                      <>
                        Cancels on{" "}
                        {subscription.currentPeriodEnd
                          ? formatDate(subscription.currentPeriodEnd)
                          : "period end"}{" "}
                        — you keep Pro until then.
                      </>
                    ) : (
                      <>
                        Renews{" "}
                        {subscription?.currentPeriodEnd
                          ? formatDate(subscription.currentPeriodEnd)
                          : "monthly"}{" "}
                        at {formatCurrency(PRO_PRICE_MONTHLY * 100)}/month.
                      </>
                    )
                  ) : (
                    "Free forever. Upgrade for unlimited AI power."
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {PLAN_FEATURES[plan].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              {isPro ? (
                <Button
                  variant="outline"
                  onClick={openPortal}
                  loading={loading === "portal"}
                >
                  {loading !== "portal" && <ExternalLink />}
                  Manage subscription
                </Button>
              ) : (
                <>
                  <Button
                    variant="gradient"
                    onClick={startCheckout}
                    loading={loading === "checkout"}
                  >
                    {loading !== "checkout" && <Sparkles />}
                    Upgrade to Pro — {formatCurrency(PRO_PRICE_MONTHLY * 100)}/mo
                  </Button>
                  {subscription?.hasStripeSubscription && (
                    <Button variant="ghost" onClick={openPortal} loading={loading === "portal"}>
                      Billing history
                    </Button>
                  )}
                </>
              )}
            </div>
            {isPro && (
              <p className="mt-3 text-xs text-muted-foreground">
                Cancel, change payment method, or download invoices from the portal.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              Payment history
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length ? (
              <div className="divide-y">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-sm font-medium">
                        {formatCurrency(payment.amount, payment.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(payment.createdAt)}
                      </div>
                    </div>
                    <Badge variant={payment.status === "paid" ? "success" : "warning"}>
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-sm text-muted-foreground">No payments yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Today&apos;s usage</CardTitle>
          <CardDescription>
            {isPro ? "Everything is unlimited on Pro ✨" : "Resets daily at midnight UTC"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {usageItems.map((item) => {
            const unlimited = item.limit === Infinity;
            const blocked = item.limit === 0;
            const pct = unlimited || blocked ? 0 : Math.min(100, (item.used / item.limit) * 100);
            return (
              <div key={item.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {blocked ? "Pro only" : unlimited ? `${item.used} / ∞` : `${item.used} / ${item.limit}`}
                  </span>
                </div>
                {!unlimited && !blocked && <Progress value={pct} />}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
