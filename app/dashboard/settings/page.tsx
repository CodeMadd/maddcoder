import Link from "next/link";
import { getCurrentUserRecord } from "@/lib/session";
import { getUsageSummary } from "@/lib/usage";
import { planLabel } from "@/lib/plans";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SettingsForm } from "@/components/dashboard/settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getCurrentUserRecord();
  if (!user) return null;
  const usage = await getUsageSummary(user.id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" description="Manage your account and plan." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm initialName={user.name ?? ""} email={user.email} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Plan &amp; billing</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Current plan</span>
            <Badge variant="default">{planLabel(usage.plan)}</Badge>
          </div>
          <Link href="/pricing" className={buttonVariants({ variant: "outline" })}>
            Manage plan
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
