import { requireApiUser, handle, parseBody, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getOwnedResume } from "@/lib/ownership";
import { updateResumeSchema } from "@/lib/validation/resume";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

export const GET = handle(async (_req, { params }) => {
  const userId = await requireApiUser();
  const resume = await getOwnedResume(userId, params.id);
  return ok({ resume });
});

export const PATCH = handle(async (req, { params }) => {
  const userId = await requireApiUser();
  await getOwnedResume(userId, params.id);
  const data = await parseBody(req, updateResumeSchema);

  const update: Prisma.ResumeUpdateInput = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.template !== undefined) update.template = data.template;
  if (data.content !== undefined)
    update.content = data.content as Prisma.InputJsonValue;
  if (data.atsScore !== undefined) update.atsScore = data.atsScore;

  const resume = await prisma.resume.update({
    where: { id: params.id },
    data: update,
  });
  return ok({ resume });
});

export const DELETE = handle(async (_req, { params }) => {
  const userId = await requireApiUser();
  await getOwnedResume(userId, params.id);
  await prisma.resume.delete({ where: { id: params.id } });
  return ok({ success: true });
});
