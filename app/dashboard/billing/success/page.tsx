import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getUserPlan } from "@/lib/usage";
import { planLabel } from "@/lib/plans";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Payment successful" };

export default async function BillingSuccessPage() {
  const user = await requireUser();
  const plan = await getUserPlan(user.id);

  return (
    <div className="mx-auto max-w-lg py-10">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="size-9" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Payment successful</h1>
          <p className="text-muted-foreground">
            Your subscription is now active. Thanks for upgrading!
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current plan</span>
            <Badge variant="success">{planLabel(plan)}</Badge>
          </div>
          <div className="mt-2 flex gap-2">
            <Link href="/dashboard" className={buttonVariants({ variant: "gradient" })}>
              Go to dashboard
            </Link>
            <Link href="/dashboard/usage" className={buttonVariants({ variant: "outline" })}>
              View usage
            </Link>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            This was a demo payment — no charge was made.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
