import { requireApiUser, handle, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getOwnedResume } from "@/lib/ownership";
import { checkUsageLimit, recordAIUsage } from "@/lib/usage";
import { resumeContentSchema } from "@/lib/validation/resume";
import { analyzeResume } from "@/lib/ai/services/resume-ai";

export const runtime = "nodejs";

export const POST = handle(async (_req, { params }) => {
  const userId = await requireApiUser();
  const resume = await getOwnedResume(userId, params.id);
  await checkUsageLimit(userId, "ai");

  const content = resumeContentSchema.parse(resume.content);
  const { data, tokensUsed } = await analyzeResume(content);

  await recordAIUsage(userId, "resume_analyze", tokensUsed);
  await prisma.resume.update({
    where: { id: resume.id },
    data: { atsScore: Math.round(data.overall) },
  });

  return ok({ result: data });
});
