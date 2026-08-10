import Link from "next/link";
import {
  FileStack,
  Files,
  Sparkles,
  CreditCard,
  Plus,
  ArrowRight,
  FileText,
} from "lucide-react";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getUsageSummary } from "@/lib/usage";
import { planLabel } from "@/lib/plans";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default async function DashboardOverview() {
  const user = await requireUser();
  const [usage, recentResumes, recentDocuments] = await Promise.all([
    getUsageSummary(user.id),
    prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const aiRemaining =
    usage.aiGenerations.limit < 0
      ? "Unlimited"
      : usage.aiGenerations.remaining;

  return (
    <>
      <PageHeader
        title={`Welcome back${user.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Here's an overview of your CareerAI workspace."
        action={
          <Link
            href="/dashboard/resumes/new"
            className={buttonVariants({ variant: "gradient" })}
          >
            <Plus className="size-4" /> Create New Resume
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Resumes"
          value={usage.resumes.used}
          icon={FileStack}
          hint={
            usage.resumes.limit < 0
              ? "Unlimited"
              : `${usage.resumes.remaining} remaining`
          }
        />
        <StatCard
          label="Documents"
          value={usage.documents.used}
          icon={Files}
          hint="Summarized this month"
        />
        <StatCard
          label="AI Generations"
          value={usage.aiGenerations.used}
          icon={Sparkles}
          hint="This month"
        />
        <StatCard
          label="Plan"
          value={planLabel(usage.plan)}
          icon={CreditCard}
          hint={`${aiRemaining} AI credits left`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent resumes</CardTitle>
            <Link
              href="/dashboard/resumes"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentResumes.length === 0 ? (
              <EmptyRow
                icon={<FileStack className="size-5" />}
                text="No resumes yet."
                cta="Create your first resume"
                href="/dashboard/resumes/new"
              />
            ) : (
              <ul className="divide-y">
                {recentResumes.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/dashboard/resumes/${r.id}`}
                      className="flex items-center justify-between py-3 transition-colors hover:text-primary"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FileStack className="size-4" />
                        </span>
                        <div>
                          <div className="text-sm font-medium">{r.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Updated {formatDate(r.updatedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="muted" className="capitalize">
                          {r.template}
                        </Badge>
                        <ArrowRight className="size-4 text-muted-foreground" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI credits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <UsageBar
                label="AI generations"
                used={usage.aiGenerations.used}
                limit={usage.aiGenerations.limit}
              />
              <UsageBar
                label="Document summaries"
                used={usage.documents.used}
                limit={usage.documents.limit}
              />
              <Link
                href="/dashboard/usage"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Manage usage <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Recent documents</CardTitle>
              <Link
                href="/dashboard/documents"
                className="text-sm text-primary hover:underline"
              >
                All
              </Link>
            </CardHeader>
            <CardContent>
              {recentDocuments.length === 0 ? (
                <EmptyRow
                  icon={<FileText className="size-5" />}
                  text="No documents yet."
                  cta="Summarize a document"
                  href="/dashboard/documents/new"
                />
              ) : (
                <ul className="space-y-2">
                  {recentDocuments.map((d) => (
                    <li key={d.id}>
                      <Link
                        href={`/dashboard/documents/${d.id}`}
                        className="flex items-center gap-2 text-sm hover:text-primary"
                      >
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{d.filename}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function UsageBar({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const unlimited = limit < 0;
  const pct = unlimited ? 0 : Math.min(100, (used / Math.max(1, limit)) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {used}
          {unlimited ? "" : ` / ${limit}`}
        </span>
      </div>
      {!unlimited && <Progress value={pct} />}
    </div>
  );
}

function EmptyRow({
  icon,
  text,
  cta,
  href,
}: {
  icon: React.ReactNode;
  text: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link href={href} className="text-sm font-medium text-primary hover:underline">
        {cta}
      </Link>
    </div>
  );
}
