import { z } from "zod";
import { requireApiUser, handle, parseBody, ok, ApiError } from "@/lib/api";
import { getOwnedResume } from "@/lib/ownership";
import { checkUsageLimit, recordAIUsage } from "@/lib/usage";
import { resumeContentSchema } from "@/lib/validation/resume";
import * as ai from "@/lib/ai/services/resume-ai";

export const runtime = "nodejs";

const bodySchema = z.object({
  action: z.enum([
    "summary",
    "improve_experience",
    "generate_bullets",
    "improve_project",
    "improve_achievement",
    "suggest_skills",
    "assistant",
  ]),
  variant: z.string().max(40).optional(),
  command: z.string().max(200).optional(),
  text: z.string().max(8000).optional(),
  section: z.unknown().optional(),
  content: resumeContentSchema.partial().optional(),
});

export const POST = handle(async (req, { params }) => {
  const userId = await requireApiUser();
  await getOwnedResume(userId, params.id);
  const body = await parseBody(req, bodySchema);

  await checkUsageLimit(userId, "ai");

  let data: unknown;
  let tokensUsed = 0;

  switch (body.action) {
    case "summary": {
      const res = await ai.generateSummary(body.content ?? {}, body.variant);
      data = res.data;
      tokensUsed = res.tokensUsed;
      break;
    }
    case "improve_experience": {
      const res = await ai.improveExperience(body.section ?? {});
      data = res.data;
      tokensUsed = res.tokensUsed;
      break;
    }
    case "generate_bullets": {
      const res = await ai.generateBullets(body.section ?? {});
      data = res.data;
      tokensUsed = res.tokensUsed;
      break;
    }
    case "improve_project": {
      const res = await ai.improveProject(body.section ?? {});
      data = res.data;
      tokensUsed = res.tokensUsed;
      break;
    }
    case "improve_achievement": {
      const s = (body.section ?? {}) as { title?: string; description?: string };
      const res = await ai.improveAchievement(s.title ?? "", s.description ?? "");
      data = res.data;
      tokensUsed = res.tokensUsed;
      break;
    }
    case "suggest_skills": {
      const res = await ai.suggestSkills(body.content ?? {});
      data = res.data;
      tokensUsed = res.tokensUsed;
      break;
    }
    case "assistant": {
      if (!body.command || body.text === undefined) {
        throw new ApiError(422, "command and text are required.");
      }
      const res = await ai.runAssistant(body.command, body.text);
      data = res.data;
      tokensUsed = res.tokensUsed;
      break;
    }
  }

  await recordAIUsage(userId, `resume_${body.action}`, tokensUsed);
  return ok({ result: data });
});
