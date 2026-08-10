import { requireApiUser, handle, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getOwnedResume } from "@/lib/ownership";
import { checkUsageLimit } from "@/lib/usage";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

export const POST = handle(async (_req, { params }) => {
  const userId = await requireApiUser();
  const source = await getOwnedResume(userId, params.id);
  await checkUsageLimit(userId, "resume");

  const resume = await prisma.resume.create({
    data: {
      userId,
      name: `${source.name} (Copy)`,
      template: source.template,
      content: source.content as Prisma.InputJsonValue,
    },
  });
  return ok({ resume }, { status: 201 });
});
