import { Plan, SubscriptionStatus } from "@prisma/client";
import { requireApiUser, handle, parseBody, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { checkoutSchema } from "@/lib/validation/billing";

export const runtime = "nodejs";

/**
 * Dummy checkout. In a real app this would create a Stripe Checkout Session or
 * PaymentIntent and confirm via webhook. Here we simply activate the selected
 * plan. IMPORTANT: no card details are accepted or stored server-side.
 */
export const POST = handle(async (req) => {
  const userId = await requireApiUser();
  const { plan } = await parseBody(req, checkoutSchema);

  const renewalDate =
    plan === Plan.FREE
      ? null
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const subscription = await prisma.subscription.upsert({
    where: { userId },
    update: { plan, status: SubscriptionStatus.ACTIVE, renewalDate },
    create: {
      userId,
      plan,
      status: SubscriptionStatus.ACTIVE,
      renewalDate,
    },
    select: { plan: true, status: true, renewalDate: true },
  });

  return ok({ subscription });
});
