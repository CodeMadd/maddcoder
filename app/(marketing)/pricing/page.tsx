import type { Metadata } from "next";
import Link from "next/link";
import { Check, CreditCard } from "lucide-react";
import { PRICING } from "@/lib/plans";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for CareerAI. Start free, upgrade to Pro or Business anytime.",
};

export default async function PricingPage() {
  const user = await getSessionUser();

  function ctaHref(planId: string) {
    if (planId === "FREE") return user ? "/dashboard" : "/register";
    const target = `/dashboard/billing/checkout?plan=${planId}`;
    return user ? target : `/register?next=${encodeURIComponent(target)}`;
  }

  return (
    <div className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-muted-foreground">
          Start for free. Upgrade when you need more power. Cancel anytime.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-5xl gap-8 lg:grid-cols-3">
        {PRICING.map((tier) => (
          <div
            key={tier.id}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-card p-8 shadow-sm",
              tier.highlighted && "border-primary shadow-lg ring-1 ring-primary",
            )}
          >
            {tier.highlighted && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="default">
                Most popular
              </Badge>
            )}
            <h2 className="text-lg font-semibold">{tier.name}</h2>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold">{tier.price}</span>
              <span className="text-muted-foreground">{tier.period}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {tier.description}
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={ctaHref(tier.id)}
              className={cn(
                "mt-8",
                buttonVariants({
                  variant: tier.highlighted ? "gradient" : "outline",
                }),
              )}
            >
              {tier.id === "FREE" ? (
                tier.cta
              ) : (
                <>
                  <CreditCard className="size-4" /> Choose payment method
                </>
              )}
            </Link>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-10 max-w-xl text-center text-xs text-muted-foreground">
        Payments use a placeholder integration in this demo — no real charge is
        made and card details are never stored. The architecture is ready for
        Stripe or another provider to be added later.
      </p>
    </div>
  );
}
