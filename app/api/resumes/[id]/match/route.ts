import { z } from "zod";
import { requireApiUser, handle, parseBody, ok } from "@/lib/api";
import { getOwnedResume } from "@/lib/ownership";
import { checkUsageLimit, recordAIUsage } from "@/lib/usage";
import { resumeContentSchema } from "@/lib/validation/resume";
import { matchJob } from "@/lib/ai/services/resume-ai";

export const runtime = "nodejs";

const bodySchema = z.object({
  jobDescription: z.string().min(20, "Paste a longer job description.").max(20000),
});

export const POST = handle(async (req, { params }) => {
  const userId = await requireApiUser();
  const resume = await getOwnedResume(userId, params.id);
  const { jobDescription } = await parseBody(req, bodySchema);
  await checkUsageLimit(userId, "ai");

  const content = resumeContentSchema.parse(resume.content);
  const { data, tokensUsed } = await matchJob(content, jobDescription);

  await recordAIUsage(userId, "resume_match", tokensUsed);
  return ok({ result: data });
});
