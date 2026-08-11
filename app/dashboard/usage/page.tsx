import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getUsageSummary } from "@/lib/usage";
import { planLabel, PLAN_LIMITS } from "@/lib/plans";
import { PageHeader } from "@/components/dashboard/page-header";
import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "AI Usage" };

export default async function UsagePage() {
  const user = await requireUser();
  const usage = await getUsageSummary(user.id);

  const rows = [
    { label: "Resumes", metric: usage.resumes, hint: "total" },
    { label: "Document summaries", metric: usage.documents, hint: "this month" },
    { label: "AI generations", metric: usage.aiGenerations, hint: "this month" },
  ];

  return (
    <>
      <PageHeader
        title="AI Usage"
        description="Track your plan limits and remaining credits."
        action={<Badge variant="default">{planLabel(usage.plan)} plan</Badge>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {rows.map((r) => {
          const unlimited = r.metric.limit < 0;
          const pct = unlimited
            ? 0
            : Math.min(100, (r.metric.used / Math.max(1, r.metric.limit)) * 100);
          return (
            <Card key={r.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  {r.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold">
                  {r.metric.used}
                  <span className="text-base font-normal text-muted-foreground">
                    {unlimited ? " used" : ` / ${r.metric.limit}`}
                  </span>
                </div>
                {!unlimited && <Progress value={pct} />}
                <p className="text-xs text-muted-foreground">
                  {unlimited
                    ? "Unlimited on your plan"
                    : `${r.metric.remaining} remaining ${r.hint}`}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Need more?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Pro unlocks {PLAN_LIMITS.PRO.aiGenerationsPerMonth} AI generations,{" "}
            {PLAN_LIMITS.PRO.documentsPerMonth} document summaries per month,
            unlimited resumes, ATS analysis, and job matching.
          </p>
          <Link
            href="/dashboard/billing/checkout?plan=PRO"
            className={buttonVariants({ variant: "gradient" })}
          >
            <CreditCard className="size-4" /> Upgrade plan
          </Link>
        </CardContent>
      </Card>
    </>
  );
}
