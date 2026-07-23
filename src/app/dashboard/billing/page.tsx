import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayUsage } from "@/lib/usage";
import { PageHeader } from "@/components/dashboard/page-header";
import { BillingClient } from "@/components/features/billing-client";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const user = await requireUser();

  const [subscription, payments, todayUsage] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: user.id } }),
    prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    getTodayUsage(user.id),
  ]);

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Manage your plan, payment method, and invoices."
      />
      <BillingClient
        plan={user.plan}
        subscription={
          subscription
            ? {
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                hasStripeSubscription: Boolean(subscription.stripeSubscriptionId),
              }
            : null
        }
        payments={payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
        }))}
        todayUsage={todayUsage}
      />
    </div>
  );
}
