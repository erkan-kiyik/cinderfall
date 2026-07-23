import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { getStripe, getProPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/utils";

export async function POST() {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimit(`checkout:${user.id}`, 5);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (user.plan === "PRO") {
      return NextResponse.json(
        { error: "You are already on the Pro plan." },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Reuse the Stripe customer if one exists
    let subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    let customerId = subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      subscription = await prisma.subscription.upsert({
        where: { userId: user.id },
        create: { userId: user.id, stripeCustomerId: customerId },
        update: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: getProPriceId(), quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { userId: user.id },
      },
      metadata: { userId: user.id },
      success_url: absoluteUrl("/dashboard/billing?success=true"),
      cancel_url: absoluteUrl("/dashboard/billing?canceled=true"),
    });

    return NextResponse.json({ data: { url: session.url } });
  } catch (error) {
    console.error("[stripe:checkout]", error);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
