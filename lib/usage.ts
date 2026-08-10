import { Plan } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { PLAN_LIMITS, type PlanLimits } from "@/lib/plans";

export const DOCUMENT_SUMMARY_FEATURE = "document_summary";

function monthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  return sub?.plan ?? Plan.FREE;
}

export type UsageMetric = {
  used: number;
  limit: number; // -1 = unlimited
  remaining: number; // Infinity-safe: -1 when unlimited
};

export type UsageSummary = {
  plan: Plan;
  limits: PlanLimits;
  resumes: UsageMetric;
  documents: UsageMetric;
  aiGenerations: UsageMetric;
};

function metric(used: number, limit: number): UsageMetric {
  return {
    used,
    limit,
    remaining: limit < 0 ? -1 : Math.max(0, limit - used),
  };
}

export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];
  const since = monthStart();

  const [resumeCount, docSummaries, aiGenerations] = await Promise.all([
    prisma.resume.count({ where: { userId } }),
    prisma.aIUsage.count({
      where: {
        userId,
        feature: DOCUMENT_SUMMARY_FEATURE,
        createdAt: { gte: since },
      },
    }),
    prisma.aIUsage.count({
      where: {
        userId,
        feature: { not: DOCUMENT_SUMMARY_FEATURE },
        createdAt: { gte: since },
      },
    }),
  ]);

  return {
    plan,
    limits,
    resumes: metric(resumeCount, limits.resumes),
    documents: metric(docSummaries, limits.documentsPerMonth),
    aiGenerations: metric(aiGenerations, limits.aiGenerationsPerMonth),
  };
}

export type LimitKind = "resume" | "document_summary" | "ai";

/**
 * Server-side enforcement. Throws ApiError(402) when a plan limit is reached.
 * Callers MUST invoke this before performing the limited action — clients can
 * never bypass it by calling the API directly.
 */
export async function checkUsageLimit(
  userId: string,
  kind: LimitKind,
): Promise<void> {
  const summary = await getUsageSummary(userId);
  const target =
    kind === "resume"
      ? summary.resumes
      : kind === "document_summary"
        ? summary.documents
        : summary.aiGenerations;

  if (target.limit >= 0 && target.used >= target.limit) {
    const label =
      kind === "resume"
        ? "resume"
        : kind === "document_summary"
          ? "monthly document summary"
          : "monthly AI generation";
    throw new ApiError(
      402,
      `You've reached your ${label} limit on the ${summary.plan} plan. Upgrade to continue.`,
    );
  }
}

export async function recordAIUsage(
  userId: string,
  feature: string,
  tokensUsed = 0,
): Promise<void> {
  await prisma.aIUsage.create({
    data: { userId, feature, tokensUsed },
  });
}

export async function getRemainingUsage(userId: string) {
  const summary = await getUsageSummary(userId);
  return {
    resumes: summary.resumes.remaining,
    documents: summary.documents.remaining,
    aiGenerations: summary.aiGenerations.remaining,
  };
}
