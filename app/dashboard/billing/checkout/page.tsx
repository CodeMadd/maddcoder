import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { PRICING } from "@/lib/plans";
import { PageHeader } from "@/components/dashboard/page-header";
import { CheckoutForm } from "@/components/billing/checkout-form";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  await requireUser();
  const planId = (searchParams.plan ?? "PRO").toUpperCase();
  const tier =
    PRICING.find((p) => p.id === planId) ??
    PRICING.find((p) => p.id === "PRO")!;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/pricing"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to plans
      </Link>
      <PageHeader
        title={`Upgrade to ${tier.name}`}
        description="Complete your purchase to unlock your new plan."
      />
      <CheckoutForm
        plan={tier.id}
        planName={tier.name}
        price={tier.price}
        period={tier.period}
        features={tier.features}
      />
    </div>
  );
}
