import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { SubscriptionStatus } from "@prisma/client";

export const maxDuration = 30;

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "unpaid":
      return "UNPAID";
    default:
      return "INCOMPLETE";
  }
}

async function resolveUserId(
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<string | null> {
  if (subscription.metadata?.userId) return subscription.metadata.userId;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const existing = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });
  if (existing) return existing.userId;

  const customer = await stripe.customers.retrieve(customerId);
  if (!customer.deleted && customer.metadata?.userId) {
    return customer.metadata.userId;
  }
  return null;
}

async function syncSubscription(stripe: Stripe, subscription: Stripe.Subscription) {
  const userId = await resolveUserId(stripe, subscription);
  if (!userId) {
    console.error("[stripe:webhook] Could not resolve userId for subscription", subscription.id);
    return;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const status = mapStatus(subscription.status);
  const isPro = status === "ACTIVE" || status === "TRIALING";
  const periodEnd = subscription.current_period_end;

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0]?.price.id,
        status,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      update: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0]?.price.id,
        status,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { plan: isPro ? "PRO" : "FREE" },
    }),
  ]);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe:webhook] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe:webhook] Signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id
          );
          await syncSubscription(stripe, subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(stripe, event.data.object);
        break;
      }

      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;
        if (!customerId || !invoice.id) break;

        const subscription = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        });
        if (!subscription) break;

        await prisma.payment.upsert({
          where: { stripeInvoiceId: invoice.id },
          create: {
            userId: subscription.userId,
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_paid || invoice.amount_due,
            currency: invoice.currency,
            status: invoice.status ?? "unknown",
          },
          update: { status: invoice.status ?? "unknown" },
        });
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[stripe:webhook] Error handling ${event.type}`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
