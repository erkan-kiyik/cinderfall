import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/utils";

/** Opens the Stripe billing portal (cancel, update payment method, invoices). */
export async function POST() {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimit(`portal:${user.id}`, 5);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found. Subscribe first." },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: absoluteUrl("/dashboard/billing"),
    });

    return NextResponse.json({ data: { url: session.url } });
  } catch (error) {
    console.error("[stripe:portal]", error);
    return NextResponse.json(
      { error: "Could not open the billing portal. Please try again." },
      { status: 500 }
    );
  }
}
